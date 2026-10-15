// Efter Vercel-buildet (npm run build:vercel): sender source maps til den PRIVATE bøtte via edge-funktionen sourcemap-upload og fjerner ALLE .map-filer
// fra dist, så de aldrig udgives offentligt. Sletningen sker altid, også hvis upload ikke er sat op eller fejler. Scriptet fejler aldrig buildet (exit 0).
// Kræver SOURCEMAP_UPLOAD_TOKEN (samme værdi som funktions-secret'en i Supabase) og VERCEL_GIT_COMMIT_SHA. Mangler en af dem, springes upload over.
import { readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const URL_BASE = "https://jegrpcflyguadyxialkm.supabase.co/functions/v1/sourcemap-upload";

/** Alle .map-filer under en mappe. @param {string} dir @returns {string[]} */
export function findMaps(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...findMaps(p));
    else if (entry.endsWith(".map")) out.push(p);
  }
  return out;
}

/** Build-id som i vite.config.ts (de første 7 tegn af commit'en). @param {Record<string, string|undefined>} env */
export const buildIdFrom = (env) => (env.VERCEL_GIT_COMMIT_SHA || env.CF_PAGES_COMMIT_SHA || "").slice(0, 7).toLowerCase();

export async function run({ dist = "dist", env = process.env, fetchFn = fetch, log = console.log } = {}) {
  let maps = [];
  try { maps = findMaps(dist); } catch { log("source maps: ingen dist-mappe"); return { uploaded: 0, removed: 0 }; }
  const build = buildIdFrom(env);
  const token = env.SOURCEMAP_UPLOAD_TOKEN || "";
  let uploaded = 0, failed = 0;
  if (!token || !/^[0-9a-f]{7}$/.test(build)) {
    log(`source maps: upload springet over (${!token ? "SOURCEMAP_UPLOAD_TOKEN mangler" : "build-id kendes ikke"}); ${maps.length} kort fjernes fra dist`);
  } else {
    for (const file of maps.filter((m) => m.endsWith(".js.map"))) {
      try {
        const name = file.split(/[\\/]/).pop();
        const res = await fetchFn(env.SOURCEMAP_UPLOAD_URL || URL_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-upload-token": token },
          body: JSON.stringify({ build, name, map: readFileSync(file, "utf8") }),
        });
        if (res.ok) uploaded++; else { failed++; log(`source maps: ${name} afvist (${res.status})`); }
      } catch (e) { failed++; log(`source maps: upload fejlede (${e instanceof Error ? e.message : "ukendt"})`); }
    }
    log(`source maps: ${uploaded} uploadet til build ${build}${failed ? `, ${failed} fejlede` : ""}`);
  }
  let removed = 0;
  for (const m of maps) { try { rmSync(m); removed++; } catch { /* ignoreres */ } }
  // Bygger bundterne en reference til kortet ind, fjernes den heller ikke (vi bruger 'hidden', så der er ingen); tjekket sikrer at ingen .map ligger tilbage
  try { if (findMaps(dist).length) log("source maps: ADVARSEL, der ligger stadig .map-filer i dist"); } catch { /* ignoreres */ }
  return { uploaded, failed, removed };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().then(() => process.exit(0)).catch((e) => { console.log("source maps: uventet fejl, buildet fortsætter:", e?.message); process.exit(0); });
}
