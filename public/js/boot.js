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
  // samme. Ved allerførste besøg er der ingen tidligere service worker, og
  // siden er allerede hentet fra nettet, så der skal ikke genindlæses (det
  // kunne afbryde indtastning). Genindlæs kun ÉN gang, når en ældre
  // service worker blev afløst af en ny.
  const hadController = !!navigator.serviceWorker.controller;
  let refreshedForSw = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshedForSw) return;
    refreshedForSw = true;
    window.location.reload();
  });
}
