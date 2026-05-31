const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image_base64, mode } = body;

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY ikke konfigureret", success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Bestem prompt baseret på mode
    const prompt = mode === "product_name"
      ? "Læs produktnavnet fra dette billede af en fødevareemballage. Returner KUN produktnavnet, intet andet. Hvis du ikke kan læse det, returner en tom streng."
      : "Læs ingredienslisten fra dette billede af en fødevareemballage. Returner KUN den rå ingrediensliste præcis som den står — behold originalsproget, store/små bogstaver og tegnsætning. Fjern alt andet (næringsdeklaration, adresser, batchnumre). Hvis du ikke kan finde en ingrediensliste, returner en tom streng.";

    // Detect media type from base64 header or default to jpeg
    let mediaType = "image/jpeg";
    if (image_base64.startsWith("/9j/")) mediaType = "image/jpeg";
    else if (image_base64.startsWith("iVBOR")) mediaType = "image/png";
    else if (image_base64.startsWith("R0lG")) mediaType = "image/gif";
    else if (image_base64.startsWith("UklG")) mediaType = "image/webp";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: image_base64 },
            },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: `Claude API fejl: ${res.status}`, details: errText, success: false }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim() || "";

    return new Response(
      JSON.stringify({ success: true, text, mode: mode || "ingredients" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
