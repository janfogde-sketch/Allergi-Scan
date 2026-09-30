// @ts-nocheck
// Sender feedback via edge-functionen "feedback" (arkitektur-audit A4,
// 30. sept. 2026) i stedet for direkte INSERT i feedback_tickets. Bruges af
// både FeedbackModal (appen) og admin/FeedbackButton.
// Funktionen sætter selv afsenderen ud fra login-tokenet og håndhæver
// grænser; ved fejl kastes en Error med funktionens danske fejltekst.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";

export async function submitFeedback({ type, description, context, imageBase64, accessToken }) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        type,
        description,
        context: context || null,
        image_base64: imageBase64 || null,
      }),
    });
  } catch {
    throw new Error("Ingen forbindelse. Tjek dit netværk og prøv igen.");
  }
  if (res.ok) return true;
  let message = "Feedbacken kunne ikke sendes. Prøv igen.";
  try {
    const data = await res.json();
    if (data?.error) message = data.error;
  } catch { /* behold standardteksten */ }
  throw new Error(message);
}
