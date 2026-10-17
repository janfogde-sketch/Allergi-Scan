// supabase/functions/_shared/recallParser.js
//
// Læser Fødevarestyrelsens RSS-feed over tilbagekaldte fødevarer og de enkelte tilbagekaldssider
// (30. sept. 2026). Ren JavaScript uden DOM, så både edge-funktionen `recalls-sync` (Deno) og
// Vitest (src/recallParser.test.js) bruger den samme kode.
//
// Kilden er kun den officielle: https://foedevarestyrelsen.dk. Siderne er fri tekst, men flere har
// "EAN/GTIN-nummer: …", parti og holdbarhedsdato. EAN'er valideres med GTIN-kontrolciffer, så en
// tastefejl på siden aldrig kan give en forkert match.

export const RECALL_HOSTS = ["foedevarestyrelsen.dk", "www.foedevarestyrelsen.dk"];

/** Kun https-links på Fødevarestyrelsens eget domæne må vises som "officiel kilde". */
export function isOfficialRecallUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && RECALL_HOSTS.includes(u.hostname);
  } catch { return false; }
}

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", ndash: "–", mdash: "—", hellip: "…", deg: "°", euro: "€", eacute: "é", egrave: "è", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß", aelig: "æ", oslash: "ø", aring: "å", AElig: "Æ", Oslash: "Ø", Aring: "Å" };
export function decodeEntities(s) {
  return String(s ?? "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => NAMED[n] ?? m);
}

const INVISIBLE = new RegExp("[\\u200B-\\u200F\\u2028\\u2029\\uFEFF]", "g");
const clean = (s) => decodeEntities(s).replace(INVISIBLE, "").replace(/\s+/g, " ").trim();

/** RSS → [{ title, url, description, publishedAt }] */
export function parseRecallFeed(xml) {
  const out = [];
  for (const m of String(xml ?? "").matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const tag = (name) => {
      const t = m[1].match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
      return t ? clean(t[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")) : "";
    };
    const url = tag("link") || tag("guid");
    const date = new Date(tag("pubDate"));
    if (!url || !isOfficialRecallUrl(url)) continue;
    out.push({ title: tag("title"), url, description: tag("description"), publishedAt: isNaN(date) ? null : date.toISOString() });
  }
  return out;
}

/** GTIN-8/12/13/14: kontrolciffer. */
export function isValidGtin(code) {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const d = code.split("").map(Number);
  const check = d.pop();
  let sum = 0;
  d.reverse().forEach((n, i) => { sum += n * (i % 2 === 0 ? 3 : 1); });
  return (10 - (sum % 10)) % 10 === check;
}

/** De skrivemåder, en stregkode kan være gemt på i databasen (uden/med foranstillede nuller). */
export function eanVariants(code) {
  const digits = String(code ?? "").replace(/\D/g, "");
  if (!digits) return [];
  const stripped = digits.replace(/^0+/, "");
  return [...new Set([digits, stripped, stripped.padStart(8, "0"), stripped.padStart(12, "0"), stripped.padStart(13, "0"), stripped.padStart(14, "0")])].filter(Boolean);
}

function htmlToLines(html) {
  const body = String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, "")
    .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article|ul|ol)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "\n");
  return decodeEntities(body).split("\n").map((l) => l.replace(INVISIBLE, "").replace(/\s+/g, " ").trim()).filter(Boolean);
}

const HEAD = {
  affected: /^Hvilken fødevare tilbagekaldes/i,
  sold: /^Hvor er produktet solgt/i,
  reason: /^Hvorfor tilbagekaldes produktet/i,
  action: /^Hvad skal du gøre som forbruger/i,
  who: /^Hvem tilbagekalder produktet/i,
};
const ANY_HEAD = Object.values(HEAD);

const cap = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/**
 * Tilbagekaldsside → { intro, affected, reason, action, eans, cancelled }
 * Alle tekstfelter er afkortet ren tekst; eans er kun gyldige GTIN'er.
 */
export function parseRecallPage(html, { title = "" } = {}) {
  const lines = htmlToLines(html);
  const start = lines.findIndex((l) => /^Tilbagekaldte fødevarer$/i.test(l));
  const endIdx = lines.findIndex((l, i) => i > start && /^Fødevarestyrelsen er en styrelse/i.test(l));
  const art = start >= 0 ? lines.slice(start + 1, endIdx > start ? endIdx : undefined) : [];

  const sections = {};
  let current = "intro";
  sections.intro = [];
  for (const line of art) {
    const key = Object.entries(HEAD).find(([, re]) => re.test(line))?.[0];
    if (key) { current = key; sections[current] = sections[current] ?? []; continue; }
    (sections[current] = sections[current] ?? []).push(line);
  }
  const join = (k, sep = " ") => (sections[k] ?? []).join(sep);

  const eans = new Set();
  const unverifiedEans = new Set(); // står på siden, men består ikke GTIN-kontrollen — vises kun til admin
  for (const l of art) {
    if (!/\b(EAN|GTIN)\b/i.test(l)) continue;
    for (const m of l.replace(/^.*?\b(?:EAN|GTIN)[^\d]*/i, "").matchAll(/\d{8,14}/g)) (isValidGtin(m[0]) ? eans : unverifiedEans).add(m[0]);
  }

  return {
    intro: cap(join("intro"), 700),
    affected: cap(join("affected", "\n"), 1500),
    reason: cap(join("reason") || join("intro"), 700),
    action: cap(join("action"), 500),
    eans: [...eans],
    unverifiedEans: [...unverifiedEans],
    cancelled: /^\s*ANNULLERET/i.test(title),
    // Hele artiklen som ren tekst (afkortet), gemt som dokumentation ved siden af de udtrukne felter
    rawText: cap(art.join("\n"), 20000),
  };
}

/**
 * "ANNULLERET: Tilbagekald – X" → "Tilbagekald – X" (den oprindelige titel), ellers null.
 * Bruges til at koble en annulleringsside til den tilbagekaldelse, den ophæver.
 */
export function originalTitleOfCancelled(title) {
  const m = String(title ?? "").match(/^\s*ANNULLERET\s*[:\-–—]?\s*(.+)$/i);
  return m ? m[1].trim() : null;
}

/** Titler sammenlignes uden forskel på store/små bogstaver, mellemrum og tankestreger. */
export function normalizeRecallTitle(title) {
  return String(title ?? "").toLowerCase().replace(/[‐-―−-]/g, "-").replace(/\s+/g, " ").trim();
}

/** Teksten, der afgør, om en tilbagekaldelse er ændret (kun de felter, brugerne får at se). */
export function recallFingerprintText({ reason, affected, action } = {}) {
  return JSON.stringify([reason ?? "", affected ?? "", action ?? ""].map((t) => String(t).replace(/\s+/g, " ").trim()));
}

/** Samme EAN'er uanset rækkefølge. */
export function sameEanSet(a, b) {
  const x = new Set(a ?? []);
  const y = new Set(b ?? []);
  return x.size === y.size && [...x].every((e) => y.has(e));
}

// ── Strukturerede berørte produkter (16. okt. 2026) ──────────────────────────────────────────────────────────────────────────────
// Siderne er fri tekst. Her udtrækkes produktblokke (navn, stregkoder, lot, datoer) uden at gætte: det, der ikke tydeligt hører til ét produkt, markeres uncertain,
// og den fulde originale tekst gemmes fortsat som dokumentation. Hvilken dato der hører til hvilket lot gættes aldrig, når der er flere af begge.

const MONTHS = "januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december";
const DATE_RE = new RegExp(`\\d{1,2}\\s*[.\\-/]\\s*\\d{1,2}\\s*[.\\-/]\\s*\\d{2,4}|\\d{1,2}\\.?\\s+(?:${MONTHS})\\s+\\d{4}|(?:${MONTHS})\\s+\\d{4}`, "gi");
const K_LOT = /^(lot\s*(?:nummer|nr\.?)?|lotnr\.?|batch\s*(?:nummer|nr\.?)?|l-kode|parti\s*(?:nummer|nr\.?)?|partinr\.?)\s*[:#.]?\s*(.*)$/i;
const K_BEST = /^(bedst før(?:-dato)?|holdbarhed\w*|sidste anvendelsesdato|udløbsdato)\s*[:.]?\s*(.*)$/i;
const K_PROD = /^(produktionsdato|tappet|produceret|pakket)\s*[:.]?\s*(.*)$/i;
const K_NET = /^(nettoindhold|nettovægt|vægt)\s*[:.]?\s*(.*)$/i;
const K_BRAND = /^(mærke|brand|producent)\s*[:.]?\s*(.*)$/i;
const K_ART = /^(varenr\.?|varenummer|art\.?\s*nr\.?)\s*[:.]?\s*(.*)$/i;
const CARTON_WORDS = /karton|kolli|ydre|trayes?|tray|case|display|pall/i;
const UNIT_WORDS = /styk|enhed|salgs|tube|pakke|dåse|flaske|forbruger/i;

/** Tjekciffer for de første cifre i en GTIN (uden tjekcifret). */
function gtinCheckDigit(digitsWithoutCheck) {
  const d = String(digitsWithoutCheck).split("").map(Number).reverse();
  let sum = 0;
  d.forEach((n, i) => { sum += n * (i % 2 === 0 ? 3 : 1); });
  return (10 - (sum % 10)) % 10;
}

/** GTIN-14 med indikator 1-8 er en kartonkode; den indeholdte salgsenhed er de 12 cifre efter indikatoren + nyt tjekciffer (EAN-13). Ellers null. */
export function deriveUnitFromCarton(code) {
  const c = String(code ?? "");
  if (!/^[1-8]\d{13}$/.test(c) || !isValidGtin(c)) return null;
  const base = c.slice(1, 13);
  return base + gtinCheckDigit(base);
}

/** @returns {"carton"|"unit"|"unknown"} */
export function gtinKind(code, hint = "") {
  if (CARTON_WORDS.test(hint)) return "carton";
  if (UNIT_WORDS.test(hint) && !/^[1-8]\d{13}$/.test(String(code))) return "unit";
  if (/^[1-8]\d{13}$/.test(String(code))) return "carton";
  return "unknown";
}

const dates = (v) => { const m = String(v ?? "").match(DATE_RE); return m ? m.map((x) => x.replace(/\s+/g, " ").trim()) : (String(v ?? "").trim() ? [String(v).trim()] : []); };
const splitList = (v) => String(v ?? "").split(/\s*[,;]\s*|\s+og\s+|\s*\/\s*(?=[A-Za-z0-9]{3})/i).map((x) => x.trim()).filter(Boolean);

function newBlock() { return { name: "", brand: null, net: null, article_no: null, eans: [], lots: [], production_dates: [], best_before: [], notes: [], lines: [] }; }
const hasData = (b) => b.eans.length > 0 || b.lots.length > 0 || b.production_dates.length > 0 || b.best_before.length > 0;

/**
 * Tekst fra "Hvilken fødevare tilbagekaldes" → liste af produktblokke.
 * @param {string} text
 * @returns {Array<{ name: string, brand: string|null, net: string|null, article_no: string|null, eans: Array<{ code: string, kind: string, valid: boolean }>, lots: string[], production_dates: string[], best_before: string[], flags: string[], uncertain: boolean, raw: string }>}
 */
export function extractAffectedProducts(text) {
  const lines = String(text ?? "").split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const blocks = [];
  let cur = newBlock();
  const push = () => { if (cur.name || hasData(cur)) blocks.push(cur); cur = newBlock(); };
  for (const line of lines) {
    cur.lines.push(line);
    let m;
    if (/\b(EAN|GTIN)\b/i.test(line) && /\d{8,14}/.test(line)) {
      const hint = line.replace(/\d{8,14}.*$/s, "");
      for (const c of line.matchAll(/\d{8,14}/g)) cur.eans.push({ code: c[0], kind: gtinKind(c[0], hint), valid: isValidGtin(c[0]) });
      continue;
    }
    if ((m = line.match(K_LOT)) && m[1]) {
      // "Lot nr. L:007221 med bedst før den 15. 09.2027": lot og dato i samme linje hører sammen
      const inline = m[2].match(/^(.*?)\s+med\s+(?:bedst før|holdbarhed\w*)\s+(?:den\s+)?(.*)$/i);
      if (inline) {
        if (cur.lots.length && cur.best_before.length) cur.notes.push("Flere partier med hver sin dato i samme blok");
        cur.lots.push(...splitList(inline[1].replace(/^L:/i, "L:")));
        cur.best_before.push(...dates(inline[2]));
      } else cur.lots.push(...splitList(m[2]));
      continue;
    }
    if ((m = line.match(K_BEST))) { cur.best_before.push(...dates(m[2])); continue; }
    if ((m = line.match(K_PROD))) { cur.production_dates.push(...dates(m[2])); continue; }
    if ((m = line.match(K_NET))) { cur.net = m[2] || null; continue; }
    if ((m = line.match(K_BRAND))) { cur.brand = m[2] || null; continue; }
    if ((m = line.match(K_ART))) { cur.article_no = m[2].replace(/[.,]$/, "") || null; continue; }
    // Alt andet: en overskrift, en sætning eller et produktnavn
    if (/:\s*$/.test(line)) { cur.lines.pop(); continue; } // "Følgende produkter er omfattet:"
    const art = line.match(/^(.*?)[.,]?\s*Varenr\.?\s*([\d ]+)[.,]?$/i);
    const name = art ? art[1].trim() : line;
    if (name.length > 110 || /[.!?]\s+[A-ZÆØÅ]/.test(name)) { cur.lines.pop(); cur.notes.push(name); continue; } // sætning, ikke et navn
    if (cur.name && (hasData(cur) || cur.name)) { cur.lines.pop(); push(); cur.lines.push(line); }
    cur.name = name;
    if (art) cur.article_no = art[2].trim();
  }
  push();

  return blocks.map((b) => {
    const flags = [];
    if (b.eans.length === 0) flags.push("no_barcode");
    if (b.eans.some((e) => !e.valid)) flags.push("invalid_barcode");
    if (b.lots.length === 0 && b.best_before.length === 0 && b.production_dates.length === 0) flags.push("no_batch_info");
    if (b.lots.length > 1 && (b.best_before.length > 1 || b.production_dates.length > 1)) flags.push("lot_date_pairing_unknown");
    if (!b.name) flags.push("no_name");
    if (b.notes.length && hasData(b) === false) flags.push("sentence_only");
    return { name: b.name, brand: b.brand, net: b.net, article_no: b.article_no, eans: b.eans, lots: b.lots, production_dates: b.production_dates, best_before: b.best_before, flags, uncertain: flags.length > 0, raw: b.lines.join("\n") };
  }).filter((b) => b.name || b.eans.length || b.lots.length);
}
