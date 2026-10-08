// Efter et deploy findes gamle hash-navne på kode-chunks ikke længere.
// Genindlæs én gang (højst hvert 60. sekund) for at hente den nye version.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('chunkReloadAt') || 0);
    if (Date.now() - last < 60000) return;
    sessionStorage.setItem('chunkReloadAt', String(Date.now()));
  } catch { return; }
  event.preventDefault();
  window.location.reload();
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
  // sw.js bruger skipWaiting + clients.claim() til at overtage med det
  // samme i stedet for at vente på at gamle faner lukkes. Det udløser et
  // "controllerchange"-event — genindlæs én gang, så siden er sikker på
  // at køre under den nyeste service worker (bl.a. relevant for om
  // browseren regner appen som installerbar).
  let refreshedForSw = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshedForSw) return;
    refreshedForSw = true;
    window.location.reload();
  });
}
