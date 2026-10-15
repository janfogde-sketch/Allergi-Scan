// @ts-nocheck
// @vitest-environment jsdom
// Opdatering fra headeren beholder de viste data i stedet for at erstatte dem med en spinner; første indlæsning og filterskift viser stadig spinneren.
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { RefreshContext } from "./RefreshContext.js";
import ErrorsSection from "./sections/ErrorsSection.jsx";
import MissingSection from "./sections/MissingSection.jsx";
import HistorySection from "./sections/HistorySection.jsx";

afterEach(cleanup);
const errors = [{ id: "e1", status: "open", message: "Fejl ABC", count: 1, last_seen: "2026-10-15T08:00:00Z", first_seen: "2026-10-15T08:00:00Z", context: {} }];
const missing = [{ ean: "5701234000011", count: 2 }];
const ui = (el, refreshing) => <RefreshContext.Provider value={refreshing}>{el}</RefreshContext.Provider>;

describe("opdatering beholder data", () => {
  it("Fejl: spinner ved almindelig indlæsning, men listen står under en opdatering", () => {
    const el = <ErrorsSection errors={errors} loading filter="all" setFilter={() => {}} load={() => {}} setStatus={() => {}} />;
    const { container, unmount } = render(ui(el, false));
    expect(container.textContent).toContain("Henter…");
    expect(container.textContent).not.toContain("Fejl ABC");
    unmount();
    const r = render(ui(el, true));
    expect(r.container.textContent).toContain("Fejl ABC");
    expect(r.container.textContent).not.toContain("Henter…");
  });
  it("uden data vises spinneren også under en opdatering", () => {
    const el = <ErrorsSection errors={[]} loading filter="all" setFilter={() => {}} load={() => {}} setStatus={() => {}} />;
    const { container } = render(ui(el, true));
    expect(container.textContent).toContain("Henter…");
  });
  it("Ukendte stregkoder og Ændringshistorik følger samme regel", () => {
    const m = <MissingSection missingEans={missing} missingEansLoading loadMissingEans={() => {}} deleteMissingEan={() => {}} />;
    let r = render(ui(m, true));
    expect(r.container.textContent).toContain("5701234000011");
    r.unmount();
    const h = <HistorySection revisionLog={[]} revisionLogLoading revisionLogFilter="all" setRevisionLogFilter={() => {}} loadRevisionLog={() => {}} />;
    r = render(ui(h, true));
    expect(r.container.textContent).toContain("Henter ændringshistorik…");
  });
});
