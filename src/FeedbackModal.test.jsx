// @ts-nocheck
// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuthProvider } from "./AuthContext.jsx";
import { NavigationProvider } from "./NavigationContext.jsx";
import { SCREENS } from "./constants.jsx";
import FeedbackModal from "./FeedbackModal.jsx";

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const renderModal = (screenId = SCREENS.HOME) => render(
  <AuthProvider value={{ user: { name: "Mia", email: "mia@example.dk", role: "user" }, userId: "u1", accessToken: "x" }}>
    <NavigationProvider value={{ screen: screenId }}>
      <FeedbackModal open onClose={() => {}} onboardStep={3} />
    </NavigationProvider>
  </AuthProvider>
);

describe("FeedbackModal: tekster og privacy", () => {
  it("viser den nye hjælpetekst under beskrivelsen og den nye diagnostiktekst, uden persondata", () => {
    renderModal();
    expect(screen.getByPlaceholderText("Beskriv hvad der skete, og hvad du forventede.")).toBeTruthy();
    expect(screen.getByText("Fortæl gerne, hvad du gjorde, hvad der skete, og hvad du forventede.")).toBeTruthy();
    expect(screen.queryByText(/Disse tekniske oplysninger/)).toBeNull(); // sammenfoldet som standard
    fireEvent.click(screen.getByText("Automatisk inkluderet diagnostik"));
    expect(screen.getByText("Disse tekniske oplysninger vedhæftes automatisk for at hjælpe os med at finde fejlen.")).toBeTruthy();
    expect(screen.queryByText(/fravælge/)).toBeNull();
    expect(document.body.textContent).not.toContain("Mia");
    expect(document.body.textContent).not.toContain("mia@example.dk");
    expect(screen.getByText("Konto-ID (internt)")).toBeTruthy();
  });

  it("'Appen lukker ned' uden crash-data lover ikke at sende noget og siger det i diagnostikken", () => {
    renderModal();
    fireEvent.click(screen.getByRole("radio", { name: "Appen lukker ned" }));
    expect(screen.getByText(/Vi fandt ingen nylig fejl på enheden/)).toBeTruthy();
    expect(screen.queryByText(/vedhæfter automatisk den seneste tekniske fejl/)).toBeNull();
    fireEvent.click(screen.getByText("Automatisk inkluderet diagnostik"));
    expect(screen.getByText("Seneste fejl")).toBeTruthy();
    expect(screen.getByText("Ingen nylig fejl fundet")).toBeTruthy();
  });

  it("'Appen lukker ned' med registreret fejl lover at vedhæfte den seneste, og viser den", () => {
    localStorage.setItem("as_recent_errors", JSON.stringify([{ ts: "2026-10-02T09:59:30.000Z", message: "Boom", screen: "Scanner", source: "react" }]));
    renderModal();
    fireEvent.click(screen.getByRole("radio", { name: "Appen lukker ned" }));
    expect(screen.getByText(/Vi vedhæfter automatisk den seneste tekniske fejl/)).toBeTruthy();
    fireEvent.click(screen.getByText("Automatisk inkluderet diagnostik"));
    expect(screen.getByText(/Boom/)).toBeTruthy();
  });

  it("onboarding-trinnet i diagnostikken følger den faktiske progression", () => {
    renderModal(SCREENS.ONBOARD);
    fireEvent.click(screen.getByText("Automatisk inkluderet diagnostik"));
    expect(screen.getByText("3 af 5")).toBeTruthy();
  });

  it("Send er deaktiveret uden beskrivelse og aktiv med", () => {
    renderModal();
    const send = screen.getByRole("button", { name: /Send feedback/ });
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Beskriv problemet"), { target: { value: "Knappen virker ikke" } });
    expect(send.disabled).toBe(false);
  });
});
