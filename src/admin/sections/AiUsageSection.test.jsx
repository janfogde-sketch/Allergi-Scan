// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import AiUsageSection from "./AiUsageSection.jsx";

beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-15T10:00:00Z")); });
afterEach(() => { vi.useRealTimers(); cleanup(); delete window.matchMedia; });
const row = (day, fn, calls, input, output) => ({ day, function_name: fn, model: "claude-haiku-4-5", calls, input_tokens: input, output_tokens: output });
const OKT = [
  row("2026-10-08", "classify-categories", 582, 1514471, 896321), row("2026-10-08", "allergens", 20, 11453, 3340),
  row("2026-10-13", "allergens", 201, 115393, 33567), row("2026-10-14", "allergens", 201, 116655, 33567), row("2026-10-15", "allergens", 200, 114747, 33400),
];
const base = { rows: OKT, loading: false, loaded: true, error: null, load: vi.fn(), budget: null, budgetAvailable: true, saveBudget: vi.fn(async () => true) };

describe("AI-forbrug", () => {
  it("har kort introduktion, periodevælger med denne måned som standard og nøgletal for perioden", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.getByText("Overblik over AI-kald, tokenforbrug og estimerede omkostninger.")).toBeTruthy();
    const sel = screen.getByLabelText("Periode");
    expect(sel.value).toBe("month");
    expect([...sel.options].map((o) => o.textContent)).toEqual(["Denne måned", "I dag", "Seneste 7 dage", "Seneste 30 dage", "Sidste måned", "Brugerdefineret periode"]);
    expect(screen.getByText("47,43 kr.")).toBeTruthy(); // estimeret forbrug i oktober
    expect(screen.getByText("1.204")).toBeTruthy(); // AI-kald i alt
    expect(screen.getByText("Estimeret forbrug")).toBeTruthy();
    expect(screen.getByText(/ind ·/)).toBeTruthy();
  });
  it("viser forbrug pr. funktion sorteret efter pris med procent, og totalen stemmer", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.getByText("41,37 kr. · 87,2 %")).toBeTruthy();
    expect(screen.getByText("6,06 kr. · 12,8 %")).toBeTruthy();
    // Forbrugstypen står ved funktionen: kategorisering er dokumenteret intern, allergen-tjek kan ikke fastslås
    expect(screen.getByText(/582 kald · 7,11 øre pr\. kald · Intern/)).toBeTruthy();
    expect(screen.getByText(/622 kald · 0,97 øre pr\. kald · Ukendt/)).toBeTruthy();
  });
  it("perioden ændrer alt samlet: i dag viser kun dagens tal, og en tom periode får en egen besked", () => {
    render(<AiUsageSection {...base} />);
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "today" } });
    expect(screen.getByText("200")).toBeTruthy();
    expect(screen.queryByText("47,43 kr.")).toBeNull();
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "lastMonth" } });
    expect(screen.getByText("Intet forbrug i den valgte periode")).toBeTruthy();
    expect(screen.getByText(/andre perioder/)).toBeTruthy();
  });
  it("brugerdefineret periode kræver to datoer og bruger dem", () => {
    render(<AiUsageSection {...base} />);
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "custom" } });
    expect(screen.getByText(/Vælg både fra- og til-dato/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Fra dato"), { target: { value: "2026-10-13" } });
    fireEvent.change(screen.getByLabelText("Til dato"), { target: { value: "2026-10-14" } });
    expect(screen.getByText("402")).toBeTruthy();
  });
  it("diagrammet kan skifte måling, og dage før registreringen er 'ikke registreret'", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.getByRole("group", { name: /Forbrug pr. dag, kr/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Kald" }));
    expect(screen.getByRole("group", { name: /Forbrug pr. dag, kald/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /1\. oktober 2026: Ikke registreret/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /9\. oktober 2026: Intet forbrug/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /8\. oktober 2026: 602/ })).toBeTruthy();
  });
  it("måneder og dage er kompakte, foldbare rækker med detaljer, nyeste dag først", () => {
    render(<AiUsageSection {...base} rows={[...OKT, row("2026-09-20", "allergens", 10, 5000, 1000)]} />);
    const month = screen.getByRole("button", { name: /^oktober 2026/ });
    expect(month.textContent).toContain("1.204 kald");
    // Nyeste måned øverst
    const monthButtons = screen.getAllByRole("button").filter((b) => /^(oktober|september) 2026/.test(b.textContent));
    expect(monthButtons.map((b) => b.textContent.slice(0, 9))).toEqual(["oktober 2", "september"]);
    expect(screen.queryByText("Tokens ind")).toBeNull();
    fireEvent.click(month);
    expect(screen.getByText("Tokens ind")).toBeTruthy();
    const dayButtons = screen.getAllByRole("button").filter((b) => /^\d+\. okt\./.test(b.textContent) && /kald · /.test(b.textContent));
    expect(dayButtons[0].textContent).toMatch(/^15\. okt\./);
  });
  it("tilstande: indlæser, tom, fejl (aldrig tom log) og ingen adgang", () => {
    const { unmount } = render(<AiUsageSection {...base} rows={[]} loaded={false} loading />);
    expect(screen.getByText("Henter…")).toBeTruthy();
    unmount();
    const r2 = render(<AiUsageSection {...base} rows={[]} />);
    expect(screen.getByText("Ingen AI-aktivitet registreret endnu")).toBeTruthy();
    r2.unmount();
    const load = vi.fn();
    const r3 = render(<AiUsageSection {...base} rows={[]} loaded={false} error={{ denied: false, message: "x" }} load={load} />);
    expect(screen.queryByText("Ingen AI-aktivitet registreret endnu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Prøv igen" }));
    expect(load).toHaveBeenCalled();
    r3.unmount();
    render(<AiUsageSection {...base} error={{ denied: true, message: "x" }} />);
    expect(screen.getByText("Ingen adgang")).toBeTruthy();
    expect(screen.queryByText("47,43 kr.")).toBeNull();
  });
  it("'Om AI-forbruget' er lukket og skelner estimat fra faktisk udgift", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.queryByText(/Der er ingen fakturadata/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Om AI-forbruget" }));
    expect(screen.getByText(/Der er ingen fakturadata/)).toBeTruthy();
    expect(screen.getByText(/ikke verificeret automatisk/)).toBeTruthy();
    expect(screen.getByText(/Forbrugstype:/)).toBeTruthy();
  });
  it("usædvanlige dage markeres ikke uden nok data; forklaringen står i 'Om AI-forbruget', ikke under diagrammet", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.queryByText(/mindst 7 dage med data/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Om AI-forbruget" }));
    expect(screen.getByText(/mindst 7 dage med data \(nu 4\)/)).toBeTruthy();
  });
  it("kort tekst under diagrammet med dynamisk antal dage; forklaring bag infoikonet", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.getByText("Data registreret på 4 dage. Tryk på en søjle for detaljer.")).toBeTruthy();
    expect(screen.queryByText(/Grønne søjler/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Forklaring til diagrammet" }));
    expect(screen.getByText(/ikke nul/)).toBeTruthy();
  });
  it("måneder vises ikke, når der kun er én måned (samme tal som nøgletallene)", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.queryByRole("heading", { name: "Måneder" })).toBeNull();
  });
  it("tryk på en søjle viser dato, omkostning, kald, tokens og fordeling pr. funktion", () => {
    render(<AiUsageSection {...base} />);
    fireEvent.click(screen.getByRole("button", { name: /^8\. oktober 2026/ }));
    const box = screen.getByText("8. oktober 2026", { selector: ".ai-day-title" }).parentElement;
    expect(within(box).getByText("41,57 kr.")).toBeTruthy();
    expect(within(box).getByText("602")).toBeTruthy();
    expect(within(box).getByText("1.525.924")).toBeTruthy(); // tokens ind
    expect(within(box).getByText("899.661")).toBeTruthy(); // tokens ud
    expect(within(box).getByText("Kategorisering")).toBeTruthy();
    expect(within(box).getByText("Allergen-tjek")).toBeTruthy();
    // En dag uden registrering og en dag uden forbrug forklares, ikke vises som nul
    fireEvent.click(screen.getByRole("button", { name: /^1\. oktober 2026/ }));
    expect(screen.getByText(/Ikke registreret \(før registreringen begyndte\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^9\. oktober 2026/ }));
    expect(screen.getByText("Registreret, men intet forbrug.")).toBeTruthy();
  });
  it("fokus på almindelige dage afkorter skalaen med tydelig besked, og den dyre dag skjules aldrig", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.queryByText(/Skalaen er afkortet/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Fokusér på almindelige dage" }));
    expect(screen.getByText(/Skalaen er afkortet.*8\. okt\. \(41,57 kr\.\)/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /8\. oktober 2026: 41,57 kr\., afkortet i diagrammet/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Vis fuld skala" }));
    expect(screen.queryByText(/Skalaen er afkortet/)).toBeNull();
  });
  it("forbrugstype: filteret ændrer nøgletal, fordeling og dage, og ukendt skilles fra intern", () => {
    render(<AiUsageSection {...base} />);
    const sel = screen.getByLabelText("Forbrugstype");
    expect([...sel.options].map((o) => o.textContent)).toEqual(["Alle", "Brugerfunktioner", "Interne processer", "Ukendt / ikke klassificeret"]);
    fireEvent.change(sel, { target: { value: "internal" } });
    expect(screen.getByText("41,37 kr.")).toBeTruthy(); // kun kategorisering
    expect(screen.queryByText("Allergen-tjek")).toBeNull();
    fireEvent.change(sel, { target: { value: "unknown" } });
    expect(screen.getByText("6,06 kr.")).toBeTruthy(); // allergen-tjek kan ikke fastslås
    expect(screen.queryByText(/^Kategorisering$/)).toBeNull();
    fireEvent.change(sel, { target: { value: "user" } });
    expect(screen.getByText("Intet forbrug af den valgte forbrugstype")).toBeTruthy();
  });
  it("registreret oprindelse bruges, og perioden virker sammen med filteret", () => {
    const rows = [{ ...row("2026-10-15", "allergens", 3, 3000, 300), origin: "user" }, { ...row("2026-10-15", "allergens", 5, 5000, 500), origin: "internal" }, { ...row("2026-10-14", "allergens", 7, 7000, 700), origin: "user" }];
    render(<AiUsageSection {...base} rows={rows} />);
    fireEvent.change(screen.getByLabelText("Forbrugstype"), { target: { value: "user" } });
    expect(screen.getByText("10")).toBeTruthy(); // 3 + 7 kald
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "today" } });
    expect(screen.getByText("3")).toBeTruthy();
  });
  it("gennemsnit pr. kald vises i øre under 1 kr.", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.getByText("3,94 øre")).toBeTruthy(); // 47,43 kr. / 1.204 kald
  });
});

describe("AI-budget", () => {
  it("uden budget vises 'Opret budget', og et nyt budget gemmes med grænser", async () => {
    const saveBudget = vi.fn(async () => true);
    render(<AiUsageSection {...base} saveBudget={saveBudget} />);
    fireEvent.click(screen.getByRole("button", { name: "Opret budget" }));
    fireEvent.change(screen.getByLabelText("Budget (kr.)"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Gem" }));
    expect(saveBudget).toHaveBeenCalledWith({ monthly: 500, warn1: 80, warn2: 100 });
  });
  it("ugyldigt budget kan ikke gemmes", () => {
    render(<AiUsageSection {...base} />);
    fireEvent.click(screen.getByRole("button", { name: "Opret budget" }));
    fireEvent.change(screen.getByLabelText("Budget (kr.)"), { target: { value: "0" } });
    expect(screen.getByRole("button", { name: "Gem" }).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Budget (kr.)"), { target: { value: "500" } });
    fireEvent.change(screen.getByLabelText("Første advarsel (%)"), { target: { value: "120" } });
    expect(screen.getByRole("button", { name: "Gem" }).disabled).toBe(true);
  });
  it("viser forbrug, tilbage og en fremskridtsbjælke; advarer ved grænsen uden at stoppe noget", () => {
    const { unmount } = render(<AiUsageSection {...base} budget={{ monthly_dkk: 500, warn_1: 80, warn_2: 100 }} />);
    // Budgettet gælder kalendermåneden og alle typer, uanset forbrugstype og periode
    fireEvent.change(screen.getByLabelText("Forbrugstype"), { target: { value: "internal" } });
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "today" } });
    const bar = screen.getByRole("progressbar", { name: /Andel af månedsbudgettet/ });
    expect(bar.getAttribute("aria-valuenow")).toBe("9");
    expect(screen.getByText(/Tilbage: 452,57 kr./)).toBeTruthy();
    unmount();
    render(<AiUsageSection {...base} budget={{ monthly_dkk: 50, warn_1: 80, warn_2: 100 }} />);
    expect(screen.getByText(/over 80 % af budgettet/)).toBeTruthy();
  });
  it("budgetdelen skjules, når funktionerne ikke findes endnu", () => {
    render(<AiUsageSection {...base} budgetAvailable={false} />);
    expect(screen.queryByRole("button", { name: "Opret budget" })).toBeNull();
  });
});
