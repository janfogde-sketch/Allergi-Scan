// @ts-nocheck
import { describe, it, expect } from "vitest";
import { todayKey, isOverdue, dueInfo, sortTodos, urgencyTier, hasValidDue, authorName, fmtDanishDateTime, betaOverview, filterTodos, countByView, viewNeedsDone, myOpenCount, buildTodoPrompt, personName, activityValue, activityActor } from "./todoLogic.js";

const T = (o) => ({ id: "x", title: "t", description: "", status: "todo", priority: "normal", track: "backend", assignee_id: null, due_date: null, created_at: "2026-10-01T08:00:00Z", completed_at: null, ...o });
const TODAY = "2026-10-01";

describe("frister", () => {
  it("todayKey bruger dansk dato (22:30 UTC er næste dag i Danmark)", () => {
    expect(todayKey(new Date("2026-09-30T22:30:00Z"))).toBe("2026-10-01");
  });
  it("overskredet kun hvis åben og fristen er før i dag", () => {
    expect(isOverdue(T({ due_date: "2026-09-30" }), TODAY)).toBe(true);
    expect(isOverdue(T({ due_date: "2026-10-01" }), TODAY)).toBe(false);
    expect(isOverdue(T({ due_date: "2026-09-30", status: "done" }), TODAY)).toBe(false);
    expect(isOverdue(T(), TODAY)).toBe(false);
  });
  it("dueInfo giver i dag / i morgen / i går / dato", () => {
    expect(dueInfo(T({ due_date: "2026-10-01" }), TODAY)).toEqual({ label: "I dag", overdue: false });
    expect(dueInfo(T({ due_date: "2026-10-02" }), TODAY).label).toBe("I morgen");
    expect(dueInfo(T({ due_date: "2026-09-30" }), TODAY)).toEqual({ label: "I går", overdue: true });
    expect(dueInfo(T({ due_date: "2026-11-01" }), TODAY).label).toMatch(/^1\. nov\.?$/);
    expect(dueInfo(T(), TODAY)).toBeNull();
  });
});

describe("sortTodos", () => {
  it("i gang først, så prioritet, så frist; færdige nederst med senest afsluttet øverst", () => {
    const list = [
      T({ id: "low", priority: "low" }),
      T({ id: "done-old", status: "done", completed_at: "2026-09-29T10:00:00Z" }),
      T({ id: "high-late", priority: "high", due_date: "2026-10-09" }),
      T({ id: "high-soon", priority: "high", due_date: "2026-10-02" }),
      T({ id: "doing", status: "doing", priority: "low" }),
      T({ id: "blocked", status: "blocked", priority: "high" }),
      T({ id: "done-new", status: "done", completed_at: "2026-09-30T10:00:00Z" }),
      T({ id: "high-nodate", priority: "high" }),
    ];
    // Smart: høj prioritet + venter først, så høj prioritet (frist stigende), så resten (i gang før skal laves); færdige nederst.
    expect(sortTodos(list, "smart", "2026-10-01").map((t) => t.id)).toEqual(["blocked", "high-soon", "high-late", "high-nodate", "doing", "low", "done-new", "done-old"]);
  });
  it("overskredne frister kommer før høj prioritet uden frist, og høj + overskredet allerførst", () => {
    const today = "2026-10-10";
    const list = [
      T({ id: "high", priority: "high" }),
      T({ id: "late-normal", due_date: "2026-10-05" }),
      T({ id: "late-high", priority: "high", due_date: "2026-10-05" }),
      T({ id: "soon", due_date: "2026-10-20" }),
      T({ id: "plain" }),
    ];
    expect(sortTodos(list, "smart", today).map((t) => t.id)).toEqual(["late-high", "late-normal", "high", "soon", "plain"]);
    expect(urgencyTier(list[2], today)).toBe(0);
  });
  it("manuel sortering: prioritet, frist og senest opdateret", () => {
    const list = [
      T({ id: "a", priority: "low", due_date: "2026-10-01", updated_at: "2026-10-03T00:00:00Z" }),
      T({ id: "b", priority: "high", updated_at: "2026-10-01T00:00:00Z" }),
      T({ id: "c", priority: "normal", due_date: "2026-10-05", updated_at: "2026-10-02T00:00:00Z" }),
    ];
    expect(sortTodos(list, "priority").map((t) => t.id)).toEqual(["b", "c", "a"]);
    expect(sortTodos(list, "due").map((t) => t.id)).toEqual(["a", "c", "b"]);
    expect(sortTodos(list.map((t, i) => ({ ...t, created_at: `2026-10-0${i + 1}T00:00:00Z` })), "newest").map((t) => t.id)).toEqual(["c", "b", "a"]);
  });
  it("ændrer ikke den oprindelige liste", () => {
    const list = [T({ id: "b", priority: "low" }), T({ id: "a", priority: "high" })];
    sortTodos(list);
    expect(list.map((t) => t.id)).toEqual(["b", "a"]);
  });
});

describe("filtre og tællere", () => {
  const me = "u1";
  const list = [
    T({ id: "1", assignee_id: me, title: "Rette push" }),
    T({ id: "2", assignee_id: "u2", track: "design", description: "Auth-mails" }),
    T({ id: "3" }),
    T({ id: "4", status: "done", assignee_id: me }),
    T({ id: "5", status: "blocked", assignee_id: me }),
  ];
  it("visninger", () => {
    const ids = (view) => filterTodos(list, { view }, me).map((t) => t.id);
    expect(ids("open")).toEqual(["1", "2", "3", "5"]);
    expect(ids("mine")).toEqual(["1", "5"]);
    expect(ids("unassigned")).toEqual(["3"]);
    expect(ids("done")).toEqual(["4"]);
    expect(ids("all")).toHaveLength(5);
  });
  it("spor, ansvarlig og søgning (også i beskrivelsen)", () => {
    expect(filterTodos(list, { view: "all", track: "design" }, me).map((t) => t.id)).toEqual(["2"]);
    expect(filterTodos(list, { view: "all", assigneeId: "none" }, me).map((t) => t.id)).toEqual(["3"]);
    expect(filterTodos(list, { view: "all", assigneeId: "u2" }, me).map((t) => t.id)).toEqual(["2"]);
    expect(filterTodos(list, { view: "all", query: "auth-mails" }, me).map((t) => t.id)).toEqual(["2"]);
    expect(filterTodos(list, { view: "all", query: "PUSH" }, me).map((t) => t.id)).toEqual(["1"]);
  });
  it("countByView", () => {
    expect(countByView(list, me)).toEqual({ open: 4, mine: 2, unassigned: 1, done: 1, all: 5 });
  });
  it("countByView bruger serverens antal, til de færdige er hentet", () => {
    const open = list.filter((t) => t.status !== "done");
    expect(countByView(open, me, { doneCount: 42, doneLoaded: false })).toEqual({ open: 4, mine: 2, unassigned: 1, done: 42, all: 46 });
    expect(countByView(list, me, { doneCount: 42, doneLoaded: true }).done).toBe(1);
  });
  it("kun Færdige og Alle kræver de færdige opgaver", () => {
    expect(["open", "mine", "unassigned", "done", "all"].filter(viewNeedsDone)).toEqual(["done", "all"]);
  });
  it("myOpenCount: kun egne åbne opgaver (også ventende), ikke færdige eller andres", () => {
    const l = [
      T({ assignee_id: "jan" }), T({ assignee_id: "jan", status: "blocked" }), T({ assignee_id: "jan", status: "done" }),
      T({ assignee_id: "bjorn", priority: "high" }), T(),
    ];
    expect(myOpenCount(l, "jan")).toBe(2);
    expect(myOpenCount(l, "")).toBe(0);
  });
});

describe("stabil sortering", () => {
  it("opgaver med ens nøgler får samme rækkefølge hver gang (id som sidste nøgle)", () => {
    const list = ["c", "a", "b"].map((id) => T({ id, priority: "normal" }));
    for (const mode of ["smart", "newest", "oldest", "priority", "due"]) {
      expect(sortTodos(list, mode).map((t) => t.id)).toEqual(["a", "b", "c"]);
      expect(sortTodos([...list].reverse(), mode).map((t) => t.id)).toEqual(["a", "b", "c"]);
    }
  });
});

describe("buildTodoPrompt", () => {
  it("indeholder titel, ansvarlig, beskrivelse og kommentarer", () => {
    const admins = [{ id: "u1", name: "Jan", email: "j@x.dk" }];
    const p = buildTodoPrompt(T({ id: "abc", title: "Ryd testdata", description: "Se liste", assignee_id: "u1", due_date: "2026-11-01", link: "https://x.dk" }), admins, [{ author_id: "u1", body: "Tager den i morgen" }]);
    expect(p).toContain("Opgave: Ryd testdata");
    expect(p).toContain("Se liste");
    expect(p).not.toMatch(/Ansvarlig|Frist|Prioritet|Status|id abc/); // ingen intern metadata
    expect(p).toContain("Link: https://x.dk");
    expect(p).toContain("- Jan: Tager den i morgen");
  });
  it("personName falder tilbage til e-mail og Ukendt", () => {
    expect(personName([{ id: "a", name: "", email: "a@x.dk" }], "a")).toBe("a@x.dk");
    expect(personName([], "zzz")).toBe("Ukendt");
    expect(personName([], null)).toBe("");
  });
});

import { activeFilterCount } from "./todoLogic.js";
describe("flere filtre på opgaver", () => {
  const today = "2026-10-13";
  const mk = (id, over = {}) => ({ id, title: id, status: "todo", priority: "normal", track: "backend", assignee_id: null, due_date: null, ...over });
  const list = [mk("a", { priority: "high", due_date: "2026-10-10" }), mk("b", { due_date: "2026-10-18", status: "doing" }), mk("c", { due_date: "2026-11-30" }), mk("d")];
  const ids = (f) => filterTodos(list, { view: "all", ...f }, "me", today).map((t) => t.id);
  it("prioritet, status og frist kan kombineres", () => {
    expect(ids({ priority: "high" })).toEqual(["a"]);
    expect(ids({ status: "doing" })).toEqual(["b"]);
    expect(ids({ due: "overdue" })).toEqual(["a"]);
    expect(ids({ due: "week" })).toEqual(["a", "b"]);
    expect(ids({ due: "none" })).toEqual(["d"]);
    expect(ids({ priority: "normal", due: "week" })).toEqual(["b"]);
  });
  it("tæller aktive filtre (ikke visning eller søgeord)", () => {
    expect(activeFilterCount({})).toBe(0);
    expect(activeFilterCount({ track: "design", due: "overdue" })).toBe(2);
  });
});

describe("kommentarafsender, datoformat og betaoverblik", () => {
  const admins = [{ id: "u1", name: "Jan", email: "j@x.dk" }, { id: "u2", name: "", email: "b@x.dk" }];
  it("authorName opfinder aldrig et navn", () => {
    expect(authorName(admins, null)).toBe("Uden afsender");
    expect(authorName(admins, "u1")).toBe("Jan");
    expect(authorName(admins, "u2")).toBe("b@x.dk");
    expect(authorName(admins, "slettet")).toBe("Tidligere administrator");
  });
  it("datoer vises i dansk tid med år", () => {
    expect(fmtDanishDateTime("2026-10-14T06:15:00Z")).toMatch(/14\. okt\.? 2026/);
    expect(fmtDanishDateTime("2026-10-14T06:15:00Z")).toMatch(/08[.:]15/);
    expect(fmtDanishDateTime(null)).toBe("");
  });
  it("betaOverview tæller kun åbne opgaver og giver ingen procent", () => {
    const list = [
      T({ id: "1", assignee_id: "u1", priority: "high", due_date: "2026-10-01" }),
      T({ id: "2", assignee_id: "u1", status: "blocked" }),
      T({ id: "3" }),
      T({ id: "4", status: "done", assignee_id: "u2" }),
    ];
    const o = betaOverview(list, admins, "2026-10-10");
    expect(o).toMatchObject({ open: 3, blocked: 1, overdue: 1, high: 1, unassigned: 1 });
    expect(o.byAssignee).toEqual([{ id: "u1", name: "Jan", count: 2 }]);
    expect(Object.keys(o)).not.toContain("percent");
  });
  it("søgning finder også spor, ansvarlig og link", () => {
    const list = [T({ id: "x", title: "Abc", track: "design", assignee_id: "u1", link: "https://github.com/pull/9" })];
    const f = (query) => filterTodos(list, { view: "all", query, admins }, "u1").map((t) => t.id);
    expect(f("design")).toEqual(["x"]);
    expect(f("jan")).toEqual(["x"]);
    expect(f("pull/9")).toEqual(["x"]);
  });
});

describe("frister: gyldige og ugyldige", () => {
  it("hasValidDue kræver en rigtig dato", () => {
    expect(hasValidDue({ due_date: "2026-10-20" })).toBe(true);
    for (const v of [null, undefined, "", "abc", "2026-13-45", "2026-02-30", "20.10.2026"]) expect(hasValidDue({ due_date: v })).toBe(false);
  });
  it("ugyldig frist er aldrig overskredet og vises ikke som frist, og tæller som 'uden frist' i filter og overblik", () => {
    const bad = T({ id: "bad", due_date: "2026-13-45" }), none = T({ id: "none", due_date: null }), ok = T({ id: "ok", due_date: "2026-10-20" });
    expect(isOverdue(bad, "2030-01-01")).toBe(false);
    expect(dueInfo(bad, "2026-10-10")).toBeNull();
    expect(filterTodos([bad, none, ok], { view: "open", due: "none" }, "u").map((t) => t.id)).toEqual(["bad", "none"]);
    expect(betaOverview([bad, none, ok, T({ id: "d", status: "done", due_date: null })], []).noDue).toBe(2);
  });
  it("antallet opdateres, når en frist tilføjes eller fjernes", () => {
    const before = [T({ id: "1", due_date: null })];
    expect(betaOverview(before, []).noDue).toBe(1);
    expect(betaOverview([{ ...before[0], due_date: "2026-11-01" }], []).noDue).toBe(0);
    expect(betaOverview([{ ...before[0], due_date: "2026-11-01" }].map((t) => ({ ...t, due_date: null })), []).noDue).toBe(1);
  });
});

describe("historik", () => {
  const admins = [{ id: "a1", name: "Jan", email: "j@x.dk" }];
  it("viser værdier som læsbar tekst", () => {
    expect(activityValue(admins, "status", "doing")).toBe("I gang");
    expect(activityValue(admins, "priority", "high")).toBe("Høj");
    expect(activityValue(admins, "assignee_id", "a1")).toBe("Jan");
    expect(activityValue(admins, "assignee_id", "slettet")).toBe("Tidligere administrator");
    expect(activityValue(admins, "due_date", "2026-12-01")).toMatch(/1\. dec/);
    expect(activityValue(admins, "due_date", null)).toBe("Ingen");
  });
  it("viser hvem og hvordan", () => {
    expect(activityActor(admins, { via: "admin", changed_by: "a1" })).toBe("Jan");
    expect(activityActor(admins, { via: "ticket", changed_by: "a1" })).toBe("Jan via ticket");
    expect(activityActor(admins, { via: "workflow", changed_by: null })).toBe("Claude (to do-workflow)");
    expect(activityActor(admins, { via: "system", changed_by: null })).toBe("Systemet");
  });
});
