# Tilbagekaldelser: to forslag til godkendelse (16. okt. 2026)

Ingen af forslagene er indbygget. De ændrer funktion og skal godkendes af Jan og Bjørn først.

## 1. Fanen "Varslet" skal kun vise tilbagekaldelser, hvor varslingen faktisk er afsendt

**Kontrol (nuværende adfærd):** fanen viser status `ready`. Den sættes, når hentningen finder gyldige stregkoder, eller når en administrator knytter produkter, og samtidig lægges hændelsen `recall_published` i udsendelseskøen (`notification_events`). Funktionen `notify` behandler køen bagefter. `ready` betyder derfor **lagt i kø**, ikke afsendt: en tilbagekaldelse står som "Varslet", før en eneste besked er sendt, og også hvis ingen brugere matcher, eller afsendelsen fejler. I detaljen vises kø-status og tal (modtagere, afsendt, fejlet), men ikke på kortene eller i fanen.

**Forslag:** en administratorfunktion `admin_recall_delivery_overview()` returnerer pr. tilbagekaldelse: kø-status (`pending`/`done`/`failed`), antal modtagere, afsendt og fejlet (kun tal). Kortene og fanen bruger den:
- **Varslet:** køen er behandlet, og mindst én besked er afsendt. Kortet viser "Sendt til n" (og "n fejlede", hvis relevant).
- **I kø** (ny gruppe øverst i fanen eller under Afventer): `ready`, men køen er ikke behandlet. Står ikke som varslet.
- **Ingen modtagere:** behandlet, men ingen brugere matcher. Står ikke som varslet.
- **Fejlet:** køen er fejlet eller alle forsøg fejlede; kræver handling.
Status `ready` og brugerappens advarsler er uændrede (appen afhænger ikke af, at en push er sendt). Ingen ændring i selve udsendelsen.

## 2. Hvor længe skal en tilbagekaldelse vises ved scanning?

**Nuværende regel:** `active_recalls_for_ean` og "Aktuelle tilbagekaldelser" viser en tilbagekaldelse i 60 dage fra offentliggørelsen (status `ready` eller `archived`, aldrig `cancelled`). Datoen på siden indgår ikke. Udsendelsesvinduet og genlæsning af ændringer er 14 dage (`recalls-sync`).

**Problem (data fra i dag):** 45 ikke-annullerede tilbagekaldelser er ældre end 60 dage. 24 af dem nævner datoer i 2027-2029 eller "alle bedst før-datoer/batchnumre", og 14 af dem har en stregkode, som brugere kan scanne. Eksempler: mandler offentliggjort 14. august med holdbarhed til 1. december 2027; en biksemad med "alle bedst før-datoer til og med maj 2027"; et katte-foder med "alle batchnumre". De er alle holdt op med at advare ved scanning.

**Forslag (anbefalet):** en tilbagekaldelse er aktuel, til den afsluttes på et dokumenteret grundlag:
1. **Annulleret** af Fødevarestyrelsen: afsluttes straks (som i dag).
2. **Har sider med holdbarhedsdatoer:** aktuel til den seneste oplyste bedst før-/sidste anvendelsesdato + 30 dage.
3. **Siger "alle partier/alle datoer" uden slutdato:** aktuel i 24 måneder (loft), da produktets reelle holdbarhed ikke er oplyst; administrator kan afslutte eller forlænge.
4. **Ingen datoer og ingen partioplysninger:** 12 måneder, hvorefter den lægges til gennemgang.
5. Administrator kan altid afslutte eller forlænge en tilbagekaldelse med begrundelse (ny kolonne `active_until` og en historikpost), og 30 dage før udløb lægges den til gennemgang i stedet for at forsvinde stille.
6. Arkivering påvirker som i dag ikke advarslen.

**Konsekvenser for brugerappen:** flere og ældre advarsler ved scanning (ca. 14 af de nuværende 45 gamle vil dukke op igen) og en længere liste under "Aktuelle tilbagekaldelser" (i dag højst 50). Ved partibegrænsede tilbagekaldelser skal teksten fortsat bede brugeren kontrollere lotnummer og dato, så advarslen ikke virker som "dette produkt er farligt". Ved datoer, der allerede er passeret, vises ingen advarsel. Kræver: ændring af `active_recalls_for_ean` og `recent_recalls`, en kolonne, en administrationsflade til afslutning/forlængelse, test med de 45 nuværende registreringer og Jans ja (brugerapp, sikkerhed og database).
