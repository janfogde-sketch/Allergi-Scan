// Genererer LIST_MAIL_HTML i supabase/functions/_shared/listMail.ts ud fra
// supabase/templates/resend/P3-delt-indkoebsliste.html. Kør: node scripts/build-list-mail.mjs
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("supabase/templates/resend/P3-delt-indkoebsliste.html", "utf-8");
const path = "supabase/functions/_shared/listMail.ts";
const ts = readFileSync(path, "utf-8");
const next = ts.replace(/export const LIST_MAIL_HTML = .*;\n/, () => `export const LIST_MAIL_HTML = ${JSON.stringify(html)};\n`);
writeFileSync(path, next);
console.log("listMail.ts opdateret");
