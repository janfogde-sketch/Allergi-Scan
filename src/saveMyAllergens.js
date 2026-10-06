// @ts-nocheck
// F2-2 (6. okt. 2026): gemmer brugerens egne allergier (faste og egne valg) i én transaktion
// via RPC'en save_my_allergens. Kaster videre ved fejl, så kalderen kan vise en fast tekst.
// Findes RPC'en ikke endnu i databasen (404, Jan kører SQL'en), bruges den gamle vej:
// DELETE + én samlet POST. Fallbacken kan fjernes, når RPC'en er kørt.
import { SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";

export async function saveMyAllergens({ accessToken, userId, allergens, custom }) {
  try {
    return await apiCall(`${SUPABASE_URL}/rest/v1/rpc/save_my_allergens`, {
      method: "POST",
      headers: makeHeaders(accessToken),
      body: JSON.stringify({ p_allergens: allergens || [], p_custom: custom || [] }),
    });
  } catch (e) {
    if (e?.status !== 404 || !userId) throw e;
  }
  await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, { method: "DELETE", headers: makeHeaders(accessToken) });
  const rows = [
    ...(allergens || []).map(a => ({ user_id: userId, allergen: a, type: "allergen" })),
    ...(custom || []).map(c => ({ user_id: userId, allergen: c, type: "custom" })),
  ];
  if (rows.length > 0) {
    await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
      method: "POST",
      headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
      body: JSON.stringify(rows),
    });
  }
  return null;
}
