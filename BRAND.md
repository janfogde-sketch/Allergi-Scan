# EatSafe brandguide

> Den ene kilde til, hvordan EatSafe ser ud: logo, farver, skrift, form, komponenter og tone.
> Gælder appen, admin-panelet, de selvstændige sider i `public/`, mails, butiksbilleder og alt andet med EatSafes navn på.
> Ejer: Bjørn (design/UI/UX). Senest opdateret 7. okt. 2026 (nyt logo A uden gradient).
> Visuel udgave (designsystem, kan åbnes på mobilen): https://claude.ai/artifact/KWDSEiUt7bBGn8iFm8WTCJ
>
> Testen `src/brandConsistency.test.js` fejler, hvis en udfaset farve dukker op igen, hvis en side bruger en anden `--green`
> end appen, eller hvis logoets SVG'er får en gradient eller fremmed farve.

---

## 1. Logo

**Opbygning (logo A, Bjørn 7. okt. 2026):** et stregkodemærke med 7 lodrette streger, hvor et flueben går gennem stregerne
med lige meget luft på begge sider af den grønne streg, og hele mærket er centreret. Ordmærket "EatSafe" står til højre.
Ingen gradient i logoet.

| Del | Farve |
|---|---|
| "Eat" og stregerne | `#232528` (`--brand-ink`) |
| "Safe" og fluebenet | `#0F7D4F` (`--green`, samme grøn som Scan-knappen) |
| App-ikonets baggrund | `#FBFAF7` (off-white) |
| Mørk baggrund (kun mail i mørk tilstand) | hvid `#FFFFFF` + lysegrøn `#79D5A7` |

**Varianter og filer**

| Variant | Brug | Fil |
|---|---|---|
| Vandret logo (mærke + ordmærke) | velkomst, login, onboarding, admin | `src/assets/logo/eatsafe-logo-horizontal.svg` via `<EatSafeLogo />` |
| Symbol (kun mærket) | kompakte steder, scan-animation | `eatsafe-symbol.svg` via `<EatSafeLogo variant="symbol" />` |
| Monokrom (vandret/symbol) | print, PDF, sort/hvid | `*-mono.svg` |
| Tekst-ordmærke | appens header | `<EatSafeWordmark />` (`.topbar-wordmark`, 26 px, vægt 800) |
| App-ikon | hjemmeskærm, butikker | `public/brand/EatSafe_AppIcon_Master.svg` → `icon-*.png`, `apple-touch-icon.png` |
| Favicon | browserfane | `public/favicon.svg` |
| Mail-logo | alle 29 mails | `public/brand/EatSafe_Logo_Email_Light*.png` (lys) og `..._Dark.png` (mørk) |
| Print/vektor | eksterne parter | `public/brand/EatSafe_Master_*.svg/.pdf`, `EatSafe_Brand_Reference.pdf` |

Master-SVG'erne i `src/assets/logo/` og `public/brand/` er kilden; PNG'er gengives fra dem (`public/brand/README.txt`).
App-ikonet har ingen indbagte runde hjørner eller skygge; iOS og Android lægger selv masken på.

**Gør ikke:** gradient, skygge, glød eller kontur på logoet; andre farver end ovenfor; strække eller dreje det; flytte
fluebenet; sætte det på et foto eller en farvet flade uden en lys plade bag; bygge et nyt ordmærke med HTML i stedet for
`EatSafeWordmark`/`EatSafeLogo`; ændre antallet af streger (7).

**Slogan:** "Mere tryghed i hverdagen", kun under logoet på velkomstsiden og i "Om EatSafe".

---

## 2. Farver

Alle farver er CSS-variabler i `:root` i `src/theme.jsx`. Komponenter bruger kun variablerne, aldrig hex-koder.
Steder, der ikke kan læse appens CSS (mails, `public/*.html`, admin, edge-funktioner), kopierer hex-værdierne herfra.

### Grøn: én primær, én accent

| Token | Værdi | Brug |
|---|---|---|
| `--green` | `#0F7D4F` | **Primær handlingsfarve og brandgrøn**: knapper, Scan-knappen, aktive faner/toggles/trin, links, "Safe" i logoet |
| `--green-dark` | `#0C643F` | mørk side af knap-gradienter (Scan, velkomstknap), tekst på lys grøn |
| `--green-glow` | `#15945F` | hover på primærknapper |
| `--green-selected-bg` | `#EFF9F4` | baggrund for valgt chip/fane/filter (altid med `border-color:var(--green)`) |
| `--green-halo` | `#DDF4E8` | glød bag Scan-knappen |
| `--green-lt` / `--green-mid` | `#0F7D4F` ved 10 % / 18 % | bløde baggrunde og kanter (ikke valgt-tilstand) |
| `--green-accent` | `#34D06A` | **kun** små positive mikro-elementer: flueben i chips, "sikker"-prikker og -badges. Aldrig knapper eller valgt-tilstand |
| `--on-green` | `#FFFFFF` | tekst på grøn |

### Status (resultatet af en scanning)

| Betydning | Token | Værdi |
|---|---|---|
| Passer til dig (ingen fund) | `--green` / `--green-accent` | `#0F7D4F` / `#34D06A` |
| Spor ("kan indeholde spor af") og kostfravalg | `--amber` | `#9A6514` (hvid tekst: `--on-amber`) |
| Indeholder allergen, fejl, sletning | `--red` | `#C8402E` |
| Kan ikke vurderes, offline, gemte data | `--neutral` (alias `--unknown`) | `#5C6A61` |
| Sekundær info, tips, oplysningsbokse | `--blue` | `#3A6EA5` |

Spor er altid gule, kun direkte indhold er rødt. Rød bruges kun ved egentlig fare eller fejl; offline er neutral grå,
genopretning er grøn. Hver statusfarve har `-lt` (ca. 8-12 %) og `-md` (ca. 18-20 %) til flader og kanter.

### Tekst, flader og kanter

| Token | Værdi | Brug |
|---|---|---|
| `--ink` | `#15201A` | brødtekst og overskrifter (grøn-sort, ikke ren sort) |
| `--ink2` / `--ink3` | `--ink` ved 78 % / 62 % | sekundær tekst |
| `--muted` | `--ink` ved 66 % (5,4:1) | hjælpetekst |
| `--muted2` | `--ink` ved 40 % | **kun** kanter, ikoner og deaktiveret tekst |
| `--paper` / `--surface` | `#FFFFFF` | baggrund og kort (lyst tema; dark mode er droppet) |
| `--surface2` / `--surface3` | `#F4F4F2` / `#FAFAF9` | felter, rækker, paneler |
| `--border` / `--border2` | `--ink` ved 10 % / 16 % | kanter |
| `--field-border` | `--ink` ved 50 % | inputfelter (mindst 3:1) |

Krav: tekst mindst 4,5:1 mod baggrunden, kanter på felter mindst 3:1.

### Mail (mørk tilstand, alle 29 mails)

Ydre `#121413`, kort `#1C1F1E`, panel `#262A28`, overskrift `#F4F7F5`, brødtekst `#C9CFCC`, sekundær `#9FA8A3`,
grøn tekst `#79D5A7`, knap altid `#0F7D4F` med hvid tekst. Lys tilstand bruger appens farver. Regler og test:
`supabase/templates/resend/README.md`, `src/mailDarkMode.test.js`.

### Uden for appen

| Sted | Farver |
|---|---|
| PWA-manifest | `theme_color #FFFFFF`, `background_color #FBFAF7` |
| Admin (`admin.html`, `src/admin/adminTheme.js`) | samme tokens; `theme-color #0F7D4F`; let grønlig baggrund `#F6F8F3` er bevidst for admin |
| `public/*.html` (vilkår, privatliv, invitation, liste, installation) | kopi af appens tokens i egen `:root` |
| Butiksbilleder og Google Play-banner | logo A og `#0F7D4F`; filer i projektmappen `eatsafe/butiksbilleder-v3-2026-10-07/` |

**Udfasede farver** (må ikke bruges, testen fanger dem): `#0E8F5A`, `#08734A` (gammel Scan-palet), `#178A50`, `#039A55`,
`#B5791A` (gammel amber), `#6B7A70` (gammel neutral) og Tailwind-farver som `#16a34a`, `#2563eb`, `#6B7280`.

---

## 3. Skrift

- **DM Sans** til alt (`--f`), **DM Mono** til tal og koder (`--mono`). Selvhostet i `public/fonts/` (ingen Google-forbindelse).
  Aldrig Inter, Space Grotesk eller serif-skrift.
- Skala: `--fs-xs 10` · `--fs-sm 12` · `--fs-md 14` · `--fs-lg 17` · `--fs-xl 22` · `--fs-2xl 28` (px). Inputfelter er 16 px
  (undgår zoom på iPhone).
- Vægte: 800 til overskrifter og ordmærket, 700 til knapper og labels, 600 til chips, 400-500 til brødtekst.
  Overskrifter har let negativ spatiering (`-.2px` til `-.4px`).

---

## 4. Form, afstand og bevægelse

- **Afstande:** 4 / 6 / 8 / 10 / 12 / 14 / 16 / 20 / 24 / 32 px. Ingen "næsten runde" tal (9, 11, 13, 15).
- **Hjørner:** kort og bokse `--r` 12 px, knapper og chips 10 px, små knapper 8 px, badges 6 px, piller 100 px, store
  velkomstknapper 16 px, Scan-knappen og ikonknapper runde.
- **Skygger:** `--sh` (kort), `--sh2` (fremhævede kort), `--sh3` (ark), `--sh-green` (under primærknapper). Bløde og lyse,
  aldrig sorte. Kort uden skygge ser flade ud: vælg bevidst skygge eller flad med kant.
- **Trykflade:** mindst 44 × 44 px.
- **Tryk-feedback:** `:active{transform:scale(.97)}` (Scan-knappen `.95`). Hover på primærknap skifter farve og løfter 1 px.
- **Animation:** rolig. Scan-haloen pulserer langsomt (4 s). Ingen fade-in ved scroll, ingen lys der følger fingeren.
- **Overlays** renderes via portal til `document.body`.

---

## 5. Komponenter

Brug de delte klasser og komponenter, ikke inline-styles der genopfinder dem.

| Behov | Brug |
|---|---|
| Primær handling | `.btn.btn-primary.btn-full` (grøn, hvid tekst) |
| Sekundær handling | `.btn.btn-outline` eller `.btn.btn-ghost` |
| Farlig handling | `.btn.btn-danger` (rød kun i selve bekræftelsen) |
| Tekstlink | `.link-green` / `.link-back` |
| Valg | `.chip` / `.chip.on`, `.tab`, `.filter-chip` (valgt = `--green` kant + `--green-selected-bg`) |
| Kort | `.card` |
| Fejl/offline/tom | `StateBox`/`LoadErrorBox` (`.state-box`, `.state-page`, `.offline-bar`) |
| Beskeder | `showToast(msg, "success"\|"error")`, aldrig `alert()` |
| Info-ark og vælgere | `InfoSheet`, `ListPickerSheet` |
| Ikoner | `<Icon name=… />` fra `SharedComponents.jsx` (selvtegnede streg-ikoner). Nye ikoner tilføjes dér |

**Scan-knappen på forsiden er en bevidst undtagelse (Bjørn, 7. okt. 2026):** den beholder sin gradient fra `--green` til
`--green-dark`, det hvide lysskær foroven og haloen i `--green-halo`, nu med langsomme bølgeringe. Gør den ikke flad, og brug ikke
gradienten andre steder end på Scan-knappen og den store velkomstknap (`ScannerScreen.jsx`, `.welcome-btn`).

**Emoji:** kun som indhold (allergen-glyffer, sprogflag, kategorier), aldrig i knapper, overskrifter eller anden UI-ramme.

---

## 6. Tone og ord

- Dansk, kort og roligt, i du-form. Ingen buzzwords.
- "Familie" (ikke "husstand"); "Børneprofil" for under 18 uden egen konto; "Kan ikke vurderes" når data mangler, aldrig
  "sikker" blot fordi intet blev fundet.
- Fast ansvarsfraskrivelse på resultatsiden: "EatSafe er vejledende…".
- Ingen tekniske ord over for brugeren ("cachede data" → "Gemte produktdata").

---

## 7. Når noget skal ændres

1. Ret token i `:root` i `src/theme.jsx` (og JS-kopien `THEME` øverst i samme fil).
2. Ret de kopier, der ikke kan læse appens CSS: `src/admin/adminTheme.js`, `public/*.html`, mailskabeloner (alle 29 på én
   gang), edge-funktioner med inline-HTML (fx `admin-digest`), `public/manifest.json`.
3. Logo: ret master-SVG'erne og gengiv PNG'erne (`public/brand/README.txt`).
4. Opdatér denne fil, `.claude/rules/design-tokens.md` og `RETIRED`-listen i `src/brandConsistency.test.js`.
5. Kør `npx vitest run`.

Antimønstre (det, vi bevidst ikke vil have): `.claude/rules/design-tokens.md`.
