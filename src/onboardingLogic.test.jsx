// @ts-nocheck
// @vitest-environment jsdom
import React, { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuthProvider } from "./AuthContext.jsx";
import { MemberForm } from "./MemberForm.jsx";
import { AgeStepper } from "./FormFields.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";
import { pruneAllergenLevels, traceEligible } from "./helpers.js";
import { AllergenSensitivity, AllergenChipPicker } from "./AllergenPicker.jsx";
import { E_NUMBERS, ALLERGENS } from "./constants.jsx";

afterEach(cleanup);

describe("pruneAllergenLevels", () => {
  it("fjerner sporvalg for allergener, der ikke længere er valgt", () => {
    expect(pruneAllergenLevels({ maelkeallergi: "direct_only", gluten: "direct_only" }, ["gluten"])).toEqual({ gluten: "direct_only" });
    expect(pruneAllergenLevels({ maelkeallergi: "direct_only" }, [])).toEqual({});
    expect(pruneAllergenLevels(undefined, ["gluten"])).toEqual({});
  });
  it("fjerner Cøliakis sporvalg sammen med Cøliaki (men ikke Glutens)", () => {
    expect(pruneAllergenLevels({ coeliaki: "direct_only", gluten: "direct_only" }, ["gluten"])).toEqual({ gluten: "direct_only" });
    expect(pruneAllergenLevels({ coeliaki: "direct_only" }, ["hvede"])).toEqual({});
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

function Harness({ onAdd, editing = false, initial = {}, onInviteAdult, onInviteOwnAccount, openPrivacy }) {
  const [name, setName] = useState(initial.name || "");
  const [birthYear, setBirthYear] = useState(initial.birthYear || "");
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
        customInput={customInput} setCustomInput={setCustomInput} onAdd={onAdd} editing={editing} onInviteAdult={onInviteAdult} onInviteOwnAccount={onInviteOwnAccount} openPrivacy={openPrivacy} />
      <output data-testid="levels">{JSON.stringify(levels)}</output>
    </AuthProvider>
  );
}

const fillBasics = () => {
  fireEvent.change(screen.getByPlaceholderText("Fx. Mia"), { target: { value: "Mia" } });
  fireEvent.change(screen.getByLabelText("Alder i år"), { target: { value: "12" } });
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
  const fill = (age = "12") => {
    fireEvent.change(screen.getByPlaceholderText("Fx. Mia"), { target: { value: "Mia" } });
    fireEvent.change(screen.getByLabelText("Alder i år"), { target: { value: age } });
    fireEvent.click(screen.queryByText("Kvinde") || document.body);
  };

  it("en mindreårig kræver en forælder/værge-bekræftelse med navn og link til privatlivspolitikken, før profilen gemmes (aldrig 'mine')", () => {
    const onAdd = vi.fn();
    const openPrivacy = vi.fn();
    render(<Harness onAdd={onAdd} openPrivacy={openPrivacy} initial={{ allergens: ["noedder"] }} />);
    fill("12");
    expect(screen.getByText(/forælder eller værge for Mia/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\bmine\b/i);
    fireEvent.click(screen.getByText("Læs privatlivspolitikken"));
    expect(openPrivacy).toHaveBeenCalled();
    fireEvent.click(screen.getByText("+ Tilføj familiemedlem"));
    expect(onAdd).not.toHaveBeenCalled();
    fireEvent.click(document.getElementById("member-consent"));
    fireEvent.click(screen.getByText("+ Tilføj familiemedlem"));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("uden kendt alder vises der ingen samtykketekst endnu", () => {
    render(<Harness onAdd={() => {}} initial={{ allergens: ["noedder"] }} />);
    expect(document.getElementById("member-consent")).toBeNull();
  });

  it("alderen i en børneprofil kan ikke komme over 17: typet eller med +, og 18+ forklares med Invitér til familien", () => {
    const onAdd = vi.fn(); const onInviteAdult = vi.fn();
    render(<Harness onAdd={onAdd} onInviteAdult={onInviteAdult} initial={{ allergens: ["noedder"] }} />);
    fireEvent.change(screen.getByPlaceholderText("Fx. Mia"), { target: { value: "Arnold" } });
    fireEvent.change(screen.getByLabelText("Alder i år"), { target: { value: "28" } });
    expect(screen.getByLabelText("Alder i år").value).toBe("17"); // klippet til 17
    expect(screen.getByText("Personer på 18 år eller derover skal have deres egen EatSafe-konto.")).toBeTruthy();
    expect(screen.queryByText("Voksne administrerer deres egen profil")).toBeNull();
    fireEvent.click(screen.getByText("Invitér til familien"));
    expect(onInviteAdult).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("Ét år ældre")); // + ved 17 går ikke videre
    expect(screen.getByLabelText("Alder i år").value).toBe("17");
    fireEvent.click(screen.getByLabelText("Ét år yngre"));
    expect(screen.getByLabelText("Alder i år").value).toBe("16");
    expect(screen.queryByText("Personer på 18 år eller derover skal have deres egen EatSafe-konto.")).toBeNull();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("minus går ikke under 0", () => {
    render(<Harness onAdd={() => {}} initial={{ allergens: ["noedder"] }} />);
    fireEvent.change(screen.getByLabelText("Alder i år"), { target: { value: "0" } });
    fireEvent.click(screen.getByLabelText("Ét år yngre"));
    expect(screen.getByLabelText("Alder i år").value).toBe("0");
  });

  it("en ældre profil, der er fyldt 18, kan redigeres og får overgangsnoten", () => {
    const onInviteOwnAccount = vi.fn();
    render(<Harness onAdd={() => {}} editing onInviteOwnAccount={onInviteOwnAccount} initial={{ allergens: ["noedder"], birthYear: String(new Date().getFullYear() - 19) }} />);
    expect(screen.getByLabelText("Alder i år").value).toBe("19");
    expect(screen.getByText("Denne profil skal nu overgå til en personlig EatSafe-konto.")).toBeTruthy();
    fireEvent.click(screen.getByText("Invitér til egen konto"));
    expect(onInviteOwnAccount).toHaveBeenCalledTimes(1);
  });

  it("redigering af en eksisterende profil kræver ikke en ny bekræftelse (og blokeres ikke)", () => {
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} editing initial={{ allergens: ["noedder"] }} />);
    fill("12");
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

describe("spor: kun hvor det giver mening", () => {
  it("laktose har ingen sporvalg, hverken i valget, i state eller i den gemte profil", () => {
    expect(traceEligible(["laktose", "maelkeallergi", "gluten"])).toEqual(["maelkeallergi", "gluten"]);
    expect(traceEligible(["coeliaki", "laktose"])).toEqual(["coeliaki"]);
    expect(pruneAllergenLevels({ laktose: "direct_only", maelkeallergi: "direct_only" }, ["laktose", "maelkeallergi"])).toEqual({ maelkeallergi: "direct_only" });
    render(<AllergenSensitivity selected={["laktose"]} levels={{}} onChange={() => {}} />);
    expect(screen.queryAllByRole("group")).toHaveLength(0);
  });
  it("mælkeallergi og laktose er to forskellige valg: kun mælk får en sporrække", () => {
    render(<AllergenSensitivity selected={["laktose", "maelkeallergi"]} levels={{}} onChange={() => {}} />);
    expect(screen.getAllByRole("group")).toHaveLength(1);
    expect(screen.getByRole("group", { name: /Mælk/ })).toBeTruthy();
  });
  it("gluten hedder Glutenfølsomhed i valg og spor, og hvede er et separat valg", () => {
    render(<AllergenChipPicker selected={[]} onChange={() => {}} />);
    expect(screen.getByText("Glutenfølsomhed")).toBeTruthy();
    expect(screen.getByText("Hvede")).toBeTruthy();
    cleanup();
    render(<AllergenSensitivity selected={["gluten", "hvede"]} levels={{}} onChange={() => {}} />);
    expect(screen.getAllByRole("group")).toHaveLength(2);
    expect(screen.getByRole("group", { name: /^Glutenfølsomhed/ })).toBeTruthy();
  });
  it("sulfitter har sin egen mærkningsgrænse som data og en præcis, ikke-kategorisk note", () => {
    const a = ALLERGENS.find(x => x.id === "svovl");
    expect(a.labelThresholdMgPerKg).toBe(10);
    expect(a.note).toMatch(/mærkningspligtigt allergen/);
    expect(a.note).toMatch(/samlet SO₂/);
    expect(a.note).not.toMatch(/kan EatSafe ikke se/);
  });
  it("hvede-noten adskiller hvedeallergi fra glutenfølsomhed og cøliaki, uden den upræcise 'Gluten (intolerance)'", () => {
    const note = id => ALLERGENS.find(a => a.id === id)?.note || "";
    expect(note("hvede")).toBe("Hvedeallergi gælder hvede. Det er ikke det samme som glutenfølsomhed, og de vælges hver for sig.");
    expect(ALLERGENS.map(a => a.note || "").join(" ")).not.toContain("Gluten (intolerance)");
  });
});
