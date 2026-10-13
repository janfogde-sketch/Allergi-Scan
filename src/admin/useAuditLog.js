// @ts-nocheck
// Henter adminloggen (public.admin_audit_log). Kun administratorer kan læse tabellen (RLS); andre får tomt svar.
import { useState } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";

export function useAuditLog(accessToken) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/admin_audit_log?select=id,created_at,admin_id,action,target_table,target_id,details&order=created_at.desc&limit=200`,
        { headers: makeHeaders(accessToken) }
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("Kunne ikke hente aktivitetsloggen: " + e.message, "error");
    }
    setLoading(false);
  };

  return { rows, loading, load };
}
