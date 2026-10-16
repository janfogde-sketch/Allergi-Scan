// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
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
    fireEvent.click(screen.getByText(/forekomst/).closest("button"));
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
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith("e1", "ignored", "Gammel version", {}));
  });
  it("'Markér som løst' åbner en bekræftelse; beskrivelsen er påkrævet, versionen kan udelades, og X lukker dialogen uden at lukke arket", async () => {
    const setStatus = vi.fn().mockResolvedValue({ ok: true, row: { ...row, status: "resolved", resolution_note: "Rettet", verified_build: null } });
    open({ setStatus });
    fireEvent.click(screen.getByRole("button", { name: "Markér som løst" }));
    const dlg = screen.getByRole("dialog", { name: "Markér fejl som løst?" });
    expect(within(dlg).getByText("Bekræft, at fejlen er rettet og verificeret.")).toBeTruthy();
    const go = within(dlg).getByRole("button", { name: "Markér som løst" });
    expect(go.disabled).toBe(true);
    expect(within(dlg).getByRole("button", { name: "Annuller" })).toBeTruthy();
    expect(within(dlg).getByRole("button", { name: "Luk dialog" }).textContent).toBe("");
    fireEvent.click(within(dlg).getByRole("button", { name: "Luk dialog" }));
    expect(screen.queryByRole("dialog", { name: "Markér fejl som løst?" })).toBeNull();
    expect(screen.getByRole("dialog", { name: /scanner/i })).toBeTruthy(); // arket står stadig
  });
  it("løst: beskrivelse og eventuel verificeret build sendes med; ugyldigt build-id afvises", async () => {
    const setStatus = vi.fn().mockResolvedValue({ ok: true, row: { ...row, status: "resolved", resolution_note: "Rettet", verified_build: "d81f4e2" } });
    open({ setStatus });
    fireEvent.click(screen.getByRole("button", { name: "Markér som løst" }));
    const dlg = () => screen.getByRole("dialog", { name: "Markér fejl som løst?" });
    fireEvent.change(within(dlg()).getByLabelText(/Beskrivelse af rettelse/), { target: { value: "  Rettet  " } });
    fireEvent.change(within(dlg()).getByLabelText(/Verificeret i version/), { target: { value: "local" } });
    expect(within(dlg()).getByRole("alert").textContent).toMatch(/7 til 40 tegn/);
    expect(within(dlg()).getByRole("button", { name: "Markér som løst" }).disabled).toBe(true);
    fireEvent.change(within(dlg()).getByLabelText(/Verificeret i version/), { target: { value: "D81F4E2" } });
    fireEvent.click(within(dlg()).getByRole("button", { name: "Markér som løst" }));
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith("e1", "resolved", "", { note: "Rettet", build: "d81f4e2" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Markér fejl som løst?" })).toBeNull());
  });
  it("en løst fejl viser rettelsen og den angivne build (eller at den ikke er angivet)", () => {
    open({ rows: [{ ...row, status: "resolved", resolution_note: "Rettet i boot.js", verified_build: "d81f4e2" }] });
    expect(screen.getByText("Rettelse")).toBeTruthy();
    expect(screen.getByText("Rettet i boot.js")).toBeTruthy();
    expect(screen.getByText("Angivet som verificeret i build")).toBeTruthy();
    expect(screen.getByText("d81f4e2")).toBeTruthy();
    cleanup();
    open({ rows: [{ ...row, status: "resolved", resolution_note: "Fix", verified_build: null }] });
    expect(screen.getByText("Ikke angivet")).toBeTruthy();
  });
  it("uden version sendes build som tom, og ikke-gemte oplysninger kasseres kun efter bekræftelse", async () => {
    const setStatus = vi.fn().mockResolvedValue({ ok: true, row: { ...row, status: "resolved", resolution_note: "x" } });
    open({ setStatus });
    fireEvent.click(screen.getByRole("button", { name: "Markér som løst" }));
    fireEvent.change(screen.getByLabelText(/Beskrivelse af rettelse/), { target: { value: "Udkast" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("alertdialog", { name: "Kassér ændringer?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fortsæt redigering" }));
    expect(screen.getByLabelText(/Beskrivelse af rettelse/).value).toBe("Udkast");
    fireEvent.click(screen.getByRole("button", { name: "Annuller" }));
    fireEvent.click(screen.getByRole("button", { name: "Kassér ændringer" }));
    expect(screen.queryByRole("dialog", { name: "Markér fejl som løst?" })).toBeNull();
    expect(setStatus).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: /scanner/i })).toBeTruthy();
  });
  it("en mislykket statusændring viser fejlen i dialogen og beholder den gamle status", async () => {
    const setStatus = vi.fn().mockResolvedValue({ ok: false, error: "HTTP 500" });
    open({ setStatus });
    fireEvent.click(screen.getByRole("button", { name: "Markér som løst" }));
    fireEvent.change(screen.getByLabelText(/Beskrivelse af rettelse/), { target: { value: "Rettet" } });
    fireEvent.click(within(screen.getByRole("dialog", { name: "Markér fejl som løst?" })).getByRole("button", { name: "Markér som løst" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Statussen blev ikke ændret"));
    expect(screen.getByRole("dialog", { name: "Markér fejl som løst?" })).toBeTruthy(); // teksten er bevaret
    expect(screen.getByLabelText(/Beskrivelse af rettelse/).value).toBe("Rettet");
  });
  it("tidspunkter: én forekomst viser kun 'Registreret'; flere viser første, seneste og antal; build-id i stedet for appversion", () => {
    open({ rows: [{ ...row, occurrences: 1, last_seen: row.first_seen }] });
    expect(screen.getByText("Registreret")).toBeTruthy();
    expect(screen.queryByText("Første forekomst")).toBeNull();
    expect(screen.queryByText("Seneste forekomst")).toBeNull();
    expect(screen.queryByText("Antal forekomster")).toBeNull();
    expect(screen.getByText("Build-id")).toBeTruthy();
    expect(screen.queryByText("Appversion")).toBeNull();
    cleanup();
    open();
    expect(screen.getByText("Første forekomst")).toBeTruthy();
    expect(screen.getByText("Seneste forekomst")).toBeTruthy();
    expect(screen.getByText("Antal forekomster")).toBeTruthy();
    expect(screen.queryByText("Registreret")).toBeNull();
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

describe("Fejl: oprindelig kode, historik og kodefelter", () => {
  const open = (props = {}) => {
    render(<ErrorsSection {...base} rows={[{ ...row, app_version: "d81f4e2" }]} {...props} />);
    fireEvent.click(screen.getByText(/forekomst/).closest("button"));
    fireEvent.click(screen.getByRole("button", { name: "Tekniske oplysninger" }));
  };
  it("viser kun verificerede, oversatte rammer med antal, og den originale stacktrace står uændret", async () => {
    const frames = [{ resolved: true, name: "lazyInitializer", source: "node_modules/react/cjs/react.production.min.js", origLine: 18, origCol: 381 }, { resolved: false, raw: "x" }];
    const symbolicate = vi.fn().mockResolvedValue({ ok: true, frames, resolved: 1, total: 2 });
    open({ symbolicate });
    fireEvent.click(screen.getByRole("button", { name: "Vis oprindelig kode" }));
    await waitFor(() => expect(screen.getByText(/1 af 2 rammer er oversat og verificeret mod build d81f4e2/)).toBeTruthy());
    expect(symbolicate).toHaveBeenCalledWith("d81f4e2", expect.stringContaining("TypeError"), "");
    expect([...document.querySelectorAll(".err-code")].some((n) => n.textContent === "lazyInitializer  node_modules/react/cjs/react.production.min.js:18:381")).toBe(true);
    expect(screen.getByText(/at a\.js:1/)).toBeTruthy(); // original stack uændret
  });
  it("uden source map, uden opsætning eller uden build-id opdigtes intet", async () => {
    const symbolicate = vi.fn().mockResolvedValue({ ok: true, frames: [{ resolved: false }], resolved: 0, total: 1 });
    open({ symbolicate });
    fireEvent.click(screen.getByRole("button", { name: "Vis oprindelig kode" }));
    await waitFor(() => expect(screen.getByText(/Ingen rammer kunne oversættes: der findes intet source map for build d81f4e2/)).toBeTruthy());
    expect(screen.queryByText(/Oprindelig kode/)).toBeNull(); // intet felt med oversatte placeringer
    cleanup();
    const unavailable = vi.fn().mockResolvedValue({ ok: false, reason: "unavailable" });
    open({ symbolicate: unavailable });
    fireEvent.click(screen.getByRole("button", { name: "Vis oprindelig kode" }));
    await waitFor(() => expect(screen.getByText(/Oversættelse er ikke sat op endnu/)).toBeTruthy());
    cleanup();
    render(<ErrorsSection {...base} rows={[{ ...row, app_version: "local" }]} symbolicate={vi.fn()} />);
    fireEvent.click(screen.getByText(/forekomst/).closest("button"));
    fireEvent.click(screen.getByRole("button", { name: "Tekniske oplysninger" }));
    fireEvent.click(screen.getByRole("button", { name: "Vis oprindelig kode" }));
    expect(screen.getByText(/Build-id mangler/)).toBeTruthy();
  });
  it("historikken er kronologisk med registreringen først og viser rettelse og hvem", async () => {
    const loadHistory = vi.fn().mockResolvedValue({ items: [{ id: 9, action: "fejlstatus_aendret", admin_id: "a", created_at: "2026-10-15T12:00:00Z", details: { fra: "open", til: "resolved", rettelse: "Rettet i boot.js", verificeret_build: "d81f4e2" } }], users: { a: { name: "Jan" } } });
    open({ loadHistory });
    fireEvent.click(screen.getByRole("button", { name: "Historik" }));
    await waitFor(() => expect(screen.getByText("Markeret som løst")).toBeTruthy());
    const titles = [...document.querySelectorAll(".err-history-title")].map((n) => n.textContent);
    expect(titles).toEqual(["Fejl registreret", "Markeret som løst"]);
    expect(screen.getByText("Rettelse: Rettet i boot.js")).toBeTruthy();
    expect(screen.getByText("Angivet som verificeret i build d81f4e2")).toBeTruthy();
    expect(screen.getByText(/^Jan · /)).toBeTruthy();
  });
  it("kodefelter: lange værdier får en svag kantmarkering (mere indhold end synligt), og kopiering tager hele indholdet", async () => {
    const sw = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(900);
    const cw = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(300);
    const writeText = vi.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    open();
    await waitFor(() => expect(document.querySelector(".err-code-wrap.more-x")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Kopiér Stacktrace" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("at a.js:1"));
    expect(writeText.mock.calls[0][0]).toContain("TypeError"); // hele stacken, ikke kun det synlige
    sw.mockRestore(); cw.mockRestore();
  });
});
