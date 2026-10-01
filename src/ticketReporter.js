// @ts-nocheck
// Hvem og hvad en ticket kommer fra, til admin. Nye tickets indeholder hverken navn eller e-mail (dataminimering); de kobles til en
// konto via `submitted_by` (sat af serveren) og det interne bruger-ID i konteksten. Ældre tickets har stadig navn/e-mail og vises som før.
export function ticketReporter(t) {
  const ctx = t?.context || {};
  if (ctx.user_name) return ctx.user_name;
  const id = t?.submitted_by || ctx.user_id;
  return id ? `Konto ${String(id).slice(0, 8)}` : "Anonym";
}

export function ticketDevice(ctx = {}) {
  if (ctx.os) return `${ctx.os}${ctx.os_version ? ` ${ctx.os_version}` : ""}${ctx.device_type ? ` · ${ctx.device_type}` : ""}`;
  const ua = ctx.user_agent || "";
  return /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : "Desktop";
}
