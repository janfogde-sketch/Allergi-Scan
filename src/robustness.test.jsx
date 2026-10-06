// @ts-nocheck
// @vitest-environment jsdom
// Klump 5 (6. okt. 2026): F2-4 fejltilstand, F2-5 ErrorBoundary-varianter, F2-6 offline-cache ryddes.
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("./errorReporter.js", () => ({ reportError: vi.fn() }));

import { ErrorBoundary } from "./ErrorBoundary.jsx";
import { LoadErrorBox } from "./SharedComponents.jsx";
import { saveToOfflineCache, getFromOfflineCache, clearOfflineCache } from "./useOffline.js";

afterEach(cleanup);

function Boom() { throw new Error("boom"); }

describe("ErrorBoundary (F2-5)", () => {
  it("viser fejlsiden i stedet for en hvid skærm", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorBoundary screen="Appen" withStyles><Boom /></ErrorBoundary>);
    expect(screen.getByText("Noget gik galt")).toBeTruthy();
    expect(screen.getByText("Der opstod en uventet fejl. Dine gemte data er ikke påvirket.")).toBeTruthy();
    expect(screen.getByText("Prøv igen").className).toContain("btn-primary");
    expect(screen.getByText("Genstart appen")).toBeTruthy();
  });

  it("silent skjuler kun den fejlende del og kalder onError", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();
    const { container } = render(<div><span>resten</span><ErrorBoundary screen="Menu" silent onError={onError}><Boom /></ErrorBoundary></div>);
    expect(container.textContent).toBe("resten");
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe("LoadErrorBox (F2-4)", () => {
  it("siger hvad der ikke kunne hentes og giver Prøv igen", () => {
    const onRetry = vi.fn();
    render(<LoadErrorBox what="Historikken" onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain("Historikken kunne ikke hentes.Tjek din forbindelse, og prøv igen.");
    fireEvent.click(screen.getByText("Prøv igen"));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("clearOfflineCache (F2-6)", () => {
  it("fjerner gemte resultater fra telefonen", () => {
    saveToOfflineCache("5701234567890", { name: "Test", matchedDanger: ["maelk"] });
    expect(getFromOfflineCache("5701234567890")?.name).toBe("Test");
    clearOfflineCache();
    expect(getFromOfflineCache("5701234567890")).toBeNull();
  });
});
