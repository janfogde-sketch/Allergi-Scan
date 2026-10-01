// @ts-nocheck
// @vitest-environment jsdom
import React, { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuthProvider } from "./AuthContext.jsx";
import { MemberForm } from "./MemberForm.jsx";
import { AgeStepper } from "./FormFields.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";
import { pruneAllergenLevels } from "./helpers.js";
import { E_NUMBERS, ALLERGENS } from "./constants.jsx";

afterEach(cleanup);

describe("pruneAllergenLevels", () => {
  it("fjerner sporvalg for allergener, der ikke længere er valgt", () => {
    expect(pruneAllergenLevels({ maelkeallergi: "direct_only", gluten: "direct_only" }, ["gluten"])).toEqual({ gluten: "direct_only" });
    expect(pruneAllergenLevels({ maelkeallergi: "direct_only" }, [])).toEqual({});
    expect(pruneAllergenLevels(undefined, ["gluten"])).toEqual({});
  });
  it("returnerer det samme objekt, når intet skal fjernes", () => {
    const lv = { gluten: "direct_only" };
    expect(pruneAllergenLevels(lv, ["gluten", "hvede"])).toBe(lv);
  });
});

describe("AgeStepper", () => {
  it("starter uden forudfyldt alder og viser 'Vælg alder'", () => {
    render(<AgeStepper value="" onChange={() => {}} />);
    const input = screen.getByLabelText("Alder i år");
    expect(input.value).toBe("");
    expect(input.getAttribute("placeholder")).toBe("Vælg alder");
  });
});

function Harness({ onAdd, editing = false, initial = {} }) {
  const [name, setName] = useState(initial.name || "");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [allergens, setAllergens] = useState(initial.allergens || []);
  const [customAllerg, setCustomAllerg] = useState([]);
  const [diets, setDiets] = useState([]);
  const [levels, setLevels] = useState(initial.levels || {});
  const [eNumbers, setENumbers] = useState([]);
  const [customInput, setCustomInput] = useState("");
  return (
    <AuthProvider value={{ userId: null, accessToken: null }}>
      <MemberForm name={name} setName={setName} birthYear={birthYear} setBirthYear={setBirthYear} gender={gender} setGender={setGender}
        allergens={allergens} setAllergens={setAllergens} customAllerg={customAllerg} setCustomAllerg={setCustomAllerg}
        diets={diets} setDiets={setDiets} levels={levels} setLevels={setLevels} eNumbers={eNumbers} setENumbers={setENumbers}
        customInput={customInput} setCustomInput={setCustomInput} onAdd={onAdd} editing={editing} />
      <output data-testid="levels">{JSON.stringify(levels)}</output>
    </AuthProvider>
  );
}

const fillBasics = () => {
  fireEvent.change(screen.getByPlaceholderText("Fx. Mia"), { target: { value: "Mia" } });
  fireEvent.change(screen.getByLabelText("Alder i år"), { target: { value: "25" } });
  fireEvent.click(screen.getByText("Kvinde"));
};

describe("MemberForm: obligatoriske felter", () => {
  it("kan ikke gemmes uden et aktivt allergivalg, men kan med et eksplicit 'ingen'", () => {
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} />);
    fillBasics();
    fireEvent.click(screen.getByText("+ Tilføj familiemedlem"));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/allergivalg er obligatoriske/)).toBeTruthy();
    fireEvent.click(screen.getByText("Ingen allergier eller intolerancer"));
    fireEvent.click(screen.getByText("+ Tilføj familiemedlem"));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("kan ikke gemmes uden alder, selv med navn, køn og allergi", () => {
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} />);
    fireEvent.change(screen.getByPlaceholderText("Fx. Mia"), { target: { value: "Mia" } });
    fireEvent.click(screen.getByText("Kvinde"));
    fireEvent.click(screen.getByText("Ingen allergier eller intolerancer"));
    fireEvent.click(screen.getByText("+ Tilføj familiemedlem"));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("'Ingen' med eksisterende valg kræver bekræftelse og rydder allergier og sporvalg", () => {
    render(<Harness onAdd={() => {}} initial={{ allergens: ["maelkeallergi"], levels: { maelkeallergi: "direct_only" } }} />);
    fireEvent.click(screen.getByText("Ingen allergier eller intolerancer"));
    expect(screen.getByText("Fjern de valgte allergier?")).toBeTruthy();
    expect(screen.getByTestId("levels").textContent).toContain("maelkeallergi");
    fireEvent.click(screen.getByText("Ja, fjern valgene"));
    expect(screen.getByTestId("levels").textContent).toBe("{}");
  });

  it("fjernes et allergen, fjernes dets sporvalg også", () => {
    render(<Harness onAdd={() => {}} initial={{ allergens: ["maelkeallergi"], levels: { maelkeallergi: "direct_only" } }} />);
    fireEvent.click(screen.getAllByRole("button", { name: /Mælk/ })[0]);
    expect(screen.getByTestId("levels").textContent).toBe("{}");
  });
});

describe("ENumberPicker: chips og liste hænger sammen", () => {
  it("fjernes et E-nummer fra chippen, bliver afkrydsningsboksen i listen frakrydset", () => {
    function H() {
      const [sel, setSel] = useState(["E101"]);
      return <ENumberPicker selected={sel} onChange={setSel} />;
    }
    render(<H />);
    const box = () => screen.getAllByRole("checkbox").find(c => c.getAttribute("aria-label").startsWith("E101 "));
    expect(box().getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Fjern E101" }));
    expect(box().getAttribute("aria-checked")).toBe("false");
  });
});

describe("MemberForm: samtykke og model for andres profiler", () => {
  const fill = (age = "25") => {
    fireEvent.change(screen.getByPlaceholderText("Fx. Mia"), { target: { value: "Mia" } });
    fireEvent.change(screen.getByLabelText("Alder i år"), { target: { value: age } });
    fireEvent.click(screen.getByText("Kvinde"));
  };

  it("kræver en bekræftelse med personens navn, før en ny profil med allergier gemmes, og bruger aldrig 'mine'", () => {
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} initial={{ allergens: ["noedder"] }} />);
    fill("25");
    expect(screen.getByText(/Mia har givet sit udtrykkelige samtykke/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\bmine\b/i);
    fireEvent.click(screen.getByText("+ Tilføj familiemedlem"));
    expect(onAdd).not.toHaveBeenCalled();
    fireEvent.click(document.getElementById("member-consent"));
    fireEvent.click(screen.getByText("+ Tilføj familiemedlem"));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("et barn får en forælder/værge-erklæring, og voksne får en note om invitation", () => {
    render(<Harness onAdd={() => {}} initial={{ allergens: ["noedder"] }} />);
    fill("8");
    expect(screen.getByText(/forælder eller værge for Mia/)).toBeTruthy();
    expect(screen.queryByText(/Voksne kan i stedet inviteres/)).toBeNull();
    fireEvent.change(screen.getByLabelText("Alder i år"), { target: { value: "30" } });
    expect(screen.getByText(/Voksne kan i stedet inviteres under Familie/)).toBeTruthy();
  });

  it("redigering af en eksisterende profil kræver ikke en ny bekræftelse", () => {
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} editing initial={{ allergens: ["noedder"] }} />);
    fill("25");
    expect(document.getElementById("member-consent")).toBeNull();
    fireEvent.click(screen.getByText("+ Tilføj familiemedlem"));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("'Ingen allergier eller intolerancer' har en tydelig valgt-tilstand (aria-pressed)", () => {
    render(<Harness onAdd={() => {}} />);
    const btn = screen.getByRole("button", { name: /Ingen allergier eller intolerancer/ });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("faglig neutralitet i E-numre og allergennoter", () => {
  it("E-nummerbeskrivelserne indeholder ingen helbredspåstande eller værdiladede ord", () => {
    const banned = /hyperaktiv|kontrovers|forbudt|farlig|skadelig|giftig|kræft|\bkan give\b/i;
    expect(Object.entries(E_NUMBERS).filter(([, v]) => banned.test(v))).toEqual([]);
  });
  it("E102 beskrives dokumentationsnært (advarselsmærkning), uden helbredspåstand", () => {
    expect(E_NUMBERS.E102).toMatch(/azo-farve/);
    expect(E_NUMBERS.E102).toMatch(/advarselsmærkning/);
  });
  it("hvede, gluten og sulfitter har hver en forklarende note", () => {
    const note = id => ALLERGENS.find(a => a.id === id)?.note || "";
    expect(note("hvede")).toMatch(/ikke det samme som gluten/);
    expect(note("gluten")).toMatch(/ikke det samme som hvedeallergi/i);
    expect(note("svovl")).toMatch(/10 mg\/kg/);
  });
});
