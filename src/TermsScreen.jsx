// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// TermsScreen.jsx — Brugsvilkår som en almindelig underside i appen (29.
// sept. 2026, "Opdater siderne Brugsvilkår og Privatlivspolitik med tydelig
// navigation tilbage"). Erstatter den tidligere <a href="/terms.html"
// target="_blank">-adfærd (åbnede den statiske public/terms.html i en ny
// browserfane) — samme ordlyd/indhold, uændret, blot portet til appens eget
// design-sprog og navigationssystem i stedet for en ekstern side.
//
// Egen, selvstændig sticky header (.legal-topbar, se theme.jsx) i stedet for
// AppHeader — se App.jsx's isLegalPage-kommentar for hvorfor: siden kan
// åbnes BÅDE fra kontekster med AppHeader (Indstillinger/Profil) og uden
// (Velkommen/Log ind, hvor AppHeader er skjult under onboarding), så den
// viser altid denne ene header, uanset indgang. Tilbagepilen fører til
// legalReturnScreen (den skærm der åbnede siden via openLegal i
// NavigationContext), IKKE et fast mål — se App.jsx.
//
// public/terms.html er bevidst IKKE fjernet/ændret — den kan stadig bruges
// som en selvstændig, offentligt tilgængelig URL uden for selve appen.
// Denne fil er en uafhængig kopi af samme tekst, ikke en delt kilde — ret
// begge, hvis selve vilkårene ændres.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Icon } from "./SharedComponents.jsx";

const S = {
  updated: { fontSize:12.5, color:"var(--muted)", marginBottom:16 },
  draftNotice: { background:"var(--amber-lt)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 16px", marginBottom:24, fontSize:12.5, color:"var(--ink2)", fontWeight:500, lineHeight:1.55 },
  h2: { fontSize:15, fontWeight:800, color:"var(--green)", margin:"24px 0 8px" },
  p: { fontSize:13.5, color:"var(--ink2)", lineHeight:1.55, marginBottom:10 },
  ul: { fontSize:13.5, color:"var(--ink2)", lineHeight:1.55, paddingLeft:18, marginBottom:10 },
  li: { marginBottom:5 },
  a: { color:"var(--green)", fontWeight:700, textDecoration:"none" },
  contactBox: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 18px", marginTop:28, boxShadow:"var(--sh)" },
};

export default function TermsScreen({ onBack }) {
  return (
    <>
      <header className="legal-topbar">
        <button onClick={onBack} aria-label="Tilbage" className="legal-topbar-back">
          <span className="legal-topbar-back-circle">
            <Icon name="chevronLeft" size={16} color="var(--ink)" />
          </span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Brugsvilkår</div>
      </header>
      {/* paddingTop matcher .legal-topbar's egen renderede højde (header er
          position:fixed, tager ikke plads i normal flow) + lidt luft — se
          theme.jsx's .legal-topbar-kommentar for hvorfor fixed frem for
          sticky. 79→75px (29. sept. 2026, "Polér designet..."): headeren
          selv blev 4px lavere (strammere lodret padding), så clearance er
          reduceret tilsvarende for at bevare samme lille luft under den. */}
      <div className="screen fade-in" style={{ paddingTop:"calc(75px + env(safe-area-inset-top))" }}>
        {/* H1 fjernet (29. sept. 2026, "Polér designet..."): sidens titel
            ("Brugsvilkår") vises allerede i topbaren ovenfor — en gentaget
            stor overskrift i selve indholdet var redundant. "Sidst
            opdateret"-linjen er nu selve indholdets første element. */}
        <div style={S.updated}>Sidst opdateret: september 2026</div>

        <div style={S.draftNotice}>
          Denne side er en foreløbig, generisk udgave af EatSafes brugsvilkår og er endnu ikke juridisk gennemgået. Kontakt <a href="mailto:hej@eatsafe.dk" style={S.a}>hej@eatsafe.dk</a>, hvis du har spørgsmål, indtil den endelige version er på plads.
        </div>

        <p style={S.p}>
          Disse brugsvilkår gælder for din brug af EatSafe ("vi", "os", "appen"). Ved at oprette en konto accepterer du betingelserne nedenfor.
        </p>

        <h2 style={S.h2}>1. Tjenesten</h2>
        <p style={S.p}>
          EatSafe er en dansk app, der hjælper dig med at vurdere, om et fødevareprodukt matcher dine registrerede allergier, intolerancer, kostpræferencer og fravalgte E-numre, baseret på produktdata fra flere kilder (producenter, Open Food Facts, andre brugere).
        </p>

        <h2 style={S.h2}>2. Ingen medicinsk erstatning</h2>
        <p style={S.p}>
          EatSafe er et vejledende værktøj — <strong>ikke</strong> en medicinsk vurdering, og appen erstatter ikke din egen kontrol af produktets emballage eller rådgivning fra en læge, diætist eller allergolog. Kontrollér altid selv et produkts aktuelle ingrediens- og allergenoplysninger.
        </p>

        <h2 style={S.h2}>3. Din konto</h2>
        <ul style={S.ul}>
          <li style={S.li}>Du skal give korrekte oplysninger ved oprettelse af konto</li>
          <li style={S.li}>Du er selv ansvarlig for at holde din adgangskode fortrolig</li>
          <li style={S.li}>Du kan til enhver tid slette din konto i appen under Profil → Konto</li>
        </ul>

        <h2 style={S.h2}>4. Brugerindsendt indhold</h2>
        <p style={S.p}>
          Indsender du produktdata (fx et nyt produkt, en rettelse eller et billede), giver du EatSafe ret til at bruge, vise og redigere dette indhold i appen. Du er ansvarlig for, at dine indsendelser er korrekte efter bedste evne — men vi kan ikke garantere, at brugerindsendt eller tredjeparts produktdata altid er 100% opdateret eller fejlfri.
        </p>

        <h2 style={S.h2}>5. Ansvarsbegrænsning</h2>
        <p style={S.p}>
          EatSafe leveres "som den er". I det omfang dansk lovgivning tillader det, er vi ikke ansvarlige for skader, der opstår som følge af forkerte eller forældede produktdata, medmindre skaden skyldes vores egen grove uagtsomhed eller forsæt.
        </p>

        <h2 style={S.h2}>6. Ændringer</h2>
        <p style={S.p}>
          Vi kan opdatere disse betingelser løbende. Væsentlige ændringer meddeles via appen. Den gældende version er altid tilgængelig på <a href="https://eatsafe.dk/terms" style={S.a}>eatsafe.dk/terms</a>.
        </p>

        <h2 style={S.h2}>7. Lovvalg</h2>
        <p style={S.p}>
          Disse betingelser er underlagt dansk ret.
        </p>

        <div style={S.contactBox}>
          <p style={{ margin:0, fontSize:13.5, color:"var(--ink2)", lineHeight:1.55 }}>
            Spørgsmål til brugsvilkårene?<br/>
            Skriv til os på <a href="mailto:hej@eatsafe.dk" style={S.a}>hej@eatsafe.dk</a>
          </p>
        </div>
      </div>
    </>
  );
}
