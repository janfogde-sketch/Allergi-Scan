// Genererer WELCOME_MAIL_HTML i supabase/functions/_shared/welcomeMail.ts ud fra
// supabase/templates/resend/N1-velkomst.html. Kør: node scripts/build-welcome-mail.mjs
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("supabase/templates/resend/N1-velkomst.html", "utf-8");
const path = "supabase/functions/_shared/welcomeMail.ts";
const ts = readFileSync(path, "utf-8");
const next = ts.replace(/export const WELCOME_MAIL_HTML = .*;\n/, () => `export const WELCOME_MAIL_HTML = ${JSON.stringify(html)};\n`);
writeFileSync(path, next);
console.log("welcomeMail.ts opdateret");
