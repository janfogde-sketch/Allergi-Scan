// @ts-nocheck
// @vitest-environment jsdom
// Indsendelser (14. okt. 2026): kompakte kort, knapper efter status, skrivebeskyttet detalje for behandlede, og allergenoplysninger der aldrig siger "Ingen" ved manglende data.
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SubmissionsSection from "./SubmissionsSection.jsx";

beforeEach(() => { globalThis.fetch = vi.fn(async () => ({ headers: { get: () => "0-0/7" } })); });
afterEach(() => { cleanup(); delete window.matchMedia; });
const setMobile = (m) => { window.matchMedia = vi.fn().mockImplementation((q) => ({ matches: m, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} })); };

const sub = (over = {}) => ({ id: "11111111-2222-3333-4444-555555555555", type: "new_product", status: "pending", ean: "458342005724", created_at: "2026-10-03T10:00:00Z", ai_parsed_data: { name: "KARTOFFEL STICKS MED SALT " + "lang ".repeat(20) }, ...over });
const props = (list, filter = "pending", extra = {}) => ({
  submissions: list, submissionsLoading: false, submissionFilter: filter, setSubmissionFilter: vi.fn(), loadSubmissions: vi.fn(),
  openSubmission: null, setOpenSubmission: vi.fn(), editingSubmission: null, setEditingSubmission: vi.fn(),
  cleanedOcrText: "", cleaningOcr: false, cleanOcrWithAI: vi.fn(), updateSubmissionAndApprove: vi.fn(), rejectSubmission: vi.fn(), accessToken: "t",
  selectedSubmissionIds: [], toggleSubmissionSelection: vi.fn(), selectAllSubmissions: vi.fn(), clearSubmissionSelection: vi.fn(),
  bulkActionLoading: false, bulkApproveSubmissions: vi.fn(), bulkRejectSubmissions: vi.fn(), ...extra,
});

describe("Indsendelser", () => {
  it("mobil: kompakt kort med navn, EAN, type og dato, allergenlinje, status og handling; ingen tabel", () => {
    setMobile(true);
    const { container } = render(<SubmissionsSection {...props([sub()])} />);
    expect(container.querySelector("table")).toBeNull();
    expect(screen.getByText(/KARTOFFEL STICKS MED SALT/)).toBeTruthy();
    expect(screen.getByText("EAN: 458342005724")).toBeTruthy();
    expect(screen.getByText(/Nyt produkt · Indsendt 3\. okt\.? 2026/)).toBeTruthy();
    expect(screen.getByText("Afventer", { selector: ".admin-pill" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gennemgå" })).toBeTruthy();
    expect(container.textContent).not.toContain("11111111"); // tekniske id'er vises kun i detaljevisningen
  });
  it("desktop: tabel", () => {
    setMobile(false);
    const { container } = render(<SubmissionsSection {...props([sub()])} />);
    expect(container.querySelector("table")).toBeTruthy();
  });
  it("manglende allergendata vises aldrig som 'Ingen'", () => {
    setMobile(true);
    const { container } = render(<SubmissionsSection {...props([sub()])} />);
    expect(container.textContent).toContain("Allergenoplysninger mangler");
    expect(container.textContent).not.toMatch(/Allergener: Ingen|\bIngen\b(?! ansvarlig)/);
  });
  it("ældre indsendelse med indlejret mælk viser mælk, og navnet 'Cheese' uden angivelse giver en påmindelse", () => {
    setMobile(true);
    const a = sub({ id: "a", status: "approved", ai_parsed_data: { name: "Elephant Sriracha Pretzel Pieces Cheese", allergen_flags: { maelkeallergi: "yes" } } });
    const b = sub({ id: "b", ean: "1", ai_parsed_data: { name: "Pretzel Cheese" } });
    const { container } = render(<SubmissionsSection {...props([a, b], "all")} />);
    expect(container.textContent).toContain("Allergener: Mælk");
    expect(container.textContent).toContain("Navnet nævner mælk");
  });
  it("knapteksterne følger status, og fanerne viser antal", async () => {
    setMobile(true);
    for (const [filter, label] of [["pending", "Gennemgå"], ["approved", "Se detaljer"], ["rejected", "Se detaljer"]]) {
      render(<SubmissionsSection {...props([sub({ status: filter })], filter)} />);
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
      cleanup();
    }
    render(<SubmissionsSection {...props([sub()])} />);
    expect(await screen.findByRole("button", { name: "Afventer (7)" })).toBeTruthy();
  });
  it("detaljer for en behandlet indsendelse er skrivebeskyttede: ingen Godkend/Afvist", () => {
    setMobile(true);
    const s = sub({ status: "approved" });
    render(<SubmissionsSection {...props([s], "approved", { openSubmission: s, editingSubmission: { name: "X", brand: "", allergen_flags: {} } })} />);
    expect(screen.queryByRole("button", { name: /Godkend og/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Afvis" })).toBeNull();
    expect(screen.getByRole("button", { name: "Luk" })).toBeTruthy();
    expect(screen.getByText(/ID: 11111111-2222/)).toBeTruthy(); // hele id'et står i detaljevisningen
  });
  it("en afventende indsendelse kan godkendes, og et ikke angivet allergen vises som 'Ikke angivet'", () => {
    setMobile(true);
    const s = sub();
    const p = props([s], "pending", { openSubmission: s, editingSubmission: { name: "X", brand: "", allergen_flags: {} } });
    render(<SubmissionsSection {...p} />);
    expect(screen.getAllByText("IKKE ANGIVET").length).toBeGreaterThan(5);
    fireEvent.click(screen.getByRole("button", { name: /Godkend og opret produkt/ }));
    expect(p.updateSubmissionAndApprove).toHaveBeenCalled();
  });
});

describe("Indsendelser: luk med kryds og advarsel ved ændringer", () => {
  it("kryds lukker uden ændringer; med ændringer vises en bekræftelse, og 'Bliv og ret' bevarer vinduet", () => {
    setMobile(false);
    const s = sub();
    const ed = { name: "Kiks", brand: "", ingredients_text: "mel", allergen_flags: {}, excluded_enumbers: [] };
    const setOpen = vi.fn(); const setEdit = vi.fn();
    const mk = (editing) => <SubmissionsSection {...props([s], "pending", { openSubmission: s, editingSubmission: editing, setOpenSubmission: setOpen, setEditingSubmission: setEdit })} />;
    const { rerender } = render(mk(ed));
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(setOpen).toHaveBeenCalledWith(null);
    setOpen.mockClear();
    rerender(mk({ ...ed, name: "Kiks med ændring" }));
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(setOpen).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog", { name: "Ikke-gemte ændringer" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bliv og ret" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    fireEvent.click(screen.getByRole("button", { name: "Kassér ændringer" }));
    expect(setOpen).toHaveBeenCalledWith(null);
  });
});
