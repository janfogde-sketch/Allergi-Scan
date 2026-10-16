// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import UsersSection from "./UsersSection.jsx";

afterEach(cleanup);
const U = (o) => ({ id: "u1", name: "Anne Hansen", email: "anne@example.dk", role: "user", created_at: "2026-10-03T10:00:00Z", onboarding_completed: true, ...o });
const DETAIL = { id: "u1", name: "Anne Hansen", email: "anne@example.dk", role: "user", created_at: "2026-10-03T10:00:00Z", onboarding_completed: true, birth_year: 1985, gender: "Kvinde", version: "v1" };
const PREFS = { ...DETAIL, allergens: ["milk"], custom: ["kanel"], e_numbers: ["E220"], allergen_levels: { milk: "direct_only" } };
const base = () => ({
  rows: [U(), U({ id: "u2", name: "Bo Admin", email: "bo@example.dk", role: "admin", onboarding_completed: false })], total: 2, counts: { all: 12, admin: 2, incomplete: 1 },
  loading: false, loadingMore: false, hasMore: false, loaded: true, error: null, load: vi.fn(), loadMore: vi.fn(),
  getUser: vi.fn(async (id, withPrefs) => ({ ok: true, user: withPrefs ? PREFS : DETAIL })),
  saveProfile: vi.fn(async () => ({ ok: true, version: "v2", preferencesChanged: false })),
  setRole: vi.fn(async () => ({ ok: true })), deleteSummary: vi.fn(async () => ({ ok: true, summary: { is_admin: false, family_profiles_owned: 1, family_links: 0, invites_sent: 0, shopping_lists_owned: 2, scan_history: 5 } })),
  deleteUser: vi.fn(async () => ({ ok: true })), exportUsers: vi.fn(async () => ({ ok: true, count: 2 })),
  userSearch: "", setUserSearch: vi.fn(), currentUserId: "me",
});
const openUser = async (p, name = "Anne Hansen") => {
  render(<UsersSection {...p} />);
  fireEvent.click(screen.getByText(name).closest("button"));
  await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
};

describe("Brugere: liste", () => {
  it("kompakte rækker med navn, e-mail, rolle og onboarding; ingen rolle-dropdown, Redigér eller Slet i listen", () => {
    render(<UsersSection {...base()} />);
    expect(screen.getByText("Anne Hansen")).toBeTruthy();
    expect(screen.getByText("anne@example.dk")).toBeTruthy();
    const meta = [...document.querySelectorAll(".usr-row-meta")].map((n) => n.textContent);
    expect(meta).toEqual(["Bruger · Onboarding gennemført", "Administrator · Onboarding ufærdig"]);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Redigér$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Slet$/ })).toBeNull();
    expect(screen.queryByRole("searchbox")).toBeNull(); // søgning sker fra headerens ikon
  });
  it("faner med antal fra serveren, og et faneskift henter fra serveren", () => {
    const p = base();
    render(<UsersSection {...p} />);
    expect(screen.getByRole("tab", { name: "Alle (12)" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Admins (2)" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Ufærdig onboarding/ }));
    expect(p.load).toHaveBeenLastCalledWith({ filter: "incomplete", q: "" });
  });
  it("viser '2 af 12 brugere' ved filtrering og '12 brugere' ellers", () => {
    const { unmount } = render(<UsersSection {...base()} />);
    expect(screen.getByText("2 af 12 brugere")).toBeTruthy();
    unmount();
    render(<UsersSection {...base()} total={12} />);
    expect(screen.getByText("12 brugere")).toBeTruthy();
  });
  it("en aktiv søgning vises som et mærke, der kan fjernes, og sendes til serveren", () => {
    const p = { ...base(), userSearch: "anne" };
    render(<UsersSection {...p} />);
    expect(p.load).toHaveBeenCalledWith({ filter: "all", q: "anne" });
    fireEvent.click(screen.getByRole("button", { name: /Søgning: anne/ }));
    expect(p.setUserSearch).toHaveBeenCalledWith("");
  });
  it("tilstande: fejl er ikke 'ingen brugere', ingen adgang, ingen match kan nulstilles, tom", () => {
    const { unmount } = render(<UsersSection {...base()} rows={[]} loaded={false} error={{ denied: false, message: "x" }} />);
    expect(screen.getByText("Brugerne kunne ikke hentes")).toBeTruthy();
    expect(screen.queryByText("Ingen brugere endnu")).toBeNull();
    unmount();
    const r2 = render(<UsersSection {...base()} error={{ denied: true, message: "x" }} />);
    expect(screen.getByText("Ingen adgang")).toBeTruthy();
    r2.unmount();
    const p = { ...base(), rows: [], total: 0, userSearch: "xyz" };
    const r3 = render(<UsersSection {...p} />);
    expect(screen.getByText("Ingen matchende brugere")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Nulstil" }));
    expect(p.setUserSearch).toHaveBeenCalledWith("");
    r3.unmount();
    render(<UsersSection {...base()} rows={[]} total={0} />);
    expect(screen.getByText("Ingen brugere endnu")).toBeTruthy();
  });
  it("eksport forklarer omfang og felter og udelader følsomme oplysninger, før den hentes", async () => {
    const p = base();
    render(<UsersSection {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "Eksportér CSV" }));
    const dlg = screen.getByRole("dialog", { name: "Eksportér brugere til CSV" });
    expect(within(dlg).getByText(/Navn, E-mail, Rolle, Oprettet, Onboarding/)).toBeTruthy();
    expect(within(dlg).getByText(/Allergier og andre helbredsoplysninger, fødselsår og bruger-id/)).toBeTruthy();
    expect(within(dlg).getByRole("button", { name: "Luk" }).textContent).toBe("");
    fireEvent.click(within(dlg).getByRole("button", { name: "Eksportér CSV" }));
    await waitFor(() => expect(p.exportUsers).toHaveBeenCalledTimes(1));
  });
});

describe("Brugere: oversigt og redigering", () => {
  it("er skrivebeskyttet som standard og viser login-e-mail; hele rækken åbner detaljerne", async () => {
    const p = base();
    await openUser(p);
    expect(p.getUser).toHaveBeenCalledWith("u1", false); // ingen præferencer hentet endnu
    expect(screen.getByText("E-mail (login)")).toBeTruthy();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("tab", { name: "Præferencer" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Administration" })).toBeTruthy();
  });
  it("e-mail er skrivebeskyttet i redigering; Gem er kun aktiv ved gyldige ændringer; versionen sendes med", async () => {
    const p = base();
    await openUser(p);
    fireEvent.click(screen.getByRole("button", { name: "Rediger oplysninger" }));
    expect(screen.getByLabelText("E-mail (login)").readOnly).toBe(true);
    const save = screen.getByRole("button", { name: "Gem ændringer" });
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Fødselsår"), { target: { value: "1700" } });
    expect(screen.getByRole("alert").textContent).toMatch(/mellem 1900/);
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Fødselsår"), { target: { value: "1986" } });
    fireEvent.change(screen.getByLabelText("Navn"), { target: { value: "Anne Nielsen" } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    await waitFor(() => expect(p.saveProfile).toHaveBeenCalledWith("u1", { profile: { name: "Anne Nielsen", birth_year: 1986, gender: "Kvinde" }, version: "v1" }));
  });
  it("ikke-gemte ændringer beskyttes ved lukning og faneskift", async () => {
    await openUser(base());
    fireEvent.click(screen.getByRole("button", { name: "Rediger oplysninger" }));
    fireEvent.change(screen.getByLabelText("Navn"), { target: { value: "Ny" } });
    fireEvent.click(screen.getByRole("tab", { name: "Administration" }));
    expect(screen.getByRole("alertdialog", { name: "Ikke-gemte ændringer" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bliv og ret" }));
    expect(screen.getByLabelText("Navn").value).toBe("Ny");
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    fireEvent.click(screen.getByRole("button", { name: "Kassér ændringer" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("en konflikt viser besked med 'Hent igen', og indtastede ændringer bevares ved fejl", async () => {
    const p = base();
    p.saveProfile.mockResolvedValue({ ok: false, error: "Brugeren er ændret, siden du åbnede den. Hent igen, før du gemmer.", conflict: true });
    await openUser(p);
    fireEvent.click(screen.getByRole("button", { name: "Rediger oplysninger" }));
    fireEvent.change(screen.getByLabelText("Navn"), { target: { value: "Ny" } });
    fireEvent.click(screen.getByRole("button", { name: "Gem ændringer" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Hent igen/));
    expect(screen.getByLabelText("Navn").value).toBe("Ny");
  });
});

describe("Brugere: præferencer", () => {
  const toPrefs = async (p) => { await openUser(p); fireEvent.click(screen.getByRole("tab", { name: "Præferencer" })); await waitFor(() => expect(screen.getByText("Rediger præferencer")).toBeTruthy()); };
  it("hentes først, når fanen åbnes, er skrivebeskyttede og viser spor, egne allergier og E-numre", async () => {
    const p = base();
    await toPrefs(p);
    expect(p.getUser).toHaveBeenCalledWith("u1", true);
    expect(screen.getByText("Advar ved spor")).toBeTruthy();
    expect(screen.getByText("Kun direkte indhold")).toBeTruthy();
    expect(screen.getByText("kanel")).toBeTruthy();
    expect(screen.getByText("E220")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Tilføj$/ })).toBeNull();
  });
  it("ændringer kræver bevidst redigering, en oversigt og en begrundelse, før de gemmes", async () => {
    const p = base();
    await toPrefs(p);
    fireEvent.click(screen.getByText("Rediger præferencer"));
    expect(screen.getByRole("button", { name: "Se ændringer" }).disabled).toBe(true); // intet ændret endnu
    fireEvent.click(screen.getByRole("button", { name: /Æg/ })); // tilføjer et allergen
    fireEvent.click(screen.getByRole("button", { name: "Se ændringer" }));
    expect(screen.getByText("Disse ændringer påvirker brugerens vurderinger")).toBeTruthy();
    expect(screen.getByText(/Tilføjer allergen/)).toBeTruthy();
    const save = screen.getByRole("button", { name: "Gem ændringer" });
    expect(save.disabled).toBe(true); // begrundelse mangler
    fireEvent.change(screen.getByLabelText("Begrundelse (påkrævet)"), { target: { value: "  Support  " } });
    fireEvent.click(save);
    await waitFor(() => expect(p.saveProfile).toHaveBeenCalledTimes(1));
    const [, args] = p.saveProfile.mock.calls[0];
    expect(args.reason).toBe("Support");
    expect(args.allergens).toEqual(expect.arrayContaining(["milk"]));
    expect(args.allergens.length).toBe(2);
    expect(args.custom).toEqual(["kanel"]);
    expect(args.profile.e_numbers).toEqual(["E220"]);
    expect(args.version).toBe("v1");
  });
  it("spor-valget er en rigtig checkbox med synlig tekst, og E-numre og egne allergier valideres som chips", async () => {
    await toPrefs(base());
    fireEvent.click(screen.getByText("Rediger præferencer"));
    const box = screen.getByRole("checkbox", { name: /advar også ved spor/ });
    expect(box.checked).toBe(false); // milk er 'kun direkte'
    expect(box.closest("label").textContent).toMatch(/advar også ved spor/);
    fireEvent.click(box);
    expect(box.checked).toBe(true);
    const input = screen.getByLabelText("Overvågede E-numre");
    fireEvent.change(input, { target: { value: "kanel" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Tilføj" })[1]);
    expect(screen.getByText("Skriv et E-nummer, fx E220.")).toBeTruthy();
    fireEvent.change(input, { target: { value: "e250" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Tilføj" })[1]);
    expect(screen.getByText("E250")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fjern E220" }));
    expect(screen.queryByText("E220")).toBeNull();
  });
  it("en afvist gemning (fx forældet version) bevarer valgene", async () => {
    const p = base();
    p.saveProfile.mockResolvedValue({ ok: false, error: "Ændringerne blev ikke gemt.", conflict: false });
    await toPrefs(p);
    fireEvent.click(screen.getByText("Rediger præferencer"));
    fireEvent.click(screen.getByRole("button", { name: /Æg/ }));
    fireEvent.click(screen.getByRole("button", { name: "Se ændringer" }));
    fireEvent.change(screen.getByLabelText("Begrundelse (påkrævet)"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Gem ændringer" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/ikke gemt/));
    expect(screen.getByLabelText("Begrundelse (påkrævet)").value).toBe("x");
  });
});

describe("Brugere: administration", () => {
  const toAdmin = async (p, name) => { await openUser(p, name); fireEvent.click(screen.getByRole("tab", { name: "Administration" })); };
  it("rolleskift kræver bekræftelse og kalder serverfunktionen; egen rolle kan ikke ændres", async () => {
    const p = base();
    await toAdmin(p);
    fireEvent.click(screen.getByRole("button", { name: "Ændre brugerrolle" }));
    expect(screen.getByText(/Ændre rolle til administrator\?/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Skift rolle" }));
    await waitFor(() => expect(p.setRole).toHaveBeenCalledWith("u1", "admin"));
    cleanup();
    const me = { ...base(), currentUserId: "u1" };
    await toAdmin(me);
    expect(screen.getByRole("button", { name: "Ændre brugerrolle" }).disabled).toBe(true);
    expect(screen.getByText("Du kan ikke ændre din egen rolle.")).toBeTruthy();
    expect(screen.getByText(/Du kan ikke slette din egen konto herfra/)).toBeTruthy();
  });
  it("en afvist rolleændring viser besked og ændrer intet", async () => {
    const p = base();
    p.setRole.mockResolvedValue({ ok: false, error: "Du har ikke rettighed til at udføre handlingen." });
    await toAdmin(p);
    fireEvent.click(screen.getByRole("button", { name: "Ændre brugerrolle" }));
    fireEvent.click(screen.getByRole("button", { name: "Skift rolle" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/rettighed/));
    expect(screen.getByRole("alertdialog", { name: "Ændre brugerrolle" })).toBeTruthy(); // bekræftelsen står stadig, rollen er uændret
  });
  it("sletning viser konsekvenserne, kræver en afkrydsning og sletter først derefter", async () => {
    const p = base();
    await toAdmin(p);
    fireEvent.click(screen.getByRole("button", { name: "Slet bruger" }));
    await waitFor(() => expect(screen.getByText(/familieprofil .* ejet af brugeren slettes også/)).toBeTruthy());
    expect(screen.getByText(/2 indkøbslister/)).toBeTruthy();
    const del = within(screen.getByRole("alertdialog", { name: "Slet bruger" })).getByRole("button", { name: "Slet bruger" });
    expect(del.disabled).toBe(true);
    expect(p.deleteUser).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Jeg forstår/ }));
    fireEvent.click(del);
    await waitFor(() => expect(p.deleteUser).toHaveBeenCalledWith("u1"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
  it("en mislykket sletning påstår ikke, at kontoen er slettet, og dialogen står åben", async () => {
    const p = base();
    p.deleteUser.mockResolvedValue({ ok: false, error: "Kontoen blev ikke slettet. Prøv igen." });
    await toAdmin(p);
    fireEvent.click(screen.getByRole("button", { name: "Slet bruger" }));
    await waitFor(() => screen.getByRole("checkbox", { name: /Jeg forstår/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Jeg forstår/ }));
    fireEvent.click(within(screen.getByRole("alertdialog", { name: "Slet bruger" })).getByRole("button", { name: "Slet bruger" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/ikke slettet/));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("tekniske oplysninger er foldbare og kan kopieres", async () => {
    await toAdmin(base());
    expect(screen.queryByText("u1")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tekniske oplysninger" }));
    expect(screen.getByText("u1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kopiér Bruger-id" })).toBeTruthy();
  });
});

describe("Brugere: detaljer når databasefunktionerne mangler, og fejltilstande", () => {
  it("læsning virker, men redigering, rolleændring og sletning er slået fra med en forklaring", async () => {
    const p = base();
    p.getUser = vi.fn(async (id, withPrefs) => ({ ok: true, user: { ...(withPrefs ? PREFS : DETAIL), version: null, legacy: true } }));
    await openUser(p);
    expect(screen.queryByRole("button", { name: "Rediger oplysninger" })).toBeNull();
    expect(screen.getByText(/Redigering er slået fra/)).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Præferencer" }));
    await waitFor(() => screen.getByText("Overvågede E-numre"));
    expect(screen.queryByRole("button", { name: "Rediger præferencer" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Administration" }));
    expect(screen.getByRole("button", { name: "Ændre brugerrolle" }).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Slet bruger" })).toBeNull();
    expect(screen.getByText(/Sletning er slået fra/)).toBeTruthy();
  });
  it("fejl i hele detaljen viser den fælles fejltilstand med Prøv igen, og visningen forbliver åben", async () => {
    const p = base();
    p.getUser = vi.fn(async () => ({ ok: false, error: "x", kind: "server" }));
    await openUser(p);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Kunne ikke hente brugeroplysninger.*Der opstod en fejl under indlæsningen/));
    p.getUser = vi.fn(async () => ({ ok: true, user: DETAIL }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Prøv igen" })).toBeTruthy();
  });
  it("særskilte tilstande for manglende adgang og slettet bruger (uden Prøv igen)", async () => {
    for (const [kind, text] of [["denied", /Du har ikke adgang/], ["notfound", /findes ikke længere/]]) {
      cleanup();
      const p = base();
      p.getUser = vi.fn(async () => ({ ok: false, error: "x", kind }));
      await openUser(p);
      await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(text));
      expect(screen.queryByRole("button", { name: "Prøv igen" })).toBeNull();
    }
  });
  it("præferencer, der ikke kan hentes, skjuler ikke oversigten, og viser egen fejl med Prøv igen", async () => {
    const p = base();
    p.getUser = vi.fn(async (id, withPrefs) => (withPrefs ? { ok: false, error: "x", kind: "server" } : { ok: true, user: DETAIL }));
    await openUser(p);
    expect(screen.getByText("anne@example.dk", { selector: "dd" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Præferencer" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Kunne ikke hente præferencer/));
    expect(screen.queryByRole("button", { name: "Rediger præferencer" })).toBeNull(); // ingen redigering uden indlæste værdier
    expect(screen.getByRole("button", { name: "Prøv igen" })).toBeTruthy();
  });
});
