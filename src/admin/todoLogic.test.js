// @ts-nocheck
import { describe, it, expect } from "vitest";
import { todayKey, isOverdue, dueInfo, sortTodos, filterTodos, countByView, viewNeedsDone, attentionCount, buildTodoPrompt, personName } from "./todoLogic.js";

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
    expect(sortTodos(list).map((t) => t.id)).toEqual(["doing", "high-soon", "high-late", "high-nodate", "low", "blocked", "done-new", "done-old"]);
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
  it("attentionCount: høj prioritet eller overskredet, men ikke ventende eller færdig", () => {
    const l = [
      T({ priority: "high" }), T({ priority: "high", status: "blocked" }), T({ priority: "high", status: "done" }),
      T({ due_date: "2026-09-30" }), T({ due_date: "2026-10-05" }), T(),
    ];
    expect(attentionCount(l, TODAY)).toBe(2);
  });
});

describe("buildTodoPrompt", () => {
  it("indeholder titel, ansvarlig, beskrivelse og kommentarer", () => {
    const admins = [{ id: "u1", name: "Jan", email: "j@x.dk" }];
    const p = buildTodoPrompt(T({ id: "abc", title: "Ryd testdata", description: "Se liste", assignee_id: "u1", due_date: "2026-11-01", link: "https://x.dk" }), admins, [{ author_id: "u1", body: "Tager den i morgen" }]);
    expect(p).toContain("id abc");
    expect(p).toContain("Titel: Ryd testdata");
    expect(p).toContain("Ansvarlig: Jan");
    expect(p).toContain("Frist: 2026-11-01");
    expect(p).toContain("Link: https://x.dk");
    expect(p).toContain("- Jan: Tager den i morgen");
  });
  it("personName falder tilbage til e-mail og Ukendt", () => {
    expect(personName([{ id: "a", name: "", email: "a@x.dk" }], "a")).toBe("a@x.dk");
    expect(personName([], "zzz")).toBe("Ukendt");
    expect(personName([], null)).toBe("");
  });
});
