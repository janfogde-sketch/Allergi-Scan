// @ts-check
// iPhone-rammen (Capacitor, 14. okt. 2026): hjælpere, der kun gør noget, når appen kører inde i iOS-rammen.
// I browseren og på Android findes window.Capacitor ikke (eller er ikke native), så alt her er uden virkning.

/** Adressen, som login i systembrowseren sender tilbage til (skal stå under Redirect URLs i Supabase). */
export const NATIVE_AUTH_RETURN = "dk.eatsafe.app://auth";
const WEB_ORIGIN = "https://www.eatsafe.dk";

/** @returns {any} */
function cap() {
  return typeof window === "undefined" ? undefined : /** @type {any} */ (window).Capacitor;
}

/** @returns {boolean} Kører vi inde i den native app-ramme? */
export function isNativeApp() {
  try { return !!cap()?.isNativePlatform?.(); } catch { return false; }
}

/** @param {string} name @returns {any} */
export function nativePlugin(name) {
  try { return cap()?.Plugins?.[name]; } catch { return undefined; }
}

/**
 * Åbner en adresse i telefonens egen browser (Google og Facebook blokerer login i indlejrede visninger).
 * @param {string} url
 * @returns {Promise<boolean>} sand, hvis den native browser tog imod den
 */
export async function openInSystemBrowser(url) {
  const browser = nativePlugin("Browser");
  if (!isNativeApp() || !browser?.open) return false;
  try { await browser.open({ url }); return true; } catch { return false; }
}

/**
 * Oversætter adressen, som systembrowseren sendte appen tilbage til, til en adresse i selve appen, som den
 * eksisterende login-modtagelse (#access_token=...) forstår. Andre adresser giver null.
 * @param {string} url
 * @returns {string | null}
 */
export function authReturnTarget(url) {
  if (typeof url !== "string" || !(url === NATIVE_AUTH_RETURN || /^dk\.eatsafe\.app:\/\/auth([?#/]|$)/.test(url))) return null;
  const i = url.indexOf("#");
  const hash = i >= 0 ? url.slice(i) : "";
  return `${WEB_ORIGIN}/?src=store${hash}`;
}

/**
 * Lytter efter, at appen åbnes igen fra systembrowseren efter login. Returnerer en oprydningsfunktion.
 * @param {(target: string) => void} onReturn
 * @returns {() => void}
 */
export function listenForAuthReturn(onReturn) {
  const app = nativePlugin("App");
  if (!isNativeApp() || !app?.addListener) return () => {};
  let handle = /** @type {any} */ (null);
  let cancelled = false;
  Promise.resolve(app.addListener("appUrlOpen", (/** @type {{url:string}} */ e) => {
    const target = authReturnTarget(e?.url);
    if (!target) return;
    try { nativePlugin("Browser")?.close?.(); } catch { /* allerede lukket */ }
    onReturn(target);
  })).then((h) => { if (cancelled) h?.remove?.(); else handle = h; }).catch(() => {});
  return () => { cancelled = true; handle?.remove?.(); };
}
