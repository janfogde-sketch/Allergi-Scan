// @ts-nocheck
// Fælles runde ikonknapper til appen og administrationen (hamburger, tilbage, søg, opdatér). Luk-knappen er CloseButton i Sheets.jsx.
// Udseendet kommer fra iconButtonCss.js: 38 px rund knap med neutral kant, 44 px trykflade, samme ikonstørrelse og stregtykkelse overalt.
import React, { forwardRef } from "react";
import { Icon } from "./Icons.jsx";

const ICON_SIZE = 17;

/** Grundknap: et ikon i en rund knap. spinning drejer ikonet og slår knappen fra (fx opdatér). badge viser en lille grøn prik. */
export const IconButton = forwardRef(function IconButton({ icon, label, onClick, spinning = false, disabled = false, badge = false, className = "", children, ...rest }, ref) {
  return (
    <button type="button" ref={ref} className={`ibtn${spinning ? " spinning" : ""}${className ? ` ${className}` : ""}`} aria-label={label} title={rest.title} onClick={onClick} disabled={disabled || spinning} {...rest}>
      <span className="ibtn-c">{children || <Icon name={icon} size={ICON_SIZE} color="var(--ink2)" />}</span>
      {badge && <span className="ibtn-dot" aria-hidden="true" />}
    </button>
  );
});

const HAMBURGER = (
  <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2.2" aria-hidden="true"><path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>
);

/** Hamburgerknap. Samme knap i appens header og i administrationens topbar. */
export const MenuButton = forwardRef(function MenuButton({ label = "Åbn menu", ...props }, ref) {
  return <IconButton ref={ref} label={label} {...props}>{HAMBURGER}</IconButton>;
});

/** Tilbage: går til forrige visning (X lukker i stedet det aktuelle panel). */
export function BackButton({ onClick, label = "Tilbage", ...props }) {
  return <IconButton icon="chevronLeft" label={label} onClick={onClick} {...props} />;
}

export function SearchButton({ onClick, label = "Søg", ...props }) {
  return <IconButton icon="search" label={label} onClick={onClick} {...props} />;
}

export function RefreshIconButton({ onClick, label = "Opdater", loading = false, ...props }) {
  return <IconButton icon="refresh" label={label} title={label} onClick={onClick} spinning={loading} aria-busy={loading} {...props} />;
}
