// Genererer supabase/functions/_shared/authMailTemplates.ts ud fra supabase/templates/auth/
// (templates.json + HTML-filerne). Kør: node scripts/build-auth-mails.mjs
// src/authMail.test.js fejler, hvis den genererede fil ikke er ajour.
import { readFileSync, writeFileSync } from "node:fs";

const dir = "supabase/templates/auth";
const templates = JSON.parse(readFileSync(`${dir}/templates.json`, "utf-8"));
const out = {};
for (const [name, { subject, file }] of Object.entries(templates)) {
  out[name] = { subject, html: readFileSync(`${dir}/${file}`, "utf-8") };
}
const header = `// supabase/functions/_shared/authMailTemplates.ts
//
// GENERERET af scripts/build-auth-mails.mjs ud fra supabase/templates/auth/ — ret ikke i hånden.
// Ret HTML-filerne eller templates.json og kør \`node scripts/build-auth-mails.mjs\`.
// Nøglerne er Supabase Auths skabelonnavne: confirmation, recovery, invite, magic_link, email_change, reauthentication.

`;
const body = `export const AUTH_MAIL_TEMPLATES: Record<string, { subject: string; html: string }> = ${JSON.stringify(out, null, 2)};\n`;
writeFileSync("supabase/functions/_shared/authMailTemplates.ts", header + body);
console.log("authMailTemplates.ts opdateret:", Object.keys(out).join(", "));
