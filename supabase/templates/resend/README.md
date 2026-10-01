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

## Mørk tilstand (1. okt. 2026, gælder alle 28 mails: Resend og `auth/`)

Samme palette og klasser i alle skabeloner (testet i `src/mailDarkMode.test.js`):
ydre baggrund `#121413`, kort `#1C1F1E` (kun en anelse lysere, næsten uden kant), felter/paneler `#262A28`,
overskrifter `#F4F7F5`, brødtekst `#C9CFCC`, sekundær tekst/footer `#9FA8A3`, grøn tekst `#79D5A7` (aldrig mørkegrøn på mørkegrå),
CTA-knap altid `#0F7D4F` med hvid tekst. Klasser: `canvas`, `paper`, `text`, `muted`, `panel`, `codebox`, `green`, `rule`,
`badge`, `num`, `btn-cell`/`btn`, `logo-light`/`logo-dark`.

- **Apple Mail, iOS Mail, Outlook (Mac/nyt) og Thunderbird** bruger `@media(prefers-color-scheme:dark)`. **Outlook.com og
  Outlook-apps** bruger `[data-ogsc]` (tekst) og `[data-ogsb]` (baggrund) med de samme farver. Metaerne
  `color-scheme`/`supported-color-schemes` er `light dark`, så klienterne ikke inverterer selv.
- **Logo:** to billeder ved siden af hinanden. `logo-light` (som før) er standard; `logo-dark`
  (`EatSafe_Logo_Email_Dark.png`, hvid "Eat" og stregkode, "Safe" i EatSafe-grøn) er skjult med `display:none` og `mso-hide:all` og vises kun i mørk tilstand.
- **Gmail** (og Outlook til Windows) understøtter ikke `prefers-color-scheme` og vælger selv, hvordan farverne vendes. Her vises det
  lyse logo (med en lys plade bag), og knappen er allerede mørk nok til, at den normalt ikke inverteres. Vi kan ikke styre mere derfra.
- Ret ALTID paletten i alle skabeloner samtidig, og kør `node scripts/build-auth-mails.mjs` og
  `node scripts/build-welcome-mail.mjs`. De 21 Resend-skabeloner i Resend-kontoen (ikke N1) skal opdateres via API'et, før mørk tilstand gælder dér.
