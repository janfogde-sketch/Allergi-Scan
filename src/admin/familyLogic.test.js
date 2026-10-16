import { describe, it, expect } from "vitest";
import { inviteStatus, ownerOf, memberType, memberLabel, memberCount, buildFromTables, filterOwners } from "./familyLogic.js";

const NOW = Date.parse("2026-10-16T12:00:00Z");
describe("inviteStatus", () => {
  it("en ventende invitation med overskredet udløb er udløbet; andre statusser røres ikke", () => {
    expect(inviteStatus("pending", "2026-10-04T10:00:00Z", NOW)).toBe("expired");
    expect(inviteStatus("pending", "2026-10-17T10:00:00Z", NOW)).toBe("pending");
    expect(inviteStatus("accepted", "2026-10-04T10:00:00Z", NOW)).toBe("accepted");
    expect(inviteStatus("revoked", "2026-10-04T10:00:00Z", NOW)).toBe("revoked");
  });
});

describe("medlemstype (16. okt. 2026: Emma var fejlagtigt 'voksen med egen konto')", () => {
  it("en profil, hvor user_id er ejeren (som appen opretter dem), er en børneprofil, ikke en voksen med egen konto", () => {
    const emma = { id: "m1", name: "Emma", birth_year: 2019, user_id: "alex", family_owner_id: null };
    expect(memberType(emma, ownerOf(emma))).toBe("child");
    expect(memberLabel({ type: "child", birth_year: 2019 }, 2026)).toBe("Børneprofil");
  });
  it("en profil uden user_id er også en børneprofil; en anden konto end ejeren gættes ikke", () => {
    expect(memberType({ user_id: null, family_owner_id: "alex" }, "alex")).toBe("child");
    expect(memberType({ user_id: "bo", family_owner_id: "alex" }, "alex")).toBe("unknown");
    expect(memberLabel({ type: "unknown" })).toBe("Medlemstype ukendt");
    expect(memberLabel({ type: "adult" })).toBe("Voksen med egen konto");
  });
  it("alder eller navn ændrer aldrig typen; en 18+ profil uden konto kaldes ikke børneprofil", () => {
    expect(memberLabel({ type: "child", birth_year: 1980 })).toBe("Profil uden egen konto");
    expect(memberType({ user_id: "alex", name: "Voksen", birth_year: 1980 }, "alex")).toBe("child");
  });
  it("medlemsantal = profiler + forbundne voksne; ejeren tælles ikke med", () => {
    expect(memberCount({ profiles: 1, connected: 0 })).toBe(1);
    expect(memberCount({ profiles: 2, connected: 1 })).toBe(3);
    expect(memberCount({})).toBe(0);
  });
});

describe("buildFromTables", () => {
  const users = [{ id: "u1", name: "Anna", email: "a@x.dk" }, { id: "u2", name: "Bo", email: "b@x.dk" }];
  const members = [{ id: "m1", name: "Emma", user_id: "u1", family_owner_id: null, birth_year: 2019, created_at: "2026-10-08T10:00:00Z" }, { id: "m2", name: "Barn", user_id: null, family_owner_id: "u1", created_at: "2026-10-09T10:00:00Z" }];
  const invites = [
    { id: "i1", status: "pending", kind: "email", created_at: "2026-10-03T10:00:00Z", expires_at: "2026-10-04T10:00:00Z", invited_by: "u1", accepted_by: null },
    { id: "i2", status: "accepted", kind: "link", created_at: "2026-10-05T10:00:00Z", expires_at: "2026-10-06T10:00:00Z", accepted_at: "2026-10-05T11:00:00Z", invited_by: "u1", accepted_by: "u2", requested_by: "u2" },
    { id: "i3", status: "accepted", kind: "email", created_at: "2026-10-02T10:00:00Z", expires_at: "2026-10-03T10:00:00Z", accepted_at: "2026-10-02T10:01:00Z", invited_by: "u1", accepted_by: null },
  ];
  it("en række uden ejer hører til brugeren selv (ingen 'ukendt bruger'); profiler og forbundne voksne tælles hver for sig", () => {
    const b = buildFromTables(members, invites, users);
    expect(b.rows).toHaveLength(1);
    expect(b.rows[0]).toMatchObject({ owner_id: "u1", name: "Anna", profiles: 2, connected: 1, accepted_invites: 2, pending_invites: 0 });
    expect(memberCount(b.rows[0])).toBe(3);
  });
  it("udløbet ventende vises som udløbet; forespørgsler og type markeres; accepteret uden modtager forbliver accepteret", () => {
    const b = buildFromTables(members, invites, users);
    expect(b.invites.find((i) => i.id === "i1")).toMatchObject({ status: "expired", kind: "email" });
    expect(b.invites.find((i) => i.id === "i2")).toMatchObject({ is_request: true, accepted_name: "Bo", inviter_name: "Anna", kind: "link" });
    expect(b.invites.find((i) => i.id === "i3")).toMatchObject({ status: "accepted", accepted_by: null, accepted_name: null });
  });
  it("detaljer: børneprofiler og forbundne voksne har hver sin type, og ingen allergifelter", () => {
    const d = buildFromTables(members, invites, users).detail("u1");
    expect(d.owner.email).toBe("a@x.dk");
    expect(d.members.map((m) => `${m.name}:${m.type}`).sort()).toEqual(["Barn:child", "Bo:adult", "Emma:child"]);
    expect(d.invites).toHaveLength(3);
    expect(JSON.stringify(d)).not.toMatch(/allergen/);
  });
  it("søgning filtrerer på navn og e-mail", () => {
    const rows = [{ name: "Anna", email: "a@x.dk" }, { name: "Bo", email: "bo@y.dk" }];
    expect(filterOwners(rows, "y.dk")).toHaveLength(1);
    expect(filterOwners(rows, "  ")).toHaveLength(2);
  });
});
