// @ts-nocheck
// Adminloggen fra edge-funktionerne (plan-aktivitetslog del B): fejlkoder uden fejltekst, før/efter kun for ændrede felter,
// og en logfejl må aldrig stoppe selve handlingen.
import { describe, it, expect, vi } from "vitest";
import { logAdminEvent, logAccessDenied, fejlkode, feltAendringer } from "../supabase/functions/_shared/adminAudit.ts";

describe("adminAudit", () => {
  it("fejlkode viser kun Postgres-koden, aldrig fejlteksten", () => {
    expect(fejlkode({ code: "23505", message: "duplicate key value (ean)=(570...)" })).toBe("db_23505");
    expect(fejlkode(new Error("hemmelig tekst"))).toBe("ukendt_fejl");
    expect(fejlkode(null)).toBe("ukendt_fejl");
  });
  it("feltAendringer tager kun ændrede felter med, sorteret, og springer updated_at over", () => {
    const r = feltAendringer({ name: "A", brand: "X", allergen_flags: { gluten: "no" }, updated_at: 1 },
      { name: "A", brand: "Y", allergen_flags: { gluten: "yes" }, updated_at: 2 });
    expect(r.felter).toEqual(["allergen_flags", "brand"]);
    expect(r.aendringer[0]).toEqual({ felt: "allergen_flags", fra: { gluten: "no" }, til: { gluten: "yes" } });
    expect(feltAendringer(null, { name: "B" }).aendringer).toEqual([{ felt: "name", fra: null, til: "B" }]);
  });
  it("logAdminEvent kalder log_admin_event med alle felter", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    await logAdminEvent({ rpc }, "a", "produkt_rettet", "products", "p", { felter: ["name"] });
    expect(rpc).toHaveBeenCalledWith("log_admin_event", { p_actor: "a", p_action: "produkt_rettet", p_target_table: "products", p_target_id: "p", p_details: { felter: ["name"] }, p_outcome: "ok" });
    await logAccessDenied({ rpc }, "u", "products");
    expect(rpc).toHaveBeenLastCalledWith("log_admin_event", expect.objectContaining({ p_action: "adgang_naegtet", p_outcome: "afvist", p_details: { funktion: "products" } }));
  });
  it("en fejl i logningen kastes aldrig videre", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(logAdminEvent({ rpc: vi.fn().mockRejectedValue(new Error("net")) }, "a", "x", "y")).resolves.toBeUndefined();
    await expect(logAdminEvent({ rpc: vi.fn().mockResolvedValue({ error: { message: "nej" } }) }, "a", "x", "y")).resolves.toBeUndefined();
    expect(err).toHaveBeenCalledTimes(2);
    err.mockRestore();
  });
});
