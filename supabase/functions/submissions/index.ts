import { createClient } from "jsr:@supabase/supabase-js@2.117.2";
import { normalizeNutrition } from "../_shared/nutrition.js";
import { reportLimitHit, withinUserLimit } from "../_shared/apiUsage.ts";
import { corsFor, getCaller } from "../_shared/http.ts";
import { PRODUCT_IMAGES_BUCKET, SUBMISSION_IMAGES_BUCKET, privateImagePath, submissionImageRef } from "../_shared/productImages.js";

const corsHeaders = corsFor("GET, POST, PATCH, DELETE, OPTIONS");

const MAX_EXTRA_IMAGES = 6;
const MAX_IMAGE_BASE64_LENGTH = 8_000_000; // samme loft som ocr-funktionen

// ── Upload base64 billede til den private bøtte (kun admin og serveren kan se det) ──
// Returnerer en henvisning ("storage:submission-images/<sti>"), ikke en offentlig URL.
async function uploadImageToStorage(
  // deno-lint-ignore no-explicit-any
  supabase: any,
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
      .from(SUBMISSION_IMAGES_BUCKET)
      .upload(path, bytes, { contentType, upsert: true });

    if (error) {
      console.error("Storage upload fejl:", error.message);
      return null;
    }

    return submissionImageRef(path);
  } catch (e) {
    console.error("uploadImageToStorage fejl:", e);
    return null;
  }
}

// ── Gør et indsendt produktbillede offentligt ved godkendelse ──────────────
// Et privat billede kopieres til den offentlige bøtte product-images, og produktet får den offentlige URL.
// Andre adresser (ældre offentlige URL'er, OFF) bruges som de er. Fejler kopieringen, oprettes produktet uden billede.
// deno-lint-ignore no-explicit-any
async function publishSubmissionImage(supabase: any, url: string | null): Promise<string | null> {
  if (!url) return null;
  const path = privateImagePath(url);
  if (!path) return url;
  try {
    const { data: blob, error: dlError } = await supabase.storage.from(SUBMISSION_IMAGES_BUCKET).download(path);
    if (dlError || !blob) throw new Error(dlError?.message ?? "intet billede");
    const { error: upError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
    if (upError) throw new Error(upError.message);
    return supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.error("publishSubmissionImage fejl:", (e as Error).message);
    return null;
  }
}

// ── Klassificér produktets subcategory via classify-categories ──────────────
// Best-effort: fejler klassificeringen, skal godkendelsen af indsendelsen
// stadig lykkes — produktet står blot uklassificeret indtil næste backfill.
async function triggerClassification(productId: string) {
  try {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/classify-categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ product_id: productId }),
    });
  } catch (e) {
    console.error("triggerClassification fejl:", e);
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

  // Verificér at den kaldende bruger faktisk er logget ind — indsendelser,
  // godkendelse/afvisning og admin-listen skal ikke være tilgængelige uden
  // login, og en bruger skal ikke kunne indsende på vegne af en anden.
  const caller = await getCaller(req);
  if (!caller) return new Response(
    JSON.stringify({ error: "Ikke autoriseret" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
  async function callerIsAdmin() {
    const { data } = await supabase.from("users").select("role").eq("id", caller!.id).single();
    return data?.role === "admin";
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const identifier = parts[parts.length - 1];
  const method = req.method;

  try {

    // ── POST — indsend nyt produkt eller rettelsesforslag ───────────────────
    if (method === "POST" && identifier === "submissions") {
      const body = await req.json();
      const { ean, submitted_by, raw_label_image, ocr_raw_text, ai_parsed_data, user_confirmed, notes, images } = body;
      const type = body.type === "edit" ? "edit" : "new_product";
      let product_id = type === "edit" ? body.product_id : null;

      if (!ean || !submitted_by) {
        return new Response(
          JSON.stringify({ error: "ean og submitted_by er påkrævet" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (submitted_by !== caller.id) {
        return new Response(
          JSON.stringify({ error: "Kan ikke indsende på vegne af en anden bruger" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!(await withinUserLimit(supabase, caller.id, "submission"))) {
        await reportLimitHit(supabase, caller.id, "submission", "indsendelser");
        return new Response(
          JSON.stringify({ error: "Du har indsendt mange i dag. Prøv igen i morgen.", code: "daily_limit" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Klienten sender scanResult.id som product_id — men den er null for et
      // produkt der lige er hentet live fra Open Food Facts og endnu ikke var
      // gemt i vores egen database på det tidspunkt appen hentede det (products-
      // funktionen gemmer den slags produkter asynkront i baggrunden,
      // EdgeRuntime.waitUntil, EFTER svaret allerede er sendt til klienten —
      // se dens GET-handler). Uden dette blev ethvert rettelsesforslag til den
      // slags produkter afvist med det samme, selvom produktet rent faktisk
      // findes (bruger-rapporteret: "Risted Løg", EAN 5705830004222 — indsendt
      // 2 timer efter produktet var gemt, men klientens scanResult.id var
      // stadig null). Slå derfor produktet op på EAN i stedet for at afvise.
      if (type === "edit" && !product_id) {
        const { data: existingProduct } = await supabase.from("products").select("id").eq("ean", ean).single();
        if (existingProduct) product_id = existingProduct.id;
      }
      if (type === "edit" && !product_id) {
        return new Response(
          JSON.stringify({ error: "Produktet kunne ikke findes i databasen endnu — prøv igen om lidt" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Et rettelsesforslag er per definition til et produkt der allerede
      // findes, så "findes allerede"-tjekket gælder kun nye produkter.
      if (type === "new_product") {
        const { data: existing } = await supabase.from("products").select("id").eq("ean", ean).single();
        if (existing) {
          return new Response(
            JSON.stringify({ error: "Produkt med denne EAN findes allerede", product_id: existing.id }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Tjek om der allerede er en pending indsendelse af samme type
      const { data: pendingSubmission } = await supabase.from("submissions").select("id").eq("ean", ean).eq("type", type).eq("status", "pending").single();
      if (pendingSubmission) {
        return new Response(
          JSON.stringify({ error: "Der er allerede en afventende indsendelse for denne EAN", submission_id: pendingSubmission.id }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Udtræk billeder fra ai_parsed_data
      const parsedData = { ...(ai_parsed_data ?? {}) };
      const productImageBase64 = parsedData.product_image_base64 ?? null;

      // Appen skalerer billeder ned før afsendelse; for store billeder afvises her.
      const tooBig = (v: unknown) => typeof v === "string" && v.length > MAX_IMAGE_BASE64_LENGTH;
      const extraList = Array.isArray(images) ? images.slice(0, MAX_EXTRA_IMAGES) : [];
      if (tooBig(raw_label_image) || tooBig(productImageBase64) || extraList.some((i: { base64?: string }) => tooBig(i?.base64))) {
        return new Response(
          JSON.stringify({ error: "Billedet er for stort. Tag et nyt billede og prøv igen.", code: "image_too_large" }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

      // Alle øvrige billeder brugeren har taget (ingrediens-, næringsbillede
      // m.fl.) gemmes også, så admin kan kvalitetsteste OCR'en mod dem.
      // Ligger som [{kind, url}] i ai_parsed_data.images; ingrediensbilledet
      // ligger i raw_label_image og produktbilledet i product_image_url.
      const extraImages = Array.isArray(images) ? images.slice(0, MAX_EXTRA_IMAGES) : [];
      const uploaded = await Promise.all(extraImages.map(async (img: { kind?: string; base64?: string }, i: number) => {
        if (!img?.base64 || img.base64.length > MAX_IMAGE_BASE64_LENGTH) return null;
        const kind = String(img.kind ?? "other").replace(/[^a-z_]/g, "").slice(0, 20) || "other";
        const url = await uploadImageToStorage(supabase, img.base64, "extra", `${safeEan}_${timestamp}_${kind}_${i}`);
        return url ? { kind, url } : null;
      }));
      const storedImages = uploaded.filter(Boolean) as { kind: string; url: string }[];
      if (storedImages.length > 0) parsedData.images = storedImages;

      const { data: submission, error } = await supabase
        .from("submissions")
        .insert({
          ean,
          submitted_by,
          raw_label_image: labelImageUrl,   // henvisning til den private bøtte i stedet for base64
          ocr_raw_text: ocr_raw_text ?? null,
          ai_parsed_data: parsedData,
          user_confirmed: user_confirmed ?? false,
          status: "pending",
          type,
          product_id,
          notes: notes ?? null,
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
      if (!(await callerIsAdmin())) return new Response(
        JSON.stringify({ error: "Kun admins kan se alle indsendelser" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      if (submission.submitted_by !== caller.id && !(await callerIsAdmin())) return new Response(
        JSON.stringify({ error: "Ikke autoriseret til denne indsendelse" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      return new Response(JSON.stringify({ success: true, submission }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── PATCH — godkend eller afvis (admin) ────────────────────────────────
    if (method === "PATCH" && identifier !== "submissions") {
      if (!(await callerIsAdmin())) return new Response(
        JSON.stringify({ error: "Kun admins kan godkende eller afvise indsendelser" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      const body = await req.json();
      const { status, review_note } = body;
      // Revisionsspor: den der godkender er altid kalderen, aldrig en værdi fra klienten.
      const reviewed_by = caller.id;

      if (!status) {
        return new Response(
          JSON.stringify({ error: "status er påkrævet" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (status !== "approved" && status !== "rejected") {
        return new Response(
          JSON.stringify({ error: "status skal være approved eller rejected" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: submission, error: fetchError } = await supabase.from("submissions").select("*").eq("id", identifier).single();
      if (fetchError || !submission) return new Response(JSON.stringify({ error: "Indsendelse ikke fundet" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Kun ventende indsendelser kan behandles (G11): et dobbeltklik eller en gammel fane må ikke godkende igen eller sende beskeden to gange.
      const alreadyHandled = () => new Response(
        JSON.stringify({ error: "Indsendelsen er allerede behandlet", code: "already_handled" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      if (submission.status !== "pending") return alreadyHandled();

      // Tjekkes FØR status ændres: ellers står forslaget som godkendt, selv om intet blev rettet.
      if (status === "approved" && submission.type === "edit" && !submission.product_id) {
        return new Response(
          JSON.stringify({ error: "Rettelsesforslaget mangler product_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Status skiftes først, når produktet er oprettet/rettet (G11), og kun fra "pending" (vagt mod to samtidige kald).
      // Skiftet udløser beskeden til indsenderen (databasetrigger), så den kommer kun, når produktet findes.
      // Adminloggen skrives her, fordi databasetriggeren ikke kan se adminen bag et kald med service-nøglen.
      async function markHandled(productId: string | null) {
        const { data: rows, error: statusError } = await supabase.from("submissions").update({
          status,
          reviewed_by,
          review_note: review_note ?? null,
          reviewed_at: new Date(),
          ...(productId ? { product_id: productId } : {}),
        }).eq("id", identifier).eq("status", "pending").select("id");
        if (statusError) throw new Error(statusError.message);
        if (!rows || rows.length === 0) return false;
        const { error: auditError } = await supabase.from("admin_audit_log").insert({
          admin_id: reviewed_by,
          action: status === "approved" ? "indsendelse_godkendt" : "indsendelse_afvist",
          target_table: "submissions",
          target_id: identifier,
          details: { ean: submission.ean, type: submission.type, ...(productId ? { product_id: productId } : {}) },
        });
        if (auditError) console.error(`submissions: adminlog fejlede: ${auditError.message}`);
        return true;
      }

      if (status === "approved" && submission.type === "edit") {
        // Et rettelsesforslag OPDATERER et eksisterende produkt i stedet for
        // at oprette et nyt — og kun de felter admin faktisk har udfyldt,
        // så vi ikke ved et uheld overskriver navn/brand med tomme værdier.
        const updateFields: Record<string, unknown> = {};
        if (body.name?.trim()) updateFields.name = body.name.trim();
        if (body.brand?.trim()) updateFields.brand = body.brand.trim();
        if (body.ingredients_text?.trim()) updateFields.ingredients_text = body.ingredients_text.trim();
        if (body.image_url) {
          const publicUrl = await publishSubmissionImage(supabase, body.image_url);
          if (publicUrl) updateFields.image_url = publicUrl;
        }
        if (body.allergen_flags && Object.keys(body.allergen_flags).length > 0) updateFields.allergen_flags = body.allergen_flags;

        // Ingredienslisten ændres uden en ny allergen-analyse ved siden af —
        // stil produktet tilbage til "pending", så det garanteret bliver
        // genanalyseret (auto-reparse-cronnet, eller frontendens egen
        // AI-reparse-kald lige efter godkendelse) i stedet for at blive
        // stående med allergen_flags der matcher den GAMLE ingrediensliste.
        // Uden dette kan en ny, forkert ingrediensliste blive godkendt med
        // flag fra det tidligere (måske helt anderledes) produkt, og aldrig
        // blive rettet igen hvis den frontend-initierede reparse fejler.
        if (updateFields.ingredients_text && !updateFields.allergen_flags) {
          updateFields.allergen_quality = "pending";
        }

        const { data: product, error: productError } = await supabase
          .from("products")
          .update(updateFields)
          .eq("id", submission.product_id)
          .select()
          .single();

        if (productError) {
          return new Response(
            JSON.stringify({ error: productError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!(await markHandled(null))) return alreadyHandled();

        await supabase.from("revision_log").insert({
          product_id:    product.id,
          changed_by:    reviewed_by,
          change_type:   "updated",
          field_changed: Object.keys(updateFields).join(", ") || "none",
          new_value:     submission.notes ?? "Opdateret via brugerens rettelsesforslag",
        });

        if (updateFields.name || updateFields.brand) await triggerClassification(product.id);

        return new Response(
          JSON.stringify({ success: true, message: "Rettelsesforslag godkendt og produkt opdateret", product_id: product.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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
        // Kun produktbilledet vises offentligt; fotoet af ingredienslisten forbliver privat (ældre offentlige etiketbilleder bruges som før).
        const legacyLabel       = privateImagePath(submission.raw_label_image) ? null : submission.raw_label_image;
        const image_url         = await publishSubmissionImage(supabase, body.image_url ?? parsed.product_image_url ?? legacyLabel ?? null);
        const ingredients_text  = body.ingredients_text ?? submission.ocr_raw_text  ?? null;
        const finalFlags        = Object.keys(body.allergen_flags ?? {}).length > 0 ? body.allergen_flags : allergenFlags;
        // Admin kan have rettet tallene under gennemsyn (body.nutrition); ellers brugerens egne. Normaliseres til det format, resultatsiden læser.
        const nutrition         = normalizeNutrition(body.nutrition ?? parsed.nutrition);

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
          // Typisk: stregkoden er imens kommet ind via import. Indsendelsen forbliver ventende, så admin kan afvise den med en forklaring.
          const duplicate = (productError as { code?: string }).code === "23505";
          return new Response(
            JSON.stringify({
              error: duplicate ? "Produktet findes allerede (stregkoden er kommet ind på anden vis). Indsendelsen er ikke godkendt." : productError.message,
              code: duplicate ? "product_exists" : undefined,
            }),
            { status: duplicate ? 409 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!(await markHandled(product.id))) return alreadyHandled();

        await supabase.from("revision_log").insert({
          product_id:    product.id,
          changed_by:    reviewed_by,
          change_type:   "created",
          field_changed: "all",
          new_value:     "Oprettet via brugerindsendelse",
        });

        await triggerClassification(product.id);

        return new Response(
          JSON.stringify({ success: true, message: "Indsendelse godkendt og produkt oprettet", product_id: product.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!(await markHandled(null))) return alreadyHandled();
      return new Response(
        JSON.stringify({ success: true, message: `Indsendelse ${status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Ikke fundet" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
