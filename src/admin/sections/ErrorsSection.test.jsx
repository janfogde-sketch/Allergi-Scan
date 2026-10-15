// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import ErrorsSection from "./ErrorsSection.jsx";

afterEach(cleanup);
const row = { id: "e1", source: "react", screen: "scanner", message: "Cannot read properties of undefined (reading 'default')", stack: "TypeError\n at a.js:1", url: "/scan",
  user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) Version/18.7 Mobile Safari/604.1", occurrences: 7, first_seen: "2026-10-01T10:00:00Z", last_seen: "2026-10-15T09:00:00Z",
  status: "open", severity: "high", app_versions: ["v1"], context: {} };
const base = { rows: [], loading: false, loadingMore: false, hasMore: false, loaded: true, error: null, extended: true, options: [],
  stats: { open: 3, resolved: 5, ignored: 2, total: 10, occurrences: 40, new_groups_7d: 1, reopened: 2 },
  load: vi.fn(), loadMore: vi.fn(), setStatus: vi.fn(), setSeverity: vi.fn(), loadHistory: vi.fn().mockResolvedValue({ items: [], users: {} }) };

describe("Fejl: side", () => {
  it("kort intro, fire faner med tal fra serveren og ingen knapper på kortene", () => {
    render(<ErrorsSection {...base} rows={[row]} />);
    expect(screen.getByText("Overblik over registrerede fejl i EatSafe.")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Åben (3)" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Løst (5)" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Ignoreret (2)" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Alle (10)" })).toBeTruthy();
    expect(screen.getByText(/7 forekomster/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ignorér" })).toBeNull();
    expect(screen.queryByText("e1")).toBeNull();
  });
  it("fanen henter fra serveren med status", () => {
    const load = vi.fn();
    render(<ErrorsSection {...base} load={load} />);
    fireEvent.click(screen.getByRole("tab", { name: /Løst/ }));
    expect(load).toHaveBeenLastCalledWith(expect.objectContaining({ status: "resolved" }));
  });
  it("en netværksfejl ligner aldrig nul fejl", () => {
    render(<ErrorsSection {...base} loaded={false} error={{ denied: false, message: "x" }} />);
    expect(screen.getByText("Fejlene kunne ikke hentes")).toBeTruthy();
    expect(screen.queryByText(/Ingen åbne fejl/)).toBeNull();
  });
  it("ingen adgang, tom og ingen match er egne tilstande", () => {
    const { unmount } = render(<ErrorsSection {...base} error={{ denied: true, message: "x" }} />);
    expect(screen.getByText("Ingen adgang")).toBeTruthy();
    unmount();
    render(<ErrorsSection {...base} />);
    expect(screen.getByText("Ingen åbne fejl")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Filtre/ }));
    fireEvent.change(screen.getByLabelText("Søg"), { target: { value: "xyz" } });
    expect(screen.getByText("Ingen matchende fejl")).toBeTruthy();
  });
  it("'Om fejlregistrering' er lukket som standard", () => {
    render(<ErrorsSection {...base} />);
    expect(screen.queryByText(/Fejlgrupper:/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Om fejlregistrering" }));
    expect(screen.getByText(/Fejlgrupper:/)).toBeTruthy();
  });
});

describe("Fejl: detaljeark", () => {
  const open = (props = {}) => {
    render(<ErrorsSection {...base} rows={[row]} {...props} />);
    fireEvent.click(screen.getByText(/forekomster/).closest("button"));
  };
  it("viser X (uden teksten Luk), handlinger for åben fejl og lukker", () => {
    open();
    const close = screen.getByRole("button", { name: "Luk" });
    expect(close.textContent).toBe("");
    expect(screen.getByRole("button", { name: "Markér som løst" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ignorér" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kopiér som prompt" })).toBeTruthy();
    fireEvent.click(close);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("løst fejl: kun Genåbn; ignoreret fejl: Genåbn og Markér som løst", () => {
    open({ rows: [{ ...row, status: "resolved" }] });
    expect(screen.getByRole("button", { name: "Genåbn" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ignorér" })).toBeNull();
    cleanup();
    open({ rows: [{ ...row, status: "ignored", status_reason: "Gammel" }] });
    expect(screen.getByRole("button", { name: "Genåbn" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Markér som løst" })).toBeTruthy();
    expect(screen.getByText("“Gammel”")).toBeTruthy();
  });
  it("ignorering kræver en begrundelse", async () => {
    const setStatus = vi.fn().mockResolvedValue({ ok: true, row: { ...row, status: "ignored" } });
    open({ setStatus });
    fireEvent.click(screen.getByRole("button", { name: "Ignorér" }));
    const go = screen.getByRole("button", { name: "Ignorér fejlen" });
    expect(go.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Hvorfor ignoreres/), { target: { value: "  Gammel version  " } });
    fireEvent.click(go);
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith("e1", "ignored", "Gammel version"));
  });
  it("mislykket statusændring viser fejl og beholder den gamle status", async () => {
    const setStatus = vi.fn().mockResolvedValue({ ok: false, error: "HTTP 500" });
    open({ setStatus });
    fireEvent.click(screen.getByRole("button", { name: "Markér som løst" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Statussen blev ikke ændret"));
    expect(screen.getByRole("button", { name: "Markér som løst" })).toBeTruthy();
  });
  it("tekniske oplysninger og historik er lukkede, indtil de åbnes; stacktrace ligger i kodeblok", async () => {
    open();
    expect(document.querySelector(".err-code")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tekniske oplysninger" }));
    expect(document.querySelector(".err-code").tagName).toBe("PRE");
    fireEvent.click(screen.getByRole("button", { name: "Historik" }));
    await waitFor(() => expect(screen.getByText("Ingen statusændringer endnu.")).toBeTruthy());
    expect(base.loadHistory).toHaveBeenCalledWith("e1");
  });
});
