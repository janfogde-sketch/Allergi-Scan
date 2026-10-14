// @ts-check
// Henter adminloggen (public.admin_audit_log). Kun administratorer kan læse tabellen (RLS); andre får tomt svar.
// Navne på admins, brugere og produkter slås op bagefter (loggen gemmer kun id'er); fejler opslaget, vises korte id'er.
import { useState } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";
import { auditNameIds } from "./auditLogic.js";

/** @param {Array<{ id: string }>} list */
const byId = (list) => Object.fromEntries((Array.isArray(list) ? list : []).map((x) => [x.id, x]));

export function useAuditLog(accessToken) {
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({ users: {}, products: {} });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/admin_audit_log?select=id,created_at,admin_id,action,target_table,target_id,details&order=created_at.desc&limit=200`,
        { headers: makeHeaders(accessToken) }
      );
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      const ids = auditNameIds(list);
      const headers = makeHeaders(accessToken);
      const [users, products] = await Promise.all([
        ids.users.length ? apiCall(`${SUPABASE_URL}/rest/v1/users?id=in.(${ids.users.join(",")})&select=id,name,email`, { headers }).catch(() => []) : [],
        ids.products.length ? apiCall(`${SUPABASE_URL}/rest/v1/products?id=in.(${ids.products.join(",")})&select=id,name`, { headers }).catch(() => []) : [],
      ]);
      setNames({ users: byId(users), products: byId(products) });
    } catch (e) {
      showToast("Kunne ikke hente aktivitetsloggen: " + e.message, "error");
    }
    setLoading(false);
  };

  return { rows, names, loading, load };
}
