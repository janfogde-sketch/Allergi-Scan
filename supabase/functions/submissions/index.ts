import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

// ── Upload base64 billede til Supabase Storage ─────────────────────────────
async function uploadImageToStorage(
  supabase: ReturnType<typeof createClient>,
  base64: string,
  folder: string,
  filename: string
): Promise<string | null> {
  if (!base64) return null;
  try {
    // Detect format fra base64-header
    let contentType = "image/jpeg";
    let ext = "jpg";
    if (base64.startsWith("iVBOR")) { contentType = "image/png"; ext = "png"; }
    else if (base64.startsWith("UklG")) { contentType = "image/webp"; ext = "webp"; }

    // Konvertér base64 til binær
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const path = `${folder}/${filename}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, bytes, { contentType, upsert: true });

    if (error) {
      console.error("Storage upload fejl:", error.message);
      return null;
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("uploadImageToStorage fejl:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const identifier = parts[parts.length - 1];
  const method = req.method;

  try {

    // ── POST — indsend nyt produkt ─────────────────────────────────────────
    if (method === "POST" && identifier === "submissions") {
      const body = await req.json();
      const { ean, submitted_by, raw_label_image, ocr_raw_text, ai_parsed_data, user_confirmed } = body;

      if (!ean || !submitted_by) {
        return new Response(
          JSON.stringify({ error: "ean og submitted_by er påkrævet" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Tjek om produktet allerede eksisterer
      const { data: existing } = await supabase.from("products").select("id").eq("ean", ean).single();
      if (existing) {
        return new Response(
          JSON.stringify({ error: "Produkt med denne EAN findes allerede", product_id: existing.id }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Tjek om der allerede er en pending indsendelse
      const { data: pendingSubmission } = await supabase.from("submissions").select("id").eq("ean", ean).eq("status", "pending").single();
      if (pendingSubmission) {
        return new Response(
          JSON.stringify({ error: "Der er allerede en afventende indsendelse for denne EAN", submission_id: pendingSubmission.id }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Udtræk billeder fra ai_parsed_data
      const parsedData = { ...(ai_parsed_data ?? {}) };
      const productImageBase64 = parsedData.product_image_base64 ?? null;
      delete parsedData.product_image_base64;

      // Upload billeder til Storage i stedet for base64 i DB
      const timestamp = Date.now();
      const safeEan = ean.replace(/[^a-zA-Z0-9-]/g, "_");

      const [labelImageUrl, productImageUrl] = await Promise.all([
        uploadImageToStorage(supabase, raw_label_image ?? null, "labels", `${safeEan}_${timestamp}_label`),
        uploadImageToStorage(supabase, productImageBase64 ?? null, "products", `${safeEan}_${timestamp}_product`),
      ]);

      // Tilføj produkt-billed-URL til parsedData
      if (productImageUrl) parsedData.product_image_url = productImageUrl;

      const { data: submission, error } = await supabase
        .from("submissions")
        .insert({
          ean,
          submitted_by,
          raw_label_image: labelImageUrl,   // URL i stedet for base64
          ocr_raw_text: ocr_raw_text ?? null,
          ai_parsed_data: parsedData,
          user_confirmed: user_confirmed ?? false,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, submission }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── GET — hent alle submissions (admin) ────────────────────────────────
    if (method === "GET" && identifier === "submissions") {
      const status = url.searchParams.get("status") ?? "pending";
      const { data: submissions, error } = await supabase
        .from("submissions").select("*").eq("status", status)
        .order("created_at", { ascending: false });

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, submissions }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── GET — hent én submission ───────────────────────────────────────────
    if (method === "GET" && identifier !== "submissions") {
      const { data: submission, error } = await supabase.from("submissions").select("*").eq("id", identifier).single();
      if (error || !submission) return new Response(JSON.stringify({ error: "Indsendelse ikke fundet" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true, submission }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── PATCH — godkend eller afvis (admin) ────────────────────────────────
    if (method === "PATCH" && identifier !== "submissions") {
      const body = await req.json();
      const { status, reviewed_by, review_note } = body;

      if (!status || !reviewed_by) {
        return new Response(
          JSON.stringify({ error: "status og reviewed_by er påkrævet" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: submission, error: fetchError } = await supabase.from("submissions").select("*").eq("id", identifier).single();
      if (fetchError || !submission) return new Response(JSON.stringify({ error: "Indsendelse ikke fundet" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await supabase.from("submissions").update({
        status,
        reviewed_by,
        review_note: review_note ?? null,
        reviewed_at: new Date(),
      }).eq("id", identifier);

      if (status === "approved") {
        const parsed = submission.ai_parsed_data ?? {};
        const allergenKeys = ["gluten","hvede","maelkeallergi","laktose","aeg","noedder","jordnoedder","soja","fisk","skaldyr","selleri","sennep","sesam","svovl","lupin","bloeddyr"];
        const allergenFlags: Record<string, string> = {};
        for (const key of allergenKeys) {
          if (parsed[key]) allergenFlags[key] = parsed[key];
        }

        const name              = body.name             ?? parsed.name             ?? "Ukendt produkt";
        const brand             = body.brand            ?? parsed.brand            ?? null;
        const category          = body.category         ?? parsed.category         ?? null;
        const image_url         = body.image_url        ?? parsed.product_image_url ?? submission.raw_label_image ?? null;
        const ingredients_text  = body.ingredients_text ?? submission.ocr_raw_text  ?? null;
        const finalFlags        = Object.keys(body.allergen_flags ?? {}).length > 0 ? body.allergen_flags : allergenFlags;
        const nutrition         = parsed.nutrition      ?? null;

        const { data: product, error: productError } = await supabase
          .from("products")
          .insert({
            ean:              submission.ean,
            name, brand, category, image_url, ingredients_text,
            allergen_flags:   finalFlags,
            source:           "user",
            verified_status:  "partial",
            verified_count:   1,
            country:          "DK",
            ...(nutrition ? { nutrition } : {}),
          })
          .select()
          .single();

        if (productError) {
          return new Response(
            JSON.stringify({ error: productError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase.from("revision_log").insert({
          product_id:    product.id,
          changed_by:    reviewed_by,
          change_type:   "created",
          field_changed: "all",
          new_value:     "Oprettet via brugerindsendelse",
        });

        return new Response(
          JSON.stringify({ success: true, message: "Indsendelse godkendt og produkt oprettet", product_id: product.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: `Indsendelse ${status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Ikke fundet" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
