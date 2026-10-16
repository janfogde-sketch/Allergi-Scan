import { describe, it, expect } from "vitest";
import { inviteStatus, ownerOf, buildFromTables, filterOwners } from "./familyLogic.js";

const NOW = Date.parse("2026-10-16T12:00:00Z");
describe("inviteStatus", () => {
  it("en ventende invitation med overskredet udløb er udløbet; andre statusser røres ikke", () => {
    expect(inviteStatus("pending", "2026-10-04T10:00:00Z", NOW)).toBe("expired");
    expect(inviteStatus("pending", "2026-10-17T10:00:00Z", NOW)).toBe("pending");
    expect(inviteStatus("accepted", "2026-10-04T10:00:00Z", NOW)).toBe("accepted");
    expect(inviteStatus("revoked", "2026-10-04T10:00:00Z", NOW)).toBe("revoked");
  });
});
describe("buildFromTables", () => {
  const users = [{ id: "u1", name: "Anna", email: "a@x.dk" }, { id: "u2", name: "Bo", email: "b@x.dk" }];
  const members = [{ id: "m1", name: "Anna", user_id: "u1", family_owner_id: null, created_at: "2026-10-08T10:00:00Z" }, { id: "m2", name: "Barn", user_id: null, family_owner_id: "u1", created_at: "2026-10-09T10:00:00Z" }];
  const invites = [
    { id: "i1", status: "pending", created_at: "2026-10-03T10:00:00Z", expires_at: "2026-10-04T10:00:00Z", invited_by: "u1", accepted_by: null },
    { id: "i2", status: "accepted", created_at: "2026-10-05T10:00:00Z", expires_at: "2026-10-06T10:00:00Z", accepted_at: "2026-10-05T11:00:00Z", invited_by: "u1", accepted_by: "u2", requested_by: "u2" },
  ];
  it("en række uden ejer hører til brugeren selv (ingen 'ukendt bruger'), og børn tælles", () => {
    expect(ownerOf(members[0])).toBe("u1");
    const b = buildFromTables(members, invites, users);
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0]).toMatchObject({ owner_id: "u1", name: "Anna", profiles: 2, child_profiles: 1, accepted_invites: 1, pending_invites: 0 });
  });
  it("udløbet ventende vises som udløbet og tælles ikke som afventende; forespørgsler markeres", () => {
    const b = buildFromTables(members, invites, users);
    expect(b.invites.find((i) => i.id === "i1").status).toBe("expired");
    expect(b.invites.find((i) => i.id === "i2")).toMatchObject({ is_request: true, accepted_name: "Bo", inviter_name: "Anna" });
  });
  it("detaljer har ejer, medlemmer og invitationer, og ingen allergifelter", () => {
    const d = buildFromTables(members, invites, users).detail("u1");
    expect(d.owner.email).toBe("a@x.dk");
    expect(d.members.map((m) => m.is_child)).toEqual([false, true]);
    expect(d.invites).toHaveLength(2);
    expect(JSON.stringify(d)).not.toMatch(/allergen/);
  });
  it("søgning filtrerer på navn og e-mail", () => {
    const rows = [{ name: "Anna", email: "a@x.dk" }, { name: "Bo", email: "bo@y.dk" }];
    expect(filterOwners(rows, "y.dk")).toHaveLength(1);
    expect(filterOwners(rows, "  ")).toHaveLength(2);
  });
});
