// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// PrivacyScreen.jsx — Privatlivspolitik som en almindelig underside i appen
// (29. sept. 2026, "Opdater siderne Brugsvilkår og Privatlivspolitik med
// tydelig navigation tilbage"). Erstatter den tidligere <a href="/privacy.
// html" target="_blank">/window.open("https://eatsafe.dk/privacy")-adfærd
// (åbnede den statiske public/privacy.html i en ny browserfane) — samme
// ordlyd/indhold, uændret, blot portet til appens eget design-sprog og
// navigationssystem i stedet for en ekstern side.
//
// Se TermsScreen.jsx's filhoved for den fulde begrundelse for header-
// mønsteret (egen sticky .legal-topbar i stedet for AppHeader, tilbagepil
// til legalReturnScreen) — samme mønster her, ikke gentaget i detalje.
//
// public/privacy.html er bevidst IKKE fjernet/ændret — den kan stadig bruges
// som en selvstændig, offentligt tilgængelig URL uden for selve appen.
// Denne fil er en uafhængig kopi af samme tekst, ikke en delt kilde — ret
// begge, hvis selve politikken ændres.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { Icon } from "./SharedComponents.jsx";

const S = {
  updated: { fontSize:12.5, color:"var(--muted)", marginBottom:16 },
  h2: { fontSize:15, fontWeight:800, color:"var(--green)", margin:"24px 0 8px" },
  p: { fontSize:13.5, color:"var(--ink2)", lineHeight:1.55, marginBottom:10 },
  ul: { fontSize:13.5, color:"var(--ink2)", lineHeight:1.55, paddingLeft:18, marginBottom:10 },
  li: { marginBottom:5 },
  a: { color:"var(--green)", fontWeight:700, textDecoration:"none" },
  contactBox: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:"12px 18px", marginTop:28, boxShadow:"var(--sh)" },
};

export default function PrivacyScreen({ onBack }) {
  return (
    <>
      <header className="legal-topbar">
        <button onClick={onBack} aria-label="Tilbage" className="legal-topbar-back">
          <span className="legal-topbar-back-circle">
            <Icon name="chevronLeft" size={17} color="var(--ink)" />
          </span>
        </button>
        <div style={{ fontSize:17, fontWeight:800, color:"var(--ink)" }}>Privatlivspolitik</div>
      </header>
      {/* paddingTop matcher .legal-topbar's egen renderede højde (header er
          position:fixed, tager ikke plads i normal flow) + lidt luft — se
          theme.jsx's .legal-topbar-kommentar for hvorfor fixed frem for
          sticky. 79→75px (29. sept. 2026, "Polér designet..."): headeren
          selv blev 4px lavere (strammere lodret padding), så clearance er
          reduceret tilsvarende for at bevare samme lille luft under den. */}
      <div className="screen fade-in" style={{ paddingTop:"calc(75px + env(safe-area-inset-top))" }}>
        {/* H1 fjernet (29. sept. 2026, "Polér designet..."): sidens titel
            ("Privatlivspolitik") vises allerede i topbaren ovenfor — en
            gentaget stor overskrift i selve indholdet var redundant.
            "Sidst opdateret"-linjens marginBottom er nu 16px, samme
            værdi som TermsScreen.jsx (var før 24px her) — samme
            placering/styling af elementet på begge sider, som bedt om. */}
        <div style={S.updated}>Sidst opdateret: juni 2026</div>

        <p style={S.p}>
          EatSafe ("vi", "os", "appen") respekterer dit privatliv. Denne politik beskriver, hvilke personoplysninger vi indsamler, hvordan vi bruger dem, og dine rettigheder.
        </p>

        <h2 style={S.h2}>1. Hvem er vi?</h2>
        <p style={S.p}>
          EatSafe er en dansk app til allergen-scanning. Kontakt os på <a href="mailto:hej@eatsafe.dk" style={S.a}>hej@eatsafe.dk</a> ved spørgsmål til behandling af dine personoplysninger.
        </p>

        <h2 style={S.h2}>2. Hvilke oplysninger indsamler vi?</h2>
        <ul style={S.ul}>
          <li style={S.li}><strong>Konto:</strong> Email-adresse og eventuelt navn</li>
          <li style={S.li}><strong>Allergiprofil:</strong> De allergier og intoleranser du selv registrerer</li>
          <li style={S.li}><strong>Familie:</strong> Navne og allergiprofiler på familiemedlemmer du selv tilføjer</li>
          <li style={S.li}><strong>Scanningshistorik:</strong> Stregkoder du har scannet og resultater heraf</li>
          <li style={S.li}><strong>Indsendelser:</strong> Produktdata du frivilligt bidrager med</li>
          <li style={S.li}><strong>Tekniske data:</strong> Grundlæggende app-brug til fejlfinding (ingen tracking på tværs af apps)</li>
        </ul>

        <h2 style={S.h2}>3. Hvordan bruger vi dine oplysninger?</h2>
        <ul style={S.ul}>
          <li style={S.li}>For at vise allergenadvarslerne i appen</li>
          <li style={S.li}>For at gemme din profil og historik på tværs af enheder</li>
          <li style={S.li}>For at forbedre produktdatabasen baseret på indsendelser</li>
          <li style={S.li}>For at sende transaktionelle emails (bekræftelse, godkendelse af indsendelse)</li>
        </ul>
        <p style={S.p}>Vi sælger <strong>aldrig</strong> dine oplysninger til tredjeparter.</p>

        <h2 style={S.h2}>4. Retsgrundlag (GDPR)</h2>
        <p style={S.p}>
          Vi behandler dine oplysninger på grundlag af <strong>aftale</strong> (art. 6(1)(b)) — for at levere den tjeneste du har oprettet konto til — og <strong>legitim interesse</strong> (art. 6(1)(f)) for teknisk fejlfinding.
        </p>
        <p style={S.p}>
          Allergier betragtes som følsomme helbredsoplysninger (art. 9 GDPR). Vi behandler dem udelukkende på baggrund af dit <strong>udtrykkelige samtykke</strong>, som du giver når du opretter din allergiprofil.
        </p>

        <h2 style={S.h2}>5. Dataopbevaring</h2>
        <p style={S.p}>
          Vi gemmer dine oplysninger så længe din konto er aktiv. Sletter du din konto, slettes alle dine personoplysninger inden for 30 dage.
        </p>

        <h2 style={S.h2}>6. Dine rettigheder</h2>
        <ul style={S.ul}>
          <li style={S.li}><strong>Indsigt:</strong> Du kan til enhver tid se dine oplysninger i appen</li>
          <li style={S.li}><strong>Sletning:</strong> Du kan slette din konto direkte i appen under Profil → Konto → Slet konto</li>
          <li style={S.li}><strong>Berigtigelse:</strong> Du kan rette dine oplysninger i appen</li>
          <li style={S.li}><strong>Portabilitet:</strong> Kontakt os for eksport af dine data</li>
          <li style={S.li}><strong>Klage:</strong> Du kan klage til Datatilsynet på <a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" style={S.a}>datatilsynet.dk</a></li>
        </ul>

        <h2 style={S.h2}>7. Cookies og lokal lagring</h2>
        <p style={S.p}>
          EatSafe bruger lokal lagring (localStorage) til at gemme din session og præferencer på din enhed. Vi bruger ikke tredjeparts tracking-cookies.
        </p>

        <h2 style={S.h2}>8. Tredjeparts tjenester</h2>
        <ul style={S.ul}>
          <li style={S.li}><strong>Supabase</strong> — database og autentificering (EU-servere)</li>
          <li style={S.li}><strong>Open Food Facts</strong> — produktdata (open source, ingen persondata deles)</li>
          <li style={S.li}><strong>Anthropic Claude</strong> — OCR og allergen-analyse (ingen persondata sendes, kun produktbilleder)</li>
          <li style={S.li}><strong>Vercel</strong> — hosting (EU-region)</li>
        </ul>

        <h2 style={S.h2}>9. Ændringer</h2>
        <p style={S.p}>
          Vi kan opdatere denne politik. Væsentlige ændringer meddeles via appen. Den gældende version er altid tilgængelig på <a href="https://eatsafe.dk/privacy" style={S.a}>eatsafe.dk/privacy</a>.
        </p>

        <div style={S.contactBox}>
          <p style={{ margin:0, fontSize:13.5, color:"var(--ink2)", lineHeight:1.55 }}>
            Spørgsmål til vores behandling af dine oplysninger?<br/>
            Skriv til os på <a href="mailto:hej@eatsafe.dk" style={S.a}>hej@eatsafe.dk</a>
          </p>
        </div>
      </div>
    </>
  );
}
