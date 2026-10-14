# Natjob-tråden (fast routine på Jans abonnement)

Fra 15. okt. 2026 (plan: `eatsafe/natjob-kategorisering-abonnement-plan-2026-10-14.md` i projektmappen) gør en fast Claude-tråd det arbejde,
som cron-jobbene `auto-reparse` (allergencheck af varer med kvalitet pending/low) og `classify-categories-backlog` (underkategori) gjorde
med API-nøglen. Tråden kører én gang i døgnet kl. 03:30 UTC (05:30 dansk sommertid).

## Sådan gør tråden

1. **Hent køen:** start workflowet `natjob-hent.yml` ("Hent natjob-kø") på `main` med GitHub-værktøjet `actions_run_trigger`
   (method `run_workflow`). Vent på kørslen (`actions_list` list_workflow_runs), og læs loggen (`get_job_logs`) mellem
   `=== NATJOB-KØ START ===` og `=== NATJOB-KØ SLUT ===`. Indhold: `allergen` (varer til allergencheck), `category` (varer uden
   underkategori) og `taxonomy` (den faste kategoriliste).
2. **Allergener:** for hver vare med `needs_ai: true` læser tråden `ingredients_text` og finder allergener, motoren kan have overset
   (fremmedsprog, sjældne ord, negationer). Svaret er kun de allergener, der er `traces` eller `yes`; et tomt objekt betyder "læst, intet fundet".
   Varer med `needs_ai: false` sendes uden `claude`. Allergennøgler: gluten, hvede, maelkeallergi, laktose, aeg, noedder, jordnoedder, soja,
   fisk, skaldyr, selleri, sennep, sesam, svovl, lupin, bloeddyr. Er du i tvivl, så vælg det forsigtige (`traces`).
3. **Kategorier:** for hver vare i `category` vælges præcis én kategori og én underkategori fra `taxonomy`. Kan varen ikke placeres: `{"id":"…","skip":true}`.
4. **Skriv:** start workflowet `natjob-skriv.yml` ("Skriv natjob-resultat") med input `payload`:
   ```json
   {"note":"natjob 15. okt.",
    "allergen":[{"id":"<uuid>"},{"id":"<uuid>","claude":{"sesam":"traces"}}],
    "category":[{"id":"<uuid>","category":"Kolonial","subcategory":"Pasta & ris"},{"id":"<uuid>","skip":true}]}
   ```
   Højst ca. 60.000 tegn pr. kald; del ellers op i flere kørsler. Bekræft, at kørslen står `success`.
5. **Er køen tom**, skrives alligevel `{"note":"tom kø"}`. Det fortæller databasen, at tråden lever (se nødstart).

Kører workflowet igen motoren på varens egen tekst, så tråden kan kun tilføje fund. Ændrer intet i koden, opretter ingen PR og
skriver ikke til to do-listen. Fejler noget, så skriv det kort i trådens svar.

## Sikkerhed

- **Kun opad:** `public.routine_apply` tager pr. allergen det strengeste af gammelt og nyt flag (nej < spor < ja) og rører kun varer i køen.
  Kategori sættes kun på varer uden underkategori. Gamle og nye værdier står i `routine_changes` (90 dage).
- Funktionerne kan kun kaldes af workflowene (ikke af appen).

## Nødstart og kontakt

- `public.routine_active()` er sand, når `app_flags.ai_jobs_via_routine` er `true` OG tråden har skrevet inden for 36 timer.
  Så springer `run_auto_reparse()` og `run_classify_categories()` over. Ellers kører de som før med API-nøglen.
- Helt tilbage til det gamle: en migration, der sætter `ai_jobs_via_routine` til `false`.
- Uændret: admin-knappen "Kør genanalyse", kategorisering ved godkendelse af en indsendelse og genkørslen af lange lister (`allergen-claude-long`).
