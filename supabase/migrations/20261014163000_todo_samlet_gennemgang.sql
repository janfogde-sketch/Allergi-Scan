-- To do-listen: fund fra den samlede gennemgang 14. okt. 2026 (eatsafe/samlet-gennemgang-2026-10-14.md). Kun skrivning til to do-listen. Idempotent.
insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Falsk grønt når profilen ikke er hentet eller ingen profil er valgt',
 'Fra samlet gennemgang 14. okt. 2026 (G1 og G2). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. (1) Uden hentet profil (offline, eller login-gendannelsen tager over 8 s) vurderes et gemt produkt mod en tom profil og vises grønt. ResultScreen stopper kun loading/error, ikke idle, og useProduct genvurderer cachen. (2) Åbnes en historikpost for et slettet barn, sættes Tjekker for til det slettede id; der tjekkes mod ingen, og alt bliver grønt, også senere scanninger. helpers.js: [].every() giver safe. Forslag: profil ikke hentet eller ingen gyldige profiler giver Kan ikke vurderes; ukendte profil-id sorteres fra med dig selv som reserve; historikken ændrer ikke det globale valg (HistoryScreen.jsx linje 140). Lille. Husk regressionstest.',
 'todo', 'high', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Falsk grønt når profilen ikke er hentet eller ingen profil er valgt');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Rediger præferencer må først gælde efter Gem',
 'Fra samlet gennemgang 14. okt. 2026 (G3). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. EditPreferencesScreen ændrer de globale allergier med det samme. Går brugeren tilbage uden at gemme, eller fejler Gem offline, scanner appen alligevel med den ændrede liste (fx uden nødder) til genstart. Profilen hentes desuden forfra ved hver login-fornyelse (useLoadUserData afhænger af accessToken), hvilket kan nulstille en halvfærdig redigering. Forslag: redigér en kladde, skriv først til appens tilstand efter vellykket save_my_allergens, og hent ikke profilen igen ved ren token-fornyelse. Mellem.',
 'todo', 'high', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Rediger præferencer må først gælde efter Gem');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Data: Genanalyse og godkendelse må kun ændre allergener opad',
 'Fra samlet gennemgang 14. okt. 2026 (G4). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. auto-reparse (natjob og Kør nu i admin) og godkendelse af indsendelser erstatter allergen_flags med en ny beregning ud fra teksten. Manuelle rettelser i admin og allergener deklareret af Open Food Facts kan dermed blive sænket (ja til nej). Kør nu tager også de ca. 12.000 medium-produkter. Lige nu står ingen produkter i kø. Forslag: manuel rettelse sætter allergen_quality=verified og springes over; genanalyse og godkendelse fletter kun opad (nej, spor, ja) som allergen-reanalyze. Lille.',
 'todo', 'high', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Data: Genanalyse og godkendelse må kun ændre allergener opad');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Scanning ved dårlig forbindelse (tidsgrænse, gemt udgave, Annuller)',
 'Fra samlet gennemgang 14. okt. 2026 (G5). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. Ved svag forbindelse (navigator.onLine er sand) hænger opslaget bag fuldskærms-indlæsningen uden udvej, og bagefter vises en generel fejl, selv om produktet ligger i den gemte cache. Historikken gemmes før resultatet vises. Forslag: stop efter ca. 10 s, brug den gemte udgave med Gemte produktdata, gem historik i baggrunden. En Annuller-knap på indlæsningen er Bjørns (design). Lille til mellem.',
 'todo', 'normal', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Scanning ved dårlig forbindelse (tidsgrænse, gemt udgave, Annuller)');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Udløbet login giver fejl overalt, og startskærmen kan stå tom',
 'Fra samlet gennemgang 14. okt. 2026 (G6). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. apiCall har ingen håndtering af 401 og ingen tidsgrænse; fornyelsen prøves kun 3 gange og ikke ved visibilitychange/online. Efter søvn eller dårlig forbindelse fejler historik, favoritter og scanning med Kontrollér forbindelsen, til appen genstartes. BOOT-skærmen er tom uden knap, hvis gendannelsen fejler. Forslag: ved 401 fornyes login én gang og kaldet gentages, ellers til log ind med Din session er udløbet; BOOT viser Prøv igen/Log ind efter ca. 6 s (StateBox findes). Mellem.',
 'todo', 'normal', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Udløbet login giver fejl overalt, og startskærmen kan stå tom');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Afslutning af onboarding skal bekræftes af serveren',
 'Fra samlet gennemgang 14. okt. 2026 (G7). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. finishOnboard (useOnboarding.js) og statustjekket ved opstart (useAuth.js 77-86) tjekker ikke svaret. Fejler gemmet, sendes brugeren alligevel til forsiden, E-numre er ikke gemt, og velkomstmailen udebliver; et fejlsvar ved opstart kan tolkes som færdig. saveProfileStep1 sluger fejl. Forslag: gå kun videre ved bekræftet svar, ellers fejlbesked og Prøv igen. Lille.',
 'todo', 'normal', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Afslutning af onboarding skal bekræftes af serveren');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Favoritter skal vurderes mod friske allergendata',
 'Fra samlet gennemgang 14. okt. 2026 (G8). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. Favoritter bruger product_snapshot fra da favoritten blev gemt (useHistory.js 79-86), mens historikken bevidst henter friske allergen_flags. En favorit gemt før et ja blev rettet ind viser stadig grønt. Forslag: favorites-funktionen henter products.allergen_flags og ingredients_text som history. Mellem.',
 'todo', 'normal', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Favoritter skal vurderes mod friske allergendata');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Fejlbesked ved Tilføj til indkøbsliste, og ryd alt ved log ud',
 'Fra samlet gennemgang 14. okt. 2026 (G9 og G10). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. (1) Tilføj til indkøbsliste på produktsiden gør intet og siger intet, hvis listerne ikke er hentet (ResultSections.jsx 172-182). (2) Log ud efterlader forrige brugers e-mail og adgangskode i log ind-felterne, valgte E-numre, favoritter og lister i hukommelsen; setShoppingList i App.jsx er en tom funktion. Forslag: fejlbesked med Prøv igen, og nulstil felter og lister i clearAuth. Lille.',
 'todo', 'normal', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Fejlbesked ved Tilføj til indkøbsliste, og ryd alt ved log ud');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Godkendelse af indsendelser (rækkefølge, rens, massegodkendelse)',
 'Fra samlet gennemgang 14. okt. 2026 (G11, G12, G16). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. (1) submissions sætter status godkendt, før produktet oprettes; fejler oprettelsen (fx stregkoden er kommet ind via import), står indsendelsen som godkendt, og brugeren får besked om et produkt, der ikke findes. Ingen vagt mod dobbeltklik. (2) Rens-funktionen fjerner linjer der starter med salt/fedt/protein m.fl. (fx Salt, selleri) og gemmer den kortere tekst; hver åbning af en indsendelse koster et AI-kald, også de gamle. (3) Godkend valgte sker uden bekræftelse, og fejl i AI-tjekket tælles som succes. Forslag: opret produkt først og skift status bagefter (kun fra pending), rens kun linjer med tal og enhed, AI kun på knappen, bekræft med antal. Lille til mellem.',
 'todo', 'normal', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Godkendelse af indsendelser (rækkefølge, rens, massegodkendelse)');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Adminloggen skal dække alle følsomme handlinger',
 'Fra samlet gennemgang 14. okt. 2026 (G13). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. Logges ikke i dag: manuelle produktrettelser (også allergener), admins ændring af andres profil og allergier, sletning af familiemedlemmer og invitationer, push-tekster til alle, CSV-eksport af brugere, og godkendelse/afvisning af indsendelser (går via serverfunktion, så auth.uid() er tom og triggeren springer over, selv om CLAUDE.md siger de logges). Loggen viser kun 8-tegns id''er. Forslag: triggere på products, users, family_members og family_invites, eksplicit log i submissions, navne i visningen. Mellem.',
 'todo', 'normal', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Adminloggen skal dække alle følsomme handlinger');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Kode: Admin: slet scannede produkter, vis skærmbilleder i feedback, sikre rolleskift',
 'Fra samlet gennemgang 14. okt. 2026 (G14, G15, G17). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. (1) Slet produkt fejler med rå databasefejl, hvis produktet er scannet eller kom fra en indsendelse (fremmednøgler uden ON DELETE). (2) Skærmbilleder i feedback vises ikke i ticketen (ligger i privat bucket; læseadgang for admin findes). (3) Rollevælgeren i brugerlisten skifter uden bekræftelse, også på egen række, og intet forhindrer at den sidste admin fjernes. Forslag: slette-funktion der rydder henvisninger, signeret billedlink i ticketen (udseende: Bjørn), bekræftelse, egen række låst og databasevagt for sidste admin. Tofaktor for admin overvejes efter beta. Lille til mellem.',
 'todo', 'normal', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Kode: Admin: slet scannede produkter, vis skærmbilleder i feedback, sikre rolleskift');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Drift: Mailloftet hos Resend (100 mails om dagen)',
 'Fra samlet gennemgang 14. okt. 2026 (G18). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. Resend er på gratis plan: 100 mails om dagen og 3.000 om måneden. Alle login-mails (bekræft e-mail, glemt adgangskode) går den vej. Ved over 100 tilmeldinger på en dag stopper bekræftelserne, og nye brugere kan ikke komme ind. Forbrug nu: 16 mails i denne måned. Forslag: fint til lukket beta; opgradér (ca. 20 dollar om måneden) før åben beta eller butikslancering. Jans beslutning, ingen kode.',
 'todo', 'normal', 'drift', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Drift: Mailloftet hos Resend (100 mails om dagen)');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Drift: Gennemgå og ryd fejlloggen',
 'Fra samlet gennemgang 14. okt. 2026 (G19). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. 24 åbne fejl i client_errors er ikke gennemgået siden 2. okt. Næsten alle er kunne ikke hente modul / text/html is not a valid JavaScript MIME type / reading default, som opstår hos åbne apps lige efter en udrulning, plus setPhotoOptions failed fra kameraet. Seneste 14. okt. på Scan. Forslag: markér dem løst/ignoreret i admin, og se om færre udrulninger (to do om Vercel) får dem til at forsvinde. Lille.',
 'todo', 'low', 'drift', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Drift: Gennemgå og ryd fejlloggen');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Drift: Færre udrulninger og tjek ved rene to do- og dokumentændringer',
 'Fra samlet gennemgang 14. okt. 2026 (W1 a og b). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. 68 af 202 migrationsfiler ændrer kun to do-listen, og hver giver CI, fuld databasetest, efter-merge-tjek, migrationskørsel og en ny produktionsudgave af appen. 58 udrulninger 13.-14. okt., heraf 10 rene to do-PR''er og 3 der kun rettede numre. Forslag: (a) ignoreCommand i vercel.json, så Vercel springer over, når kun to do-migrationer, docs eller .md er ændret; (b) DB-tests springes over for rene to do-filer. Lille. Bemærk: vercel.json-ændringen skal selv udrulles.',
 'todo', 'high', 'drift', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Drift: Færre udrulninger og tjek ved rene to do- og dokumentændringer');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select 'Drift: To do-ændringer uden migrationsnumre',
 'Fra samlet gennemgang 14. okt. 2026 (W1 c). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. To do-filerne er årsagen til de fleste nummerkollisioner. Forslag: læg to do-ændringer i en egen mappe (fx supabase/todo/), som en lille separat kørsel anvender ved merge uden versionsnumre og uden databasetest; de rigtige migrationer bliver så kun skemaændringer. Lille til mellem. Skal skrives ind i CLAUDE.md og projektinstruktionerne, når den er bygget.',
 'todo', 'normal', 'drift', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = 'Drift: To do-ændringer uden migrationsnumre');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select 'Drift (Jan): Kræv opdateret gren før merge i GitHub',
 'Fra samlet gennemgang 14. okt. 2026 (W2). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. Tjekket Migrationsnumre sammenligner kun med main, da PR''en blev tjekket, så næsten samtidige merges kan stadig kollidere. Forslag: i GitHub, Settings, Rules, reglen Beskyt main: slå Require branches to be up to date before merging til. Så kører tjekket igen mod nyeste main. Et klik for Jan; tråde opdaterer selv deres gren før merge.',
 'todo', 'normal', 'drift', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = 'Drift (Jan): Kræv opdateret gren før merge i GitHub');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Drift: Skær CLAUDE.md ned til højst 15 KB',
 'Fra samlet gennemgang 14. okt. 2026 (W3). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. CLAUDE.md er 52 KB (ca. 15.000 tokens) og læses af hver eneste session (ca. 100 på 10 dage); filen siger selv hold den KORT. Over halvdelen er designhistorik for enkelte skærme, og admin-afsnittet vokser med hver admin-PR. Forslag: behold stående regler, flyt detaljer til src/CONTEXT.md og docs/ (læses ved behov). Samme tråd kan skrive undtagelsen om to do-PR''er ind (to do 3b044eb3). Lille, én tråd.',
 'todo', 'high', 'drift', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Drift: Skær CLAUDE.md ned til højst 15 KB');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select 'Ledelse (Jan): Beslut arbejdsregler, der sparer forbrug',
 'Fra samlet gennemgang 14. okt. 2026 (W4, W6, W7, W8). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. Forslag til beslutning: (1) én pakke med 3-5 små ændringer inden for samme område pr. tråd i stedet for én opgave pr. tråd (kræver ændring i CLAUDE.md og projektinstruktionerne); (2) admin-panelets udseende fryses til efter beta, kun fejl rettes (7 admin-design-PR''er 13. okt. aften); (3) engangstest (testkonti, gensend tilbagekaldelse) laves med engangsscript eller manuel kørsel, ikke som migrationer; (4) ryd ubrugte projekter på Vercel-kontoen (fx final-escape-slet), de deler loftet på 100 udrulninger om dagen.',
 'todo', 'normal', 'drift', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = 'Ledelse (Jan): Beslut arbejdsregler, der sparer forbrug');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Efter beta] Kode: Fjern ubrugte serverfunktioner',
 'Fra samlet gennemgang 14. okt. 2026 (G20). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. Live, men ubrugte: admin (ingen kalder; kan skrive alle felter med service-rollen bag admin-tjek), send-push (afløst af _shared/webpush.ts), nutrition-backfill og nutrition-backfill-nemlig (færdige, cron stoppet). allergen-reanalyze kan fjernes, når genkørslen af lange lister er færdig (ca. 17. okt.), og cron classify-categories-backlog kan stoppes. Sletning af mappen fjerner ikke funktionen: den skal også slettes i Supabase og fjernes fra config.toml. Lille.',
 'todo', 'low', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Efter beta] Kode: Fjern ubrugte serverfunktioner');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Efter beta] Kode: Fjern admin-koden fra brugerappen',
 'Fra samlet gennemgang 14. okt. 2026 (G21). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. App.jsx kalder stadig useAdmin og useAdminTools og sender alt videre i AdminContext, som intet i brugerappen læser (admin er nu admin.html med egen useAdmin). adminUi.jsx bruges ikke. Forslag: fjern koblingen, AdminContext, useAdminTools-kopien og adminUi.jsx. Lille.',
 'todo', 'low', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Efter beta] Kode: Fjern admin-koden fra brugerappen');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Efter beta] Data: Rester af Opskrifter og diæter, ubrugte kolonner',
 'Fra samlet gennemgang 14. okt. 2026 (G22, G23). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. Rester: 5 Ugens opskrifter-skabeloner i Resend og N7-1 til N7-5 i supabase/templates/resend (plus catalog.json), valget weekly_digest i useNotificationPrefs, tomme tabeller recipes og recipe_ingredients, funktionen food-waste (Jan valgte 13. okt. at beholde tabeller og funktion). Leksikon-editoren i admin tilbyder stadig kategorien Kost (teksten: Bjørn). Ubrugte, tomme kolonner: users.phone (er med i admins CSV-eksport) og users.preferred_stores. Lille.',
 'todo', 'low', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Efter beta] Data: Rester af Opskrifter og diæter, ubrugte kolonner');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Data: Konto uden profil og slettedatoer på backup-tabeller',
 'Fra samlet gennemgang 14. okt. 2026 (G24, G25). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. (1) En Google-konto fra 19. sept. har ingen profil og ryddes aldrig af inactive_accounts(), som kun ser konti med profil (GDPR-frist). Forslag: lad oprydningen også tage auth-konti uden profil, eller slet den efter Jans ja. (2) 15 backup-tabeller fylder ca. 30 MB; sæt en slettedato på hver (diæt-backups 12. nov.; removed_image_backup_20261005 beholdes). Lille.',
 'todo', 'low', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Før beta] Data: Konto uden profil og slettedatoer på backup-tabeller');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Efter beta] Kode: Admin-lister, dashboard og AI-kvote i admin',
 'Fra samlet gennemgang 14. okt. 2026 (G27, G28, G29). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. (1) Lister skjuler rækker uden besked: brugere over 200, ventende indsendelser over 100, fejl, log og tickets; familieoversigten kan ramme URL-grænsen. (2) Dashboardet henter alle scanninger fra 30 dage ved hvert besøg; sidebjælkens tal opdateres ikke efter handlinger. (3) Admins ændring af en brugers allergier er tre kald (fejler det midtvejs, står personen uden allergier). (4) Admins AI-handlinger trækker på admins egen dagskvote og gemmer stille lavere kvalitet; Kør nu laver op til 100 AI-kald i ét kald. Forslag: sideskift med total, én databasefunktion til dashboardtal, ét kald til allergier, loft på 25 ved Kør nu og tydelig besked. Mellem.',
 'todo', 'low', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Efter beta] Kode: Admin-lister, dashboard og AI-kvote i admin');

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Efter beta] Kode: Småfejl fra samlet gennemgang',
 'Fra samlet gennemgang 14. okt. 2026 (G26, G30, G31). Rapport: eatsafe/samlet-gennemgang-2026-10-14.md. (1) auto-import-off spørger hver nat på de samme 50 stregkoder, der ikke findes på Open Food Facts, og importerer derfor intet nyt; markér tjekkede koder. (2) To billedfelter i indsendelser har ingen størrelsesgrænse; historik og favoritter har intet loft pr. bruger. (3) Afbrudt Google/Apple-login viser Linket i mailen er udløbet. (4) Stregkode fra billede bruger ikke normalizeScannedBarcode (UPC-E). (5) Børneformularen tømmes før gem (tabes offline). (6) To stregkodebiblioteker hentes (ca. 110 KB ekstra ved skrå koder). Lille hver.',
 'todo', 'low', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title = '[Efter beta] Kode: Småfejl fra samlet gennemgang');

insert into public.admin_todo_comments (todo_id, body)
select '274dffa5-10a7-45fb-8b83-0f06a06b139d', 'Samlet gennemgang 14. okt. 2026 (W5): anbefaling at slå dev til, før rigtige betabrugere kommer ind. Alt går i dag direkte i produktion (op til 34 udrulninger på en dag), og hver udrulning giver genindlæsninger og fejl hos åbne apps. Med dev udgives samlet 1-2 gange om dagen. Ulempe: ændringer når først ud ved udgiv. Rapport: eatsafe/samlet-gennemgang-2026-10-14.md.'
where exists (select 1 from public.admin_todos where id = '274dffa5-10a7-45fb-8b83-0f06a06b139d')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '274dffa5-10a7-45fb-8b83-0f06a06b139d' and body like 'Samlet gennemgang 14. okt. 2026%');

insert into public.admin_todo_comments (todo_id, body)
select '3b044eb3-8150-462f-800c-061c86314c49', 'Samlet gennemgang 14. okt. 2026: kan laves i samme tråd som den nye to do om at skære CLAUDE.md ned til højst 15 KB (W3).'
where exists (select 1 from public.admin_todos where id = '3b044eb3-8150-462f-800c-061c86314c49')
  and not exists (select 1 from public.admin_todo_comments where todo_id = '3b044eb3-8150-462f-800c-061c86314c49' and body like 'Samlet gennemgang 14. okt. 2026%');
