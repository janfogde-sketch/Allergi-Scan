import { describe, it, expect } from "vitest";
import { ticketTitleParts, ticketOrigin, originLabel, effectivePriority, filterTickets, statusCounts, progress, buildActivity, redact, buildTicketPrompt, buildManyPrompts, isLegalCandidate, contextPriority } from "./ticketsLogic.js";

const T = (o = {}) => ({ id: "t1", type: "bug", description: "Knappen på scanskærmen virker ikke. Når man trykker på Scan, sker der ingenting.", status: "open", created_at: "2026-10-10T10:00:00Z", submitted_by: "u1", context: { screen_label: "Scan", user_email: "bruger@example.com", user_id: "u1", allergens: ["mælk"] }, ...o });

describe("Tickets: logik", () => {
  it("titel og uddrag; tom beskrivelse", () => {
    expect(ticketTitleParts("Knappen på scanskærmen virker ikke. Når man trykker").title).toBe("Knappen på scanskærmen virker ikke.");
    expect(ticketTitleParts("").title).toBe("(ingen beskrivelse)");
  });
  it("interne opgaver vises ikke som Anonym; brugerindsendelser skelnes", () => {
    const internal = T({ submitted_by: null, context: { source: "claude-session 30-09-2026", kind: "opgave", priority: "høj" } });
    expect(ticketOrigin(internal)).toBe("internal");
    expect(originLabel(internal)).toBe("Intern opgave");
    expect(originLabel(T())).toBe("Brugerindsendelse");
    expect(originLabel(T({ submitted_by: null, context: {} }))).toBe("Brugerindsendelse uden konto");
  });
  it("prioritet: egen først, så ældre kontekstprioritet, ellers normal", () => {
    expect(effectivePriority(T(), { priority: "critical" })).toBe("critical");
    expect(effectivePriority(T({ context: { priority: "kritisk" } }), null)).toBe("critical");
    expect(contextPriority(T({ context: { priority: "mellem" } }))).toBe("normal");
    expect(effectivePriority(T(), null)).toBe("normal");
  });
  it("filtre: fane, status, kategori, prioritet, ansvarlig, lanceringsblokering, søgning i beskrivelse; sortering", () => {
    const a = T({ id: "a", created_at: "2026-10-01T00:00:00Z" });
    const b = T({ id: "b", type: "ui", status: "in_progress", description: "Farven er forkert", created_at: "2026-10-05T00:00:00Z" });
    const c = T({ id: "c", status: "resolved", created_at: "2026-10-09T00:00:00Z" });
    const all = [a, b, c];
    const ctx = { meta: { a: { priority: "high", launch_blocking: true }, b: { priority: "low", updated_at: "2026-10-20T00:00:00Z" } }, todos: { a: { assignee_id: "jan" }, b: {} } };
    const ids = (f) => filterTickets(all, f, ctx).map((t) => t.id);
    expect(ids({ tab: "active" })).toEqual(["b", "a"]);
    expect(ids({ tab: "all" })).toEqual(["c", "b", "a"]);
    expect(ids({ tab: "all", status: "resolved" })).toEqual(["c"]);
    expect(ids({ tab: "all", category: "ui" })).toEqual(["b"]);
    expect(ids({ tab: "all", priority: "high" })).toEqual(["a"]);
    expect(ids({ tab: "all", assignee: "jan" })).toEqual(["a"]);
    expect(ids({ tab: "all", assignee: "none" })).toEqual(["c", "b"]);
    expect(ids({ tab: "all", blocking: true })).toEqual(["a"]);
    expect(ids({ tab: "all", q: "farven" })).toEqual(["b"]);
    expect(ids({ tab: "all", sort: "oldest" })).toEqual(["a", "b", "c"]);
    expect(ids({ tab: "all", sort: "activity" })[0]).toBe("b"); // b har den nyeste aktivitet (meta opdateret senere)
    expect(statusCounts(all)).toMatchObject({ active: 2, open: 1, in_progress: 1, resolved: 1, all: 3 });
  });
  it("fremdrift og mulig lanceringsblokering (kun markeret til gennemgang, aldrig automatisk)", () => {
    expect(progress([{ status: "done" }, { status: "todo" }]).text).toBe("1 af 2 punkter afsluttet");
    expect(progress([]).text).toBe("");
    expect(isLegalCandidate(T({ description: "[Privatlivspolitik · IKKE FÆRDIG] Udkast" }))).toBe(true);
    expect(isLegalCandidate(T({ description: "[Privatlivspolitik · IKKE FÆRDIG] Udkast", status: "resolved" }))).toBe(false);
    expect(isLegalCandidate(T())).toBe(false);
  });
  it("aktivitet: genåbning, afslutning, ansvarlig, prioritet, flag og kommentarer samlet nyeste først", () => {
    const names = { jan: "Jan", bjorn: "Bjørn" };
    const nameOf = (id) => names[id] || "Ukendt";
    const act = buildActivity({
      todoActivity: [
        { id: 1, created_at: "2026-10-02T10:00:00Z", changed_by: "jan", via: "admin", field: "status", old_value: "todo", new_value: "done" },
        { id: 2, created_at: "2026-10-03T10:00:00Z", changed_by: "jan", via: "admin", field: "status", old_value: "done", new_value: "todo" },
        { id: 3, created_at: "2026-10-04T10:00:00Z", changed_by: "bjorn", via: "admin", field: "assignee_id", old_value: null, new_value: "bjorn" },
        { id: 4, created_at: "2026-10-04T11:00:00Z", changed_by: "bjorn", via: "ticket", field: "priority", old_value: "normal", new_value: "high" },
      ],
      metaLog: [{ id: 9, created_at: "2026-10-05T10:00:00Z", changed_by: "jan", field: "priority", old_value: "normal", new_value: "critical" }, { id: 10, created_at: "2026-10-05T11:00:00Z", changed_by: "jan", field: "launch_blocking", old_value: "false", new_value: "true" }],
      comments: [{ id: "c", created_at: "2026-10-06T10:00:00Z", author_id: "bjorn", body: "Ser godt ud" }],
    }, nameOf);
    expect(act.map((a) => a.kind)).toEqual(["comment", "flag", "priority", "assignee", "reopen", "resolved"]);
    expect(act.find((a) => a.kind === "priority").text).toBe("Prioritet: Normal → Kritisk");
    expect(act.find((a) => a.kind === "assignee").text).toBe("Ansvarlig: Ingen → Bjørn");
    expect(act.find((a) => a.kind === "reopen").actor).toBe("Jan");
  });
  it("redact fjerner e-mails, tokens og nøgler", () => {
    const r = redact("Mail bruger@example.com, Bearer abcdefghijklmnop123, jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abcdefgh1234, nøgle sk-abcdefghijklmnopqrst");
    expect(r).not.toMatch(/bruger@example|abcdefghijklmnop123|eyJhbGci|sk-abcdef/);
  });
  it("prompt: indeholder titel, problem, skærm, ønsket ændring og acceptkriterier; ingen e-mail, konto-id, allergier eller tokens; ændrer ikke noget", () => {
    const p = buildTicketPrompt(T({ description: "Knappen på scanskærmen virker ikke. Se bruger@example.com og Bearer abcdefghijklmnopqrstu", context: { screen_label: "Scan", user_email: "bruger@example.com", user_id: "u1-secret", allergens: ["mælk"], debug_trace: [{ m: "token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abcdefgh1234" }] } }), { priority: "high", launchBlocking: true, tasks: [{ title: "Tjek iOS", status: "todo" }] });
    for (const must of ["## Titel", "Knappen på scanskærmen virker ikke.", "## Problembeskrivelse", "Skærm/komponent: Scan", "## Hvad ønskes ændret", "## Acceptkriterier", "Punkt: Tjek iOS", "lanceringsblokerende"]) expect(p).toContain(must);
    for (const mustNot of ["bruger@example.com", "u1-secret", "mælk", "abcdefghijklmnopqrstu", "eyJhbGciOiJIUzI1NiJ9"]) expect(p).not.toContain(mustNot);
  });
  it("flere prompts er tydeligt adskilt og kan identificeres", () => {
    const text = buildManyPrompts([{ ticket: T({ id: "x1" }) }, { ticket: T({ id: "x2", description: "Anden fejl her. Mere tekst" }) }]);
    expect(text).toContain("Ticket 1 af 2");
    expect(text).toContain("Ticket 2 af 2");
    expect(text).toContain("(id: x1)");
    expect(text).toContain("(id: x2)");
  });
});
