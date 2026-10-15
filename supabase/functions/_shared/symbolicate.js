// Oversætter minificerede stacktraces til oprindelige placeringer ud fra source maps (symbolisering, 16. okt. 2026).
// Rene funktioner uden Deno- eller Node-afhængigheder; bruges af edge-funktionen symbolicate-error, af scripts/symbolicate.mjs og af tests.
// Regel: en placering vises KUN, hvis der findes et source map til netop den fil (filnavnet indeholder filens hash), og kortet giver et svar.
// Alt andet returneres som ikke oversat; der opdigtes aldrig en placering.

const MAX_FRAMES = 40;

/** Filnavnet på en kodefil fra appens build (/assets/<navn>.js), ellers null. @param {string} url */
export function assetFileName(url) {
  let path = String(url || "");
  try { path = new URL(path).pathname; } catch { /* allerede en sti */ }
  const m = path.match(/\/assets\/([\w.-]+\.js)$/);
  return m ? m[1] : null;
}

/**
 * Billeder af stackrammer i Chrome ("at fn (url:l:k)", "at url:l:k") og Safari/Firefox ("fn@url:l:k"). Kun rammer med en placering.
 * @param {string|null|undefined} stack
 * @returns {Array<{ raw: string, fn: string, url: string, file: string|null, line: number, col: number }>}
 */
export function parseStackFrames(stack) {
  const out = [];
  for (const rawLine of String(stack || "").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/^(?:at\s+)?(?:(.*?)\s*[@(])?\s*((?:https?:\/\/|\/)[^\s)@]+?):(\d+):(\d+)\)?$/);
    if (!m) continue;
    const fn = (m[1] || "").replace(/^at\s+/, "").trim();
    out.push({ raw: line, fn, url: m[2], file: assetFileName(m[2]), line: Number(m[3]), col: Number(m[4]) });
    if (out.length >= MAX_FRAMES) break;
  }
  return out;
}

/** Stien fra kortet gøres læsbar uden byggemaskinens mapper: fra node_modules/, src/ eller supabase/, ellers de sidste to led. @param {string} source */
export function cleanSource(source) {
  const s = String(source || "").replace(/\\/g, "/");
  for (const root of ["node_modules/", "src/", "supabase/"]) {
    const i = s.lastIndexOf(root === "node_modules/" ? root : `/${root}`);
    if (i >= 0) return root === "node_modules/" ? s.slice(i) : s.slice(i + 1);
    if (s.startsWith(root)) return s;
  }
  return s.split("/").filter((p) => p && p !== "..").slice(-2).join("/");
}

/**
 * @param {{ stack?: string|null, componentStack?: string|null }} input
 * @param {(file: string) => Promise<any|null>} loadMap giver source map (objekt) til filen i buildet, ellers null
 * @param {new (map: any) => { originalPositionFor: (p: { line: number, column: number }) => { source: string|null, line: number|null, column: number|null, name: string|null } }} Consumer
 */
export async function symbolicateStack(input, loadMap, Consumer) {
  const frames = [...parseStackFrames(input.stack), ...parseStackFrames(input.componentStack)].slice(0, MAX_FRAMES);
  const consumers = new Map();
  const result = [];
  for (const f of frames) {
    const base = { raw: f.raw, fn: f.fn, file: f.file, line: f.line, col: f.col };
    if (!f.file) { result.push({ ...base, resolved: false, reason: "ikke en kodefil fra appen" }); continue; }
    if (!consumers.has(f.file)) {
      let map = null;
      try { map = await loadMap(f.file); } catch { map = null; }
      // Kortet skal høre til netop denne fil; filnavnet indeholder filens hash, så et map fra en anden build afvises
      if (map && map.file && String(map.file).split("/").pop() !== f.file) map = null;
      consumers.set(f.file, map ? new Consumer(map) : null);
    }
    const c = consumers.get(f.file);
    if (!c) { result.push({ ...base, resolved: false, reason: "source map findes ikke for denne fil" }); continue; }
    const o = c.originalPositionFor({ line: f.line, column: Math.max(0, f.col - 1) });
    if (!o || !o.source) { result.push({ ...base, resolved: false, reason: "ingen oprindelig placering i kortet" }); continue; }
    result.push({ ...base, resolved: true, source: cleanSource(o.source), origLine: o.line, origCol: (o.column ?? 0) + 1, name: o.name || null });
  }
  return result;
}

/** Oversatte rammer som tekst (kun verificerede): "fn  src/x.jsx:12:5". @param {Array<any>} frames */
export function formatResolved(frames) {
  return (frames || []).filter((f) => f.resolved).map((f) => `${f.name || f.fn || "(anonym)"}  ${f.source}:${f.origLine}:${f.origCol}`).join("\n");
}
