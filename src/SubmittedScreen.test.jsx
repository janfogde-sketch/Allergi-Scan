// @ts-nocheck
// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SubmittedScreen from "./SubmittedScreen.jsx";
import { NavigationProvider } from "./NavigationContext.jsx";
import { normalizeProductName } from "./helpers.js";

afterEach(cleanup);
const setup = (props = {}) => {
  const setScreen = vi.fn();
  const p = { notFoundEan: "5711070908312", proposedName: "CHOKOBÆR", setNotFoundStep: vi.fn(), setProposedName: vi.fn(), setProposedFlags: vi.fn(), setProposedNutrition: vi.fn(), setProposedNotes: vi.fn(), setOcrText: vi.fn(), ...props };
  render(<NavigationProvider value={{ setScreen }}><SubmittedScreen {...p} /></NavigationProvider>);
  return { setScreen, p };
};

describe("normalizeProductName", () => {
  it("STORE BOGSTAVER bliver normal formatering, blandet case røres ikke", () => {
    expect(normalizeProductName("CHOKOBÆR")).toBe("Chokobær");
    expect(normalizeProductName("ØKOLOGISK HAVREGRYN")).toBe("Økologisk havregryn");
    expect(normalizeProductName("Arla Skyr")).toBe("Arla Skyr");
    expect(normalizeProductName("  ")).toBe("");
  });
});

describe("SubmittedScreen", () => {
  it("viser tak, produktnavn i normal formatering, EAN og tre punkter, uden emoji og marketing", () => {
    setup();
    expect(screen.getByText("Tak for din hjælp!")).toBeTruthy();
    expect(screen.getByText("Chokobær")).toBeTruthy();
    expect(screen.getByText(/er sendt til godkendelse/)).toBeTruthy();
    expect(screen.getByText("EAN 5711070908312")).toBeTruthy();
    expect(screen.getByText("Vi gennemgår din indsendelse")).toBeTruthy();
    expect(screen.getByText("Du får besked, når produktet er godkendt")).toBeTruthy();
    expect(screen.getByText("Produktet bliver tilgængeligt i EatSafe")).toBeTruthy();
    expect(screen.queryByText(/gavn af dit bidrag/)).toBeNull();
    expect(screen.queryByText(/Søg efter alternativer/)).toBeNull();
    expect(document.body.textContent).not.toContain("🙏");
  });
  it("Scan nyt produkt nulstiller og går til Scan", () => {
    const { setScreen, p } = setup();
    fireEvent.click(screen.getByText("Scan nyt produkt"));
    expect(p.setNotFoundStep).toHaveBeenCalledWith(1);
    expect(setScreen).toHaveBeenCalled();
  });
});
