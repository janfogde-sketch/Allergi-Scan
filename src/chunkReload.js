// Efter en udrulning findes gamle kodefiler ikke længere. Genindlæs højst én gang
// pr. minut (samme nøgle som public/js/boot.js), så en fejl aldrig giver en løkke.
const KEY = "chunkReloadAt";
const WINDOW_MS = 60000;

/** Er fejlen en kodefil, der ikke kunne hentes (typisk efter en opdatering)? */
export function isChunkLoadError(err) {
  const msg = String(err?.message || err || "");
  return /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|Loading CSS chunk/i.test(msg);
}

/** Genindlæser siden én gang ved modulfejl. Returnerer true, hvis der genindlæses. */
export function reloadOnceForChunkError(err, reload = () => window.location.reload()) {
  if (!isChunkLoadError(err)) return false;
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < WINDOW_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  reload();
  return true;
}
