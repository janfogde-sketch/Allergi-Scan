// @ts-check
// Henter forbruget på Claude (public.ai_usage_daily; kun admins kan læse tabellen, RLS; med origin, når migrationen er live), de sidste 400 dage, og månedsbudgettet (get_ai_budget).
// En fejl er en egen tilstand (error), aldrig en tom liste. Findes budgetfunktionerne ikke endnu (migrationen er ikke udgivet), er budgetAvailable false.
import { useState } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";

export function useAiUsage(accessToken) {
  const [rows, setRows] = useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(/** @type {null | { denied: boolean, message: string }} */ (null));
  const [budget, setBudget] = useState(/** @type {any} */ (null));
  const [budgetAvailable, setBudgetAvailable] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
      const get = (/** @type {string} */ cols) => apiCall(
        `${SUPABASE_URL}/rest/v1/ai_usage_daily?select=${cols}&day=gte.${since}&order=day.desc&limit=5000`,
        { headers: makeHeaders(accessToken) }
      );
      let data;
      try {
        data = await get("day,function_name,model,origin,calls,input_tokens,output_tokens");
      } catch (e) {
        // Før migrationen 20261016090000 er live, findes origin ikke (400): hent uden; forbrugstypen afledes så kun af funktionen
        if (/** @type {any} */ (e).status !== 400) throw e;
        data = await get("day,function_name,model,calls,input_tokens,output_tokens");
      }
      setRows(Array.isArray(data) ? data : []);
      setLoaded(true);
    } catch (e) {
      const status = /** @type {any} */ (e).status;
      setError({ denied: status === 401 || status === 403, message: e instanceof Error ? e.message : "Ukendt fejl" });
    }
    try {
      const b = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/get_ai_budget`, { method: "POST", headers: makeHeaders(accessToken), body: "{}" });
      setBudget(b && typeof b === "object" && b.monthly_dkk ? b : null);
      setBudgetAvailable(true);
    } catch {
      setBudgetAvailable(false); // funktionen findes ikke endnu, eller adgang nægtet: budgetdelen skjules
    }
    setLoading(false);
  };

  /** Gemmer budgettet; null fjerner det. Returnerer true ved succes. @param {null | { monthly: number, warn1: number, warn2: number }} next */
  const saveBudget = async (next) => {
    try {
      const body = next ? { p_budget: next.monthly, p_warn_1: next.warn1, p_warn_2: next.warn2 } : { p_budget: null };
      const saved = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/set_ai_budget`, { method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify(body) });
      setBudget(saved && typeof saved === "object" && saved.monthly_dkk ? saved : null);
      showToast(next ? "Budget gemt" : "Budget fjernet", "success");
      return true;
    } catch (e) {
      showToast("Kunne ikke gemme budgettet: " + (e instanceof Error ? e.message : "ukendt fejl"), "error");
      return false;
    }
  };

  return { rows, loading, loaded, error, budget, budgetAvailable, load, saveBudget };
}
