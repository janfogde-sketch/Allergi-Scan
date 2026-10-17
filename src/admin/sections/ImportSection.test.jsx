// @ts-nocheck
// @vitest-environment jsdom
// Dataimport: tre områder, status ud fra kørselsloggen (aldrig opdigtet), fundet vs. importeret, manglende tal som "–", beskyttelse mod dobbeltklik, 409 ved samtidig kørsel,
// fejl er aldrig en tom liste, og tekniske detaljer ligger i kørslens detaljer.
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor, act } from "@testing-library/react";

vi.mock("../../helpers.js", async (orig) => ({ ...(await orig()), apiCall: vi.fn(), makeHeaders: () => ({}) }));
import { apiCall } from "../../helpers.js";
import ImportSection from "./ImportSection.jsx";
import { useAdminImport } from "../useAdminImport.js";
import { nextRun, fmtLocal, jobStatus, countTiles, runSummary } from "../importLogic.js";

afterEach(cleanup);
beforeEach(() => { apiCall.mockReset(); });
const RUN = (o = {}) => ({ id: "r1", job: "off_import", trigger: "cron", started_at: "2026-10-16T02:00:00Z", finished_at: "2026-10-16T02:01:10Z", status: "ok", counts: { attempted: 50, found: 12, imported: 9, already_exists: 3, not_on_off: 36, error: 2 }, error_code: null, log: ["✓ Testkiks (5701234567899)"], ...o });

function Harness() {
  const imp = useAdminImport("tok");
  React.useEffect(() => { imp.load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return <ImportSection imp={imp} />;
}
const routes = ({ runs = [RUN()], overview = [{ pending_eans: 4, pending_reanalyze: 10, pending_reanalyze_manual: 30 }], ...over } = {}) => {
  apiCall.mockImplementation(async (url, opts = {}) => {
    for (const [k, fn] of Object.entries(over)) if (url.includes(k)) return fn(url, opts);
    if (url.includes("rest/v1/import_runs")) return runs;
    if (url.includes("rpc/admin_import_overview")) return overview;
    return {};
  });
};

describe("Dataimport: logik", () => {
  it("planlagte kørsler vises i dansk tid, også ved sommer- og vintertid", () => {
    expect(fmtLocal("2026-07-01T02:00:00Z")).toMatch(/04\.00|04:00/); // sommertid, UTC+2
    expect(fmtLocal("2026-12-01T02:00:00Z")).toMatch(/03\.00|03:00/); // vintertid, UTC+1
    expect(nextRun(2, new Date("2026-10-16T01:00:00Z")).toISOString()).toBe("2026-10-16T02:00:00.000Z");
    expect(nextRun(2, new Date("2026-10-16T03:00:00Z")).toISOString()).toBe("2026-10-17T02:00:00.000Z");
  });
  it("status afledes af seneste kørsel; ingen kørsler = Klar; manglende tal er null", () => {
    expect(jobStatus([], "off_import").status).toBe("idle");
    expect(jobStatus([RUN({ status: "partial" })], "off_import").status).toBe("partial");
    expect(jobStatus([RUN({ job: "reanalyze", status: "running" }), RUN()], "reanalyze").status).toBe("running");
    expect(countTiles("off_import", {}).every(([, v]) => v === null)).toBe(true);
    expect(runSummary(RUN({ counts: { nothing_to_do: 1 } }))).toBe("Ingen kvalificerede manglende stregkoder");
  });
});

describe("Dataimport: side", () => {
  it("viser overblik, to kørselstyper med danske knapper og seneste kørsler; fundet og importeret er adskilt", async () => {
    routes();
    render(<Harness />);
    expect(await screen.findByRole("region", { name: "Overblik" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kør import" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kør genanalyse" })).toBeTruthy();
    const card = screen.getByRole("region", { name: "Produktimport fra Open Food Facts" });
    expect(within(card).getByText("Fundet").previousSibling.textContent).toBe("12");
    expect(within(card).getByText("Importeret").previousSibling.textContent).toBe("9");
    expect(within(card).getByText("Gennemført")).toBeTruthy();
    expect(screen.queryByText(/missing_ean_log/)).toBeNull();
    expect(screen.queryByText(/reparsing/i)).toBeNull();
    expect(screen.getByRole("region", { name: "Overblik" }).textContent).toMatch(/Til manuel gennemgang/);
  });
  it("manglende tal vises som '–', ikke 0, og uden kørsler står der Klar", async () => {
    routes({ runs: [], overview: [] });
    render(<Harness />);
    await screen.findByRole("region", { name: "Overblik" });
    expect(screen.getAllByText("Klar").length).toBe(2);
    expect(screen.getAllByText("–").length).toBeGreaterThan(0);
  });
  it("dobbeltklik på Kør import starter kun én kørsel, og knappen er slået fra mens den kører", async () => {
    let resolve;
    const post = vi.fn(() => new Promise((r) => { resolve = r; }));
    routes({ "functions/v1/auto-import-off": post });
    render(<Harness />);
    const btn = await screen.findByRole("button", { name: "Kør import" });
    fireEvent.click(btn); fireEvent.click(btn);
    expect(post).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Importerer…" }).disabled).toBe(true);
    await act(async () => { resolve({ ok: true }); });
    await waitFor(() => expect(screen.getByRole("button", { name: "Kør import" }).disabled).toBe(false));
  });
  it("genanalyse sendes som manuel kørsel med grænsen 25", async () => {
    const post = vi.fn(async () => ({}));
    routes({ "functions/v1/auto-reparse": post });
    render(<Harness />);
    await act(async () => { fireEvent.click(await screen.findByRole("button", { name: "Kør genanalyse" })); });
    expect(JSON.parse(post.mock.calls[0][1].body)).toEqual({ manual: true, limit: 25 });
  });
  it("409 (en anden kørsel er i gang) og netværksfejl vises forståeligt, ikke som succes", async () => {
    routes({ "functions/v1/auto-import-off": () => { throw Object.assign(new Error("x"), { status: 409 }); }, "functions/v1/auto-reparse": () => { throw new Error("net"); } });
    render(<Harness />);
    await act(async () => { fireEvent.click(await screen.findByRole("button", { name: "Kør import" })); });
    expect(await screen.findByText(/Der kører allerede en kørsel/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Kør genanalyse" })); });
    expect(await screen.findByText(/kunne ikke gennemføres eller svaret udeblev/)).toBeTruthy();
    expect(screen.queryByText(/Kørslen er afsluttet/)).toBeNull();
  });
  it("delvis og fejlet kørsel vises med rigtig status, og detaljer åbnes med forståelig fejl og foldede tekniske oplysninger", async () => {
    routes({ runs: [RUN({ id: "a", status: "partial" }), RUN({ id: "b", status: "failed", error_code: "afbrudt", counts: {} })] });
    render(<Harness />);
    const list = await screen.findByRole("region", { name: "Seneste kørsler" });
    expect(within(list).getByText("Delvist gennemført")).toBeTruthy();
    expect(within(list).getByText("Fejlet")).toBeTruthy();
    fireEvent.click(within(list).getByText("Fejlet").closest("button"));
    const d = await screen.findByRole("dialog");
    expect(within(d).getByText(/Kørslen blev afbrudt/)).toBeTruthy();
    expect(within(d).getByText("Tekniske oplysninger")).toBeTruthy();
  });
  it("fejl ved indlæsning er en fejltilstand, aldrig en tom side; manglende tabel forklares", async () => {
    apiCall.mockImplementation(async () => { throw Object.assign(new Error("net"), { status: 500 }); });
    render(<Harness />);
    expect(await screen.findByText("Kunne ikke hente kørsler")).toBeTruthy();
    cleanup(); apiCall.mockReset();
    apiCall.mockImplementation(async () => { throw Object.assign(new Error("x"), { status: 404, body: "42P01" }); });
    render(<Harness />);
    expect(await screen.findByText("Kørselsloggen er endnu ikke tilgængelig")).toBeTruthy();
  });
});
