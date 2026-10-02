// @ts-nocheck
// @vitest-environment jsdom
import React, { useState } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { AuthProvider } from "./AuthContext.jsx";
import { NavigationProvider } from "./NavigationContext.jsx";
import SuggestEditScreen from "./SuggestEditScreen.jsx";
import { SCREENS } from "./constants.jsx";

afterEach(cleanup);

const product = { id: "p1", code: "5701234500035", name: "Letmælk", brand: "Arla", ingredients: "" };

// startStep: hvor flowet åbnes (som ResultScreen.openContribution gør). setScreen logges, så vi kan se, om tilbage forlader flowet.
function Harness({ startStep, startType, onScreen }) {
  const [editStep, setEditStep] = useState(startStep);
  const [editType, setEditType] = useState(startType);
  const [editIngText, setEditIngText] = useState("");
  const [editNote, setEditNote] = useState("");
  return (
    <AuthProvider value={{ accessToken: "x", userId: "u1" }}>
      <NavigationProvider value={{ setScreen: onScreen }}>
        <SuggestEditScreen scanResult={product} editStep={editStep} setEditStep={setEditStep} editType={editType} setEditType={setEditType}
          editIngText={editIngText} setEditIngText={setEditIngText} editNote={editNote} setEditNote={setEditNote}
          editProductImage={null} editProductImageB64={null} handleEditProductCapture={() => {}} />
      </NavigationProvider>
    </AuthProvider>
  );
}
const back = () => fireEvent.click(screen.getByRole("button", { name: "Tilbage" }));

describe("Bidragsflow: tilbage går ét logisk trin tilbage", () => {
  it("via valgmenuen: manuel -> fotoguide -> menu -> produkt", () => {
    const onScreen = vi.fn();
    render(<Harness startStep="start" startType="missing" onScreen={onScreen} />);
    fireEvent.click(screen.getByText("Ingrediensliste mangler"));
    expect(screen.getByText("Tag billede med kamera")).toBeTruthy();
    fireEvent.click(screen.getByText("Skriv manuelt i stedet"));
    expect(screen.getByText("Send forslag")).toBeTruthy();
    back();
    expect(screen.getByText("Tag billede med kamera")).toBeTruthy();
    back();
    expect(screen.getByText("Næringsindhold mangler")).toBeTruthy();
    expect(onScreen).not.toHaveBeenCalled();
    back();
    expect(onScreen).toHaveBeenCalledWith(SCREENS.RESULT);
  });

  it("åbnet direkte på fotoguiden fører tilbage til oversigten (aldrig direkte til produktet)", () => {
    const onScreen = vi.fn();
    render(<Harness startStep="guide" startType="ingredients" onScreen={onScreen} />);
    back();
    expect(screen.getByText("Næringsindhold mangler")).toBeTruthy();
    expect(onScreen).not.toHaveBeenCalled();
    back();
    expect(onScreen).toHaveBeenCalledWith(SCREENS.RESULT);
  });

  it("'Andet er forkert': Send forslag kræver tekst, og tilbage fører til menuen", () => {
    const onScreen = vi.fn();
    render(<Harness startStep="start" startType="correct" onScreen={onScreen} />);
    fireEvent.click(screen.getByText("Andet er forkert"));
    const send = screen.getByRole("button", { name: /Send forslag/ });
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByPlaceholderText(/forkert navn/i), { target: { value: "Forkert navn" } });
    expect(send.disabled).toBe(false);
    back();
    expect(screen.getByText("Produktbilledet er forkert")).toBeTruthy();
    expect(onScreen).not.toHaveBeenCalled();
  });

  it("'Skriv manuelt' vises ikke ved produktbillede", () => {
    render(<Harness startStep="guide" startType="image" onScreen={() => {}} />);
    expect(screen.queryByText("Skriv manuelt i stedet")).toBeNull();
  });

  it("Androids systemtilbage (eatsafe:back) følger samme stak som tilbagepilen", () => {
    const onScreen = vi.fn();
    render(<Harness startStep="start" startType="missing" onScreen={onScreen} />);
    fireEvent.click(screen.getByText("Ingrediensliste mangler"));
    const ev = new CustomEvent("eatsafe:back", { cancelable: true });
    act(() => { window.dispatchEvent(ev); });
    expect(ev.defaultPrevented).toBe(true);
    expect(screen.getByText("Næringsindhold mangler")).toBeTruthy();
    expect(onScreen).not.toHaveBeenCalled();
  });
});
