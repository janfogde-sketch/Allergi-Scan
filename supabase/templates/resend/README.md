# Resend-skabeloner (oprettet 30. sept. 2026)

De 22 godkendte mails fra udviklerpakken (Mails/Resend), oprettet og **publiceret** i Resend
(ingen mails er sendt). HTML-filerne her er kilden; `catalog.json` har Resend-id, alias, emne og
variabler pr. skabelon.

- Variabler skrives `{{{navn}}}` (Resends syntaks; pakkens `{{navn}}` er konverteret). Alle er
  deklareret med fallback. Afsenderen (`notify`) skal HTML-escape tekstværdier, før de sendes.
- Skabelonerne indeholder `<style>` (mørk tilstand og mobil). Resend beholder den ved oprettelse
  via API'et, men **åbnes en skabelon i Resends visuelle editor, kan den blive ændret** — ret
  hellere HTML-filen her og opdatér skabelonen via API'et.
- Ændres mailens tekst, skal `supabase/functions/_shared/notificationContent.js` ændres tilsvarende
  (samme ordlyd i app, push og mail).
- Supabase-auth-mails (bekræftelse, glemt adgangskode m.fl.) ligger i `supabase/templates/auth/`. De sendes fra
  Resend: enten af `auth-send-email` (Send Email Hook, HTML'en bygges ind i funktionen), eller, hvis hook'en er slået
  fra, af Supabase Auth via Resends SMTP med skabelonerne fra `deploy-auth-templates.yml`. Se `src/CONTEXT.md` afsnit 16.
- N1 (velkomst) sendes af `send-email` direkte med HTML'en fra denne mappe (kopieret til
  `supabase/functions/_shared/welcomeMail.ts` med `node scripts/build-welcome-mail.mjs`), ikke
  via Resend-skabelonen — så overskrift og tekst følger filen her.
