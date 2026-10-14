// @ts-check
// To do 0255840a (14. okt. 2026): liste over de seneste 60 dages tilbagekaldelser fra Fødevarestyrelsen,
// også dem uden stregkode (RPC recent_recalls, kun offentlige felter). En fejl logges og vises som en fejlboks.
import { useCallback, useEffect, useState } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";
import { reportError } from "./errorReporter.js";

export function useRecentRecalls(accessToken) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    return apiCall(`${SUPABASE_URL}/rest/v1/rpc/recent_recalls`, {
      method: "POST", headers: makeHeaders(accessToken), body: "{}",
    })
      .then(rows => { setItems(Array.isArray(rows) ? rows : []); })
      .catch(e => { reportError(e, { source: "recent-recalls" }); setError(true); })
      .finally(() => setLoading(false));
  }, [accessToken]);
  useEffect(() => { load(); }, [load]);
  return { items, loading, error, reload: load };
}
