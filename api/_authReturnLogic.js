// Retur fra login i iPhone-appen (sikkerhedsfund S5, 15. okt. 2026). Login i systembrowseren sendes tilbage til
// https://www.eatsafe.dk/auth-retur. Når appen har en "Universal Link" (Associated Domains + .well-known/apple-app-site-association),
// åbner iPhone appen direkte, og denne adresse hentes aldrig. Ellers sender serveren videre til appens egen adresse
// dk.eatsafe.app://auth som før. Kun engangskoden (PKCE) og evt. fejl sendes med; uden appens engangsnøgle er koden værdiløs.
// Logikken ligger her uden Vercel-detaljer, så den kan testes (src/authReturnApi.test.js).

export const APP_SCHEME_RETURN = "dk.eatsafe.app://auth";
const PARAMS = ["code", "error", "error_code", "error_description"];
const MAX_LEN = 512;

/**
 * @param {{ method?: string, url?: string }} req
 * @returns {{ status: number, location: string }}
 */
export function handleAuthReturn(req) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") return { status: 302, location: "/" };
  const raw = String(req.url || "");
  const q = raw.indexOf("?");
  const incoming = new URLSearchParams(q >= 0 ? raw.slice(q + 1) : "");
  const out = new URLSearchParams();
  for (const k of PARAMS) {
    const v = incoming.get(k);
    if (v && v.length <= MAX_LEN) out.set(k, v);
  }
  // Uden kode eller fejl er det ikke en login-retur (fx adressen åbnet i hånden): til forsiden.
  if (!out.has("code") && !out.has("error") && !out.has("error_code")) return { status: 302, location: "/" };
  return { status: 302, location: `${APP_SCHEME_RETURN}?${out.toString()}` };
}
