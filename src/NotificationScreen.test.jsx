// @ts-nocheck
// @vitest-environment jsdom
// Beskeds detaljevisning: overskrift, dato og tidspunkt, tekst, begrundelse; diskret sletning med bekræftelse og kun én sletning.
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

vi.mock("./notificationsApi.js", async (orig) => ({ ...(await orig()), fetchNotification: vi.fn(), fetchInviteStatus: vi.fn(async () => "active") }));
vi.mock("./SharedComponents.jsx", async (orig) => ({ ...(await orig()), showToast: vi.fn() }));
import { fetchNotification } from "./notificationsApi.js";
import { showToast } from "./SharedComponents.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import NotificationScreen from "./NotificationScreen.jsx";

afterEach(cleanup);
const item = {
  id: "n1", type: "N3", created_at: "2026-10-17T17:55:00Z", read_at: null, primary_action: null,
  content_blocks: [
    { type: "heading", text: "Vi kunne ikke godkende din indsendelse" },
    { type: "paragraph", parts: [{ text: "Tak, fordi du har indsendt oplysninger om " }, { text: "Osk", strong: true }, { text: "." }] },
    { type: "panel", title: "Begrundelse fra vores team", blocks: [{ type: "paragraph", parts: [{ text: "Mangler oplysninger" }] }] },
  ],
};
const setup = (over = {}) => {
  const props = { notificationId: "n1", markRead: vi.fn(), onDelete: vi.fn(async () => true), onAction: vi.fn(), onBack: vi.fn(), ...over };
  const view = render(<AuthProvider value={{ accessToken: "t", clearAuth: vi.fn() }}><NotificationScreen {...props} /></AuthProvider>);
  return { ...view, props };
};
beforeEach(() => { fetchNotification.mockResolvedValue({ status: "ok", item }); vi.mocked(showToast).mockClear(); });

describe("NotificationScreen", () => {
  it("viser overskrift, derefter dato og tidspunkt i dansk tid, derefter teksten og begrundelsen", async () => {
    setup();
    const heading = await screen.findByText("Vi kunne ikke godkende din indsendelse");
    const time = screen.getByText("17. oktober 2026 kl. 19:55");
    const text = screen.getByText(/Tak, fordi du har indsendt/);
    const reason = screen.getByText("Mangler oplysninger");
    const order = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(order(heading, time)).toBe(true);
    expect(order(time, text)).toBe(true);
    expect(order(text, reason)).toBe(true);
    expect(screen.getByText("Begrundelse fra vores team")).toBeTruthy();
  });
  it("markerer beskeden som læst, når den er vist", async () => {
    const { props } = setup();
    await screen.findByText("Vi kunne ikke godkende din indsendelse");
    expect(props.markRead).toHaveBeenCalledWith("n1");
  });
  it("Slet besked ligger nederst, kræver bekræftelse med den aftalte tekst, og Annuller sletter ikke", async () => {
    const { props } = setup();
    const del = await screen.findByRole("button", { name: /Slet besked/ });
    const reason = screen.getByText("Mangler oplysninger");
    expect(!!(reason.compareDocumentPosition(del) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    fireEvent.click(del);
    expect(screen.getByText("Slet besked?")).toBeTruthy();
    expect(screen.getByText("Vil du slette denne besked? Handlingen kan ikke fortrydes.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Annuller" }));
    expect(props.onDelete).not.toHaveBeenCalled();
  });
  it("bekræftet sletning sletter én gang (også ved gentagne tryk) og går tilbage til oversigten", async () => {
    let done;
    const onDelete = vi.fn(() => new Promise((r) => { done = r; }));
    const { props } = setup({ onDelete });
    fireEvent.click(await screen.findByRole("button", { name: /Slet besked/ }));
    const confirm = screen.getAllByRole("button", { name: "Slet besked" }).pop();
    await act(async () => { fireEvent.click(confirm); fireEvent.click(confirm); });
    expect(onDelete).toHaveBeenCalledTimes(1);
    await act(async () => { done(true); });
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
  it("fejler sletningen, bliver man på beskeden og får en fejlbesked", async () => {
    const { props } = setup({ onDelete: vi.fn(async () => false) });
    fireEvent.click(await screen.findByRole("button", { name: /Slet besked/ }));
    await act(async () => { fireEvent.click(screen.getAllByRole("button", { name: "Slet besked" }).pop()); });
    expect(props.onBack).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Beskeden kunne ikke slettes. Prøv igen.", "error");
  });
});
