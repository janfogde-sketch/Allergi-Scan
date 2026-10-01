---
paths: ["supabase/functions/**/*.ts"]
---

# Edge Function auth-mønster

Rescue-audittets Tier 1/2 fandt gentagne gange Edge Functions uden noget
auth-tjek overhovedet (`products`, `ocr`, `auto-import-off`, `weekly-digest`,
`send-email` — alle siden rettet). Enhver ny eller ændret funktion i
`supabase/functions/*/index.ts` skal bevidst falde i én af disse fem
kategorier — ikke bare "virke":

1. **Kræver bruger-login:** `auth.getUser()` (via en bruger-scopet klient
   med anon-nøgle + kalderens `Authorization`-header) før noget følsomt
   læses/skrives (personoplysninger, allergidata, indkøbslister).
2. **Kræver admin-rolle:** login-tjek OVEN I et rolle-opslag
   (`users.role === "admin"`) for handlinger kun admins må udføre — samme
   mønster som `admin`/`delete-user`.
3. **Legitimt offentligt/anonymt:** `verify_jwt:false` er en bevidst,
   dokumenteret beslutning (fx `search`, `allergens`-læsning — anonym
   scanning/søgning skal virke uden login), med fornuftige grænser
   (`MAX_TEXT_LENGTH`/`MAX_BASE64_LENGTH`-stil caps mod abuse).
4. **Kun cron/service-role:** verificerer rent faktisk service-role-nøglen
   (`req.headers.get("apikey") === serviceRoleKey` eller
   `Authorization === "Bearer " + SUPABASE_SERVICE_ROLE_KEY`) — antag ALDRIG
   at en funktion kun kaldes internt bare fordi den ikke er linket fra UI'et.

5. **Signeret webhook:** kaldes af en tjeneste uden bruger-JWT (fx Supabase Auths Send Email Hook,
   `auth-send-email`). `verify_jwt:false`, men funktionen SKAL verificere signaturen (Standard Webhooks via
   `_shared/standardWebhook.ts`, hemmelighed i en funktions-secret) og svare 401 uden gyldig signatur,
   før noget læses eller sendes.

   Variant: **signeret token-link** (`report-unrequested-reset`): kaldes fra en statisk side med en token fra en mail;
   `verify_jwt:false`, men HMAC-signatur og udløb (`_shared/reportLink.ts`) kontrolleres før noget læses eller skrives.

En funktion der ikke falder bevidst i én af de fem er sandsynligvis et hul.

**IDOR-fælden:** når en funktion tjekker ejerskab af ÉT id (fx `listId`) men
udfører selve mutationen på et ANDET, ubundet id (fx `itemId` uden
`.eq("list_id", listId)`), er ejerskabs-tjekket illusorisk. Bind altid
mutationens `.eq()`/`.match()` til det samme id som blev autoriseret.

**Før du designer et auth-tjek:** grep efter alle reelle kaldere af
funktionen (`grep -rn "<function-navn>" src supabase`) — et tjek der kun
dækker ét legitimt kald-mønster kan utilsigtet bryde et andet (fundet i
praksis: `auto-reparse` kaldes både fra cron OG fra AdminScreens
"reparse nu"-knap; `send-push` sender både til sig selv OG til andre
familiemedlemmer ved invitation).

Se `.claude/skills/security-check/SKILL.md` for den fulde gennemgangs-
proces, og `SECURITY_TODO.md` for historikken over konkrete fund og
rettelser.
