// @ts-check
// Slet egen konto (Indstillinger → "Slet konto"). Flyttet uændret ud af useAdmin.js
// 14. okt. 2026, så brugerappen ikke længere henter admin-panelets kode.
import { useState } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";

export function useDeleteAccount(accessToken, userId, clearAuth) {
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const deleteOwnAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "slet") return;
    setDeletingAccount(true);
    try {
      // Går via delete-user Edge Function i stedet for at slette tabel for
      // tabel herfra — den er den eneste der også sletter selve
      // auth.users-identiteten, så en "slettet" konto ikke stadig kan logge ind.
      const res = await apiCall(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ uid: userId }),
      });
      if (res?.error) throw new Error(res.error);
      clearAuth();
      setShowDeleteAccount(false);
    } catch (e) {
      console.error("deleteOwnAccount:", e);
      showToast("Kontoen kunne ikke slettes helt. Prøv igen, eller kontakt support@eatsafe.dk.", "error");
    }
    setDeletingAccount(false);
  };

  return { showDeleteAccount, setShowDeleteAccount, deleteConfirmText, setDeleteConfirmText, deletingAccount, deleteOwnAccount };
}
