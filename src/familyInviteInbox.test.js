// @ts-nocheck
// Invitationer til sheetet: e-mail-match og link fra mailen (fx Facebook-login) samles uden dubletter.
import { describe, it, expect } from "vitest";
import { mergeInvites, nextInvite } from "./familyInviteInbox.js";

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
