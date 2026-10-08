// @ts-nocheck
// iOS åbner kun tastaturet, når et felt får fokus i selve trykket. Kaldes i "Indtast kode"-trykket: et usynligt felt får fokus
// med det samme, og arket flytter fokus videre til sit eget felt, så tastaturet bliver oppe.
export function primeBarcodeKeyboard() {
  if (typeof document === "undefined") return;
  const proxy = document.createElement("input");
  proxy.setAttribute("inputmode", "numeric");
  proxy.setAttribute("aria-hidden", "true");
  proxy.tabIndex = -1;
  proxy.dataset.barcodeProxy = "1";
  proxy.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;";
  document.body.appendChild(proxy);
  proxy.focus({ preventScroll: true });
  setTimeout(() => proxy.remove(), 1000);
}
