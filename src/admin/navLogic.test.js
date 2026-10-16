// @ts-nocheck
import { describe, it, expect } from "vitest";
import { NAV_GROUPS, NAV_ITEMS, groupOfSection, formatBadge, worstTone } from "./navLogic.js";

describe("menuens navne og ruter", () => {
  it("rute-id'erne er uændrede, og de nye navne er konsekvente", () => {
    expect(NAV_ITEMS.map((i) => i.id)).toEqual(["dashboard", "todo", "submissions", "recalls", "tickets", "products", "knowledge", "missing", "import", "history", "users", "family", "notifications", "onboarding", "errors", "ai-usage", "audit"]);
    const label = Object.fromEntries(NAV_ITEMS.map((i) => [i.id, i.label]));
    expect(label.todo).toBe("Opgaver");
    expect(label.onboarding).toBe("Frafald i onboarding");
    expect(label.history).toBe("Ændringshistorik");
    for (const keep of [["dashboard", "Dashboard"], ["submissions", "Indsendelser"], ["recalls", "Tilbagekald"], ["tickets", "Tickets"], ["products", "Produkter"], ["knowledge", "Leksikon"], ["import", "Import"], ["users", "Brugere"], ["family", "Familie"], ["notifications", "Notifikationer"], ["errors", "Fejl"], ["ai-usage", "AI-forbrug"], ["audit", "Aktivitetslog"]]) expect(label[keep[0]]).toBe(keep[1]);
    // Siden viser stregkoder, som brugerne har scannet uden at finde produktet (ikke produkter uden EAN)
    expect(label.missing).toBe("Ukendte stregkoder");
  });
  it("de fem kategorier og unikke id'er", () => {
    expect(NAV_GROUPS.map((g) => g.label)).toEqual(["Overblik", "Til behandling", "Indhold & data", "Brugere & kommunikation", "Drift"]);
    expect(new Set(NAV_ITEMS.map((i) => i.id)).size).toBe(NAV_ITEMS.length);
  });
  it("samme funktion har samme ikon, og forskellige sider deler ikke ikon", () => {
    const icons = NAV_ITEMS.map((i) => i.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });
  it("groupOfSection finder gruppen", () => {
    expect(groupOfSection("tickets")).toBe("review");
    expect(groupOfSection("audit")).toBe("system");
    expect(groupOfSection("findes-ikke")).toBeUndefined();
  });
});

describe("antalsmarkeringer", () => {
  it("formatBadge: skjult ved 0, ugyldigt og ikke indlæst; 99+ over 99", () => {
    for (const v of [0, -3, NaN, undefined, null, "", "abc", Infinity]) expect(formatBadge(v)).toBe("");
    expect(formatBadge(1)).toBe("1");
    expect(formatBadge(9)).toBe("9");
    expect(formatBadge(10)).toBe("10");
    expect(formatBadge(99)).toBe("99");
    expect(formatBadge(100)).toBe("99+");
    expect(formatBadge(12345)).toBe("99+");
    expect(formatBadge("7")).toBe("7");
    expect(formatBadge(9.8)).toBe("9");
  });
  it("worstTone: rød slår gul slår neutral", () => {
    expect(worstTone([])).toBe("neutral");
    expect(worstTone(["neutral", "warn"])).toBe("warn");
    expect(worstTone(["warn", "crit", "neutral"])).toBe("crit");
  });
});
