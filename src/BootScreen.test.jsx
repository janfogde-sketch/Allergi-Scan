// @ts-nocheck
// @vitest-environment jsdom
// Startskærmen: indlæsningsikon med det samme, ingen fejl før en konstateret fejl, og beskeder, der følger årsagen.
import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import BootScreen, { BOOT_HELP_DELAY_MS } from "./BootScreen.jsx";

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("BootScreen: indlæsning", () => {
  it("viser straks et indlæsningsikon og ingen fejl eller knapper", () => {
    const { container } = render(<BootScreen onRetry={() => {}} onLogin={() => {}} />);
    expect(container.querySelector(".spinner")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Åbner EatSafe");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByText(/kunne ikke|Ingen forbindelse|logge ind/i)).toBeNull();
  });
  it("efter ca. 6 sekunder kommer en rolig besked og Prøv igen, men ingen fejltekst og intet login", () => {
    render(<BootScreen onRetry={() => {}} onLogin={() => {}} />);
    act(() => { vi.advanceTimersByTime(BOOT_HELP_DELAY_MS - 1); });
    expect(screen.queryByText(/længere end normalt/)).toBeNull();
    act(() => { vi.advanceTimersByTime(2); });
    expect(screen.getByText("Det tager lidt længere end normalt …")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Prøv igen" })).toBeTruthy();
    expect(screen.queryByText(/Log ind/i)).toBeNull();
    expect(screen.queryByText(/Ingen forbindelse|kunne ikke starte/)).toBeNull();
  });
});

describe("BootScreen: fejl følger årsagen", () => {
  it("offline: Ingen forbindelse, kun Prøv igen", () => {
    const onRetry = vi.fn();
    render(<BootScreen failure="offline" onRetry={onRetry} onLogin={() => {}} />);
    expect(screen.getByText("Ingen forbindelse")).toBeTruthy();
    expect(screen.getByText("Tjek din internetforbindelse, og prøv igen.")).toBeTruthy();
    expect(screen.queryByText(/Log ind/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Prøv igen" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
  it("serverfejl og ukendt årsag: EatSafe kunne ikke starte, aldrig 'ingen forbindelse'", () => {
    for (const failure of ["server", "noget-ukendt"]) {
      const { unmount } = render(<BootScreen failure={failure} onRetry={() => {}} onLogin={() => {}} />);
      expect(screen.getByText("EatSafe kunne ikke starte")).toBeTruthy();
      expect(screen.getByText("Vi kunne ikke få kontakt til tjenesten. Prøv igen om lidt.")).toBeTruthy();
      expect(screen.queryByText(/Ingen forbindelse/)).toBeNull();
      expect(screen.queryByText(/Log ind/i)).toBeNull();
      unmount();
    }
  });
  it("udløbet session: Du skal logge ind igen med Log ind, ikke Prøv igen", () => {
    const onLogin = vi.fn();
    render(<BootScreen failure="expired" onRetry={() => {}} onLogin={onLogin} />);
    expect(screen.getByText("Du skal logge ind igen")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Prøv igen" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Log ind" }));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});

describe("BootScreen: gentagne tryk", () => {
  it("flere hurtige tryk starter kun ét forsøg, og knappen er slået fra, mens det kører", async () => {
    let done;
    const onRetry = vi.fn(() => new Promise((r) => { done = r; }));
    render(<BootScreen failure="server" onRetry={onRetry} onLogin={() => {}} />);
    const btn = screen.getByRole("button", { name: "Prøv igen" });
    await act(async () => { fireEvent.click(btn); fireEvent.click(btn); fireEvent.click(btn); });
    expect(onRetry).toHaveBeenCalledTimes(1);
    const busy = screen.getByRole("button", { name: "Prøver igen …" });
    expect(busy.disabled).toBe(true);
    await act(async () => { done(); });
    expect(screen.getByRole("button", { name: "Prøv igen" }).disabled).toBe(false);
  });
});
