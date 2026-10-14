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
| Associated Domains (retur fra login, trin 2) | `applinks:www.eatsafe.dk` + fil `apple-app-site-association` på eatsafe.dk | App ID |
| Sign in with Apple | `docs/apple-login-opsaetning.md` | Services ID |
| Bygning | Mac/Xcode eller bygge-tjeneste; ikke valgt endnu | |

## Login i systembrowseren (trin 2)
- I iPhone-rammen åbner Google/Facebook (og senere Apple) i telefonens browser (`src/nativeShell.js`, `handleOAuth` i `src/useAuth.js`) og
  vender tilbage via adressen `dk.eatsafe.app://auth` (URL-skema i `Info.plist`).
- **Skal sættes i Supabase (Authentication → URL Configuration → Redirect URLs): `dk.eatsafe.app://auth`.** Uden den afvises login i iPhone-appen.
  Browseren og Android er upåvirket.
- Retur-adressen er et eget URL-skema, så det virker uden Apple-konto. Universal Links (`applinks:`) kan skiftes til senere.
