// @ts-nocheck
// Henter og ændrer den fælles to do-liste (public.admin_todos + admin_todo_comments).
// Kun admins kan læse og skrive (RLS). Listen genindlæses automatisk hvert 30. sekund,
// mens fanen er åben, så Jan og Bjørn ser hinandens ændringer uden at opdatere siden.
import { useState, useEffect, useCallback, useRef } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast } from "../SharedComponents.jsx";

const TODO_SELECT = "id,title,description,status,priority,track,assignee_id,due_date,link,created_by,created_at,updated_at,completed_at,completed_by";
const POLL_MS = 30_000;
const EDITABLE = ["title", "description", "status", "priority", "track", "assignee_id", "due_date", "link"];

export function useAdminTodos(accessToken, { active = false } = {}) {
  const [todos, setTodos] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const loadedOnce = useRef(false);
  const openCommentsFor = useRef(null);

  const headers = useCallback(() => makeHeaders(accessToken), [accessToken]);
  const minimal = useCallback(() => ({ ...makeHeaders(accessToken), Prefer: "return=minimal" }), [accessToken]);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!accessToken) return;
    if (!quiet) setLoading(true);
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/admin_todos?select=${TODO_SELECT}&order=created_at.desc&limit=1000`, { headers: headers() });
      setTodos(Array.isArray(data) ? data : []);
      loadedOnce.current = true;
    } catch (e) {
      if (!quiet) showToast("Kunne ikke hente to do-listen: " + e.message, "error");
    }
    if (!quiet) setLoading(false);
  }, [accessToken, headers]);

  const loadAdmins = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/users?role=eq.admin&select=id,name,email&order=name.asc`, { headers: headers() });
      setAdmins(Array.isArray(data) ? data : []);
    } catch { /* ansvarlig-listen er en bekvemmelighed; opgaverne virker uden */ }
  }, [accessToken, headers]);

  // Første indlæsning ved login (så tælleren i menuen er rigtig), derefter polling mens fanen er åben
  useEffect(() => {
    if (!accessToken) return;
    load({ quiet: true });
    loadAdmins();
  }, [accessToken, load, loadAdmins]);

  useEffect(() => {
    if (!active || !accessToken) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") {
        load({ quiet: true });
        if (openCommentsFor.current) loadComments(openCommentsFor.current, { quiet: true });
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [active, accessToken, load]);

  const create = async (fields) => {
    const title = String(fields.title ?? "").trim();
    if (!title) return false;
    try {
      const body = { title, ...Object.fromEntries(EDITABLE.filter((k) => k !== "title" && fields[k] !== undefined && fields[k] !== "").map((k) => [k, fields[k]])) };
      const rows = await apiCall(`${SUPABASE_URL}/rest/v1/admin_todos?select=${TODO_SELECT}`, {
        method: "POST", headers: { ...headers(), Prefer: "return=representation" }, body: JSON.stringify(body),
      });
      if (Array.isArray(rows) && rows[0]) setTodos((prev) => [rows[0], ...prev]);
      return true;
    } catch (e) {
      showToast("Kunne ikke oprette opgaven: " + e.message, "error");
      return false;
    }
  };

  // Opdaterer lokalt med det samme og ruller tilbage ved fejl
  const update = async (id, patch) => {
    const clean = Object.fromEntries(Object.entries(patch).filter(([k]) => EDITABLE.includes(k)).map(([k, v]) => [k, v === "" ? null : v]));
    if ("title" in clean && !String(clean.title ?? "").trim()) { showToast("Titlen må ikke være tom", "error"); return false; }
    const before = todos;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...clean } : t)));
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/admin_todos?id=eq.${id}`, { method: "PATCH", headers: minimal(), body: JSON.stringify(clean) });
      load({ quiet: true }); // henter trigger-felter (completed_at m.fl.)
      return true;
    } catch (e) {
      setTodos(before);
      showToast("Kunne ikke gemme: " + e.message, "error");
      return false;
    }
  };

  const remove = async (id) => {
    const before = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/admin_todos?id=eq.${id}`, { method: "DELETE", headers: minimal() });
      return true;
    } catch (e) {
      setTodos(before);
      showToast("Kunne ikke slette: " + e.message, "error");
      return false;
    }
  };

  const loadComments = useCallback(async (todoId, { quiet = false } = {}) => {
    openCommentsFor.current = todoId;
    if (!quiet) { setCommentsLoading(true); setComments([]); }
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/admin_todo_comments?todo_id=eq.${todoId}&select=id,todo_id,author_id,body,created_at&order=created_at.asc&limit=500`, { headers: headers() });
      if (openCommentsFor.current === todoId) setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      if (!quiet) showToast("Kunne ikke hente kommentarer: " + e.message, "error");
    }
    if (!quiet) setCommentsLoading(false);
  }, [headers]);

  const closeComments = useCallback(() => { openCommentsFor.current = null; setComments([]); }, []);

  const addComment = async (todoId, body) => {
    const text = String(body ?? "").trim();
    if (!text) return false;
    try {
      const rows = await apiCall(`${SUPABASE_URL}/rest/v1/admin_todo_comments?select=id,todo_id,author_id,body,created_at`, {
        method: "POST", headers: { ...headers(), Prefer: "return=representation" }, body: JSON.stringify({ todo_id: todoId, body: text }),
      });
      if (Array.isArray(rows) && rows[0]) setComments((prev) => [...prev, rows[0]]);
      return true;
    } catch (e) {
      showToast("Kunne ikke gemme kommentaren: " + e.message, "error");
      return false;
    }
  };

  const deleteComment = async (id) => {
    const before = comments;
    setComments((prev) => prev.filter((c) => c.id !== id));
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/admin_todo_comments?id=eq.${id}`, { method: "DELETE", headers: minimal() });
    } catch (e) {
      setComments(before);
      showToast("Kunne ikke slette kommentaren: " + e.message, "error");
    }
  };

  return { todos, admins, loading, load, create, update, remove, comments, commentsLoading, loadComments, closeComments, addComment, deleteComment };
}
