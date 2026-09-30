// supabase/functions/feedback/validate.js
//
// Validering og grænser for feedback (arkitektur-audit A4, 30. sept. 2026).
// Almindelig JavaScript i samme mappe som index.ts, så både edge-functionen
// og Vitest (src/feedbackValidate.test.js) kan importere den.

export const FEEDBACK_TYPES = ["bug", "ui", "missing", "content", "crash", "suggestion"];

export const LIMITS = {
  descriptionMax: 8000,
  contextMaxChars: 64000,
  imageMaxChars: 2_500_000, // base64 — største hidtil var ca. 1 MB
  anonPerHourPerClient: 5,
  anonPerHourTotal: 60,
  userPerHour: 20,
};

/**
 * Tjekker og renser et feedback-kald. Returnerer { ok: true, ticket } eller
 * { ok: false, status, error } med en dansk fejltekst til brugeren.
 */
export function validateFeedback(body) {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "Ugyldig forespørgsel." };
  }
  const type = String(body.type || "");
  if (!FEEDBACK_TYPES.includes(type)) {
    return { ok: false, status: 400, error: "Vælg en type feedback." };
  }
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    return { ok: false, status: 400, error: "Skriv en beskrivelse." };
  }
  if (description.length > LIMITS.descriptionMax) {
    return { ok: false, status: 400, error: `Beskrivelsen er for lang (højst ${LIMITS.descriptionMax} tegn).` };
  }

  let context = null;
  if (body.context != null) {
    if (typeof body.context !== "object" || Array.isArray(body.context)) {
      return { ok: false, status: 400, error: "Ugyldig kontekst." };
    }
    if (JSON.stringify(body.context).length > LIMITS.contextMaxChars) {
      return { ok: false, status: 413, error: "Feedbacken indeholder for meget teknisk data." };
    }
    context = body.context;
  }

  let image = null;
  if (body.image_base64 != null && body.image_base64 !== "") {
    // Appen sender ren base64 (JPEG fra compressImageToBase64); et
    // "data:image/...;base64,"-præfiks accepteres også og fjernes, så
    // tabellen altid har samme format.
    const raw = typeof body.image_base64 === "string"
      ? body.image_base64.replace(/^data:image\/(png|jpe?g|webp);base64,/, "")
      : "";
    if (raw.length > LIMITS.imageMaxChars) {
      return { ok: false, status: 413, error: "Billedet er for stort. Prøv et mindre skærmbillede." };
    }
    if (!raw || !/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) {
      return { ok: false, status: 400, error: "Billedet kunne ikke læses. Prøv et andet skærmbillede." };
    }
    image = raw;
  }

  return { ok: true, ticket: { type, description, context, image_base64: image } };
}

/** Om et nyt kald må gå igennem, givet hvor mange der allerede er sendt. */
export function withinLimit({ isUser, recentForClient, recentTotalAnon }) {
  if (isUser) return recentForClient < LIMITS.userPerHour;
  return recentForClient < LIMITS.anonPerHourPerClient && recentTotalAnon < LIMITS.anonPerHourTotal;
}
