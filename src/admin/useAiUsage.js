// @ts-nocheck
// Henter forbruget på Claude Haiku (public.ai_usage_daily; kun admins kan læse tabellen, RLS). De sidste 400 dage.
import { useState } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";

export function useAiUsage(accessToken) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const since = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/ai_usage_daily?select=day,function_name,model,calls,input_tokens,output_tokens&day=gte.${since}&order=day.desc&limit=5000`,
        { headers: makeHeaders(accessToken) }
      );
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("Kunne ikke hente AI-forbrug: " + e.message, "error");
    }
    setLoading(false);
  };

  return { rows, loading, load };
}
