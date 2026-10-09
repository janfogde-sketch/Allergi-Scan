// @ts-nocheck
import React from "react";
import { isAllergenWord, keywordMatches } from "./allergenKeywords.js";

// ─── KONSTANTER ──────────────────────────────────────────────────────────────

// `highlightRules` (28. sept. 2026, FINAL PRODUCT RESULT PAGE) — valgfrit,
// bagudkompatibelt tilvalg til den brugerspecifikke fremhævning på
// ResultScreen.jsx: en liste af `{ keywords?, codes?, category, label,
// reason }`, hvor kun ingredienser der reelt matcher NOGET af dette
// fremhæves — IKKE alle allergener produktet måtte indeholde (den
// eksisterende `allergenFlags`-baserede opførsel herunder, brugt af
// RecipesScreen.jsx og bevaret 100% uændret når `highlightRules` udelades,
// fremhæver derimod ALLE kendte allergener i produktet, uanset brugerens
// egne aktive valg — bevidst forskellig brug, se ResultScreen.jsx's egen
// kommentar for hvorfor kun ÉT sted har brug for den strengere variant).
// `category` afgør farve (allergi=rød, alt andet=orange/gult, jf. appens
// statusfarve-konvention) og bruges af `onHighlightTap` til at vise en kort
// forklaring i stedet for det almindelige leksikon-opslag.
const HIGHLIGHT_CATEGORY_STYLE = {
  allergy: { color: "var(--red)", bg: "var(--red-lt)" },
  // Fælles statussystem (9. okt. 2026): konflikt med valgt E-nummer eller kostpræference er rød; kun spor er orange.
  enumber: { color: "var(--red)", bg: "var(--red-lt)" },
  diet: { color: "var(--red)", bg: "var(--red-lt)" },
  trace: { color: "var(--amber)", bg: "var(--amber-lt)" },
};
// Almindelige E-numre (ikke en konflikt for brugeren) er neutrale og klikbare, så de ikke ligner personlige konflikter.
const NEUTRAL_E_STYLE = { color: "var(--ink2)", bg: "var(--surface2)" };
const E_CODE_RE = /\bE[\s-]?\d{3,4}[a-z]?\b/i;

function findMatchingHighlightRule(part, highlightRules) {
  if (!highlightRules?.length) return null;
  const lowerPart = part.toLowerCase();
  const eCodesInPart = (part.match(/\bE[\s-]?\d{3,4}[a-z]?\b/gi) || [])
    .map(m => "E" + m.replace(/^E[\s-]?/i, "").toUpperCase());
  for (const rule of highlightRules) {
    if (rule.codes?.length && eCodesInPart.some(c => rule.codes.some(rc => rc.toUpperCase() === c))) return rule;
    if (rule.keywords?.length && rule.keywords.some(kw => keywordMatches(lowerPart, kw))) return rule;
  }
  return null;
}

// ─── PRÆCIS FREMHÆVNING (10. okt. 2026) ──────────────────────────────────────────────────────────────────
// I brugerspecifik tilstand (highlightRules) analyseres teksten på ord- og udtryksniveau i stedet for kommasegmenter: kun det konkrete
// ingrediensord ("MANDELpulver", "HVEDEMEL", "sødmælkspulver") eller udtryk ("E322 (SOJA)") markeres, aldrig procenter, kommaer eller
// nabo-ord. Teksten vises uændret (kun overflødigt mellemrum er slået sammen). Sporsætninger ("Kan indeholde spor af ...") matches kun
// mod spor-regler, så et ord dér ikke farves som direkte indhold.
const TOKEN_RE = /E[\s-]?\d{3,4}[a-z]?(?:[ ]?\([^()]*\))?|[A-Za-zÀ-ÖØ-öø-ÿ]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+)*/g;
const TRACE_ZONE_RE = /(kan indeholde|may contain|indeholder spor|spor af)[^]*?(?:\.(?=\s|$)|$)/gi;
const E_PART_RE = /^E[\s-]?(\d{3,4}[a-z]?)/i;

export function analyzeIngredientTokens(text, rules) {
  const lower = text.toLowerCase();
  const zones = [];
  TRACE_ZONE_RE.lastIndex = 0;
  let zm;
  while ((zm = TRACE_ZONE_RE.exec(text))) { zones.push([zm.index, zm.index + zm[0].length]); if (zm[0].length === 0) TRACE_ZONE_RE.lastIndex++; }
  const inZone = (i) => zones.some(([a, b]) => i >= a && i < b);
  const rulesFor = (i) => (rules || []).filter(r => (inZone(i) ? r.category === "trace" : r.category !== "trace"));
  const matches = [];

  // Flerords-nøgleord (fx "ris mel") findes som udtryk i teksten.
  for (const rule of rules || []) {
    for (const kw of rule.keywords || []) {
      if (!/\s/.test(kw)) continue;
      const k = kw.toLowerCase();
      let from = 0, idx;
      while ((idx = lower.indexOf(k, from)) !== -1) {
        from = idx + k.length;
        if (rulesFor(idx).includes(rule)) matches.push({ start: idx, end: idx + k.length, rule });
      }
    }
  }

  TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = TOKEN_RE.exec(text))) {
    const tok = m[0], start = m.index, end = start + tok.length;
    const eMatch = tok.match(E_PART_RE);
    if (eMatch) {
      const code = "E" + eMatch[1].toUpperCase();
      const inner = (tok.match(/\(([^()]*)\)/) || [])[1] || "";
      const active = rulesFor(start);
      const rule = active.find(r => r.codes?.some(c => c.toUpperCase() === code))
        || (inner && active.find(r => r.keywords?.some(kw => !/\s/.test(kw) && keywordMatches(inner.toLowerCase(), kw))));
      matches.push({ start, end, rule: rule || null, kind: "e", code });
      continue;
    }
    const lw = tok.toLowerCase();
    const rule = rulesFor(start).find(r => r.keywords?.some(kw => !/\s/.test(kw) && keywordMatches(lw, kw)));
    if (rule) {
      let s0 = start;
      // "vallepulver (MÆLK)": et enkelt ord i en parentes, der forklarer ordet foran, markeres sammen med det.
      const before = text.slice(0, start);
      const par = before.match(/([A-Za-zÀ-ÖØ-öø-ÿ]+(?:-[A-Za-zÀ-ÖØ-öø-ÿ]+)*) \($/);
      if (par && text[end] === ")") { s0 = start - par[0].length; matches.push({ start: s0, end: end + 1, rule }); }
      else matches.push({ start: s0, end, rule });
      continue;
    }
    // Vitaminer (B12, K2, "vitamin C") er opslagsbare i leksikonet.
    if (/^[abcdk]\d{1,2}$/i.test(tok) || (/^[abcdk]$/i.test(tok) && /vitamin $/i.test(text.slice(Math.max(0, start - 9), start)))) {
      matches.push({ start, end, rule: null, kind: "vitamin" });
    }
  }
  // Ingen overlap: det første/længste vinder.
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const out = [];
  let cursor = 0;
  for (const mt of matches) {
    if (mt.start < cursor) continue;
    out.push(mt);
    cursor = mt.end;
  }
  return out;
}

function RuleIngredients({ cleaned, rules, onIngredientTap, onHighlightTap }) {
  const matches = analyzeIngredientTokens(cleaned, rules);
  const nodes = [];
  let cursor = 0;
  matches.forEach((mt, i) => {
    if (mt.start > cursor) nodes.push(cleaned.slice(cursor, mt.start));
    const label = cleaned.slice(mt.start, mt.end);
    const style = mt.rule ? (HIGHLIGHT_CATEGORY_STYLE[mt.rule.category] || HIGHLIGHT_CATEGORY_STYLE.diet)
      : mt.kind === "vitamin" ? { color: "var(--blue)", bg: "var(--blue-lt)" } : NEUTRAL_E_STYLE;
    const handle = mt.rule && onHighlightTap ? () => onHighlightTap(mt.rule)
      : onIngredientTap ? () => onIngredientTap(label.replace(/\(.*?\)/g, "").replace(/[*%]/g, "").trim())
      : undefined;
    nodes.push(
      <span key={i} role={handle ? "button" : undefined} tabIndex={handle ? 0 : undefined}
        onClick={handle} onKeyDown={handle ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handle(); } } : undefined}
        title={mt.rule ? mt.rule.label : handle ? `Læs mere om ${label}` : undefined}
        style={{ fontWeight: 700, color: style.color, background: style.bg, borderRadius: 4, padding: "0 2px", margin: "0 -2px", cursor: handle ? "pointer" : "default" }}>
        {label}
      </span>
    );
    cursor = mt.end;
  });
  if (cursor < cleaned.length) nodes.push(cleaned.slice(cursor));
  return <div style={{ fontSize: 12, lineHeight: "21px", color: "var(--ink2)", overflowWrap: "anywhere" }}>{nodes}</div>;
}

export function IngredientsList({ text, allergenFlags = {}, onIngredientTap, highlightRules, onHighlightTap }) {
  if (!text) return null;

  // Rens teksten — fjern linjeskift og ekstra mellemrum
  // "spor afæg" (manglende mellemrum i butiksdata) vises og matches som "spor af æg"
  const cleaned = text
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bspor\s+af(?=[a-zæøå])/gi, "spor af ")
    .trim();
  if (Array.isArray(highlightRules)) return <RuleIngredients cleaned={cleaned} rules={highlightRules} onIngredientTap={onIngredientTap} onHighlightTap={onHighlightTap} />;
  // "..., olivenekstrakt. Kan indeholde spor af æg, mælk" er to sætninger: "Kan indeholde ..." deles ud som egen del (adskilt af et punktum),
  // så en fremhævelse af sporet ikke også farver den foregående ingrediens. \u0001 markerer sætningsstart.
  const SENTENCE_MARK = "\u0001";
  const withSentences = cleaned.replace(/\.\s+(?=(Kan indeholde|May contain)\b)/gi, "," + SENTENCE_MARK);

  // Split på ALLE kommaer, uanset paren-dybde — en indlejret under-liste (fx
  // "7% krydderiblanding (sukker, salt, VALLEPULVER (MÆLK), ...)") skal give
  // individuelt fremhævelige dele, ikke én stor uadskillelig blok. Uden dette
  // fremhævede en enkelt "mælk" et sted i en lang under-liste HELE blokken —
  // inkl. ingredienser der intet har med allergenet at gøre (rapporteret af
  // en bruger 24. sept. 2026: "hele dette produkts ingredienser står som
  // fremhævet"). Rydder derefter op i de paren-ubalancerede rand-stykker en
  // sådan blind splitning uundgåeligt giver (gruppe-header-åbningen og den
  // afsluttende lukning), og klæber en ren, kort forklarings-parentes
  // ("(MÆLK)" som sin egen del) til den forrige del i stedet for at vise den
  // isoleret.
  // Et komma MELLEM to cifre er et decimalkomma ("jordbær (6,1%)"), ikke
  // en ingrediens-adskiller — ellers blev det vist som "jordbær 6" og "1%"
  // (fundet i live-test 30. sept. 2026, Arla Cultura). Decimalkommaet
  // maskeres midlertidigt i stedet for et lookbehind-regex, som ældre
  // iOS-Safari (før 16.4) ikke kan parse — det ville vælte hele bundlen.
  const DECIMAL_MARK = "\u0000";
  const rawParts = withSentences.replace(/(\d),(?=\d)/g, "$1" + DECIMAL_MARK)
    .split(",")
    .map(p => p.split(DECIMAL_MARK).join(",").trim())
    .filter(Boolean);
  const parts = [];
  for (const raw of rawParts) {
    const opens = (raw.match(/[([]/g) || []).length;
    const closes = (raw.match(/[)\]]/g) || []).length;
    if (/^[([].*[)\]]$/.test(raw) && opens === closes && opens <= 1 && parts.length > 0) {
      parts[parts.length - 1] += " " + raw;
    } else if (opens > closes) {
      parts.push(raw.replace(/[([]/g, "").trim());
    } else if (opens < closes) {
      parts.push(raw.replace(/[)\]]/g, "").trim());
    } else {
      parts.push(raw);
    }
  }

  // Hvilke dele starter en ny sætning (separatoren før dem vises som punktum i stedet for komma), og rens markeringen af.
  const sentenceStart = parts.map(p => p.startsWith(SENTENCE_MARK));
  for (let k = 0; k < parts.length; k++) parts[k] = parts[k].split(SENTENCE_MARK).join("").trim();

  const isHighlighted = (part) => {
    // STORE BOGSTAVER = allergen markeret af producent. Tæl kun de
    // bogstaver der reelt er i teksten (ikke hele part.length) — ellers
    // tæller cifre med i længdetjekket, og korte bogstav+tal-tokens som
    // vitamin-notationer ("B12") eller E-numre ("E621") bliver fejlagtigt
    // fremhævet, mens fx "B6" tilfældigt undgår det pga. sin kortere
    // samlede længde (bruger-rapporteret fejl, 25. sept. 2026: "b12
    // fremhæves men ikke b6" — reelt en fejl i selve heuristikken, ikke i
    // allergen-matchingen).
    const letters = part.match(/[a-zA-ZæøåÆØÅ]+/g)?.join("") || "";
    const hasUppercase = letters.length > 2 && letters === letters.toUpperCase();
    // Eller indeholder et allergen-ord
    const words = part.toLowerCase().replace(/[()[\]]/g, "").split(/\s+/);
    const hasAllergenWord = words.some(w => isAllergenWord(w, allergenFlags));
    return hasUppercase || hasAllergenWord;
  };

  // E-numre og vitaminer er ikke allergener, men de er begge opslagsbare i
  // leksikonet (bruger-ønske, 25. sept. 2026: "vil gerne at dem fremhæves
  // som noget der fremgår af mit leksikon, lige som enumre") — fremhæves
  // derfor i en separat, neutral blå stil i stedet for allergen-rød, så de
  // ikke fejlagtigt læses som en fare. Ligesom hasAllergenWord ovenfor
  // tjekkes hvert ord i den urensede part for sig (IKKE cleanPart, som
  // fjerner hele parentes-indholdet — et E-nummer der står i en parentes,
  // fx "smagsforstærker (E621)", ville ellers aldrig blive fundet).
  const isKnowledgeTerm = (part) => {
    const words = part.replace(/[()[\]]/g, " ").replace(/[.,]/g, "").trim().split(/\s+/);
    return words.some(w => /^E[\s-]?\d{3,4}[a-z]?$/i.test(w) || /^[abcdk][0-9]{0,2}$/i.test(w));
  };

  // Brugerspecifik tilstand (kun når `highlightRules` er givet, se
  // komponent-kommentaren ovenfor) — ellers 100% uændret opførsel.
  // En tom liste er også brugerspecifik tilstand ("intet er relevant for dig"): ellers faldt visningen tilbage til den gamle, generelle
  // fremhævning, som farvede alle almindelige allergen-ord røde, selv om produktet ikke matcher brugerens valg (2. okt. 2026).
  const useRules = Array.isArray(highlightRules);
  // Mindre "washed out" grundtekst (krav 8) — kun i den nye tilstand, så
  // RecipesScreen.jsx's eksisterende brug (ingen highlightRules) er
  // pixel-identisk uændret.
  const baseColor = useRules ? "var(--ink2)" : "var(--muted)";

  return (
    <div style={{ fontSize:12, lineHeight:"21px", overflowWrap:"anywhere" }}>
      {parts.map((part, i) => {
        const rule = useRules ? findMatchingHighlightRule(part, highlightRules) : null;
        const highlighted = useRules ? !!rule : isHighlighted(part);
        const clickable = !!onIngredientTap || (useRules && !!rule && !!onHighlightTap);
        // Rens ingrediens-tekst for opslag (fjern parenteser og ekstra tegn)
        const cleanPart = part.replace(/\(.*?\)/g, "").replace(/[*%]/g, "").trim();
        const knowledgeTerm = !highlighted && isKnowledgeTerm(part);
        const ruleStyle = rule ? (HIGHLIGHT_CATEGORY_STYLE[rule.category] || HIGHLIGHT_CATEGORY_STYLE.diet) : (useRules && knowledgeTerm && E_CODE_RE.test(part) ? NEUTRAL_E_STYLE : null);
        const handleClick = rule && onHighlightTap ? () => onHighlightTap(rule)
          : onIngredientTap ? () => onIngredientTap(cleanPart)
          : undefined;
        return (
          <React.Fragment key={i}>
            <span
              onClick={handleClick}
              style={{
                fontSize: 12,
                fontWeight: highlighted || knowledgeTerm ? 700 : 400,
                color: ruleStyle ? ruleStyle.color : highlighted ? "var(--red)" : knowledgeTerm ? "var(--blue)" : baseColor,
                background: ruleStyle ? ruleStyle.bg : highlighted ? "var(--red-lt)" : knowledgeTerm ? "var(--blue-lt)" : "transparent",
                borderRadius: highlighted || knowledgeTerm ? 4 : 0,
                padding: highlighted || knowledgeTerm ? "1px 3px" : 0,
                margin: highlighted || knowledgeTerm ? "0 -3px" : 0,
                cursor: clickable ? "pointer" : "default",
                transition: "background .1s",
              }}
              title={rule ? rule.label : clickable ? `Søg "${cleanPart}" i leksikon` : undefined}
            >
              {part}
            </span>
            {i < parts.length - 1 && (
              <span style={{ color:"var(--muted)", fontSize:12 }}>{sentenceStart[i + 1] ? ". " : ", "}</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Viser profilbadges (bruger + familie) baseret på allergen flags
