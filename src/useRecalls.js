// @ts-nocheck
// F1-1 (6. okt. 2026): slår den scannede vare op blandt Fødevarestyrelsens tilbagekaldelser
// (RPC active_recalls_for_ean, kun offentlige felter, sidste 60 dage). Et fejlet opslag
// blokerer aldrig resultatet: det logges, og siden vises som før.
import { useEffect, useState } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";
import { reportError } from "./errorReporter.js";
import { PREVIEW_MOCK_RECALLS } from "./previewMockData.js";

export function useRecalls(ean, accessToken) {
  const [recalls, setRecalls] = useState([]);
  useEffect(() => {
    setRecalls([]);
    if (!ean || !/^\d{8,14}$/.test(String(ean))) return undefined;
    if (import.meta.env.MODE === "artifact-preview" && PREVIEW_MOCK_RECALLS[String(ean)]) {
      setRecalls(PREVIEW_MOCK_RECALLS[String(ean)]);
      return undefined;
    }
    let cancelled = false;
    apiCall(`${SUPABASE_URL}/rest/v1/rpc/active_recalls_for_ean`, {
      method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify({ p_ean: String(ean) }),
    })
      .then(rows => { if (!cancelled) setRecalls(Array.isArray(rows) ? rows : []); })
      .catch(e => { reportError(e, { source: "recall-lookup" }); });
    return () => { cancelled = true; };
  }, [ean, accessToken]);
  return recalls;
}
