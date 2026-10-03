// Genererer INVITE_MAIL_HTML i supabase/functions/_shared/inviteMail.ts ud fra
// supabase/templates/resend/N9-familieinvitation.html. Kør: node scripts/build-invite-mail.mjs
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("supabase/templates/resend/N9-familieinvitation.html", "utf-8");
const path = "supabase/functions/_shared/inviteMail.ts";
const ts = readFileSync(path, "utf-8");
const next = ts.replace(/export const INVITE_MAIL_HTML = .*;\n/, () => `export const INVITE_MAIL_HTML = ${JSON.stringify(html)};\n`);
writeFileSync(path, next);
console.log("inviteMail.ts opdateret");
