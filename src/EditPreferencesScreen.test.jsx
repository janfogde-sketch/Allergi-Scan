// @ts-nocheck
// @vitest-environment jsdom
import React, { useState } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuthProvider } from "./AuthContext.jsx";
import { ProfileProvider } from "./ProfileContext.jsx";
import { NavigationProvider } from "./NavigationContext.jsx";
import { AllergenPrefsProvider } from "./AllergenPrefsContext.jsx";
import EditPreferencesScreen from "./EditPreferencesScreen.jsx";

afterEach(cleanup);

function Harness() {
  const [user, setUser] = useState({ name: "Bjørn", allergenLevels: {}, diets: [] });
  const [allergens, setAllergens] = useState(["maelkeallergi", "jordnoedder"]);
  const [customAllerg, setCustomAllerg] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [selectedENumbers, setSelectedENumbers] = useState([]);
  return (
    <AuthProvider value={{ user, setUser, userId: "u1", accessToken: "x" }}>
      <ProfileProvider value={{ allergens, setAllergens, customAllerg, setCustomAllerg }}>
        <NavigationProvider value={{ setScreen: () => {} }}>
          <AllergenPrefsProvider value={{ selectedENumbers, setSelectedENumbers }}>
            <EditPreferencesScreen customInput={customInput} setCustomInput={setCustomInput} glutenFreeAutoApplied={false} setGlutenFreeAutoApplied={() => {}} />
          </AllergenPrefsProvider>
        </NavigationProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

describe("Rediger præferencer: Gem ændringer vises kun ved ugemte ændringer", () => {
  it("er skjult fra start, vises ved en ændring og forsvinder igen, når ændringen fortrydes", () => {
    render(<Harness />);
    expect(screen.queryByText("Gem ændringer")).toBeNull();
    const milk = screen.getByRole("group", { name: /Mælk/ });
    fireEvent.click(milk.querySelectorAll("button")[1]); // "Kun ved ingrediens"
    expect(screen.getByText("Gem ændringer")).toBeTruthy();
    fireEvent.click(milk.querySelectorAll("button")[0]); // tilbage til "Advar mig"
    expect(screen.queryByText("Gem ændringer")).toBeNull();
  });

  it("tekst i 'Skriv selv'-feltet tæller som en ændring, og plus-knappen hedder 'Tilføj'", () => {
    render(<Harness />);
    expect(screen.queryByText("Gem ændringer")).toBeNull();
    fireEvent.change(screen.getByLabelText("Egen allergi eller intolerance"), { target: { value: "Fruktose" } });
    expect(screen.getByText("Gem ændringer")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tilføj" })).toBeTruthy();
  });

  it("knappen ligger i en fast bjælke uden for siden og giver siden plads (så intet ligger bag den)", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Egen allergi eller intolerance"), { target: { value: "x" } });
    const bar = screen.getByText("Gem ændringer").closest(".save-bar");
    expect(bar).toBeTruthy();
    expect(bar.parentElement).toBe(document.body);
    expect(document.querySelector(".screen").style.paddingBottom).toMatch(/px$/);
  });
});
