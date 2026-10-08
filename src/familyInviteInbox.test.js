// @ts-nocheck
// Invitationer til sheetet: e-mail-match og link fra mailen (fx Facebook-login) samles uden dubletter.
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { mergeInvites, nextInvite, parseInviteToken, linkStatusMessage, storeInviteToken, readInviteToken, clearInviteToken, recentInviteLinkFollowed, INVITE_ROUTE_WINDOW_MS } from "./familyInviteInbox.js";

const a = { id: "a", inviter_first_name: "Jan", expires_at: "2026-10-04T10:00:00Z" };
const b = { id: "b", inviter_first_name: "Bjørn", expires_at: "2026-10-04T11:00:00Z" };

describe("mergeInvites", () => {
  it("returnerer e-mail-invitationerne uændret, når der ikke er et link", () => {
    expect(mergeInvites([a], null, null)).toEqual([a]);
    expect(mergeInvites(undefined, null, null)).toEqual([]);
  });
  it("tilføjer linkets invitation først, markeret med tokenet (fx Facebook-bruger med en anden adresse)", () => {
    const res = mergeInvites([a], b, "tok-b");
    expect(res.map(i => i.id)).toEqual(["b", "a"]);
    expect(res[0].viaToken).toBe("tok-b");
    expect(res[1].viaToken).toBeUndefined();
  });
  it("viser en invitation, der findes begge steder, kun én gang", () => {
    const res = mergeInvites([a], a, "tok-a");
    expect(res).toHaveLength(1);
    expect(res[0].viaToken).toBe("tok-a");
  });
  it("bevarer typen på et delt link, så sheetet kan bede om afsenderens godkendelse", () => {
    const link = { id: "c", kind: "link", inviter_first_name: "Jan", expires_at: "2026-10-04T12:00:00Z", awaiting: false };
    const res = mergeInvites([], link, "tok-c");
    expect(res[0].kind).toBe("link");
    expect(res[0].viaToken).toBe("tok-c");
  });
  it("ignorerer et link uden token eller uden gyldig invitation", () => {
    expect(mergeInvites([a], b, null)).toEqual([a]);
    expect(mergeInvites([a], {}, "tok")).toEqual([a]);
  });
  it("ændrer ikke inputlisten", () => {
    const input = [a];
    mergeInvites(input, a, "tok");
    expect(input[0].viaToken).toBeUndefined();
  });
});

describe("nextInvite", () => {
  it("springer udsatte invitationer over", () => {
    expect(nextInvite([a, b], ["a"]).id).toBe("b");
    expect(nextInvite([a, b], [])).toBe(a);
    expect(nextInvite([a], ["a"])).toBeNull();
  });
});

const TOKEN = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718";

describe("parseInviteToken: et indsat link eller en kode (fx når linket blev åbnet i en anden browser)", () => {
  it("læser tokenet fra det fulde link, med og uden afsluttende tegn", () => {
    expect(parseInviteToken(`https://www.eatsafe.dk/invite/${TOKEN}`)).toBe(TOKEN);
    expect(parseInviteToken(`  https://www.eatsafe.dk/invite/${TOKEN}/  `)).toBe(TOKEN);
    expect(parseInviteToken(`https://www.eatsafe.dk/invite/${TOKEN}?utm=x`)).toBe(TOKEN);
    expect(parseInviteToken(`Her er linket: https://www.eatsafe.dk/invite/${TOKEN} tak!`)).toBe(TOKEN);
  });
  it("læser tokenet fra ?invite= og fra en ren kode", () => {
    expect(parseInviteToken(`https://www.eatsafe.dk/?invite=${TOKEN}&login=1`)).toBe(TOKEN);
    expect(parseInviteToken(TOKEN)).toBe(TOKEN);
  });
  it("afviser alt, der ikke ligner et token", () => {
    for (const bad of ["", "   ", null, undefined, "hej", "https://www.eatsafe.dk/", "https://www.eatsafe.dk/invite/kort", "https://www.eatsafe.dk/invite/", `x${"y".repeat(200)}`]) {
      expect(parseInviteToken(bad), String(bad)).toBeNull();
    }
  });
});

describe("linkStatusMessage: forklaring, når et gemt link ikke kan bruges", () => {
  it("har en tydelig tekst for de tilfælde, brugeren skal kende", () => {
    for (const s of ["locked", "used", "expired", "revoked", "awaiting", "unknown"]) expect(linkStatusMessage(s), s).toMatch(/\S{10}/);
    expect(linkStatusMessage("locked")).toMatch(/allerede brugt af en anden/);
    expect(linkStatusMessage("awaiting")).toMatch(/venter/);
  });
  it("siger intet, når det ikke er en fejl for brugeren (egen invitation, selv brugt, kan bruges, ukendt værdi)", () => {
    for (const s of ["own", "mine", "ok", "noget-andet", null, undefined]) expect(linkStatusMessage(s), String(s)).toBeNull();
  });
});

describe("startskærm efter et fulgt invitationslink (første besøg genindlæser siden)", () => {
  beforeEach(() => localStorage.clear());
  it("et nyligt fulgt link betyder login/oprettelse som startskærm", () => {
    storeInviteToken(TOKEN, 1_000_000);
    expect(readInviteToken()).toBe(TOKEN);
    expect(recentInviteLinkFollowed(1_000_000 + 60_000)).toBe(true);
  });
  it("et gammelt token styrer ikke længere startskærmen", () => {
    storeInviteToken(TOKEN, 1_000_000);
    expect(recentInviteLinkFollowed(1_000_000 + INVITE_ROUTE_WINDOW_MS)).toBe(false);
    expect(recentInviteLinkFollowed(1_000_000 + 24 * 3600e3)).toBe(false);
  });
  it("uden token, uden tidsstempel eller efter rydning er svaret nej", () => {
    expect(recentInviteLinkFollowed()).toBe(false);
    localStorage.setItem("as_pending_invite", TOKEN); // et token fra før tidsstemplet fandtes
    expect(recentInviteLinkFollowed()).toBe(false);
    storeInviteToken(TOKEN);
    expect(recentInviteLinkFollowed()).toBe(true);
    clearInviteToken();
    expect(readInviteToken()).toBeNull();
    expect(recentInviteLinkFollowed()).toBe(false);
  });
  it("et tidsstempel i fremtiden (forkert ur) tæller ikke", () => {
    storeInviteToken(TOKEN, 5_000_000);
    expect(recentInviteLinkFollowed(1_000_000)).toBe(false);
  });
});
