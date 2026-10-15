// @ts-nocheck
// @vitest-environment jsdom
// Notifikationssiden: foldbare kategorier uden interne navne, separat redigeringsvisning med faner, beskyttede ikke-gemte ændringer, gem med konfliktkontrol,
// bekræftelse før gendan og testafsendelse, og at en delvis eller mislykket test aldrig fremstår som fuldført.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import NotificationsSection from "./NotificationsSection.jsx";

vi.mock("../../SharedComponents.jsx", async (orig) => ({ ...(await orig()), showToast: vi.fn() }));

const base = (o = {}) => ({
  admins: [{ id: "a1", name: "Jan", email: "j@x.dk" }], overrides: {}, loading: false, loaded: true, error: null, load: vi.fn(),
  savePush: vi.fn(async () => ({ ok: true, updated_at: "2026-10-16T10:00:00Z" })),
  sendTest: vi.fn(async () => ({ ok: true, data: { push: { devices: 1, sent: 1, failed: 0, errors: [] }, mail: { sent: true }, usedDraft: false } })),
  loadMailPreview: vi.fn(async () => ({ html: "<p>Mail</p>", status: "published", templateId: "tpl-1" })), userId: "a1", ...o,
});
beforeEach(() => { cleanup(); });

const openProduct = () => {
  fireEvent.click(screen.getByRole("button", { name: /Indsendelser/ }));
  fireEvent.click(screen.getByText("Produkt godkendt"));
};

describe("NotificationsSection", () => {
  it("viser kategorier med danske navne og antal, uden interne navne, og folder ud og ind", () => {
    render(<NotificationsSection {...base()} />);
    expect(screen.getByRole("button", { name: /Manglende produkter/ })).toBeTruthy();
    expect(screen.queryByText(/missing_product_found|N2a/)).toBeNull();
    const head = screen.getByRole("button", { name: /Indsendelser/ });
    expect(head.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(head);
    expect(head.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Rettelse godkendt")).toBeTruthy();
    fireEvent.click(head);
    expect(screen.queryByText("Rettelse godkendt")).toBeNull();
  });
  it("valg åbner redigeringen med tre faner og markerer den valgte; tilbagepilen går til oversigten", () => {
    render(<NotificationsSection {...base()} />);
    openProduct();
    expect(screen.getByRole("tab", { name: "Push" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Mail" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Send test" })).toBeTruthy();
    expect(screen.getByText("Produkt godkendt", { selector: ".np-item-name" }).closest("button").getAttribute("aria-current")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Tilbage til notifikationer" }));
    expect(document.querySelector(".np-layout").className).not.toContain("editing");
  });
  it("ændring aktiverer Gem, viser 'Ikke gemt' og tæller; en ugyldig variabel blokerer; gem sender den åbnede version", async () => {
    const p = base({ overrides: { "N2a:default": { key: "N2a:default", title: "T", body: "B {{productName}}", updated_at: "2026-10-15T08:00:00Z" } } });
    render(<NotificationsSection {...p} />);
    openProduct();
    const save = screen.getByRole("button", { name: "Gem push-tekst" });
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "Ny titel" } });
    expect(save.disabled).toBe(false);
    expect(screen.getByText("Ikke gemt")).toBeTruthy();
    expect(document.querySelector("#np-title-count").textContent).toMatch(/^8\/60/);
    fireEvent.change(screen.getByLabelText("Besked"), { target: { value: "{{hemmelig}}" } });
    expect(screen.getByRole("alert").textContent).toMatch(/Ukendt variabel/);
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Besked"), { target: { value: "Godkendt {{productName}}" } });
    fireEvent.click(save);
    await waitFor(() => expect(p.savePush).toHaveBeenCalledWith("N2a:default", { title: "Ny titel", body: "Godkendt {{productName}}" }, "2026-10-15T08:00:00Z"));
  });
  it("en overskredet grænse vises som fejl i tælleren", () => {
    render(<NotificationsSection {...base()} />);
    openProduct();
    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "x".repeat(61) } });
    expect(document.querySelector("#np-title-count").className).toContain("over");
    expect(screen.getByRole("button", { name: "Gem push-tekst" }).disabled).toBe(true);
  });
  it("variabel indsættes ved markøren", () => {
    render(<NotificationsSection {...base()} />);
    openProduct();
    const body = screen.getByLabelText("Besked");
    fireEvent.change(body, { target: { value: "AB" } });
    body.focus();
    body.setSelectionRange(1, 1);
    fireEvent.click(screen.getByRole("button", { name: "Produktnavn" }));
    expect(body.value).toBe("A{{productName}}B");
  });
  it("konflikt bevarer kladden og tilbyder at hente den nyeste", async () => {
    const p = base({ savePush: vi.fn(async () => ({ ok: false, conflict: true, error: "Teksten er ændret af en anden administrator" })) });
    render(<NotificationsSection {...p} />);
    openProduct();
    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "Min titel" } });
    fireEvent.click(screen.getByRole("button", { name: "Gem push-tekst" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/ændret af en anden/));
    expect(screen.getByLabelText("Titel").value).toBe("Min titel");
    expect(screen.getByRole("button", { name: "Hent den nyeste tekst" })).toBeTruthy();
  });
  it("ikke-gemte ændringer beskyttes ved tilbage og ved skift", () => {
    render(<NotificationsSection {...base()} />);
    openProduct();
    fireEvent.change(screen.getByLabelText("Titel"), { target: { value: "Ændret" } });
    fireEvent.click(screen.getByRole("button", { name: "Tilbage til notifikationer" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Annuller" }));
    expect(screen.getByLabelText("Titel").value).toBe("Ændret");
    fireEvent.click(screen.getByRole("button", { name: "Tilbage til notifikationer" }));
    fireEvent.click(screen.getByRole("button", { name: "Forlad" }));
    expect(document.querySelector(".np-layout").className).not.toContain("editing");
  });
  it("gendan standard kræver bekræftelse, når tilpasset tekst findes", async () => {
    const p = base({ overrides: { "N2a:default": { key: "N2a:default", title: "T", body: "B", updated_at: "2026-10-15T08:00:00Z" } } });
    render(<NotificationsSection {...p} />);
    openProduct();
    fireEvent.click(screen.getByRole("button", { name: "Gendan standard" }));
    expect(p.savePush).not.toHaveBeenCalled();
    fireEvent.click(within_dialog("Gendan standard"));
    await waitFor(() => expect(p.savePush).toHaveBeenCalledWith("N2a:default", { title: "", body: "" }, "2026-10-15T08:00:00Z"));
  });
  it("mail-fanen viser emne og skrivebeskyttet info, og interne id'er ligger i Tekniske oplysninger", async () => {
    render(<NotificationsSection {...base()} />);
    openProduct();
    fireEvent.click(screen.getByRole("tab", { name: "Mail" }));
    expect(screen.getByText(/Resend \(skrivebeskyttet her\)/)).toBeTruthy();
    expect(screen.queryByText("N2a:default")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tekniske oplysninger" }));
    expect(screen.getByText("N2a:default")).toBeTruthy();
    await waitFor(() => expect(document.querySelector("iframe.np-frame")).toBeTruthy());
  });
  it("test: kræver bekræftelse, sender kun én gang ved dobbelttryk, og delvis afsendelse er ikke fuldført", async () => {
    let release;
    const p = base({ sendTest: vi.fn(() => new Promise((r) => { release = () => r({ ok: true, data: { push: { devices: 1, sent: 1, failed: 0 }, mail: { sent: false, error: "RESEND_API_KEY mangler" }, usedDraft: false } }); })) });
    render(<NotificationsSection {...p} />);
    openProduct();
    fireEvent.click(screen.getByRole("tab", { name: "Send test" }));
    fireEvent.click(screen.getByRole("button", { name: "Send test…" }));
    expect(p.sendTest).not.toHaveBeenCalled();
    const confirm = within_dialog("Send test");
    fireEvent.click(confirm); fireEvent.click(confirm);
    expect(p.sendTest).toHaveBeenCalledTimes(1);
    release();
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/Delvist sendt/));
    expect(screen.getByRole("status").textContent).toMatch(/Mail: ikke sendt/);
  });
  it("test mislykkes med fejl og viser den", async () => {
    const p = base({ sendTest: vi.fn(async () => ({ ok: false, error: "Du har ikke adgang til at sende test." })) });
    render(<NotificationsSection {...p} />);
    openProduct();
    fireEvent.click(screen.getByRole("tab", { name: "Send test" }));
    fireEvent.click(screen.getByRole("button", { name: "Send test…" }));
    fireEvent.click(within_dialog("Send test"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Testen mislykkedes/));
  });
  it("fejl og ingen adgang er egne tilstande", () => {
    render(<NotificationsSection {...base({ loaded: false, error: { denied: false } })} />);
    expect(screen.getByRole("alert").textContent).toMatch(/kunne ikke hentes/);
    cleanup();
    render(<NotificationsSection {...base({ loaded: false, error: { denied: true } })} />);
    expect(screen.getByRole("alert").textContent).toMatch(/Ingen adgang/);
  });
});

function within_dialog(name) {
  const d = screen.getByRole("alertdialog");
  return Array.from(d.querySelectorAll("button")).find((b) => b.textContent === name);
}
