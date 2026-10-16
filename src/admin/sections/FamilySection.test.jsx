// @ts-nocheck
// @vitest-environment jsdom
// Familiesiden: kompakte rækker, afledt status, detaljer, og at fjernelse og tilbagekaldelse kræver en begrundelse før knappen virker.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import FamilySection from "./FamilySection.jsx";

const detail = {
  owner: { id: "o1", name: "Anna", email: "a@x.dk" },
  members: [
    { id: "m1", name: "Emma", type: "child", birth_year: 2019, created_at: "2026-01-02T10:00:00Z" },
    { id: "acc-b", name: "Bo", type: "adult", birth_year: null, created_at: "2026-01-03T10:00:00Z" },
    { id: "m3", name: "Rest", type: "unknown", birth_year: null, created_at: "2026-01-04T10:00:00Z" },
  ],
  invites: [
    { id: "i1", status: "pending", kind: "email", created_at: "2026-02-01T10:00:00Z", expires_at: "2026-02-02T10:00:00Z", is_request: false },
    { id: "i2", status: "pending", kind: "link", created_at: "2026-02-01T10:00:00Z", expires_at: "2026-02-02T10:00:00Z", is_request: true },
  ],
};
const base = (o = {}) => ({
  rows: [{ owner_id: "o1", name: "Anna", email: "a@x.dk", profiles: 1, connected: 1, pending_invites: 1 }], total: 1,
  invites: [
    { id: "i1", status: "expired", kind: "email", inviter_name: "Anna", created_at: "2026-02-01T10:00:00Z", expires_at: "2026-02-02T10:00:00Z", is_request: false },
    { id: "i2", status: "accepted", kind: "email", inviter_name: "Anna", accepted_by: null, created_at: "2026-02-01T10:00:00Z", accepted_at: "2026-02-01T12:00:00Z", expires_at: "2026-02-02T10:00:00Z", is_request: false },
    { id: "i3", status: "revoked", kind: "link", inviter_name: "Anna", created_at: "2026-02-03T10:00:00Z", expires_at: "2026-02-04T10:00:00Z", is_request: false },
  ],
  famPhase: "ok", invPhase: "ok", famError: null, invError: null, canAct: true, loadingMore: false, load: vi.fn(), loadMore: vi.fn(), q: "", setQ: vi.fn(),
  getFamily: vi.fn(async () => ({ ok: true, data: detail })), revokeInvite: vi.fn(async () => ({ ok: true })), removeMember: vi.fn(async () => ({ ok: true })), ...o,
});
beforeEach(() => { cleanup(); });

describe("FamilySection", () => {
  it("familien viser medlemsantal uden ejeren (profiler + forbundne voksne) og åbner detaljer med korrekte medlemstyper", async () => {
    render(<FamilySection {...base()} />);
    expect(screen.getByText(/2 familiemedlemmer · 1 invitation afventer/)).toBeTruthy();
    fireEvent.click(screen.getByText("Anna"));
    await waitFor(() => expect(screen.getByText("Familiemedlemmer (3)")).toBeTruthy());
    const emma = screen.getByText(/^Emma/).closest(".fam-line");
    expect(emma.textContent).toMatch(/Emma \(\d+ år\)/);
    expect(emma.textContent).toMatch(/Børneprofil/);
    expect(emma.textContent).not.toMatch(/Voksen med egen konto/);
    expect(screen.getByText("Bo").closest(".fam-line").textContent).toMatch(/Voksen med egen konto/);
    expect(screen.getByText("Rest").closest(".fam-line").textContent).toMatch(/Medlemstype ukendt/);
    expect(screen.getByText("Familieejer")).toBeTruthy();
  });
  it("fjern profil kræver begrundelse, og voksne forbundne konti kan ikke fjernes herfra", async () => {
    const p = base();
    render(<FamilySection {...p} />);
    fireEvent.click(screen.getByText("Anna"));
    await waitFor(() => screen.getAllByText("Fjern profil"));
    expect(screen.getAllByText("Fjern profil")).toHaveLength(2); // Emma og den ukendte, ikke Bo
    fireEvent.click(screen.getAllByText("Fjern profil")[0]);
    const btn = Array.from(document.querySelectorAll(".fam-reason button")).find((b) => b.textContent === "Fjern profil");
    expect(btn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Begrundelse/), { target: { value: "Oprettet ved en fejl" } });
    fireEvent.click(btn);
    await waitFor(() => expect(p.removeMember).toHaveBeenCalledWith("m1", "Oprettet ved en fejl"));
  });
  it("forespørgsler om forbindelse har ingen tilbagekaldeknap; almindelige ventende har", async () => {
    render(<FamilySection {...base()} />);
    fireEvent.click(screen.getByText("Anna"));
    await waitFor(() => screen.getByText("Invitationer (2)"));
    expect(screen.getAllByText("Tilbagekald")).toHaveLength(1);
    expect(screen.getByText(/Forespørgsel om forbindelse/)).toBeTruthy();
  });
  it("invitationsfanen: alle fem statusser kan vælges, antal stemmer, og kort åbner en detalje med chevron", async () => {
    const p = base();
    render(<FamilySection {...p} />);
    fireEvent.click(screen.getByRole("tab", { name: /Invitationer/ }));
    for (const n of ["Alle (3)", "Afventer (0)", "Accepteret (1)", "Udløbet (1)", "Tilbagekaldt (1)"]) expect(screen.getByRole("tab", { name: n })).toBeTruthy();
    expect(document.querySelectorAll(".admin-item-card .audit-card-chev")).toHaveLength(3);
    fireEvent.click(screen.getByRole("tab", { name: "Tilbagekaldt (1)" }));
    expect(screen.getAllByText("Tilbagekaldt").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Fra Anna/)).toHaveLength(1);
    fireEvent.click(screen.getByRole("tab", { name: "Accepteret (1)" }));
    expect(screen.getByText(/Modtager ikke registreret/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Fra Anna/).closest("button"));
    const dlg = screen.getByRole("dialog");
    expect(dlg.textContent).toMatch(/Modtageren blev ikke gemt ved accepten, eller kontoen er siden slettet/);
    expect(dlg.textContent).not.toMatch(/80a69be7/);
    fireEvent.click(screen.getByRole("button", { name: "Tekniske oplysninger" }));
    expect(screen.getByText("i2")).toBeTruthy();
  });
  it("invitationsdetaljen kan tilbagekalde en ventende invitation med begrundelse", async () => {
    const p = base({ invites: [{ id: "i9", status: "pending", kind: "email", inviter_name: "Anna", created_at: "2026-02-01T10:00:00Z", expires_at: "2099-02-02T10:00:00Z", is_request: false }] });
    render(<FamilySection {...p} />);
    fireEvent.click(screen.getByRole("tab", { name: /Invitationer/ }));
    fireEvent.click(screen.getByText(/Fra Anna/).closest("button"));
    fireEvent.click(screen.getByRole("button", { name: "Tilbagekald invitation" }));
    const btn = Array.from(document.querySelectorAll(".fam-reason button")).find((b) => b.textContent === "Tilbagekald");
    expect(btn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Begrundelse/), { target: { value: "Bad om det" } });
    fireEvent.click(btn);
    await waitFor(() => expect(p.revokeInvite).toHaveBeenCalledWith("i9", "Bad om det"));
  });
  it("viser aldrig 0, når invitationerne ikke kan hentes: ingen antal, en fejltilstand, og familierne vises stadig", () => {
    render(<FamilySection {...base({ invPhase: "error", invError: { denied: false, unavailable: false }, invites: [] })} />);
    expect(screen.getByRole("tab", { name: "Invitationer" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Familier (1)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Invitationer" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Kunne ikke hente oplysninger/);
    expect(screen.queryByRole("tab", { name: /\(0\)/ })).toBeNull();
  });
  it("fejltilstandene har de aftalte tekster", () => {
    const cases = [[{ unavailable: true }, /ikke tilgængelig endnu.*databaseopdatering mangler/], [{ denied: true }, /Du har ikke adgang til disse oplysninger/], [{}, /Kunne ikke hente oplysninger.*Prøv at opdatere siden/]];
    for (const [err, text] of cases) {
      cleanup();
      render(<FamilySection {...base({ rows: [], total: null, famPhase: "error", famError: { denied: false, unavailable: false, ...err } })} />);
      expect(screen.getByRole("alert").textContent).toMatch(text);
    }
  });
  it("tomme tilstande er korte: ingen familier, ingen søgeresultater og ingen invitationer i detaljen", async () => {
    render(<FamilySection {...base({ rows: [], total: 0 })} />);
    expect(screen.getByText("Ingen familier endnu.")).toBeTruthy();
    cleanup();
    render(<FamilySection {...base({ rows: [], total: 0, q: "zzz" })} />);
    expect(screen.getByText("Ingen resultater matcher din søgning.")).toBeTruthy();
    cleanup();
    render(<FamilySection {...base({ getFamily: vi.fn(async () => ({ ok: true, data: { ...detail, invites: [] } })) })} />);
    fireEvent.click(screen.getByText("Anna"));
    await waitFor(() => screen.getByText("Invitationer (0)"));
    expect(screen.getByText("Ingen invitationer knyttet til familien.")).toBeTruthy();
  });
  it("ingen egen søge-knap: søgningen styres fra headerens ikon, og aktiv søgning vises som mærke der kan fjernes", () => {
    const p = base({ q: "Ann" });
    render(<FamilySection {...p} />);
    expect(screen.queryByRole("button", { name: "Søg" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Søgning: Ann/ }));
    expect(p.setQ).toHaveBeenCalledWith("");
  });
  it("introduktionsteksten er kort", () => {
    render(<FamilySection {...base()} />);
    expect(screen.getByText("Administrer familier, medlemmer og invitationer.")).toBeTruthy();
  });
  it("uden databasefunktioner: én kort besked med foldbar forklaring, og handlinger er slået fra uden gentagelse i detaljen", async () => {
    render(<FamilySection {...base({ canAct: false })} />);
    expect(screen.getAllByText(/Administrative ændringer er midlertidigt utilgængelige/)).toHaveLength(1);
    expect(screen.queryByText(/databaseopdatering, som endnu ikke er udgivet/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hvorfor?" }));
    expect(screen.getByText(/databaseopdatering, som endnu ikke er udgivet/)).toBeTruthy();
    fireEvent.click(screen.getByText("Anna"));
    await waitFor(() => screen.getAllByText("Fjern profil"));
    expect(screen.getAllByText("Fjern profil")[0].disabled).toBe(true);
    expect(screen.getAllByText(/Administrative ændringer er midlertidigt utilgængelige/)).toHaveLength(1);
  });
});
