# Arkitektur — detaljer

Detaljer bag afsnit 3 i `CLAUDE.md`.

## Store filer er delt op (8. okt. 2026, ren omflytning)

- `SharedComponents.jsx` og `constants.jsx` er samlefiler, der genudgiver fra `Icons`/`Sheets`/`ProductParts`/`ToastAndMisc`/`EatSafeLogo`/`IngredientsList` og `src/data/`. Ret i den fil, tingen bor i. Import stadig fra samlefilen.
- `App.jsx` har udbydere (`AppProviders`), context-værdier (`useAppContextValues`) og `BottomNav`.
- Onboarding-, Result- og Scanner-skærmene er delt i `OnboardingStep1-5`/`Welcome`/`Login`, `ResultSections` og `ScannerHome`/`ScannerParts`. De får skærmens lokale tilstand som `ctx`.
- Plan for opdeling: `eatsafe/del-store-filer-plan-2026-10-08.md` i projektmappen.

## Delte komponenter (`SharedComponents.jsx`)

- `Icon`: ét SVG-bibliotek. Ingen emoji i UI-chrome, kun indholds-emoji som allergen-glyffer. Nye ikoner tilføjes her.
- `showToast(msg, "success"|"error")` + `<ToastHost/>`. Brug ikke native `alert()`.
- `ListPickerSheet`, `InfoSheet` (bottom-sheet til info-ikoner).
- `EatSafeLogo` (varianter horizontal/symbol). Bruges på velkomst, login, onboarding og admin. Header bruger tekst-wordmark.
- `productDisplayName()` i `helpers.js`.

## Login via links (15. okt. 2026, sikkerhedsfund S4/S5)
- Google/Facebook/Apple (web og systembrowser i iPhone-appen) bruger PKCE: `src/authLink.js` laver engangsnøglen, retur er `?code=`, som kun
  veksles med nøglen fra samme enhed. iPhone-returen `dk.eatsafe.app://auth?code=` sendes videre af `authReturnTarget` (`nativeShell.js`).
- Mail-links (`?token_hash=&type=&email=`) og den gamle form (`#access_token=`) logger først ind efter "Fortsæt" på `AuthConfirmScreen.jsx`.
  Passer kontoen ikke til e-mailen i linket, afvises den. Plan: `/mnt/project-files/eatsafe/plan-sikrere-login-2026-10-15.md`.

## Allergenmotor: matchningsregler

Motoren ligger i `supabase/functions/_shared/allergenEngine.js` (test `src/allergenEngine.test.js`). Frontend-logik i `src/helpers.js` (`compareAllergens`, `computeProfileResults`, `categorizeProductFindings`, `computeTopStatus`).

Nøgleordslisten er én fælles fil: `supabase/functions/_shared/allergenKeywords.js`. Den bruges af både motoren og `src/allergenKeywords.js`.

- **Ental og flertal:** hvert tælleligt dansk substantiv skal have begge former ("hasselnød" + "hasselnødder"), undtagen ord hvor de er ens ("æg", "fisk", "rug", "byg", "havre"). Pas på tvetydige ord (fx "snegle").
- **Understreng (6. okt. 2026):** nøgleord på 5 tegn eller mere matches som understreng (fanger "FuldkornsHVEDE", "Mandelflager"). Undtagelser står i `NO_SUBSTRING`. Ord der ikke må matche (boghvede, kanelsnegl, kokosfløde) fjernes i `normalizeIngredientText`.
- **Hele ord:** ord på højst 4 tegn matcher som hele ord, med eksplicitte sammensætningsregler i `SHORT_PATTERNS`.
- **Negation:** gælder kun inden for samme kommasegment.
- **Spor-signal:** "kan indeholde spor af" skal stå i samme sætning FØR ordet.
- **Regressionsliste:** ændringer i motoren skal have en liste i `src/fixtures/allergenRegression.json` (test `src/allergenRegression.test.js`).
- **Genanalyse:** `allergen-reanalyze` kører først som `dry_run` (diff-tabel), så `apply`. Kun opadgående: nej → spor → ja, aldrig nedgange, fordi motoren ikke kender fremmedsprog og fiskenavne. Backup i `products_allergen_backup_20261006`.
- Usikkerheder: `docs/allergenlogik-usikkerheder.md`.


## Flyttet fra CLAUDE.md (14. okt. 2026)

8. **Indholdsspærre (CSP):** `vercel.json` sætter Content-Security-Policy. Kun egne scripts (`script-src 'self'`): intet inline `<script>` i HTML
   (læg koden i `public/js/`), ingen `eval`. Nye eksterne adresser skal i spærren; `src/securityHeaders.test.js` vogter den.
