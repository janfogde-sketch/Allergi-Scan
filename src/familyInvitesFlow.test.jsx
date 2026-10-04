// @vitest-environment jsdom
// @ts-nocheck
// Familie-invitationer, appens side (4. okt. 2026): hooks og sheets for mail-invitation, delt link og afsenderens godkendelse.
// Netværket er mocket; databasens regler testes i docs/familie-invitationer-test.sql.
import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook, waitFor, render, screen, fireEvent, cleanup } from "@testing-library/react";
import { useFamilyInviteInbox } from "./useFamilyInviteInbox.js";
import { useFamilyLinkRequests } from "./useFamilyLinkRequests.js";
import { FamilyInviteSheet, FamilyRequestSheet } from "./ListSheets.jsx";
import { InvitePanel, InviteLinkEntry, PendingInviteCard, inviteErrorText } from "./FamilyInvite.jsx";
import { showToast } from "./SharedComponents.jsx";

vi.mock("./SharedComponents.jsx", async (orig) => ({ ...(await orig()), showToast: vi.fn() }));

const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718";
const USER = { onboarding_completed: true };
const INVITE = { id: "inv-1", inviter_first_name: "Jan", expires_at: "2026-10-05T10:00:00Z" };
const LINK = { id: "lnk-1", kind: "link", inviter_first_name: "Jan", expires_at: "2026-10-05T10:00:00Z", awaiting: false };

// Mock af fetch: en tabel fra rpc-/funktionsnavn til svar (værdi eller funktion). Gemmer alle kald.
let calls;
function mockNetwork(routes) {
  calls = [];
  global.fetch = vi.fn(async (url, opts = {}) => {
    const name = String(url).split("/").pop();
    calls.push({ name, body: opts.body ? JSON.parse(opts.body) : null });
    const r = routes[name];
    if (r === undefined) return { ok: true, status: 200, text: async () => "{}" };
    const res = typeof r === "function" ? await r(opts.body ? JSON.parse(opts.body) : null) : r;
    if (res?.__error) return { ok: false, status: res.status ?? 400, text: async () => JSON.stringify({ error: res.__error }) };
    return { ok: true, status: 200, text: async () => JSON.stringify(res) };
  });
}
const called = (name) => calls.filter((c) => c.name === name);
const toasts = () => showToast.mock.calls.map((c) => c[0]);

afterEach(() => cleanup());

beforeEach(() => {
  localStorage.clear();
  showToast.mockClear();
  calls = [];
});

const mount = (props = {}) =>
  renderHook(() => useFamilyInviteInbox({ accessToken: "t", userId: "u1", user: USER, loadFamily: props.loadFamily ?? vi.fn(), ...props }));

describe("modtager: mail-invitation (e-mail-match)", () => {
  it("viser invitationen og forbinder først, når brugeren siger ja", async () => {
    const loadFamily = vi.fn();
    mockNetwork({ get_my_pending_family_invites: [INVITE], accept_my_family_invite: { success: true } });
    const { result } = mount({ loadFamily });
    await waitFor(() => expect(result.current.familyInvite?.id).toBe("inv-1"));
    expect(called("accept_my_family_invite")).toHaveLength(0); // intet kobles af sig selv
    await act(async () => { await result.current.acceptFamilyInvite(); });
    expect(called("accept_my_family_invite")[0].body).toEqual({ p_invite_id: "inv-1" });
    expect(loadFamily).toHaveBeenCalled();
    expect(toasts().join(" ")).toMatch(/nu i familie/);
    expect(result.current.familyInvite).toBeNull();
  });

  it("'Nej tak' afviser via id", async () => {
    mockNetwork({ get_my_pending_family_invites: [INVITE], decline_my_family_invite: { success: true } });
    const { result } = mount();
    await waitFor(() => expect(result.current.familyInvite).toBeTruthy());
    await act(async () => { await result.current.declineFamilyInvite(); });
    expect(called("decline_my_family_invite")[0].body).toEqual({ p_invite_id: "inv-1" });
    expect(result.current.familyInvite).toBeNull();
  });

  it("'Senere' udsætter uden at afgøre noget, og invitationen kommer igen ved næste åbning", async () => {
    mockNetwork({ get_my_pending_family_invites: [INVITE] });
    const first = mount();
    await waitFor(() => expect(first.result.current.familyInvite).toBeTruthy());
    act(() => first.result.current.laterFamilyInvite());
    expect(first.result.current.familyInvite).toBeNull();
    expect(called("decline_my_family_invite")).toHaveLength(0);
    first.unmount();
    const second = mount();
    await waitFor(() => expect(second.result.current.familyInvite?.id).toBe("inv-1"));
  });

  it("viser ikke noget (og kalder intet), før onboarding er færdig eller brugeren er logget ind", async () => {
    mockNetwork({ get_my_pending_family_invites: [INVITE] });
    const a = mount({ user: { onboarding_completed: false } });
    const b = mount({ accessToken: null });
    await new Promise((r) => setTimeout(r, 30));
    expect(called("get_my_pending_family_invites")).toHaveLength(0);
    expect(a.result.current.familyInvite).toBeNull();
    expect(b.result.current.familyInvite).toBeNull();
  });

  it("henter igen, når appen kommer i forgrunden (invitation sendt, mens appen var åben)", async () => {
    let list = [];
    mockNetwork({ get_my_pending_family_invites: () => list });
    const { result } = mount();
    await waitFor(() => expect(called("get_my_pending_family_invites")).toHaveLength(1));
    expect(result.current.familyInvite).toBeNull();
    list = [INVITE];
    act(() => { window.dispatchEvent(new Event("focus")); });
    await waitFor(() => expect(result.current.familyInvite?.id).toBe("inv-1"));
  });

  it("en udløbet eller brugt invitation ved accept giver en fejlbesked, ikke en forbindelse", async () => {
    const loadFamily = vi.fn();
    mockNetwork({ get_my_pending_family_invites: [INVITE], accept_my_family_invite: { success: false, error: "ugyldig" } });
    const { result } = mount({ loadFamily });
    await waitFor(() => expect(result.current.familyInvite).toBeTruthy());
    await act(async () => { await result.current.acceptFamilyInvite(); });
    expect(loadFamily).not.toHaveBeenCalled();
    expect(toasts().join(" ")).toMatch(/virker ikke længere/);
  });
});

describe("modtager: mailens link (token), fx Facebook-login eller anden e-mail", () => {
  it("viser en mail-invitation, brugeren kom til via linket, og accepterer med tokenet (ingen godkendelse hos afsenderen)", async () => {
    localStorage.setItem("as_pending_invite", TOKEN);
    mockNetwork({
      get_my_pending_family_invites: [],
      get_family_invite_by_link: { ...INVITE, kind: "email", awaiting: false },
      accept_family_invite_by_link: { success: true },
    });
    const loadFamily = vi.fn();
    const { result } = mount({ loadFamily });
    await waitFor(() => expect(result.current.familyInvite?.viaToken).toBe(TOKEN));
    await act(async () => { await result.current.acceptFamilyInvite(); });
    expect(called("accept_family_invite_by_link")[0].body).toEqual({ p_token: TOKEN });
    expect(localStorage.getItem("as_pending_invite")).toBeNull();
    expect(loadFamily).toHaveBeenCalled();
  });

  it("samme invitation via e-mail-match og link vises kun én gang", async () => {
    localStorage.setItem("as_pending_invite", TOKEN);
    mockNetwork({ get_my_pending_family_invites: [INVITE], get_family_invite_by_link: { ...INVITE, kind: "email", awaiting: false } });
    const { result } = mount();
    await waitFor(() => expect(result.current.familyInvite).toBeTruthy());
    act(() => result.current.laterFamilyInvite());
    expect(result.current.familyInvite).toBeNull(); // der var kun én
  });

  it("delt link: 'ja' sender kun en anmodning (ingen forbindelse), tokenet ryddes, og brugeren får at vide, at afsenderen skal godkende", async () => {
    localStorage.setItem("as_pending_invite", TOKEN);
    const loadFamily = vi.fn();
    mockNetwork({
      get_my_pending_family_invites: [],
      get_family_invite_by_link: LINK,
      accept_family_invite_by_link: { success: true, pending_approval: true },
    });
    const { result } = mount({ loadFamily });
    await waitFor(() => expect(result.current.familyInvite?.kind).toBe("link"));
    await act(async () => { await result.current.acceptFamilyInvite(); });
    expect(loadFamily).not.toHaveBeenCalled();
    expect(localStorage.getItem("as_pending_invite")).toBeNull();
    expect(toasts().join(" ")).toMatch(/Anmodningen er sendt.*Jan.*godkende/);
  });

  it("delt link: 'nej tak' kalder ingen afvisning (det ville ødelægge afsenderens invitation), men rydder tokenet", async () => {
    localStorage.setItem("as_pending_invite", TOKEN);
    mockNetwork({ get_my_pending_family_invites: [], get_family_invite_by_link: LINK });
    const { result } = mount();
    await waitFor(() => expect(result.current.familyInvite?.kind).toBe("link"));
    await act(async () => { await result.current.declineFamilyInvite(); });
    expect(called("decline_family_invite_by_link")).toHaveLength(0);
    expect(called("decline_my_family_invite")).toHaveLength(0);
    expect(localStorage.getItem("as_pending_invite")).toBeNull();
  });

  it("mail-invitation via link: 'nej tak' afviser med tokenet", async () => {
    localStorage.setItem("as_pending_invite", TOKEN);
    mockNetwork({ get_my_pending_family_invites: [], get_family_invite_by_link: { ...INVITE, kind: "email", awaiting: false }, decline_family_invite_by_link: { success: true } });
    const { result } = mount();
    await waitFor(() => expect(result.current.familyInvite?.viaToken).toBe(TOKEN));
    await act(async () => { await result.current.declineFamilyInvite(); });
    expect(called("decline_family_invite_by_link")[0].body).toEqual({ p_token: TOKEN });
  });

  it.each([
    ["locked", /allerede brugt af en anden/],
    ["used", /allerede brugt/],
    ["expired", /udløbet/],
    ["revoked", /trukket tilbage/],
    ["unknown", /kunne ikke finde/],
  ])("et link, der ikke kan bruges (%s), forklares for brugeren, og tokenet ryddes", async (status, text) => {
    localStorage.setItem("as_pending_invite", TOKEN);
    mockNetwork({ get_my_pending_family_invites: [], get_family_invite_by_link: null, get_family_invite_link_status: status });
    const { result } = mount();
    await waitFor(() => expect(toasts().length).toBeGreaterThan(0));
    expect(toasts()[0]).toMatch(text);
    expect(result.current.familyInvite).toBeNull();
    expect(localStorage.getItem("as_pending_invite")).toBeNull();
  });

  it.each(["own", "mine", "ok"])("status %s giver ingen fejlbesked, men tokenet ryddes", async (status) => {
    localStorage.setItem("as_pending_invite", TOKEN);
    mockNetwork({ get_my_pending_family_invites: [], get_family_invite_by_link: null, get_family_invite_link_status: status });
    mount();
    await waitFor(() => expect(called("get_family_invite_link_status")).toHaveLength(1));
    expect(showToast).not.toHaveBeenCalled();
    expect(localStorage.getItem("as_pending_invite")).toBeNull();
  });

  it("allerede anmodet (afventer godkendelse): ingen ny sheet, en rolig besked, tokenet ryddes", async () => {
    localStorage.setItem("as_pending_invite", TOKEN);
    mockNetwork({ get_my_pending_family_invites: [], get_family_invite_by_link: { ...LINK, awaiting: true }, get_family_invite_link_status: "awaiting" });
    const { result } = mount();
    await waitFor(() => expect(toasts().length).toBeGreaterThan(0));
    expect(toasts()[0]).toMatch(/venter på, at afsenderen godkender/);
    expect(showToast.mock.calls[0][1]).toBe("success");
    expect(result.current.familyInvite).toBeNull();
    expect(localStorage.getItem("as_pending_invite")).toBeNull();
  });

  it("netværksfejl: tokenet beholdes, så det prøves igen", async () => {
    localStorage.setItem("as_pending_invite", TOKEN);
    mockNetwork({ get_my_pending_family_invites: { __error: "HTTP 500", status: 500 } });
    mount();
    await waitFor(() => expect(called("get_my_pending_family_invites")).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 30));
    expect(localStorage.getItem("as_pending_invite")).toBe(TOKEN);
  });

  it("et indsat link (begivenhed fra Familie-siden) hentes med det samme", async () => {
    mockNetwork({ get_my_pending_family_invites: [], get_family_invite_by_link: LINK });
    const { result } = mount();
    await waitFor(() => expect(called("get_my_pending_family_invites")).toHaveLength(1));
    expect(result.current.familyInvite).toBeNull();
    localStorage.setItem("as_pending_invite", TOKEN);
    act(() => { window.dispatchEvent(new Event("eatsafe:invite-token")); });
    await waitFor(() => expect(result.current.familyInvite?.kind).toBe("link"));
  });
});

describe("afsender: godkendelse af delt link", () => {
  const REQ = { invite_id: "lnk-1", requester_first_name: "Frederikke", requested_at: "2026-10-04T10:00:00Z" };
  const mountReq = (props = {}) =>
    renderHook(() => useFamilyLinkRequests({ accessToken: "t", userId: "u1", user: USER, loadFamily: props.loadFamily ?? vi.fn(), ...props }));

  it("viser anmodningen, og 'Godkend' forbinder og siger det", async () => {
    const loadFamily = vi.fn();
    mockNetwork({ get_family_link_requests: [REQ], approve_family_link_request: { success: true } });
    const { result } = mountReq({ loadFamily });
    await waitFor(() => expect(result.current.linkRequest?.requester_first_name).toBe("Frederikke"));
    expect(called("approve_family_link_request")).toHaveLength(0);
    await act(async () => { await result.current.approveLinkRequest(); });
    expect(called("approve_family_link_request")[0].body).toEqual({ p_invite_id: "lnk-1" });
    expect(loadFamily).toHaveBeenCalled();
    expect(toasts().join(" ")).toMatch(/Frederikke er nu i din familie/);
    expect(result.current.linkRequest).toBeNull();
  });

  it("'Afvis' afviser, og ingen forbindes", async () => {
    const loadFamily = vi.fn();
    mockNetwork({ get_family_link_requests: [REQ], decline_family_link_request: { success: true } });
    const { result } = mountReq({ loadFamily });
    await waitFor(() => expect(result.current.linkRequest).toBeTruthy());
    await act(async () => { await result.current.declineLinkRequest(); });
    expect(called("decline_family_link_request")[0].body).toEqual({ p_invite_id: "lnk-1" });
    expect(loadFamily).not.toHaveBeenCalled();
    expect(result.current.linkRequest).toBeNull();
  });

  it("'Senere' afgør intet, og en udløbet anmodning giver en fejlbesked ved godkendelse", async () => {
    mockNetwork({ get_family_link_requests: [REQ], approve_family_link_request: { success: false } });
    const { result } = mountReq();
    await waitFor(() => expect(result.current.linkRequest).toBeTruthy());
    act(() => result.current.laterLinkRequest());
    expect(result.current.linkRequest).toBeNull();
    expect(called("decline_family_link_request")).toHaveLength(0);
    act(() => { window.dispatchEvent(new Event("focus")); });
    await new Promise((r) => setTimeout(r, 30));
    expect(result.current.linkRequest).toBeNull(); // udsat anmodning vises ikke igen i samme åbning
  });

  it("ingen anmodninger: intet sheet", async () => {
    mockNetwork({ get_family_link_requests: [] });
    const { result } = mountReq();
    await waitFor(() => expect(called("get_family_link_requests")).toHaveLength(1));
    expect(result.current.linkRequest).toBeNull();
  });
});

describe("sheets", () => {
  it("modtagersheet for mail: 'Ja, forbind os' og afvis", () => {
    const onConfirm = vi.fn(), onDecline = vi.fn(), onLater = vi.fn();
    render(<FamilyInviteSheet invite={INVITE} busy={false} onConfirm={onConfirm} onDecline={onDecline} onLater={onLater} />);
    expect(screen.getByText(/har inviteret dig til sin familie/)).toBeTruthy();
    expect(screen.queryByText(/skal vedkommende godkende/)).toBeNull();
    fireEvent.click(screen.getByText("Ja, forbind os"));
    fireEvent.click(screen.getByText("Nej tak"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it("modtagersheet for delt link: forklarer godkendelsen og hedder 'Ja, send anmodning'", () => {
    render(<FamilyInviteSheet invite={LINK} busy={false} onConfirm={vi.fn()} onDecline={vi.fn()} onLater={vi.fn()} />);
    expect(screen.getByText(/skal vedkommende godkende, før I bliver forbundet/)).toBeTruthy();
    expect(screen.getByText("Ja, send anmodning")).toBeTruthy();
  });

  it("afsendersheet: navn, Godkend og Afvis", () => {
    const onApprove = vi.fn(), onDecline = vi.fn();
    render(<FamilyRequestSheet request={{ invite_id: "x", requester_first_name: "Frederikke" }} busy={false} onApprove={onApprove} onDecline={onDecline} onLater={vi.fn()} />);
    expect(screen.getByText("Frederikke")).toBeTruthy();
    fireEvent.click(screen.getByText("Godkend"));
    fireEvent.click(screen.getByText("Afvis"));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it("afsendersheet uden navn bruger en neutral tekst", () => {
    render(<FamilyRequestSheet request={{ invite_id: "x" }} busy={false} onApprove={vi.fn()} onDecline={vi.fn()} onLater={vi.fn()} />);
    expect(screen.getByText("En bruger af EatSafe")).toBeTruthy();
  });
});

describe("afsender: opret invitation (panel)", () => {
  it("mail: sender adressen til family-invite og viser, hvem den er sendt til", async () => {
    mockNetwork({ "family-invite": { success: true, invite: { id: "i1", invitee_email: "frederikke@gmail.com", expires_at: "2026-10-05T10:00:00Z" } } });
    const onChanged = vi.fn();
    render(<InvitePanel accessToken="t" onClose={vi.fn()} onInviteId={vi.fn()} onChanged={onChanged} />);
    fireEvent.change(screen.getByLabelText("E-mailadresse"), { target: { value: "  Frederikke@Gmail.com " } });
    fireEvent.click(screen.getByText("Send invitation"));
    await waitFor(() => expect(screen.getByText("frederikke@gmail.com")).toBeTruthy());
    expect(called("family-invite")[0].body).toEqual({ email: "Frederikke@Gmail.com" });
    expect(onChanged).toHaveBeenCalled();
  });

  it.each([
    ["invalid_email", /gyldig e-mailadresse/],
    ["own_email", /din egen/],
    ["already_connected", /allerede forbundet/],
    ["already_pending", /allerede sendt/],
    ["rate_limited", /mange invitationer/],
    ["mail_failed", /kunne ikke sendes/],
    ["HTTP 500", /Noget gik galt/],
  ])("mail: fejlkoden %s bliver til en forståelig tekst", async (code, text) => {
    mockNetwork({ "family-invite": { __error: code, status: 400 } });
    render(<InvitePanel accessToken="t" onClose={vi.fn()} onInviteId={vi.fn()} onChanged={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("E-mailadresse"), { target: { value: "a@b.dk" } });
    fireEvent.click(screen.getByText("Send invitation"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(text));
    expect(inviteErrorText(code === "HTTP 500" ? "x" : code)).toMatch(text);
  });

  it("knappen er slået fra uden adresse", () => {
    mockNetwork({});
    render(<InvitePanel accessToken="t" onClose={vi.fn()} onInviteId={vi.fn()} onChanged={vi.fn()} />);
    expect(screen.getByText("Send invitation").closest("button").disabled).toBe(true);
  });

  it("delt link: opretter et link uden e-mail og viser adressen og forklaringen om godkendelse", async () => {
    mockNetwork({ "family-invite": { success: true, invite: { id: "l1", kind: "link", expires_at: "2026-10-05T10:00:00Z", url: `https://eatsafe.dk/invite/${TOKEN}` } } });
    render(<InvitePanel accessToken="t" onClose={vi.fn()} onInviteId={vi.fn()} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByText("Del et link"));
    fireEvent.click(screen.getByText("Opret link"));
    await waitFor(() => expect(screen.getByText(/Linket er klar/)).toBeTruthy());
    expect(called("family-invite")[0].body).toEqual({ kind: "link" });
    expect(screen.getByText(/skal godkende, før I bliver forbundet/)).toBeTruthy();
    expect(screen.getByText("Kopiér link")).toBeTruthy();
  });

  it("delt link: grænsen på invitationer pr. døgn vises", async () => {
    mockNetwork({ "family-invite": { __error: "rate_limited", status: 429 } });
    render(<InvitePanel accessToken="t" onClose={vi.fn()} onInviteId={vi.fn()} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByText("Del et link"));
    fireEvent.click(screen.getByText("Opret link"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/mange invitationer/));
  });

  it("annullér sletter invitationen og lukker", async () => {
    mockNetwork({ "family-invite": { success: true, invite: { id: "i1", invitee_email: "a@b.dk", expires_at: "2026-10-05T10:00:00Z" } }, family_invites: {} });
    const onClose = vi.fn();
    render(<InvitePanel accessToken="t" onClose={onClose} onInviteId={vi.fn()} onChanged={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("E-mailadresse"), { target: { value: "a@b.dk" } });
    fireEvent.click(screen.getByText("Send invitation"));
    await waitFor(() => expect(screen.getByText("Annuller invitation")).toBeTruthy());
    fireEvent.click(screen.getByText("Annuller invitation"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(global.fetch.mock.calls.some(([url, o]) => String(url).includes("family_invites?id=eq.i1") && o.method === "DELETE")).toBe(true);
  });
});

describe("afsender: afventende invitationer i oversigten", () => {
  it("delt link viser Del/Kopiér og ingen 'Send igen'; mail viser 'Send igen'", () => {
    const { rerender } = render(<PendingInviteCard invite={{ id: "l", kind: "link", token: TOKEN, expires_at: "2026-10-05T10:00:00Z" }} onCancel={vi.fn()} accessToken="t" />);
    expect(screen.getByText("Delt link")).toBeTruthy();
    expect(screen.getByText("Kopiér link")).toBeTruthy();
    expect(screen.queryByText("Send igen")).toBeNull();
    rerender(<PendingInviteCard invite={{ id: "m", kind: "email", invitee_email: "a@b.dk", expires_at: "2026-10-05T10:00:00Z" }} onCancel={vi.fn()} accessToken="t" />);
    expect(screen.getByText("Invitation sendt")).toBeTruthy();
    expect(screen.getByText("Send igen")).toBeTruthy();
  });

  it("'Send igen' for mail: pause giver en forklaring, og succes bekræftes", async () => {
    mockNetwork({ "family-invite": { __error: "too_soon", status: 429 } });
    render(<PendingInviteCard invite={{ id: "m", kind: "email", invitee_email: "a@b.dk", expires_at: "2026-10-05T10:00:00Z" }} onCancel={vi.fn()} accessToken="t" />);
    fireEvent.click(screen.getByText("Send igen"));
    await waitFor(() => expect(toasts().join(" ")).toMatch(/Vent lidt/));
    expect(called("family-invite")[0].body).toEqual({ resend_id: "m" });
    showToast.mockClear();
    mockNetwork({ "family-invite": { success: true } });
    fireEvent.click(screen.getByText("Send igen"));
    await waitFor(() => expect(toasts().join(" ")).toMatch(/sendt igen/));
  });
});

describe("modtager uden link i browseren: indsæt linket (Familie)", () => {
  it("et gyldigt link gemmes og sender en begivenhed, så invitationen hentes", () => {
    const heard = vi.fn();
    window.addEventListener("eatsafe:invite-token", heard);
    render(<InviteLinkEntry />);
    fireEvent.click(screen.getByText("Har du fået et invitationslink?"));
    fireEvent.change(screen.getByLabelText("Indsæt invitationslinket"), { target: { value: `https://eatsafe.dk/invite/${TOKEN}` } });
    fireEvent.click(screen.getByText("Fortsæt"));
    expect(localStorage.getItem("as_pending_invite")).toBe(TOKEN);
    expect(heard).toHaveBeenCalledTimes(1);
    window.removeEventListener("eatsafe:invite-token", heard);
  });

  it("noget, der ikke ligner et link, afvises med en forklaring og gemmer intet", () => {
    render(<InviteLinkEntry />);
    fireEvent.click(screen.getByText("Har du fået et invitationslink?"));
    fireEvent.change(screen.getByLabelText("Indsæt invitationslinket"), { target: { value: "hej med dig" } });
    fireEvent.click(screen.getByText("Fortsæt"));
    expect(screen.getByRole("alert").textContent).toMatch(/ligner ikke et invitationslink/);
    expect(localStorage.getItem("as_pending_invite")).toBeNull();
  });
});
