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
    expect(screen.getByText(/Kategorisering \(intern\)/)).toBeTruthy();
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
    render(<AiUsageSection {...base} />);
    const month = screen.getByRole("button", { name: /^oktober 2026/ });
    expect(month.textContent).toContain("1.204 kald");
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
    expect(screen.queryByText(/ikke faktureret beløb/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Om AI-forbruget" }));
    expect(screen.getByText(/ikke faktureret beløb/)).toBeTruthy();
    expect(screen.getByText(/ikke verificeret automatisk/)).toBeTruthy();
  });
  it("usædvanlige dage markeres ikke uden nok data, og det siges", () => {
    render(<AiUsageSection {...base} />);
    expect(screen.getByText(/mindst 7 dage med data \(nu 4\)/)).toBeTruthy();
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
