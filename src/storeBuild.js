// @ts-check
// Butiksudgave eller testudgave (14. okt. 2026): BETA-mærket skjules i appen fra Google Play / App Store, men bliver i browseren og PWA'en.
// Android-appen (TWA) åbner med referrer "android-app://dk.eatsafe.app" og startadressen "/?src=store" (android/twa-manifest.json); iOS-skallen
// (Capacitor) kan bruge samme `?src=store` eller `window.Capacitor`. Valget huskes på enheden, så det holder efter navigation og genindlæsning.
const STORAGE_KEY = "es_store_build";
const STORE_PACKAGE_REFERRER = "android-app://dk.eatsafe.app";

/** @returns {boolean} */
export function isStoreBuild() {
  try {
    if (typeof window === "undefined") return false;
    const w = /** @type {any} */ (window);
    const fromLaunch =
      new URLSearchParams(w.location?.search || "").get("src") === "store" ||
      String(w.document?.referrer || "").startsWith(STORE_PACKAGE_REFERRER) ||
      !!w.Capacitor?.isNativePlatform?.();
    if (fromLaunch) {
      try { w.localStorage.setItem(STORAGE_KEY, "1"); } catch { /* privat tilstand */ }
      return true;
    }
    try { return w.localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  } catch {
    return false;
  }
}
