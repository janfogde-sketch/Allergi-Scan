// @ts-nocheck
// @vitest-environment jsdom
// Klump 6a (6. okt. 2026): fælles ark/dialog-adfærd (F4-7), toasts (F4-8) og fokus ved skærmskift (F4-6).
import React, { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { ConfirmDialog, InfoSheet, ToastHost, showToast } from "./SharedComponents.jsx";
import { focusScreenHeading } from "./useScreenFocus.js";

afterEach(cleanup);

describe("ark og dialoger (F4-7)", () => {
  it("har rolle og titel, får fokus og lukker på Esc", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Slet liste?" message="Kan ikke fortrydes." confirmLabel="Slet" onConfirm={() => {}} onCancel={onCancel} />);
    const dlg = screen.getByRole("alertdialog", { name: "Slet liste?" });
    expect(document.activeElement).toBe(dlg);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("kun det øverste ark reagerer på Esc", () => {
    const outer = vi.fn(), inner = vi.fn();
    render(<>
      <InfoSheet title="Info" onClose={outer}>tekst</InfoSheet>
      <ConfirmDialog title="Sikker?" confirmLabel="Ja" onConfirm={() => {}} onCancel={inner} />
    </>);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it("giver fokus tilbage til knappen, der åbnede arket", () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return <>
        <button onClick={() => setOpen(true)}>Åbn</button>
        {open && <InfoSheet title="Info" onClose={() => setOpen(false)}>tekst</InfoSheet>}
      </>;
    }
    render(<Harness />);
    const opener = screen.getByText("Åbn");
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(opener);
  });
});

describe("toasts (F4-8)", () => {
  it("er altid i en status-region, og fejl læses op som alert", () => {
    render(<ToastHost />);
    expect(screen.getByRole("status")).toBeTruthy();
    act(() => showToast("Noget fejlede", "error"));
    expect(screen.getByRole("alert").textContent).toContain("Noget fejlede");
  });
});

describe("fokus ved skærmskift (F4-6)", () => {
  it("flytter fokus til skærmens overskrift", () => {
    document.body.innerHTML = '<div class="screen"><div class="screen-title">Historik</div></div>';
    expect(focusScreenHeading()).toBe(true);
    expect(document.activeElement.textContent).toBe("Historik");
  });
});
