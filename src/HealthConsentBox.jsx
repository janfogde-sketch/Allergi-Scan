// @ts-nocheck
// Særskilt afkrydsning for udtrykkeligt samtykke til helbredsoplysninger (2. okt. 2026). Aldrig forhåndsafkrydset og adskilt fra
// vilkår/privatlivspolitik. Opbygning: primær tekst (selve samtykket), sekundær tekst (tilbagetrækning), link til politikken.
import React from "react";
import { HEALTH_CONSENT_TEXT, HEALTH_CONSENT_WITHDRAW_TEXT } from "./healthConsent.js";

export default function HealthConsentBox({ checked, onChange, openPrivacy }) {
  return (
    <label className={`consent-box${checked ? " on" : ""}`}>
      <input id="health-consent" type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      <span>
        <span className="consent-main">{HEALTH_CONSENT_TEXT}</span>
        <span className="consent-sub">{HEALTH_CONSENT_WITHDRAW_TEXT}</span>
        {openPrivacy && (
          <button type="button" className="consent-link" onClick={e => { e.preventDefault(); openPrivacy(); }}>
            Læs privatlivspolitikken
          </button>
        )}
      </span>
    </label>
  );
}
