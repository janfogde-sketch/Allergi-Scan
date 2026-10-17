// @ts-nocheck
// Fælles ikonknapper til appen og administrationen (hamburger, tilbage, søg, opdatér). Luk-knappen er CloseButton i Sheets.jsx.
// Kun ikonet er synligt (ingen ramme, cirkel eller fast baggrund); trykfladen er 44 × 44 px, og ikonet har samme størrelse, streg og farve overalt (navIcon.js).
import React, { forwardRef } from "react";
import { Icon } from "./Icons.jsx";
import { NAV_ICON } from "./navIcon.js";

/** Grundknap: et ikon i en rund knap. spinning drejer ikonet og slår knappen fra (fx opdatér). badge viser en lille grøn prik. */
export const IconButton = forwardRef(function IconButton({ icon, label, onClick, spinning = false, disabled = false, badge = false, className = "", children, ...rest }, ref) {
  return (
    <button type="button" ref={ref} className={`ibtn${spinning ? " spinning" : ""}${className ? ` ${className}` : ""}`} aria-label={label} title={rest.title} onClick={onClick} disabled={disabled || spinning} {...rest}>
      <span className="ibtn-c">{children || <Icon name={icon} size={NAV_ICON.size} strokeWidth={NAV_ICON.stroke} color={NAV_ICON.color} />}</span>
      {badge && <span className="ibtn-dot" aria-hidden="true" />}
    </button>
  );
});

/** Hamburgerknap. Samme knap i appens header og i administrationens topbar. */
export const MenuButton = forwardRef(function MenuButton({ label = "Åbn menu", ...props }, ref) {
  return <IconButton ref={ref} icon="menu" label={label} {...props} />;
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
