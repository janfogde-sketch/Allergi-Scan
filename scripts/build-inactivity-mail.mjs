// Genererer INACTIVITY_MAIL_HTML i supabase/functions/_shared/inactivityMail.ts ud fra
// supabase/templates/resend/P7-inaktiv-konto.html. Kør: node scripts/build-inactivity-mail.mjs
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("supabase/templates/resend/P7-inaktiv-konto.html", "utf-8");
const path = "supabase/functions/_shared/inactivityMail.ts";
const ts = readFileSync(path, "utf-8");
const next = ts.replace(/export const INACTIVITY_MAIL_HTML = .*;\n/, () => `export const INACTIVITY_MAIL_HTML = ${JSON.stringify(html)};\n`);
writeFileSync(path, next);
console.log("inactivityMail.ts opdateret");
