// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import OnboardingFunnelSection from "./OnboardingFunnelSection.jsx";

beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-15T10:00:00Z")); });
afterEach(() => { vi.useRealTimers(); cleanup(); delete window.matchMedia; });
const DATA = { total: 12, completed: 11, in_progress: 0, possible_dropout: 1, not_started: 0, unconfirmed: 0, test_accounts: 0, include_test: false, first_account: "2026-09-01T00:00:00Z",
  steps: [{ step: 3, latest: 1, inactive: 1 }], funnel_users: 3, funnel: [{ step: 1, reached: 3, continued: 3 }, { step: 2, reached: 3, continued: 2 }, { step: 3, reached: 2, continued: 1 }, { step: 4, reached: 1, continued: 1 }, { step: 5, reached: 1, continued: 1 }], daily: [] };
const base = (o = {}) => ({ data: DATA, loading: false, loaded: true, error: null, load: vi.fn(), ...o });

describe("Frafald i onboarding", () => {
  it("kort intro, periodevælger med denne måned som standard og den præcise datoperiode", () => {
    render(<OnboardingFunnelSection {...base()} />);
    expect(screen.getByText("Se, hvor mange der gennemfører onboarding, og hvor andre forlader forløbet.")).toBeTruthy();
    const sel = screen.getByLabelText("Periode");
    expect(sel.value).toBe("month");
    expect([...sel.options].map((o) => o.textContent)).toEqual(["Denne måned", "I dag", "Seneste 7 dage", "Seneste 30 dage", "Sidste måned", "Brugerdefineret periode"]);
    expect(screen.getByText(/Konti oprettet 1\. oktober 2026 – 15\. oktober 2026/)).toBeTruthy();
  });
  it("henter for perioden, og et periodeskift henter forfra", () => {
    const p = base();
    render(<OnboardingFunnelSection {...p} />);
    expect(p.load).toHaveBeenCalledWith({ from: "2026-10-01", to: "2026-10-15", includeTest: false });
    fireEvent.change(screen.getByLabelText("Periode"), { target: { value: "today" } });
    expect(p.load).toHaveBeenLastCalledWith({ from: "2026-10-15", to: "2026-10-15", includeTest: false });
  });
  it("fire kompakte nøgletal og gennemførelsesindikator med antal OG procent", () => {
    render(<OnboardingFunnelSection {...base()} />);
    for (const label of ["Oprettede konti", "Gennemført", "Igangværende", "Muligt frafald"]) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText("91,7 %", { selector: ".ai-kpi-sub" })).toBeTruthy();
    expect(screen.getByText("11 af 12 konti")).toBeTruthy();
    const bar = screen.getByRole("progressbar", { name: /gennemført onboarding/ });
    expect(bar.getAttribute("aria-valuenow")).toBe("92");
    expect(screen.getByText(/11 gennemført \+ 0 igangværende \+ 1 muligt frafald \+ 0 ikke startet \+ 0 ubekræftet = 12$/)).toBeTruthy();
  });
  it("ved få konti står et forbehold, og tallene vises stadig", () => {
    render(<OnboardingFunnelSection {...base()} />);
    expect(screen.getByText(/Datagrundlaget er endnu begrænset \(12 konti\)/)).toBeTruthy();
    cleanup();
    render(<OnboardingFunnelSection {...base({ data: { ...DATA, total: 200, completed: 150, possible_dropout: 50 } })} />);
    expect(screen.queryByText(/Datagrundlaget er endnu begrænset/)).toBeNull();
  });
  it("ÉN samlet oversigt i stedet for store trinkort: alle trin i rækkefølge, 'Senest registrerede trin', aldrig 'Stoppet her'", () => {
    render(<OnboardingFunnelSection {...base()} />);
    expect(screen.getByRole("heading", { name: "Hvor brugerne senest nåede til" })).toBeTruthy();
    expect(screen.queryByText(/Stoppet her/)).toBeNull();
    const rows = [...document.querySelectorAll(".onb-row .ai-fn-top span:first-child")].map((n) => n.textContent);
    const stepRows = rows.filter((t) => /^\d\. /.test(t) && !t.includes("nåede"));
    expect(stepRows.slice(0, 5)).toEqual(["1. Profil (navn, alder, køn)", "2. Allergier og samtykke", "3. Spor", "4. Familie (valgfrit)", "5. Notifikationer (valgfrit)"]);
    expect(screen.getByText(/heraf 1 uden fremgang i over 24 timer/)).toBeTruthy();
    expect(screen.getByText(/Det er ikke en tragt/)).toBeTruthy();
  });
  it("før-onboarding-kategorierne vises særskilt og tælles ikke som gennemført", () => {
    render(<OnboardingFunnelSection {...base({ data: { ...DATA, total: 14, not_started: 1, unconfirmed: 1 } })} />);
    expect(screen.getByText(/1 med ubekræftet e-mail og 1 uden registreret fremgang/)).toBeTruthy();
    expect(screen.getByText("E-mail ikke bekræftet")).toBeTruthy();
    expect(screen.getByText("Ikke startet (ingen registreret fremgang)")).toBeTruthy();
  });
  it("tragten vises fra registrerede trin, med valgfrie trin forklaret, og skjules uden data", () => {
    render(<OnboardingFunnelSection {...base()} />);
    expect(screen.getByRole("heading", { name: "Tragt: observerede overgange" })).toBeTruthy();
    expect(screen.getAllByText(/gennemført eller sprunget over/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Bygger på 3 konti med registreret trin/)).toBeTruthy();
    cleanup();
    render(<OnboardingFunnelSection {...base({ data: { ...DATA, funnel_users: 0 } })} />);
    expect(screen.queryByRole("heading", { name: "Tragt: observerede overgange" })).toBeNull();
  });
  it("udvikling vises kun med nok konti og dage; ellers en diskret besked", () => {
    render(<OnboardingFunnelSection {...base()} />);
    expect(screen.getByText(/Udviklingen over tid vises, når der er mindst 20 konti fordelt på mindst 14 dage/)).toBeTruthy();
    cleanup();
    const daily = Array.from({ length: 14 }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")}`, created: 3, completed: 2 }));
    render(<OnboardingFunnelSection {...base({ data: { ...DATA, total: 42, completed: 30, possible_dropout: 12, daily } })} />);
    expect(screen.getByRole("heading", { name: "Oprettede konti pr. dag" })).toBeTruthy();
  });
  it("testkonti kan tages med, men valget vises kun, når der findes nogen", () => {
    const p = base();
    render(<OnboardingFunnelSection {...p} />);
    expect(screen.queryByRole("checkbox", { name: /Medtag testkonti/ })).toBeNull();
    cleanup();
    const q = base({ data: { ...DATA, test_accounts: 2 } });
    render(<OnboardingFunnelSection {...q} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Medtag testkonti \(2\)/ }));
    expect(q.load).toHaveBeenLastCalledWith({ from: "2026-10-01", to: "2026-10-15", includeTest: true });
  });
  it("tilstande: fejl er ikke 'ingen konti', ikke aktiveret, ingen adgang og tom periode", () => {
    const { unmount } = render(<OnboardingFunnelSection {...base({ data: null, loaded: false, error: { denied: false, unavailable: false } })} />);
    expect(screen.getByText("Statistikken kunne ikke hentes")).toBeTruthy();
    unmount();
    const r2 = render(<OnboardingFunnelSection {...base({ data: null, loaded: false, error: { denied: false, unavailable: true } })} />);
    expect(screen.getByText("Statistikken er ikke aktiveret endnu")).toBeTruthy();
    r2.unmount();
    const r3 = render(<OnboardingFunnelSection {...base({ data: null, loaded: false, error: { denied: true, unavailable: false } })} />);
    expect(screen.getByText("Ingen adgang")).toBeTruthy();
    r3.unmount();
    render(<OnboardingFunnelSection {...base({ data: { ...DATA, total: 0, completed: 0, possible_dropout: 0 } })} />);
    expect(screen.getByText("Ingen konti oprettet i perioden")).toBeTruthy();
  });
  it("'Om onboardingstatistikken' er lukket som standard og forklarer definitionerne", () => {
    render(<OnboardingFunnelSection {...base()} />);
    expect(screen.queryByText(/Perioden afgrænser altid kohorten/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Om onboardingstatistikken" }));
    expect(screen.getByText(/Perioden afgrænser altid kohorten/)).toBeTruthy();
    expect(screen.getByText(/ikke bevis for permanent frafald/)).toBeTruthy();
    expect(screen.getByText(/example\.com eller example\.invalid/)).toBeTruthy();
  });
});
