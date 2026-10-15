# iPhone-appen (Capacitor): tjekliste (14. okt. 2026)

Plan: `/mnt/project-files/eatsafe/ios-skal-plan-2026-10-14.md`. iOS-rammen er en tynd skal om www.eatsafe.dk
(`capacitor.config.json`, `server.url`). Hjemmesiden ændres ikke; ny kode aktiveres kun, når `window.Capacitor` findes
(`isStoreBuild()` i `src/storeBuild.js`). App-id `dk.eatsafe.app` er det samme som Android.

## Kommandoer
- Efter ændring i `capacitor.config.json` eller plugins: `npx cap sync ios` (virker uden Mac).
- `ios/` ligger i repoet; `ios/App/App/public`, `capacitor.config.json` og `config.xml` under `ios/App/App/` genereres og er ignoreret.
- Lint og typetjek ignorerer `ios/`.

## Pladsholdere, der udfyldes, når Apple-kontoen findes
| Hvad | Hvor | Kilde hos Apple |
|---|---|---|
| Team ID og signering | Xcode → App → Signing & Capabilities (`DEVELOPMENT_TEAM` i `ios/App/App.xcodeproj/project.pbxproj`) | Membership |
| Push-nøgle (.p8), Key ID | Supabase secrets `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID` (indføres i trin 3) | Keys → Apple Push Notifications service |
| Capability "Push Notifications" | Xcode → Signing & Capabilities | App ID |
| Associated Domains (retur fra login, trin 2) | Xcode → + Capability → Associated Domains: `applinks:www.eatsafe.dk`; erstat `TEAMID` i `public/.well-known/apple-app-site-association` med Team ID | App ID |
| Sign in with Apple | `docs/apple-login-opsaetning.md` | Services ID |
| Bygning | Mac/Xcode eller bygge-tjeneste; ikke valgt endnu | |

## Login i systembrowseren (trin 2)
- I iPhone-rammen åbner Google/Facebook (og senere Apple) i telefonens browser (`src/nativeShell.js`, `handleOAuth` i `src/useAuth.js`) og
  vender tilbage via `https://www.eatsafe.dk/auth-retur` (`NATIVE_AUTH_REDIRECT`, sikkerhedsfund S5). Login bruger PKCE, så adressen bærer
  kun en engangskode, som er værdiløs uden nøglen i appen.
- Med Associated Domains (tabellen ovenfor) åbner iPhone appen direkte på den adresse (Universal Link). Uden sender serveren
  (`api/auth-retur.js`) videre til appens eget URL-skema `dk.eatsafe.app://auth` (`Info.plist`), så login virker også før Apple-kontoen.
  Kun `code` og fejl sendes videre.
- **Skal stå i Supabase (Authentication → URL Configuration → Redirect URLs): `https://www.eatsafe.dk/auth-retur`** (præcis, uden stjerne).
  Uden den falder Supabase tilbage til standardadressen, og login i iPhone-appen afbrydes. Browseren og Android er upåvirket.
- Tjek efter Associated Domains: `https://www.eatsafe.dk/.well-known/apple-app-site-association` viser Team ID, og et login i appen
  vender tilbage uden at vise "Åbn i EatSafe?".

## Apples push (trin 3)
- Appen (`src/nativePush.js`, `src/usePush.js`) beder om tilladelse, får Apples push-adresse og gemmer den i `push_tokens.token` som
  `{"platform":"ios","apns":"<hex>"}` (samme tabel og `claim_push_token` som web-push; ingen databaseændring). Tryk på en besked åbner
  `url` i beskeden, kun hvis den peger på www.eatsafe.dk.
- Serveren (`supabase/functions/_shared/apns.ts`, brugt af `notify` og `notify-test`) sender til Apple. **Uden secrets nedenfor springes
  iPhone-tokens over uden spor, og web-push er uændret.** Sæt i Supabase → Edge Functions → Secrets, når Apple-kontoen findes:
  `APNS_KEY_P8` (hele .p8-filen), `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID=dk.eatsafe.app`. `APNS_SANDBOX=true` kun til bygninger direkte
  fra Xcode (TestFlight og App Store bruger produktion). Redeploy `notify` og `notify-test` er ikke nødvendigt, secrets læses ved hvert kald.
- **I Xcode:** Signing & Capabilities → + Capability → Push Notifications (opretter `App.entitlements`; kræver Apple-kontoen).
- Privatlivspolitikken dækker allerede Apples push-tjeneste (afsnit 9, "Push-tjenester"), så teksterne er uændrede.
- Test fra admin-panelet (notify-test) virker til iPhone-tokens, så snart nøglerne er sat; kun til admin-konti som i dag.

## Native detaljer (trin 4)
- Vibration ved scanning og advarsler går via `haptic()` i `src/nativeShell.js`: telefonens egen haptik i iPhone-rammen (iOS' browser kan ikke
  vibrere), ellers `navigator.vibrate` som før. Kameratekst står i `Info.plist`. Indstillingen "Vibration" under Indstillinger gælder stadig.

## Indbygget "Fortsæt med Apple" (trin 6)
- I iPhone-rammen viser knappen "Fortsæt med Apple" (som før kun når Apple er slået til i Supabase, `useOAuthProviders`) Apples egen dialog i appen
  (`src/nativeApple.js`, plugin `@capacitor-community/apple-sign-in`). Id-tokenet veksles hos Supabase (`/auth/v1/token?grant_type=id_token`) til en
  session, som gemmes direkte (`completeLinkLogin` i `useAuth.js`). Annullerer brugeren, sker der intet. Findes pluginet ikke, åbner Apple i
  systembrowseren som Google/Facebook. Browseren og Android er uændrede, og knappens udseende er uændret.
- **Hos Apple/Supabase, når kontoen findes** (`docs/apple-login-opsaetning.md`): Supabase → Authentication → Providers → Apple → **Client IDs** skal
  indeholde både Services ID (web) og bundle-id'et `dk.eatsafe.app`, kommasepareret; ellers afviser Supabase tokenet fra appen.
- **I Xcode:** Signing & Capabilities → + Capability → Sign in with Apple (kræver Apple-kontoen).
- Apple sender navnet med ved første login i appen, men vi gemmer det ikke; onboarding spørger om navn som ved web-login.
