# Ændringshistorik: datamodel, mangler og forslag (16. okt. 2026)

## Hvad der gemmes i dag
| Kilde | Indhold | Dækker |
|---|---|---|
| `admin_audit_log` (`produkt_oprettet`, `produkt_rettet`, `produkt_slettet`) | administrator-id, tidspunkt, felter, **før- og efterværdier** (`aendringer`, afkortet til 500 tegn), produktets navn og EAN som øjebliksbillede | kun ændringer foretaget med en administrators login (trigger `trg_admin_audit_fields` kræver en admin-JWT) og via `products`-funktionen |
| `revision_log` (ældre, 12 poster) | produkt-id, administrator, oprettet/opdateret, feltnavne, en note | kun godkendelse af brugerindsendelser; `new_value` er en note, ikke en værdi |

Siden læser nu begge gennem `admin_product_history` (kun læsning; ingen tabel ændret, ingen data flyttet). Ældre poster vises uden før/efter, og aktør vises kun, hvis loggen dokumenterer den.

## Hvad der mangler (identificeret, ikke ændret)
1. **Automatiske ændringer logges ikke:** import (`auto-import-off`), genanalyse (`auto-reparse`, `allergen-reanalyze`) og andre service-kald skriver til `products` uden en admin-JWT, så triggeren springer dem over. Der er derfor ingen historik for, hvad AI-genanalysen eller importen har ændret på et produkt (kun tællere pr. kørsel i `import_runs`).
2. **Ingen ændringskilde:** loggen skelner ikke mellem administratorredigering, import, AI-genanalyse og godkendelse af indsendelse (undtagen den ældre log). Aktørtyperne "automatisk system", "ekstern import" og "AI-behandling" kan derfor ikke vises endnu og er **ikke gættet**.
3. **Ingen begrundelse/evidens** pr. allergenændring (kilde, metode, modelversion, automatisk eller godkendt).
4. **Værdier afkortes** ved 500 tegn (ingrediensliste); er en værdi afkortet, vises den som tekst, aldrig som opdigtet fuld værdi.
5. **Ikke samme transaktion** for ændring og log hos edge-funktionen `products` (logningen sker efter opdateringen og kan fejle uden at stoppe handlingen); trigger-logningen er i samme transaktion.
6. **Ingen ændringsbeskyttelse udover RLS:** auditposter kan ikke redigeres eller slettes af administratorer (kun læsning; skrivning via service-nøgle og triggere), men der er ingen automatisk opbevaringsfrist for `admin_audit_log` produkthændelser udover den eksisterende politik.

## Mindst indgribende sikre udvidelse (forslag, kræver Jans ja)
- Tabel `product_change_log` (append-only): `product_id`, `ean`, `name_snapshot`, `at`, `op`, `changes` (som `aendringer`), `source` (`admin` | `import` | `reanalyze` | `submission` | `system`), `actor_id` (null for automatik), `method`/`model` (kun ved AI), `automatic boolean`.
- En `AFTER INSERT/UPDATE/DELETE`-trigger på `products` skriver én post pr. ændring i samme transaktion. Kilden sættes af den, der ændrer: en transient kolonne `products.change_source`, som triggeren læser og nulstiller (edge-funktionerne sætter den i samme `update`). Uden angivelse og uden admin-login: `system`.
- Opbevaring: 24 måneder, automatisk oprydning (GDPR: kun administrator-id er personhenførbart; sletning ved kontosletning sætter `actor_id` til null).
- Allergenændringer fra AI gemmes som **forslag** først (`status = proposed`), så usikre eller modstridende resultater kan sendes til manuel gennemgang (se `docs/dataimport-risikovurdering.md`).

## Gendannelse (senere, ikke implementeret)
Kræver administrator, tjek af at produktets `updated_at` er uændret siden den viste version, en ny historikpost (`source = restore`) og dobbelt bekræftelse ved allergenfelter. Kræver først `product_change_log`, fordi auditloggens værdier er afkortede.
