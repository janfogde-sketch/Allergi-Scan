// @ts-nocheck
// @vitest-environment jsdom
// Indkøbslistens hjælpevindue: ny overskrift, fire kompakte rækker med de aftalte tekster, ingen feedback-knap, lukning med X og via baggrunden.
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import HelpModal from "./HelpModal.jsx";

afterEach(cleanup);

describe("HelpModal: indkøbsliste", () => {
  it("viser den nye overskrift og de fire forklaringer som rækker", () => {
    render(<HelpModal screen="list" onClose={() => {}} onOpenFeedback={() => {}} />);
    expect(screen.getByText("Sådan bruger du indkøbslisten")).toBeTruthy();
    const rows = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(rows.map((r) => r.textContent)).toEqual([
      "Flere listerTryk på listenavnet for at skifte liste eller oprette en ny.",
      "Del din listeDel med familien, bestemte personer eller via et link.",
      "Tilføj varerSøg efter produkter, eller skriv selv en vare.",
      "Afkryds og ryd" + 'Markér varer som købt, og fjern dem samlet med "Ryd".',
    ]);
  });
  it("har ingen feedback-knap og ingen kort omkring rækkerne", () => {
    render(<HelpModal screen="list" onClose={() => {}} onOpenFeedback={() => {}} />);
    expect(screen.queryByText(/Send feedback/)).toBeNull();
    for (const r of screen.getAllByRole("listitem")) expect(r.style.border).toBe("");
  });
  it("lukkes med X og ved tryk på baggrunden", () => {
    const onClose = vi.fn();
    render(<HelpModal screen="list" onClose={onClose} onOpenFeedback={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(document.body.querySelector("[role=dialog]").parentElement);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it("andre skærme har uændret feedback-knap", () => {
    render(<HelpModal screen="profile" onClose={() => {}} onOpenFeedback={() => {}} />);
    expect(screen.getByText(/Send feedback/)).toBeTruthy();
  });
});
