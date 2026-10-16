import { describe, it, expect } from "vitest";
import { NEW_VIEWS, viewCounts, listRecalls, searchRecalls, recallProducts, lookupCodes, matchEntry, summarizeMatch, nameMismatch, syncStatus, recallHistory, notificationSummary, missingInfoText, STATUS_TEXT } from "./recallLogic.js";
import { needsReviewCount, filterRecalls, countByStatus, addProduct, removeProduct, searchTermFromRaw, confirmSendText } from "./recallLogic.js";

const R = [
  { id: "1", status: "needs_review", published_at: "2026-09-30T10:00:00Z" },
  { id: "2", status: "archived", published_at: "2026-08-01T10:00:00Z" },
  { id: "3", status: "needs_review", published_at: "2026-10-01T10:00:00Z" },
  { id: "4", status: "ready", published_at: "2026-09-01T10:00:00Z" },
];

describe("recallLogic", () => {
  it("tæller dem, der afventer gennemgang", () => {
    expect(needsReviewCount(R)).toBe(2);
    expect(countByStatus(R)).toEqual({ all: 4, needs_review: 2, ready: 1, archived: 1, cancelled: 0 });
  });
  it("filtrerer på status og sorterer nyeste først", () => {
    expect(filterRecalls(R, "needs_review").map((r) => r.id)).toEqual(["3", "1"]);
    expect(filterRecalls(R, "all").map((r) => r.id)).toEqual(["3", "1", "4", "2"]);
  });
  it("tilføjer et produkt én gang og kan fjerne det igen", () => {
    const p = { id: "p", ean: "5701234567899", name: "Dild", brand: "X", extra: 1 };
    const one = addProduct([], p);
    expect(one).toEqual([{ id: "p", ean: "5701234567899", name: "Dild", brand: "X" }]);
    expect(addProduct(one, p)).toBe(one);
    expect(addProduct(one, { id: "q", name: "uden ean" })).toBe(one);
    expect(removeProduct(one, "5701234567899")).toEqual([]);
  });
  it("laver søgeord af et råt tal", () => {
    expect(searchTermFromRaw("571 287 790 945")).toBe("571287790945");
    expect(searchTermFromRaw(" dild ")).toBe("dild");
  });
  it("bekræftelsen nævner antal brugere og produkter", () => {
    expect(confirmSendText(12, 2)).toBe("12 brugere får en besked. Send tilbagekaldelsen for 2 produkter? Det kan ikke fortrydes.");
    expect(confirmSendText(1, 1)).toMatch(/^1 bruger får en besked\. .* 1 produkt\?/);
    expect(confirmSendText(0, 1)).toMatch(/^Ingen brugere/);
  });
});


const RC = (o = {}) => ({ id: "r1", title: "Tilbagekald: Test", status: "ready", published_at: "2026-10-10T10:00:00Z", intro: "", affected: "Testkiks\nEAN: 5701234567899\nLotnr.: A1\nHoldbarhedsdato: 01.01.2027", reason: "Metal", action: "Kassér", eans: ["5701234567899"], unverified_eans: [], raw_text: "", ...o });
const NOW = Date.parse("2026-10-16T12:00:00Z");

describe("ny tilbagekaldsadministration: visninger og søgning", () => {
  it("tre visninger; Arkiv rummer arkiveret og annulleret, og tællerne følger statusserne", () => {
    expect(NEW_VIEWS.map(([, l]) => l)).toEqual(["Afventer gennemgang", "Varslet", "Arkiv"]);
    const rs = [RC({ status: "needs_review", eans: [] }), RC({ id: "2" }), RC({ id: "3", status: "archived" }), RC({ id: "4", status: "cancelled" })];
    expect(viewCounts(rs)).toEqual({ needs_review: 1, ready: 1, archive: 2 });
    expect(listRecalls(rs, { view: "archive" }, NOW).map((r) => r.id).sort()).toEqual(["3", "4"]);
    expect(STATUS_TEXT.archived).toBe("Arkiveret");
  });
  it("søgning på titel, produktnavn, EAN med og uden foranstillede nuller og lotnummer", () => {
    const rs = [RC(), RC({ id: "2", title: "Tilbagekald: Ketchup", affected: "Ketchup\nEAN: 0570123456789\nL-kode: 493181", eans: ["0570123456789"] })];
    expect(searchRecalls(rs, "ketchup").map((r) => r.id)).toEqual(["2"]);
    expect(searchRecalls(rs, "testkiks").map((r) => r.id)).toEqual(["r1"]);
    expect(searchRecalls(rs, "5701234567899").map((r) => r.id)).toEqual(["r1"]);
    expect(searchRecalls(rs, "570123456789").map((r) => r.id)).toContain("2");
    expect(searchRecalls(rs, "493181").map((r) => r.id)).toEqual(["2"]);
  });
  it("filtre: periode og kun dem der kræver manuel kontrol", () => {
    const rs = [RC({ published_at: "2026-01-01T00:00:00Z" }), RC({ id: "2", eans: [], status: "ready" }), RC({ id: "3", unverified_eans: ["571287790945"] })];
    expect(listRecalls(rs, { view: "ready", days: "30" }, NOW).map((r) => r.id).sort()).toEqual(["2", "3"]);
    expect(listRecalls(rs, { view: "ready", manual: true }, NOW).map((r) => r.id).sort()).toEqual(["2", "3"]);
  });
});

describe("produktmatch", () => {
  const byEan = (list) => Object.fromEntries(list.flatMap((p) => [[p.ean, p]]));
  const P = { id: "p1", ean: "5701234567899", name: "Testkiks", brand: "Test" };
  it("tilbagekaldelse uden EAN: produktliste uden stregkode, kræver manuel kontrol, intet match", () => {
    const r = RC({ eans: [], status: "needs_review", affected: "Følgende produkter er omfattet:\nOksespegepølse\nLøgpølse" });
    const entries = recallProducts(r);
    const s = summarizeMatch(r, entries, {});
    expect(entries).toHaveLength(2);
    expect(s.confirmed + s.possible).toBe(0);
    expect(s.needsManual).toBe(true);
    expect(s.reasons).toContain("Ingen gyldig stregkode på siden");
    expect(missingInfoText(r, entries)).toContain("gyldig stregkode");
  });
  it("stregkode + partioplysninger = bekræftet; stregkode uden partioplysninger = muligt (ikke falsk sikkerhed)", () => {
    const withBatch = recallProducts(RC())[0];
    expect(matchEntry(withBatch, byEan([P]))[0]).toMatchObject({ level: "confirmed", product: P });
    const noBatch = recallProducts(RC({ affected: "Testkiks\nEAN: 5701234567899" }))[0];
    const m = matchEntry(noBatch, byEan([P]))[0];
    expect(m.level).toBe("possible");
    expect(m.basis).toMatch(/alle partier kan være omfattet/);
  });
  it("foranstillede nuller: EAN-13 i databasen findes også, når siden har 14 cifre med 0", () => {
    const e = recallProducts(RC({ affected: "Testkiks\nEAN: 05701234567899\nLotnr.: A1", eans: ["05701234567899"] }))[0];
    expect(e.eans[0].code).toBe("05701234567899");
    expect(matchEntry(e, byEan([P]))[0].level).toBe("confirmed");
    expect(lookupCodes([e])).toContain("5701234567899");
  });
  it("karton (GTIN-14) er aldrig et bekræftet match; salgsenheden udledes og er kun et muligt match", () => {
    const r = RC({ affected: "Amanda Makrelkræs\nEAN karton: 15705550826125\nEAN på styk / tuben: 5705550826128\nLotnummer: 270526", eans: ["15705550826125", "5705550826128"] });
    const [e] = recallProducts(r);
    const product = { id: "p2", ean: "5705550826128", name: "Makrelkræs" };
    const ms = matchEntry(e, byEan([product]));
    expect(ms.find((m) => m.kind === "carton")).toMatchObject({ level: "possible", unit: "5705550826128" });
    expect(ms.find((m) => m.kind === "unit").level).toBe("confirmed");
    // kun kartonen i kataloget: intet automatisk match for den
    expect(matchEntry(e, byEan([{ id: "x", ean: "15705550826125", name: "Karton" }])).find((m) => m.kind === "carton").level).toBe("not_found");
  });
  it("ugyldig stregkode matches aldrig automatisk, og 'ikke omfattet' kommer kun fra en dokumenteret afgørelse", () => {
    const e = recallProducts(RC({ affected: "Dild\nEAN nr. 571287790945\nLot nr. L:1", eans: [], unverified_eans: ["571287790945"] }))[0];
    expect(matchEntry(e, {})[0].level).toBe("unverified");
    const o = { "5701234567899": { level: "not_covered", basis: "Andet parti end det tilbagekaldte, kontrolleret på emballage", decided_by: "a1", decided_at: "2026-10-12T10:00:00Z" } };
    const m = matchEntry(recallProducts(RC())[0], byEan([P]), o)[0];
    expect(m).toMatchObject({ level: "not_covered", manual: true, decidedBy: "a1" });
    expect(m.basis).toMatch(/Andet parti/);
  });
  it("flere varianter og lot: hver variant matches for sig", () => {
    const r = RC({ affected: "A Lemon\nLotnr.: L1\nEAN/GTIN-nummer: 8435660200767\nA Dracula\nLotnr.: L2\nEAN/GTIN-nummer: 8435660200774", eans: ["8435660200767", "8435660200774"] });
    const s = summarizeMatch(r, recallProducts(r), { "8435660200767": { id: "p", ean: "8435660200767", name: "A Lemon" } });
    expect(s.confirmed).toBe(1);
    expect(s.notFound).toBe(1);
  });
  it("navnebeskyttelse: et produkt uden fælles ord med tilbagekaldelsen advares der om", () => {
    expect(nameMismatch({ name: "Kærnemælk", brand: "Arla" }, RC())).toBe(true);
    expect(nameMismatch({ name: "Testkiks naturel", brand: "Test" }, RC())).toBe(false);
  });
});

describe("synkronisering, historik og varsling", () => {
  it("sync: fejl, forældet og ukendt vises aldrig som succes", () => {
    const ok = { status: "ok", started_at: "2026-10-16T17:00:00Z", finished_at: "2026-10-16T17:00:20Z" };
    expect(syncStatus([ok], Date.parse("2026-10-16T18:00:00Z"))).toMatchObject({ state: "ok", lastOkAt: ok.finished_at });
    expect(syncStatus([{ status: "failed", error_code: "kilde_svarer_ikke", started_at: "2026-10-16T17:00:00Z" }, ok], NOW)).toMatchObject({ state: "failed", lastOkAt: ok.finished_at, code: "kilde_svarer_ikke" });
    expect(syncStatus([ok], Date.parse("2026-10-19T18:00:00Z")).state).toBe("stale");
    expect(syncStatus([], NOW).state).toBe("unknown");
    expect(syncStatus(null, NOW).state).toBe("unknown");
  });
  it("historik: hvem og hvad, også automatiske hændelser", () => {
    const h = recallHistory([{ id: 1, created_at: "2026-10-12T17:00:00Z", actor_id: null, kind: "imported", details: { status: "ready" } }, { id: 2, created_at: "2026-10-13T10:00:00Z", actor_id: "a1", kind: "match_decided", details: { ean: "570", niveau: "not_covered", begrundelse: "Andet parti" } }], () => "Jan");
    expect(h[0]).toMatchObject({ by: "Jan" });
    expect(h[0].text).toMatch(/Ikke omfattet.*Andet parti/);
    expect(h[1].by).toMatch(/Automatisk/);
  });
  it("varsling skelner afsendt (accepteret af tjenesten), fejlet og afventende; levering opgøres ikke", () => {
    const s = notificationSummary({ recipients: 5, by_variant: { default: 5 }, deliveries: [{ channel: "push", status: "sent", count: 4 }, { channel: "push", status: "failed", count: 1 }, { channel: "email", status: "skipped", count: 2 }], queued: { status: "done" } });
    expect(s).toMatchObject({ recipients: 5, sent: 4, failed: 1, skipped: 2, pending: 0 });
    expect(s).not.toHaveProperty("delivered");
    expect(notificationSummary(null)).toBeNull();
  });
});
