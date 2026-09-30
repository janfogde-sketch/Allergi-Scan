// @ts-nocheck
// Henter og opdaterer rækker i public.client_errors (fejl fra appen og edge
// functions, A3 30. sept. 2026). Kun admins kan læse tabellen (RLS).
import { useState } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";

const SELECT = "id,source,message,stack,screen,url,user_agent,app_version,context,user_id,occurrences,first_seen,last_seen,status";

export function useClientErrors(accessToken) {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("open");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/client_errors?select=${SELECT}&order=last_seen.desc&limit=200`,
        { headers: makeHeaders(accessToken) }
      );
      setErrors(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("Kunne ikke hente fejl: " + e.message, "error");
    }
    setLoading(false);
  };

  const setStatus = async (id, status) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/client_errors?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({ status }),
      });
      setErrors(prev => prev.map(e => (e.id === id ? { ...e, status } : e)));
    } catch (e) {
      showToast("Kunne ikke opdatere fejlen: " + e.message, "error");
    }
  };

  return { errors, loading, filter, setFilter, load, setStatus };
}
