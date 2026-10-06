// @ts-nocheck
// F2-2 (6. okt. 2026): gemmer brugerens egne allergier (faste og egne valg) i én transaktion
// via RPC'en save_my_allergens. Kaster videre ved fejl, så kalderen kan vise en fast tekst.
import { SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";

export function saveMyAllergens({ accessToken, allergens, custom }) {
  return apiCall(`${SUPABASE_URL}/rest/v1/rpc/save_my_allergens`, {
    method: "POST",
    headers: makeHeaders(accessToken),
    body: JSON.stringify({ p_allergens: allergens || [], p_custom: custom || [] }),
  });
}
