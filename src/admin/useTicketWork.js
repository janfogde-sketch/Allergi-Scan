// @ts-check
// Arbejdsdata til tickets: prioritet og markeringer (ticket_meta), tjekliste (ticket_tasks), ansvarlig/kommentarer/historik fra den tilknyttede to do, og administratorer.
// Ticketlisten og statusskift ligger fortsat i useAdmin. Før migrationen er udgivet, virker siden som hidtil uden de nye felter (available = false).
import { useState, useCallback, useRef } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";

export function useTicketWork(/** @type {string | null} */ accessToken, /** @type {string | null} */ userId) {
  const [meta, setMeta] = useState(/** @type {Record<string, any>} */ ({}));
  const [tasks, setTasks] = useState(/** @type {Record<string, any[]>} */ ({}));
  const [todos, setTodos] = useState(/** @type {Record<string, any>} */ ({}));
  const [admins, setAdmins] = useState(/** @type {Array<{ id: string, name: string }>} */ ([]));
  const [available, setAvailable] = useState(true);
  const adminsRef = useRef(/** @type {Array<{ id: string, name: string }>} */ ([]));
  const h = useCallback(() => ({ ...makeHeaders(accessToken), Accept: "application/json" }), [accessToken]);
  const get = useCallback((/** @type {string} */ path, /** @type {any} */ opts) => apiCall(`${SUPABASE_URL}/rest/v1/${path}`, { headers: h(), ...opts }), [h]);
  const write = useCallback((/** @type {string} */ path, /** @type {string} */ method, /** @type {any} */ body, /** @type {string} */ prefer = "return=representation") =>
    apiCall(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers: { ...h(), "Content-Type": "application/json", Prefer: prefer }, body: JSON.stringify(body) }), [h]);

  const nameOf = useCallback((/** @type {string|null|undefined} */ id) => (id ? adminsRef.current.find((a) => a.id === id)?.name || "Administrator" : "Ingen"), []);

  const load = useCallback(async () => {
    const [m, t, td, ad] = await Promise.allSettled([
      get("ticket_meta?select=*"), get("ticket_tasks?select=id,ticket_id,title,status,position&order=position.asc,created_at.asc&limit=2000"),
      get("admin_todos?ticket_id=not.is.null&select=id,ticket_id,assignee_id,updated_at&limit=2000"), get("users?role=eq.admin&select=id,name,email&order=name.asc"),
    ]);
    if (m.status === "fulfilled" && t.status === "fulfilled") {
      setAvailable(true);
      setMeta(Object.fromEntries((Array.isArray(m.value) ? m.value : []).map((r) => [r.ticket_id, r])));
      /** @type {Record<string, any[]>} */ const by = {};
      for (const r of Array.isArray(t.value) ? t.value : []) (by[r.ticket_id] ||= []).push(r);
      setTasks(by);
    } else setAvailable(false);
    if (td.status === "fulfilled") setTodos(Object.fromEntries((Array.isArray(td.value) ? td.value : []).map((r) => [r.ticket_id, r])));
    if (ad.status === "fulfilled") { const list = (Array.isArray(ad.value) ? ad.value : []).map((a) => ({ id: a.id, name: a.name || a.email || "Administrator" })); adminsRef.current = list; setAdmins(list); }
  }, [get]);

  /** Historik, kommentarer og tjekliste for én ticket. */
  const loadDetail = useCallback(async (/** @type {string} */ ticketId) => {
    const todoId = todos[ticketId]?.id;
    const [log, act, com, tk] = await Promise.allSettled([
      get(`ticket_meta_log?ticket_id=eq.${ticketId}&order=created_at.desc&limit=50`),
      todoId ? get(`admin_todo_activity?todo_id=eq.${todoId}&order=created_at.desc&limit=50`) : Promise.resolve([]),
      todoId ? get(`admin_todo_comments?todo_id=eq.${todoId}&order=created_at.desc&limit=50`) : Promise.resolve([]),
      get(`ticket_tasks?ticket_id=eq.${ticketId}&order=position.asc,created_at.asc`),
    ]);
    const ok = (/** @type {any} */ r) => (r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []);
    return { ok: [log, act, com, tk].every((r) => r.status === "fulfilled"), metaLog: ok(log), todoActivity: ok(act), comments: ok(com), tasks: ok(tk), todoId };
  }, [get, todos]);

  const guard = async (/** @type {() => Promise<any>} */ fn) => { try { const r = await fn(); return { ok: true, data: r }; } catch { return { ok: false }; } };

  const saveMeta = useCallback(async (/** @type {string} */ ticketId, /** @type {Record<string, any>} */ patch) => {
    const r = await guard(() => write("ticket_meta?on_conflict=ticket_id", "POST", { ticket_id: ticketId, ...patch }, "resolution=merge-duplicates,return=representation"));
    if (r.ok && Array.isArray(r.data) && r.data[0]) setMeta((m) => ({ ...m, [ticketId]: r.data[0] }));
    return r;
  }, [write]);
  const addTask = useCallback(async (/** @type {string} */ ticketId, /** @type {string} */ title, /** @type {number} */ position) => {
    const r = await guard(() => write("ticket_tasks", "POST", { ticket_id: ticketId, title: title.trim(), position, created_by: userId }));
    if (r.ok && Array.isArray(r.data) && r.data[0]) setTasks((t) => ({ ...t, [ticketId]: [...(t[ticketId] || []), r.data[0]] }));
    return r;
  }, [write, userId]);
  const setTaskStatus = useCallback(async (/** @type {string} */ ticketId, /** @type {string} */ id, /** @type {string} */ status) => {
    const r = await guard(() => write(`ticket_tasks?id=eq.${id}`, "PATCH", { status }));
    if (r.ok) setTasks((t) => ({ ...t, [ticketId]: (t[ticketId] || []).map((x) => (x.id === id ? { ...x, status } : x)) }));
    return r;
  }, [write]);
  const removeTask = useCallback(async (/** @type {string} */ ticketId, /** @type {string} */ id) => {
    const r = await guard(() => write(`ticket_tasks?id=eq.${id}`, "DELETE", {}, "return=minimal"));
    if (r.ok) setTasks((t) => ({ ...t, [ticketId]: (t[ticketId] || []).filter((x) => x.id !== id) }));
    return r;
  }, [write]);
  const assign = useCallback(async (/** @type {string} */ ticketId, /** @type {string|null} */ adminId) => {
    const todo = todos[ticketId];
    if (!todo) return { ok: false };
    const r = await guard(() => write(`admin_todos?id=eq.${todo.id}`, "PATCH", { assignee_id: adminId }, "return=minimal"));
    if (r.ok) setTodos((t) => ({ ...t, [ticketId]: { ...todo, assignee_id: adminId, updated_at: new Date().toISOString() } }));
    return r;
  }, [write, todos]);
  const addComment = useCallback(async (/** @type {string} */ ticketId, /** @type {string} */ body) => {
    const todo = todos[ticketId];
    if (!todo) return { ok: false };
    return guard(() => write("admin_todo_comments", "POST", { todo_id: todo.id, body: body.trim(), author_id: userId }, "return=minimal"));
  }, [write, todos, userId]);

  return { meta, tasks, todos, admins, available, nameOf, load, loadDetail, saveMeta, addTask, setTaskStatus, removeTask, assign, addComment };
}
