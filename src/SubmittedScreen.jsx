// @ts-nocheck
import React from "react";
import { SCREENS } from "./constants.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { Icon } from "./SharedComponents.jsx";
import { normalizeProductName } from "./helpers.js";

export default function SubmittedScreen({
  notFoundEan,
  proposedName,
  setNotFoundStep,
  setProposedName,
  setProposedFlags,
  setProposedNutrition,
  setProposedNotes,
  setOcrText,
}) {
  const { setScreen } = useNavigationContext();
  const reset = () => {
    setNotFoundStep(1);
    setProposedName("");
    setProposedFlags({});
    setProposedNutrition({});
    setProposedNotes("");
    setOcrText("");
    setScreen(SCREENS.HOME);
  };

  const name = normalizeProductName(proposedName);

  return (
    <div className="screen fade-in" style={{ paddingBottom: 120 }}>
      <div style={{ textAlign: "center", padding: "48px 4px 24px" }}>

        {/* Grønt check som det primære visuelle fokus */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "var(--green-lt)", border: "2px solid var(--green-mid)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px", lineHeight: 1.25 }}>Tak for din hjælp!</h1>
        <div style={{ fontSize: 15, color: "var(--ink2)", lineHeight: 1.5, marginBottom: 6 }}>
          {name
            ? <><strong style={{ color: "var(--ink)", fontWeight: 700, overflowWrap: "anywhere" }}>{name}</strong> er sendt til godkendelse.</>
            : <>Produktet er sendt til godkendelse.</>}
        </div>
        <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.55, marginBottom: 16 }}>
          Vi gennemgår produktet snarest. Du får besked, når det er godkendt og tilgængeligt i EatSafe.
        </div>

        {/* EAN som diskret, sekundær information */}
        {notFoundEan && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 24 }}>EAN {notFoundEan}</div>
        )}

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "14px 16px", marginBottom: 24, textAlign: "left",
          boxShadow: "var(--sh)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", marginBottom: 10 }}>Hvad sker der nu?</div>
          {[
            "Vi gennemgår din indsendelse",
            "Du får besked, når produktet er godkendt",
            "Produktet bliver tilgængeligt i EatSafe",
          ].map((text, i) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
              <span style={{ flexShrink: 0, display: "flex" }}><Icon name="check" size={15} color="var(--green)" /></span>
              <span style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-primary btn-full" style={{ minHeight: 48 }} onClick={reset}>
          Scan nyt produkt
        </button>
      </div>
    </div>
  );
}
