// @ts-nocheck
import React from "react";
import { SCREENS } from "./constants.jsx";

export default function SubmittedScreen({
  notFoundEan,
  proposedName,
  setScreen,
  setNotFoundStep,
  setProposedName,
  setProposedFlags,
  setProposedNutrition,
  setProposedNotes,
  setOcrText,
}) {
  const reset = () => {
    setNotFoundStep(1);
    setProposedName("");
    setProposedFlags({});
    setProposedNutrition({});
    setProposedNotes("");
    setOcrText("");
    setScreen(SCREENS.HOME);
  };

  return (
    <div className="screen fade-in" style={{ paddingBottom: 120 }}>
      <div style={{ textAlign: "center", padding: "56px 20px 32px" }}>

        {/* Ikon */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "var(--green-lt)", border: "2px solid var(--green-mid)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Overskrift */}
        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 10 }}>
          Tak for din hjælp! 🙏
        </div>
        <div style={{ fontSize: 15, color: "var(--muted2)", lineHeight: 1.7, marginBottom: 8 }}>
          {proposedName
            ? <><strong style={{ color: "var(--ink)" }}>{proposedName}</strong> er sendt ind til godkendelse.</>
            : <>Produktet er sendt ind til godkendelse.</>
          }
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 32 }}>
          Vores team gennemgår det snarest. Når det er godkendt, kan alle EatSafe-brugere med samme allergi bruge det.
        </div>

        {/* EAN */}
        {notFoundEan && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 100,
            background: "var(--surface)", border: "1px solid var(--border)",
            marginBottom: 32,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
              <rect x="3" y="4" width="3" height="16" rx="1" /><rect x="8" y="4" width="1.5" height="16" rx="0.5" />
              <rect x="11" y="4" width="3" height="16" rx="1" /><rect x="16" y="4" width="1.5" height="16" rx="0.5" />
              <rect x="19" y="4" width="2" height="16" rx="1" />
            </svg>
            <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{notFoundEan}</span>
          </div>
        )}

        {/* Hvad sker nu */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "16px 18px", marginBottom: 28, textAlign: "left",
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", marginBottom: 12 }}>
            Hvad sker der nu?
          </div>
          {[
            { emoji: "🔍", text: "Vores team gennemgår din indsendelse" },
            { emoji: "✅", text: "Produktet godkendes og tilføjes til databasen" },
            { emoji: "🔔", text: "Du får besked når det er godkendt" },
            { emoji: "🌍", text: "Alle brugere med samme allergi får gavn af dit bidrag" },
          ].map((step, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "7px 0",
              borderBottom: i < 3 ? "1px solid var(--border)" : "none",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{step.emoji}</span>
              <span style={{ fontSize: 13, color: "var(--muted2)", lineHeight: 1.5 }}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* Handlinger */}
        <button
          className="btn btn-primary btn-full"
          style={{ marginBottom: 10 }}
          onClick={reset}>
          Scan nyt produkt
        </button>
        <button
          className="btn btn-ghost btn-full"
          onClick={() => setScreen(SCREENS.SEARCH)}>
          Søg efter alternativer
        </button>
      </div>
    </div>
  );
}
