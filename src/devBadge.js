// Lille "TEST"-mærke øverst på testadressen (dev.eatsafe.dk), så den ikke forveksles med den rigtige app.
export const isDevHost = (hostname) => /^dev\.eatsafe\.dk$/i.test(hostname || "");

export function installDevBadge(win = window) {
  if (!isDevHost(win.location && win.location.hostname)) return null;
  const doc = win.document;
  if (doc.getElementById("dev-badge")) return null;
  const el = doc.createElement("div");
  el.id = "dev-badge";
  el.textContent = "TEST";
  el.setAttribute("aria-hidden", "true");
  el.style.cssText =
    "position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:none;" +
    "padding:1px 10px;border-radius:0 0 8px 8px;font:700 10px/14px system-ui,sans-serif;letter-spacing:.08em;" +
    "background:var(--blue,#3A6EA5);color:#fff";
  doc.body.appendChild(el);
  return el;
}
