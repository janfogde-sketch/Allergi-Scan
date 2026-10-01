// @ts-nocheck
// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SafetyInfoModal, { SAFETY_INFO_PARAGRAPHS } from "./SafetyInfoModal.jsx";
import { ENumberPicker } from "./AllergenPicker.jsx";

afterEach(cleanup);

describe("SafetyInfoModal", () => {
  it("viser titel, vejledende tekst og én knap, der kalder onAcknowledge", () => {
    const onAcknowledge = vi.fn();
    render(<SafetyInfoModal onAcknowledge={onAcknowledge} />);
    expect(screen.getByRole("dialog", { name: "Vigtig sikkerhedsinformation" })).toBeTruthy();
    SAFETY_INFO_PARAGRAPHS.forEach(p => expect(screen.getByText(p)).toBeTruthy());
    expect(SAFETY_INFO_PARAGRAPHS[0]).toMatch(/^EatSafe er vejledende\./);
    expect(screen.queryByText(/Beta/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Jeg forstår – kom i gang" }));
    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });
});

describe("ENumberPicker: eksplicit afkrydsning pr. række", () => {
  it("afkrydsningsboksen vælger/fravælger, og info-knappen folder kun detaljer ud", () => {
    const onChange = vi.fn();
    render(<ENumberPicker selected={["E101"]} onChange={onChange} />);
    const on = screen.getAllByRole("checkbox").find(c => c.getAttribute("aria-label").startsWith("E101 "));
    const off = screen.getAllByRole("checkbox").find(c => c.getAttribute("aria-label").startsWith("E100 "));
    expect(on.getAttribute("aria-checked")).toBe("true");
    expect(off.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(off);
    expect(onChange).toHaveBeenLastCalledWith(["E101", "E100"]);
    fireEvent.click(on);
    expect(onChange).toHaveBeenLastCalledWith([]);
    onChange.mockClear();
    fireEvent.click(screen.getAllByRole("button", { name: /^Vis information om E100/ })[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
