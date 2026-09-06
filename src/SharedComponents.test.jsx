// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// SharedComponents.test.jsx
// safetyStyle() is the single source of truth for how "safe/spor/farligt"
// is colored and iconed everywhere in the app (SafetyRow, SafetyPill, and
// the search-result status label). A previous version of this logic was
// duplicated three times with subtly different icons — this test locks down
// the one true mapping so a future edit can't silently reintroduce that.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { safetyStyle } from "./SharedComponents.jsx";

describe("safetyStyle", () => {
  it("maps 'danger' to red with an × icon", () => {
    const s = safetyStyle("danger");
    expect(s.color).toBe("var(--red)");
    expect(s.icon).toBe("×");
  });

  it("maps 'warn' to amber with a ! icon", () => {
    const s = safetyStyle("warn");
    expect(s.color).toBe("var(--amber)");
    expect(s.icon).toBe("!");
  });

  it("maps anything else (including 'safe') to green with a ✓ icon", () => {
    expect(safetyStyle("safe").color).toBe("var(--green)");
    expect(safetyStyle("safe").icon).toBe("✓");
    expect(safetyStyle(undefined).icon).toBe("✓");
  });
});
