// Test-værktøj til edge-funktionernes handlere (supabase/functions/*/index.ts).
// Funktionerne kalder Deno.serve(handler) og createClient(...) ved indlæsning. Her stubbes begge, så handleren kan kaldes med en
// rigtig Request uden Deno, netværk eller database. Databasen er en "script": testen giver en funktion, der svarer på hvert kald.
//
// const h = await loadHandler("family", { tokens: { "Bearer a": "user-a" } , resolver: (c) => ... });
// const res = await h.call("GET", "/family/group", { token: "a" });
import { vi } from "vitest";

const BASE_ENV = {
  SUPABASE_URL: "http://db.test",
  SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-key",
};

const WRITE_OPS = ["insert", "update", "upsert", "delete"];

// Et kald til databasen, som resolveren ser: { table, rpc, args, kind, ops, op(name) }
function makeCall(table, rpc, args, ops) {
  const kind = WRITE_OPS.find((w) => ops.some(([n]) => n === w)) ?? (rpc ? "rpc" : "select");
  return {
    table, rpc, args, kind, ops,
    op: (name) => ops.find(([n]) => n === name)?.[1],
    has: (name, ...a) => ops.some(([n, v]) => n === name && a.every((x, i) => v[i] === x)),
  };
}

function makeDb(state) {
  const run = (call) => {
    state.calls.push(call);
    const r = state.resolver?.(call);
    return Promise.resolve(r === undefined ? { data: null, error: null } : r);
  };
  const query = (table) => {
    const ops = [];
    const b = new Proxy({}, {
      get(_, prop) {
        if (prop === "then") return (res, rej) => run(makeCall(table, null, null, ops)).then(res, rej);
        return (...a) => { ops.push([prop, a]); return b; };
      },
    });
    return b;
  };
  return {
    from: query,
    rpc: (name, args) => run(makeCall(null, name, args, [])),
    storage: { from: () => ({ remove: async () => ({ data: [], error: null }), upload: async () => ({ error: null }) }) },
    auth: { admin: { deleteUser: async (id) => { state.deletedAuthUsers.push(id); return { error: null }; } } },
  };
}

// tokens: { "Bearer abc": "user-id" }. Ukendt token giver ingen bruger.
export async function loadHandler(fn, { tokens = {}, resolver, env = {}, file = "index.ts" } = {}) {
  const state = { calls: [], resolver, deletedAuthUsers: [] };
  const fullEnv = { ...BASE_ENV, ...env };
  let handler = null;
  globalThis.Deno = { env: { get: (k) => fullEnv[k] }, serve: (h) => { handler = h; } };
  globalThis.__edgeTest = {
    createClient: (_url, key, opts) => {
      const db = makeDb(state);
      const auth = opts?.global?.headers?.Authorization;
      if (auth !== undefined || key === fullEnv.SUPABASE_ANON_KEY) {
        const id = tokens[auth];
        db.auth.getUser = async () => ({ data: { user: id ? { id, email: `${id}@test.dk` } : null }, error: null });
      }
      return db;
    },
  };
  vi.resetModules();
  await import(/* @vite-ignore */ `../../supabase/functions/${fn}/${file}`);
  if (!handler) throw new Error(`${fn} kaldte ikke Deno.serve`);
  return {
    state,
    writes: () => state.calls.filter((c) => WRITE_OPS.includes(c.kind)),
    // call("POST", "/family/members", { token: "abc", body: {...} })
    async call(method, path, { token, body, headers = {} } = {}) {
      const h = { ...headers };
      if (token) h.Authorization = `Bearer ${token}`;
      const hasBody = body !== undefined && method !== "GET" && method !== "HEAD";
      if (hasBody) h["Content-Type"] = "application/json";
      const res = await handler(new Request(`http://fn.test${path}`, { method, headers: h, body: hasBody ? JSON.stringify(body) : undefined }));
      let json = null;
      try { json = await res.clone().json(); } catch { /* ikke JSON */ }
      return { status: res.status, json, res };
    },
  };
}
