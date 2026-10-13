// Belastningstest mod live Supabase med de 100 testkonti fra migrationen 20261013140000.
// Kørsel: LOADTEST_PASSWORD=... node scripts/loadtest.mjs [trin=10,50,100] [sekunder pr. trin=40] [maks. kald=30000]
// Bruger kun eksisterende produkter (ingen opslag hos Open Food Facts, ingen AI) og kun læsninger,
// plus indkøbsliste-Realtime. Stopper selv ved for mange fejl eller ved kald-loftet.
import fs from "node:fs";

const URL_ = "https://jegrpcflyguadyxialkm.supabase.co";
const ANON = fs.readFileSync(new URL("../src/constants.jsx", import.meta.url), "utf8").match(/SUPABASE_ANON_KEY = "([^"]+)"/)[1];
const PW = process.env.LOADTEST_PASSWORD;
const STEPS = (process.argv[2] || "10,50,100").split(",").map(Number);
const SECS = Number(process.argv[3] || 40);
const MAX_CALLS = Number(process.argv[4] || 30000);
const EANS = fs.readFileSync(process.env.LOADTEST_EANS, "utf8").split(/\s+/).filter(Boolean);
const WORDS = ["mælk", "æg", "brød", "chokolade", "ost", "pasta", "yoghurt", "kiks", "juice", "ris"];
if (!PW) throw new Error("LOADTEST_PASSWORD mangler");

const stats = {};
let calls = 0, stop = false;
const rec = (k, ms, ok) => {
  const s = (stats[k] ||= { n: 0, fail: 0, ms: [] });
  s.n++; if (!ok) s.fail++; s.ms.push(ms);
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const pct = (a, p) => a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : 0;

async function timed(key, url, opt) {
  if (calls >= MAX_CALLS) { stop = true; return null; }
  calls++;
  const t = Date.now();
  try {
    const r = await fetch(url, opt);
    await r.arrayBuffer();
    rec(key, Date.now() - t, r.ok);
    return r;
  } catch { rec(key, Date.now() - t, false); return null; }
}

async function login(i) {
  const email = `loadtest-${String(i).padStart(3, "0")}@example.com`;
  const t = Date.now();
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PW }),
  }).catch(() => null);
  calls++;
  if (!r || !r.ok) { rec("login", Date.now() - t, false); return null; }
  const j = await r.json(); rec("login", Date.now() - t, true);
  return { token: j.access_token, id: j.user.id };
}

function realtime(u) {
  return new Promise((resolve) => {
    const t = Date.now();
    const ws = new WebSocket(`${URL_.replace("https", "wss")}/realtime/v1/websocket?apikey=${ANON}&vsn=1.0.0`);
    let done = false;
    const fin = (ok) => { if (!done) { done = true; rec("realtime", Date.now() - t, ok); resolve(ok ? ws : null); } };
    ws.onopen = () => ws.send(JSON.stringify({
      topic: "realtime:loadtest", event: "phx_join", ref: "1",
      payload: { config: { postgres_changes: [{ event: "*", schema: "public", table: "shopping_list_items" }] }, access_token: u.token },
    }));
    ws.onmessage = (m) => { try { const d = JSON.parse(m.data); if (d.event === "phx_reply" && d.ref === "1") fin(d.payload?.status === "ok"); } catch {} };
    ws.onerror = () => fin(false);
    setTimeout(() => fin(false), 15000);
  });
}

async function user(u, until) {
  const H = { apikey: ANON, Authorization: `Bearer ${u.token}` };
  const F = `${URL_}/functions/v1`;
  while (!stop && Date.now() < until) {
    const x = Math.random();
    if (x < 0.35) await timed("scan(products)", `${F}/products/${pick(EANS)}`, { headers: H });
    else if (x < 0.55) await timed("historik", `${F}/history?user_id=${u.id}&limit=50&offset=0`, { headers: H });
    else if (x < 0.75) await timed("soegning", `${F}/search?q=${encodeURIComponent(pick(WORDS))}`, { headers: H });
    else if (x < 0.9) await timed("indkoebslister", `${F}/shopping?user_id=${u.id}`, { headers: H });
    else await timed("favoritter", `${F}/favorites?user_id=${u.id}`, { headers: H });
    await new Promise((r) => setTimeout(r, Math.random() * 300));
  }
}

const users = (await Promise.all(Array.from({ length: Math.max(...STEPS) }, (_, i) => login(i + 1)))).filter(Boolean);
console.log(`Logget ind: ${users.length} af ${Math.max(...STEPS)}`);
const sockets = (await Promise.all(users.map(realtime))).filter(Boolean);
console.log(`Realtime-forbindelser åbne: ${sockets.length}`);

for (const n of STEPS) {
  const t0 = Date.now();
  await Promise.all(users.slice(0, n).map((u) => user(u, t0 + SECS * 1000)));
  const secs = (Date.now() - t0) / 1000;
  console.log(`\n== Trin: ${n} samtidige brugere, ${secs.toFixed(0)} s, kald i alt ${calls} ==`);
  for (const [k, s] of Object.entries(stats)) {
    console.log(`${k.padEnd(16)} n=${String(s.n).padStart(6)} fejl=${String(s.fail).padStart(5)}  p50=${pct(s.ms, .5)} ms  p95=${pct(s.ms, .95)} ms  maks=${Math.max(...s.ms)} ms`);
    s.ms = []; // nulstil svartider pr. trin (tællerne akkumuleres)
  }
  const failRate = Object.values(stats).reduce((a, s) => a + s.fail, 0) / Math.max(1, calls);
  if (failRate > 0.2 || stop) { console.log("STOP: for mange fejl eller kald-loftet nået"); break; }
}
sockets.forEach((w) => w.close());
console.log(`\nKald i alt: ${calls}`);
process.exit(0);
