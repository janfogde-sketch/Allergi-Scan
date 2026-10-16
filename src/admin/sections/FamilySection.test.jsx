// @ts-nocheck
// @vitest-environment jsdom
// Familiesiden: kompakte rækker, afledt status, detaljer, og at fjernelse og tilbagekaldelse kræver en begrundelse før knappen virker.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import FamilySection from "./FamilySection.jsx";

const detail = {
  owner: { id: "o1", name: "Anna", email: "a@x.dk" },
  members: [{ id: "m1", name: "Barn", is_child: true, birth_year: 2018, created_at: "2026-01-02T10:00:00Z" }],
  invites: [
    { id: "i1", status: "pending", created_at: "2026-02-01T10:00:00Z", expires_at: "2026-02-02T10:00:00Z", is_request: false },
    { id: "i2", status: "pending", created_at: "2026-02-01T10:00:00Z", expires_at: "2026-02-02T10:00:00Z", is_request: true },
  ],
};
const base = (o = {}) => ({
  rows: [{ owner_id: "o1", name: "Anna", email: "a@x.dk", profiles: 2, child_profiles: 1, pending_invites: 1 }], total: 1,
  invites: [{ id: "i1", status: "expired", inviter_name: "Anna", created_at: "2026-02-01T10:00:00Z", expires_at: "2026-02-02T10:00:00Z", is_request: false },
    { id: "i2", status: "accepted", inviter_name: "Anna", accepted_by: null, created_at: "2026-02-01T10:00:00Z", accepted_at: "2026-02-01T12:00:00Z", is_request: false }],
  famPhase: "ok", invPhase: "ok", famError: null, invError: null, canAct: true, loadingMore: false, load: vi.fn(), loadMore: vi.fn(),
  getFamily: vi.fn(async () => ({ ok: true, data: detail })), revokeInvite: vi.fn(async () => ({ ok: true })), removeMember: vi.fn(async () => ({ ok: true })), ...o,
});
beforeEach(() => { cleanup(); });

describe("FamilySection", () => {
  it("viser familier som rækker uden allergier og åbner detaljer", async () => {
    render(<FamilySection {...base()} />);
    expect(screen.getByText("Anna")).toBeTruthy();
    expect(screen.getByText(/2 medlemmer · 1 barn · 1 afventer/)).toBeTruthy();
    fireEvent.click(screen.getByText("Anna"));
    await waitFor(() => expect(screen.getByText("Medlemmer (1)")).toBeTruthy());
    expect(screen.getByText(/Børneprofil/)).toBeTruthy();
  });
  it("fjern medlem kræver begrundelse før bekræftelse", async () => {
    const p = base();
    render(<FamilySection {...p} />);
    fireEvent.click(screen.getByText("Anna"));
    await waitFor(() => screen.getByText("Fjern medlem"));
    fireEvent.click(screen.getByText("Fjern medlem"));
    const btn = Array.from(document.querySelectorAll(".fam-reason button")).find((b) => b.textContent === "Fjern medlem");
    expect(btn.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Begrundelse/), { target: { value: "Oprettet ved en fejl" } });
    expect(btn.disabled).toBe(false);
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
  it("invitationsfanen viser afledt status, modtager der ikke er registreret, og filtrerer med bekræftede antal", () => {
    render(<FamilySection {...base()} />);
    fireEvent.click(screen.getByRole("tab", { name: /Invitationer/ }));
    expect(screen.getByText(/modtager ikke registreret/)).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Alle (2)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Afventer (0)" }));
    expect(screen.getByText("Ingen invitationer")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Udløbet (1)" }));
    expect(screen.getByText(/Fra Anna/)).toBeTruthy();
  });
  it("viser aldrig 0, når invitationerne ikke kan hentes: ingen antal, en fejltilstand, og familierne vises stadig", () => {
    render(<FamilySection {...base({ invPhase: "error", invError: { denied: false, unavailable: false }, invites: [] })} />);
    expect(screen.getByRole("tab", { name: "Invitationer" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Familier (1)" })).toBeTruthy();
    expect(screen.getByText("Anna")).toBeTruthy();
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
  it("tomme tilstande: ingen familier og ingen søgeresultater", () => {
    render(<FamilySection {...base({ rows: [], total: 0 })} />);
    expect(screen.getByText("Ingen familier endnu.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Søg" }));
    fireEvent.change(screen.getByLabelText(/Søg i ejer/), { target: { value: "zzz" } });
    expect(screen.getByText("Ingen resultater matcher din søgning.")).toBeTruthy();
  });
  it("søgefeltet er skjult som standard, får fokus ved åbning, kan ryddes, og aktiv søgning vises som mærke", () => {
    const p = base();
    render(<FamilySection {...p} />);
    expect(screen.queryByLabelText(/Søg i ejer/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Søg" }));
    const input = screen.getByLabelText(/Søg i ejer/);
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "Ann" } });
    fireEvent.click(screen.getByRole("button", { name: "Ryd søgning" }));
    expect(screen.getByLabelText(/Søg i ejer/).value).toBe("");
    fireEvent.change(screen.getByLabelText(/Søg i ejer/), { target: { value: "Ann" } });
    fireEvent.click(screen.getByRole("button", { name: "Søg" })); // luk feltet, søgningen består
    expect(screen.getByRole("button", { name: /Søgning: Ann/ })).toBeTruthy();
  });
  it("introduktionsteksten er kort", () => {
    render(<FamilySection {...base()} />);
    expect(screen.getByText("Administrer familier, medlemmer og invitationer.")).toBeTruthy();
  });
  it("uden databasefunktioner er handlinger slået fra, men oplysningerne vises", async () => {
    render(<FamilySection {...base({ canAct: false })} />);
    expect(screen.getAllByText(/Handlinger er slået fra/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText("Anna"));
    await waitFor(() => screen.getByText("Fjern medlem"));
    expect(screen.getByText("Fjern medlem").disabled).toBe(true);
    expect(screen.getByText("Tilbagekald").disabled).toBe(true);
  });
});
