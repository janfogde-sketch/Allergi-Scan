# Fortsæt med Apple: opsætning (8. okt. 2026)

Koden er klar. Knappen "Fortsæt med Apple" vises øverst på Log ind/Ny bruger, så snart Apple-udbyderen er slået til i
Supabase (`src/useOAuthProviders.js` spørger `/auth/v1/settings`). Der skal altså ikke laves en ny app-version, når
kontoen er klar. Login går gennem Supabase som Google/Facebook (`handleOAuth("apple")` i `src/useAuth.js`), og nye
brugere lander i onboarding, der selv spørger om navn (Apple sender ikke navnet med i web-login).

## 1. Hos Apple (developer.apple.com → Certificates, Identifiers & Profiles)

1. **App ID** (Identifiers → +, App IDs): appens bundle-id (fx `dk.eatsafe.app`). Sæt kryds ved **Sign In with Apple**.
2. **Services ID** (Identifiers → +, Services IDs): fx `dk.eatsafe.login`. Det er "Client ID" i Supabase.
   Sæt kryds ved **Sign In with Apple** → **Configure**:
   - Primary App ID: App ID'et fra punkt 1.
   - Domains and Subdomains: `jegrpcflyguadyxialkm.supabase.co` og `www.eatsafe.dk`
   - Return URLs: `https://jegrpcflyguadyxialkm.supabase.co/auth/v1/callback`
3. **Key** (Keys → +): navn fx "EatSafe Sign in with Apple", kryds ved **Sign In with Apple**, Configure → vælg App ID'et.
   Download `.p8`-filen (kan kun hentes én gang) og notér **Key ID**. **Team ID** står øverst til højre på siden.
4. **Mails til skjulte adresser** (Services → **Sign in with Apple for Email Communication** → Configure):
   tilføj domænet `eatsafe.dk` og afsenderen `noreply@eatsafe.dk`. Uden dette når vores mails (bekræftelse,
   nulstilling, invitationer, beskeder) ikke brugere, der har valgt "Skjul min e-mail". Apple tjekker SPF/DKIM for domænet;
   Resend-domænet er allerede sat op, så det bør blive grønt.

## 2. I Supabase (Authentication → Sign In / Providers → Apple)

1. Slå **Apple** til.
2. **Client IDs**: Services ID'et fra punkt 2 (fx `dk.eatsafe.login`). Kommer der senere et indbygget iOS-login, tilføjes
   bundle-id'et kommasepareret.
3. **Secret Key (for OAuth)**: en JWT lavet af `.p8`-nøglen, Key ID, Team ID og Services ID. Supabases dokumentation
   (søg "Login with Apple" → "Generate a client secret") har et værktøj til det. **Hemmeligheden udløber efter højst 6 måneder**
   og skal laves igen; opret en to do med frist, når den er sat ind, ellers holder Apple-login op med at virke.
4. Gem. Tjek under Authentication → URL Configuration, at `https://www.eatsafe.dk/` står under Redirect URLs (gør den allerede
   for Google/Facebook).

Derefter: åbn www.eatsafe.dk, vælg Log ind, og tjek at "Fortsæt med Apple" er kommet frem og logger ind.

## 3. Åbne punkter

- **Kontosletning og Apple:** Apple beder apps med Sign in with Apple om at tilbagekalde brugerens Apple-token, når kontoen
  slettes (Apples REST-endpoint `auth/revoke`). `delete-user` sletter kontoen hos os, men kalder ikke Apple. Det kræver, at
  Apples refresh-token gemmes ved login (ny personoplysning, så privatlivspolitik og sletningstest skal med). Afklares sammen
  med iOS-appen (to do "iOS via Capacitor").
- **iOS-appen (Capacitor):** login skal åbne i systembrowseren og vende tilbage via deep link, ligesom Google (samme to do).
  Et indbygget Apple-login (Apple-arket direkte i appen) kan komme senere; det kræver bundle-id'et under Client IDs.
