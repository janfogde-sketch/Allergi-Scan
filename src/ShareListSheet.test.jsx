// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ShareListSheet, JoinListSheet, ListSwitcherSheet } from "./ListSheets.jsx";
import { formatExpiry } from "./FamilyInvite.jsx";

const members = [{ id: "u2", name: "Anna Nielsen", email: "a@x.dk" }, { id: "u3", name: "Ben", email: "b@x.dk" }];
const base = (over = {}) => ({
  list: { id: "l1", name: "Weekend", owner_id: "u1", type: "personal", share_link: "ABC234", shared_with: [] },
  userId: "u1", familyMembers: members, loadFamilyMembers: vi.fn(),
  getListAccess: vi.fn().mockResolvedValue([]), grantAccess: vi.fn().mockResolvedValue(true), revokeAccess: vi.fn().mockResolvedValue(true),
  setListType: vi.fn().mockResolvedValue(), rotateListCode: vi.fn(), leaveList: vi.fn().mockResolvedValue(true), onChanged: vi.fn(), onClose: vi.fn(), ...over,
});

afterEach(cleanup);
describe("ShareListSheet", () => {
  it("ejer ser tre klare valg, og Kun mig er valgt for en privat liste", () => {
    render(<ShareListSheet {...base()} />);
    expect(screen.getByRole("radio", { name: /Kun mig/ }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: /Hele familien/ })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Bestemte personer/ })).toBeTruthy();
  });
  it("Hele familien sætter type family", async () => {
    const p = base();
    render(<ShareListSheet {...p} />);
    fireEvent.click(screen.getByRole("radio", { name: /Hele familien/ }));
    await waitFor(() => expect(p.setListType).toHaveBeenCalledWith("l1", "family"));
  });
  it("Bestemte personer: Tilføj giver adgang", async () => {
    const p = base();
    render(<ShareListSheet {...p} />);
    fireEvent.click(screen.getByRole("radio", { name: /Bestemte personer/ }));
    fireEvent.click(await screen.findByLabelText("Giv Anna Nielsen adgang til listen"));
    await waitFor(() => expect(p.grantAccess).toHaveBeenCalledWith("l1", "u2", "edit"));
  });
  it("link-tilsluttede vises med Fjern", async () => {
    const p = base({ list: { id: "l1", name: "X", owner_id: "u1", type: "personal", share_link: "ABC234", shared_with: ["Carl"] },
      getListAccess: vi.fn().mockResolvedValue([{ user_id: "u9", permission: "edit", users: { name: "Carl Hansen" } }]) });
    render(<ShareListSheet {...p} />);
    expect(await screen.findByText("Tilsluttet via link")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Fjern Carl Hansen fra listen"));
    await waitFor(() => expect(p.revokeAccess).toHaveBeenCalledWith("l1", "u9"));
  });
  it("en liste, andre har delt, forlades under Dine lister → Rediger (ikke via Del)", async () => {
    const leaveList = vi.fn().mockResolvedValue(true);
    const lists = [
      { id: "a", name: "Min", owner_id: "u2", type: "personal" },
      { id: "l1", name: "Test", owner_id: "u1", owner_name: "Jan", type: "personal", via_access: true },
    ];
    render(<ListSwitcherSheet lists={lists} activeListId="l1" userId="u2" onSelect={() => {}} onClose={() => {}} createList={vi.fn()} renameList={vi.fn()}
      leaveList={leaveList} joinByCode={vi.fn()} onRequestDelete={vi.fn()} />);
    expect(screen.getByText("Delt af Jan")).toBeTruthy();
    fireEvent.click(screen.getByText("Rediger"));
    expect(screen.queryByLabelText(/Slet listen Test/)).toBeNull(); // kan ikke slette en andens liste
    fireEvent.click(screen.getByLabelText("Forlad listen Test"));
    fireEvent.click(screen.getAllByText("Forlad listen").pop());
    await waitFor(() => expect(leaveList).toHaveBeenCalledWith("l1"));
  });
});

describe("formatExpiry", () => {
  it("siger i dag kl.", () => {
    expect(formatExpiry(new Date(Date.now() + 60000).toISOString())).toMatch(/^i (dag|morgen) kl\. \d\d\.\d\d$/);
  });
});

describe("JoinListSheet", () => {
  it("forklarer hvad der sker og kræver et aktivt valg", () => {
    const onConfirm = vi.fn(), onCancel = vi.fn();
    render(<JoinListSheet preview={{ name: "Weekend", owner_name: "Anna", code: "ABC234" }} onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText(/vil dele indkøbslisten/)).toBeTruthy();
    expect(screen.getByText(/Dine allergier og øvrige profiloplysninger deles ikke/)).toBeTruthy();
    expect(screen.getAllByText(/Weekend/)).toHaveLength(1); // listenavnet står kun i sætningen, ikke også som undertitel
    expect(screen.getByText(/Anna og andre med adgang kan se dine ændringer/)).toBeTruthy();
    expect(screen.getByText(/Dine lister → Rediger/)).toBeTruthy();
    expect(screen.queryByText(/tryk på listenavnet/)).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Tilslut listen"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Ikke nu"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
