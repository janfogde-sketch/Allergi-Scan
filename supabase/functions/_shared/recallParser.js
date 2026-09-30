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
  };
}
