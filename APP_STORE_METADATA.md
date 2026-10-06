# EatSafe — App Store Metadata

Godkendt af Bjørn 6. okt. 2026 (F6-2). Tal tjekket i databasen samme dag: 20.182 varer og 768 opslag i leksikonet.
Undgå "sikkert", "præcis" og funktioner på pause (opskrifter, diæter), når teksten ændres.

**Tjek tallene før hver indsendelse til butikkerne** (teksten i butikkerne opdateres ikke af sig selv, så tallene er rundet ned):
`select (select count(*) from products) varer, (select count(*) from knowledge_base where category <> 'diet') opslag;`
Sprogene i madpasset tælles i `MADPAS_LANGUAGES` (`src/constants.jsx`, test i `src/useMadpas.test.js`).

## App-navn
**EatSafe**

## Undertitel (App Store, højst 30 tegn)
**Scan mad for allergener**

## Kort beskrivelse (Google Play, højst 80 tegn)
Scan madvarer og tjek allergener og intolerancer for dig og din familie.

## Lang beskrivelse (højst 4000 tegn)

Gør det lettere at tjekke madvarer, når du handler.

Med EatSafe kan du scanne en stregkode og hurtigt se, hvordan varens registrerede ingrediens- og allergenoplysninger matcher dine valgte allergier og intolerancer.

**Scan og få et klart overblik**

Scan varens stregkode, eller søg efter varen.

EatSafe har oplysninger om over 20.000 varer fra danske butikker og hjælper dig med at se relevante allergener, ingredienser og eventuelle oplysninger om spor.

Mangler der ingrediensoplysninger om en vare, fortæller EatSafe det i stedet for at gætte. Du kan også hjælpe ved at indsende oplysninger om varen.

**Din profil, dine valg**

Vælg dine allergier og intolerancer én gang, og få resultater tilpasset din profil.

For hvert allergen kan du selv vælge, om EatSafe også skal advare dig om produkter mærket med eksempelvis “kan indeholde spor af”.

Du kan desuden vælge bestemte E-numre, du ønsker at holde øje med.

**Tjek for hele familien**

Opret profiler til dine børn, og tjek den samme vare for flere personer på én gang.

Invitér andre voksne til familien, og del blandt andet indkøbslister på tværs af familien.

**Få besked om tilbagekaldte varer**

Hvis Fødevarestyrelsen tilbagekalder en vare, du har scannet, gemt som favorit eller tilføjet til en indkøbsliste, kan EatSafe advare dig.

Advarslen gives, når Fødevarestyrelsen oplyser varens stregkode.

**Madpas på 17 sprog**

Tag dine allergioplysninger med på rejsen eller restauranten.

Vis dit madpas på 17 sprog, eller få teksten læst højt, når du skal forklare dine allergier til eksempelvis en tjener.

**Allergileksikon**

Bliv klogere på allergener, ingredienser og E-numre med mere end 700 opslag i EatSafes leksikon.

Vigtigt: EatSafe er vejledende. Kontrollér altid produktets aktuelle ingrediens- og allergenoplysninger på emballagen.

---

## Søgeord (App Store, højst 100 tegn)
allergi,allergener,madallergi,gluten,cøliaki,laktose,nødder,ingredienser,e-numre,stregkode

## Søgeord (Google Play)
allergi app, allergen scanner, madallergi, stregkode scanner, glutenfri, cøliaki, laktoseintolerans, nøddeallergi, fødevareallergi, ingredienser, e-numre, madpas, tilbagekaldte varer

---

## Kategori
App Store og Google Play: **Mad og drikke (Food & Drink)**

## Aldersgrænse og målgruppe
Afventer endelig afklaring (Jan, F6-4).

## Privatliv (kort)
- Kamera bruges til at scanne stregkoder og fotografere ingrediensoplysninger.
- Profiloplysninger og valgte allergier gemmes på din EatSafe-konto.
- Oplysninger om allergier og intolerancer behandles kun med det nødvendige samtykke.
- EatSafe sælger ikke dine personoplysninger.

---

## Billedtekster til skærmbilleder

1. **Scan en vare på få sekunder**
2. **Se resultatet ud fra din allergiprofil**
3. **Tjek for hele familien på én gang**
4. **Få besked om tilbagekaldte varer**
5. **Dit madpas på 17 sprog**
6. **700+ opslag om allergener og E-numre**

---

## Nyt i denne version
- Advarsler om tilbagekaldte varer
- Madpas på 17 sprog med oplæsning
- Familieprofiler og invitationer
- Individuelt spor-valg for hvert allergen
- Forbedret offlineoplevelse
