// @ts-nocheck
// @vitest-environment jsdom
// Tickets: kompakte klikbare kort, filtre og søgning, detaljer med fast handlingsbjælke, løsning kræver kommentar, genåbning, ansvarlig, prioritet, lanceringsblokering,
// tjekliste med fremdrift, kommentarer, kopiér prompt (ændrer aldrig status), menuens placering og at interne opgaver ikke vises som Anonym.
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor, act } from "@testing-library/react";

vi.mock("../../SharedComponents.jsx", async (orig) => ({ ...(await orig()), showToast: vi.fn() }));
import { showToast } from "../../SharedComponents.jsx";
import TicketsSection from "./TicketsSection.jsx";
import ActionsMenu, { menuPosition } from "../ActionsMenu.jsx";

afterEach(cleanup);
beforeEach(() => { try { sessionStorage.clear(); } catch { /* ingen */ } showToast.mockReset(); });

const T = (o = {}) => ({ id: "t1", type: "bug", description: "Menuen åbner uden for skærmen. Den vises delvist til venstre på mobil.", status: "open", created_at: "2026-10-10T10:00:00Z", submitted_by: "u1", context: { screen_label: "Tickets", user_email: "bruger@example.com", allergens: ["mælk"] }, ...o });
const INTERNAL = T({ id: "t2", submitted_by: null, type: "content", description: "[Privatlivspolitik · IKKE FÆRDIG] Teksten mangler afsnit.", context: { source: "claude-session 30-09-2026", kind: "opgave", priority: "høj" } });

function makeWork(over = {}) {
  const w = {
    meta: {}, tasks: {}, todos: { t1: { id: "td1", assignee_id: null, updated_at: "2026-10-10T10:00:00Z" } }, admins: [{ id: "jan", name: "Jan" }, { id: "bjorn", name: "Bjørn" }], available: true,
    nameOf: (id) => ({ jan: "Jan", bjorn: "Bjørn" }[id] || "Ingen"), load: vi.fn(),
    loadDetail: vi.fn(async () => ({ ok: true, metaLog: [], todoActivity: [], comments: [], tasks: [] })),
    saveMeta: vi.fn(async () => ({ ok: true })), addTask: vi.fn(async () => ({ ok: true })), setTaskStatus: vi.fn(async () => ({ ok: true })), removeTask: vi.fn(async () => ({ ok: true })),
    assign: vi.fn(async () => ({ ok: true })), addComment: vi.fn(async () => ({ ok: true })), ...over,
  };
  return w;
}
function mount(over = {}, tickets = [T(), INTERNAL], extra = {}) {
  const props = { adminTickets: tickets, ticketsLoading: false, adminTicketFilter: "active", setAdminTicketFilter: vi.fn(), ticketsIncludeDone: true, loadTickets: vi.fn(), openTicket: null, setOpenTicket: vi.fn(), updateTicketStatus: vi.fn(), getTicketScreenshotUrl: vi.fn(), work: makeWork(over), ...extra };
  const r = render(<TicketsSection {...props} />);
  return { props, ...r };
}

describe("Tickets: oversigt", () => {
  it("kompakte kort uden separate knapper, interne opgaver som 'Intern opgave' og prioritet/mulig blokering synlig", () => {
    mount();
    const card = screen.getByText(/Menuen åbner uden for skærmen/).closest("button");
    expect(card.textContent).toContain("Brugerindsendelse");
    expect(card.textContent).toContain("Ikke tildelt");
    expect(card.querySelectorAll("button, select").length).toBe(0);
    const internal = screen.getByText(/Privatlivspolitik · IKKE FÆRDIG/).closest("button");
    expect(internal.textContent).toContain("Intern opgave");
    expect(internal.textContent).not.toContain("Anonym");
    expect(internal.textContent).toContain("Høj");
    expect(internal.textContent).toContain("Mulig lanceringsblokering");
  });
  it("hele kortet åbner ticketten", () => {
    const { props } = mount();
    fireEvent.click(screen.getByText(/Menuen åbner uden for skærmen/).closest("button"));
    expect(props.setOpenTicket).toHaveBeenCalledWith(expect.objectContaining({ id: "t1" }));
  });
  it("søgning og filtre indsnævrer listen; tom tilstand med Nulstil; filtre huskes", () => {
    mount();
    fireEvent.change(screen.getByLabelText("Søg i titel og beskrivelse"), { target: { value: "afsnit" } });
    expect(screen.queryByText(/Menuen åbner/)).toBeNull();
    expect(screen.getByText(/Privatlivspolitik/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Søg i titel og beskrivelse"), { target: { value: "findes-ikke" } });
    expect(screen.getByText("Ingen tickets matcher")).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem("eatsafe.ticketFilters")).q).toBe("findes-ikke");
    fireEvent.click(screen.getAllByRole("button", { name: "Nulstil" })[0]);
    expect(screen.getByText(/Menuen åbner/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Prioritet"), { target: { value: "high" } });
    expect(screen.queryByText(/Menuen åbner/)).toBeNull();
    fireEvent.change(screen.getByLabelText("Prioritet"), { target: { value: "" } });
    fireEvent.click(screen.getByLabelText("Kun lanceringsblokerende"));
    expect(screen.getByText("Ingen tickets matcher")).toBeTruthy();
  });
  it("tællere pr. status og statusvalg", () => {
    const { props } = mount();
    expect(screen.getByRole("button", { name: /Aktive \(2\)/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "resolved" } });
    expect(props.setAdminTicketFilter).toHaveBeenCalledWith("resolved");
  });
  it("tom liste og indlæsning", () => {
    mount({}, []);
    expect(screen.getByText("Ingen tickets her")).toBeTruthy();
    cleanup();
    render(<TicketsSection {...{ adminTickets: [], ticketsLoading: true, adminTicketFilter: "active", setAdminTicketFilter: vi.fn(), ticketsIncludeDone: true, loadTickets: vi.fn(), openTicket: null, setOpenTicket: vi.fn(), updateTicketStatus: vi.fn(), work: makeWork() }} />);
    expect(screen.getByText("Henter tickets…")).toBeTruthy();
  });
});

describe("Tickets: detaljer", () => {
  const open = (over = {}, ticket = T(), extra = {}) => { mount(over, [ticket], { openTicket: ticket, ...extra }); return screen.getByRole("dialog"); };

  it("fast overskrift og handlingsbjælke; beskrivelsen bevarer linjeskift; tekniske oplysninger er foldet", async () => {
    const d = open({}, T({ description: "Titel her er lang nok til en sætning.\n\n## Trin\n1. Åbn menuen\n2. Tryk" }));
    expect(d.querySelector(".todo-panel-head")).toBeTruthy();
    expect(d.querySelector(".todo-panel-foot")).toBeTruthy();
    expect(within(d).getByText("Trin").tagName).toBe("H3");
    expect([...d.querySelectorAll(".tk-desc-p")].at(-1).textContent).toContain("1. Åbn menuen\n2. Tryk");
    expect(within(d).getByRole("button", { name: "Kopiér prompt" })).toBeTruthy();
    expect(within(d).queryByText("bruger@example.com")).toBeNull(); // kun under tekniske oplysninger (foldet)
  });
  it("kopiér prompt kopierer og ændrer aldrig status", async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    const { props } = mount({}, [T()], { openTicket: T() });
    await act(async () => { fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Kopiér prompt" })); });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).not.toContain("bruger@example.com");
    expect(writeText.mock.calls[0][0]).toContain("## Acceptkriterier");
    expect(props.updateTicketStatus).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Prompt kopieret", "success");
  });
  it("kopiering der fejler vises som fejl", async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn(async () => { throw new Error("blokeret"); }) } });
    open();
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Kopiér prompt" })); });
    expect(showToast).toHaveBeenCalledWith("Kunne ikke kopiere: blokeret", "error");
  });
  it("løst kræver en afsluttende kommentar; status ændres først ved bekræftelse", async () => {
    const { props } = mount({}, [T()], { openTicket: T() });
    const d = screen.getByRole("dialog");
    fireEvent.change(within(d).getByLabelText("Status"), { target: { value: "resolved" } });
    expect(props.updateTicketStatus).not.toHaveBeenCalled();
    const btn = within(d).getByRole("button", { name: "Markér som løst" });
    expect(btn.disabled).toBe(true);
    fireEvent.change(within(d).getByLabelText(/Afsluttende kommentar/), { target: { value: "Rettet i version 12." } });
    fireEvent.change(within(d).getByLabelText(/Hvordan er løsningen testet/), { target: { value: "Prøvet på iPhone SE." } });
    await act(async () => { fireEvent.click(btn); });
    expect(props.updateTicketStatus).toHaveBeenCalledWith("t1", "resolved", "Rettet i version 12.");
  });
  it("løst ticket kan genåbnes", () => {
    const { props } = mount({}, [T({ status: "resolved" })], { openTicket: T({ status: "resolved" }) });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Genåbn" }));
    expect(props.updateTicketStatus).toHaveBeenCalledWith("t1", "open", undefined);
  });
  it("tildeling, prioritet og lanceringsblokering gemmes hver for sig (blokering er ikke prioritet)", async () => {
    const work = makeWork();
    mount({}, [T()], { openTicket: T(), work });
    const d = screen.getByRole("dialog");
    await act(async () => { fireEvent.change(within(d).getByLabelText("Ansvarlig"), { target: { value: "bjorn" } }); });
    expect(work.assign).toHaveBeenCalledWith("t1", "bjorn");
    await act(async () => { fireEvent.change(within(d).getByLabelText("Prioritet"), { target: { value: "critical" } }); });
    expect(work.saveMeta).toHaveBeenCalledWith("t1", { priority: "critical" });
    await act(async () => { fireEvent.click(within(d).getByLabelText("Lanceringsblokerende")); });
    expect(work.saveMeta).toHaveBeenLastCalledWith("t1", { launch_blocking: true });
  });
  it("uafsluttet juridisk ticket foreslås gennemgået som mulig blokering, men markeres ikke automatisk", () => {
    const work = makeWork({ todos: { t2: { id: "td2" } } });
    mount({}, [INTERNAL], { openTicket: INTERNAL, work });
    expect(screen.getByText(/gennemgå, om denne ticket skal blokere lanceringen/)).toBeTruthy();
    expect(screen.getByLabelText("Lanceringsblokerende").checked).toBe(false);
    expect(work.saveMeta).not.toHaveBeenCalled();
  });
  it("tjekliste: fremdrift, tilføj, skift status; afsluttet tjekliste godkender ikke noget", async () => {
    const work = makeWork({ tasks: { t1: [{ id: "k1", title: "Tjek iPhone", status: "done" }, { id: "k2", title: "Tjek Android", status: "todo" }] } });
    mount({}, [T()], { openTicket: T(), work });
    const d = screen.getByRole("dialog");
    expect(within(d).getByText(/1 af 2 punkter afsluttet/)).toBeTruthy();
    await act(async () => { fireEvent.change(within(d).getByLabelText("Status for Tjek Android"), { target: { value: "done" } }); });
    expect(work.setTaskStatus).toHaveBeenCalledWith("t1", "k2", "done");
    fireEvent.change(within(d).getByLabelText("Ny delopgave"), { target: { value: "Tjek desktop" } });
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Tilføj" })); });
    expect(work.addTask).toHaveBeenCalledWith("t1", "Tjek desktop", 2);
    expect(work.saveMeta).not.toHaveBeenCalled(); // ingen automatisk verificering
    expect(within(d).queryByText(/ikke en faglig eller juridisk godkendelse/)).toBeNull(); // forklaringen ligger bag infoknappen
    fireEvent.click(within(d).getByRole("button", { name: /Hvad betyder de fire felter/ }));
    expect(within(d).getByText(/ikke en faglig eller juridisk godkendelse/)).toBeTruthy();
  });
  it("tjekliste: afkrydsning markerer en delopgave som udført i ét tryk, og en tom liste viser en tomtilstand", async () => {
    const work = makeWork({ tasks: { t1: [{ id: "k2", title: "Tjek Android", status: "todo" }] } });
    const d = open({}, T(), { work });
    await act(async () => { fireEvent.click(within(d).getByLabelText("Afsluttet: Tjek Android")); });
    expect(work.setTaskStatus).toHaveBeenCalledWith("t1", "k2", "done");
    cleanup();
    const d2 = open({ tasks: {} });
    expect(within(d2).getByText("Ingen delopgaver endnu.")).toBeTruthy();
  });
  it("en fejlet gemning rydder hverken kommentar eller delopgave, og tom/mellemrums-tekst kan ikke sendes", async () => {
    const work = makeWork({ addComment: vi.fn(async () => ({ ok: false })), addTask: vi.fn(async () => ({ ok: false })), tasks: {} });
    const d = open({}, T(), { work });
    const send = within(d).getByRole("button", { name: "Send" });
    fireEvent.change(within(d).getByLabelText("Ny kommentar"), { target: { value: "   " } });
    expect(send.disabled).toBe(true);
    fireEvent.change(within(d).getByLabelText("Ny kommentar"), { target: { value: "Vigtig note" } });
    await act(async () => { fireEvent.click(send); });
    expect(within(d).getByLabelText("Ny kommentar").value).toBe("Vigtig note");
    fireEvent.change(within(d).getByLabelText("Ny delopgave"), { target: { value: "Ny ting" } });
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Tilføj" })); });
    expect(within(d).getByLabelText("Ny delopgave").value).toBe("Ny ting");
  });
  it("modstridende verificering advarer uden at fjerne markeringer", () => {
    const work = makeWork({ meta: { t1: { priority: "normal", tested_at: "2026-10-10T10:00:00Z" } } });
    const d = open({}, T(), { work });
    expect(within(d).getByText(/Testet er markeret, men ikke Implementeret/)).toBeTruthy();
    expect(within(d).getByLabelText(/^Testet/).checked).toBe(true);
    expect(work.saveMeta).not.toHaveBeenCalled();
  });
  it("verificering: implementeret og testet er adskilte, og løst + krævet gennemgang uden udført gennemgang advares", async () => {
    const work = makeWork({ meta: { t1: { priority: "normal", requires_review: true, launch_blocking: true } } });
    const t = T({ status: "resolved" });
    mount({}, [t], { openTicket: t, work });
    const d = screen.getByRole("dialog");
    expect(within(d).getByText(/den krævede gennemgang er ikke registreret som udført/)).toBeTruthy();
    expect(within(d).getByText(/ikke registreret som testet/)).toBeTruthy();
    await act(async () => { fireEvent.click(within(d).getByLabelText("Testet")); });
    expect(work.saveMeta).toHaveBeenCalledWith("t1", { tested_at: expect.any(String) });
  });
  it("aktivitet og kommentarer vises, og en kommentar kan tilføjes", async () => {
    const work = makeWork({ loadDetail: vi.fn(async () => ({ ok: true, metaLog: [{ id: 1, created_at: "2026-10-11T10:00:00Z", changed_by: "jan", field: "priority", old_value: "normal", new_value: "critical" }], todoActivity: [{ id: 2, created_at: "2026-10-12T10:00:00Z", changed_by: "bjorn", via: "admin", field: "status", old_value: "done", new_value: "todo" }], comments: [{ id: "c1", created_at: "2026-10-13T10:00:00Z", author_id: "jan", body: "Ser vi på i morgen" }], tasks: [] })) });
    mount({}, [T()], { openTicket: T(), work });
    const d = screen.getByRole("dialog");
    expect(await within(d).findByText(/Prioritet: Normal → Kritisk/)).toBeTruthy();
    expect(within(d).getByText(/Genåbnet/)).toBeTruthy();
    expect(within(d).getByText(/Ser vi på i morgen/)).toBeTruthy();
    fireEvent.change(within(d).getByLabelText("Ny kommentar"), { target: { value: "Nyt svar" } });
    await act(async () => { fireEvent.click(within(d).getByRole("button", { name: "Send" })); });
    expect(work.addComment).toHaveBeenCalledWith("t1", "Nyt svar");
  });
  it("fejl ved gemning vises, og fejl ved aktivitet er ikke en tom aktivitet", async () => {
    const work = makeWork({ saveMeta: vi.fn(async () => ({ ok: false })), loadDetail: vi.fn(async () => ({ ok: false, metaLog: [], todoActivity: [], comments: [], tasks: [] })) });
    mount({}, [T()], { openTicket: T(), work });
    const d = screen.getByRole("dialog");
    expect(await within(d).findByText(/Aktiviteten kunne ikke hentes helt/)).toBeTruthy();
    await act(async () => { fireEvent.change(within(d).getByLabelText("Prioritet"), { target: { value: "high" } }); });
    expect(await within(d).findByText(/Ændringen kunne ikke gemmes/)).toBeTruthy();
  });
  it("før databaseopdateringen er de nye felter slået fra med forklaring, og siden virker som før", () => {
    const work = makeWork({ available: false });
    mount({}, [T()], { openTicket: T(), work });
    const d = screen.getByRole("dialog");
    expect(within(d).getByLabelText("Prioritet").disabled).toBe(true);
    expect(within(d).getByText(/kan sættes, når den seneste databaseopdatering er udgivet/)).toBeTruthy();
    expect(within(d).queryByText("Tjekliste")).toBeNull();
  });
});

describe("Flere handlinger", () => {
  it("menuen placeres helt inden for skærmen, også når knappen er yderst til venstre eller højre", () => {
    const vw = 360, vh = 640;
    const left = menuPosition({ left: 8, right: 100, top: 100, bottom: 140 }, vw, vh, 120);
    expect(left.left).toBeGreaterThanOrEqual(12);
    expect(left.left + left.width).toBeLessThanOrEqual(vw - 12);
    const right = menuPosition({ left: 280, right: 352, top: 100, bottom: 140 }, vw, vh, 120);
    expect(right.left + right.width).toBeLessThanOrEqual(vw - 12);
    const bottom = menuPosition({ left: 100, right: 160, top: 600, bottom: 636 }, vw, vh, 160);
    expect(bottom.top + 160).toBeLessThanOrEqual(vh - 12); // vendes opad
    expect(menuPosition({ left: 0, right: 20, top: 0, bottom: 20 }, 300, 400, 100).width).toBeLessThanOrEqual(276);
  });
  it("åbner og lukkes ved tryk udenfor og med Escape, og handlingen virker", () => {
    const onClick = vi.fn();
    render(<ActionsMenu items={[{ label: "Kopiér åbne som prompts (1)", onClick }]} />);
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Kopiér åbne/ }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
  });
  it("tickets-menuen kopierer alle åbne som adskilte prompts", async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, { clipboard: { writeText } });
    mount({}, [T(), T({ id: "t9", description: "Anden fejl i kodebasen her. Mere." })]);
    fireEvent.click(screen.getByRole("button", { name: /Flere handlinger/ }));
    await act(async () => { fireEvent.click(screen.getByRole("menuitem", { name: /Kopiér åbne som prompts \(2\)/ })); });
    const text = writeText.mock.calls[0][0];
    expect(text).toContain("Ticket 1 af 2");
    expect(text).toContain("Ticket 2 af 2");
  });
});
