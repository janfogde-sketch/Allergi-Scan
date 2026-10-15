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
const base = () => ({
  rows: [{ owner_id: "o1", name: "Anna", email: "a@x.dk", profiles: 2, child_profiles: 1, pending_invites: 1 }], total: 1,
  invites: [{ id: "i1", status: "expired", inviter_name: "Anna", created_at: "2026-02-01T10:00:00Z", expires_at: "2026-02-02T10:00:00Z", is_request: false }],
  loading: false, loadingMore: false, loaded: true, error: null, load: vi.fn(), loadMore: vi.fn(),
  getFamily: vi.fn(async () => ({ ok: true, data: detail })), revokeInvite: vi.fn(async () => ({ ok: true })), removeMember: vi.fn(async () => ({ ok: true })),
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
    await waitFor(() => screen.getByText("Fjern"));
    fireEvent.click(screen.getByText("Fjern"));
    const btn = screen.getByRole("button", { name: "Fjern medlem" });
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
  it("invitationsfanen viser afledt status og filtrerer", () => {
    render(<FamilySection {...base()} />);
    fireEvent.click(screen.getByRole("tab", { name: /Invitationer/ }));
    expect(screen.getByText(/Fra Anna/)).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Afventer (0)" }));
    expect(screen.getByText("Ingen invitationer")).toBeTruthy();
  });
  it("ikke udgivet, ingen adgang og fejl er egne tilstande, aldrig en tom liste", () => {
    for (const [err, text] of [[{ unavailable: true }, /ikke udgivet/], [{ denied: true }, /Ingen adgang/], [{}, /kunne ikke hentes/]]) {
      cleanup();
      render(<FamilySection {...base()} rows={[]} invites={[]} total={null} loaded={false} error={{ denied: false, unavailable: false, ...err }} />);
      expect(screen.getByRole("alert").textContent).toMatch(text);
    }
  });
});
