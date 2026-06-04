// @ts-nocheck
import React, { useState, useEffect, useMemo } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SCREENS, ALLERGENS, DIETS } from "./constants.jsx";
import { Icon } from "./SharedComponents.jsx";

const CATEGORIES = [
  { id: "all",             label: "Alle",            emoji: "📚" },
  { id: "allergen",        label: "Allergener",      emoji: "⚠️" },
  { id: "e_number",        label: "E-numre",         emoji: "🧪" },
  { id: "diet",            label: "Diæter",          emoji: "🥗" },
  { id: "ingredient",      label: "Ingredienser",    emoji: "🧈" },
  { id: "cross_reaction",  label: "Krydsreaktioner", emoji: "🔄" },
  { id: "faq",             label: "FAQ",             emoji: "❓" },
  { id: "fun_fact",        label: "Vidste du",       emoji: "💡" },
];

const RISK_COLORS = {
  high:   { bg: "var(--red-lt)",   color: "var(--red)",   label: "Høj risiko" },
  medium: { bg: "var(--amber-lt)", color: "var(--amber)", label: "Moderat" },
  low:    { bg: "var(--green-lt)", color: "var(--green)", label: "Lav risiko" },
  none:   { bg: "var(--green-lt)", color: "var(--green)", label: "Ingen risiko" },
};

export default function KnowledgeScreen({ screen, setScreen, accessToken }) {
  const [entries, setEntries]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("all");
  const [selected, setSelected]     = useState(null); // detail view

  // ── Load all entries on mount ──
  useEffect(() => {
    if (entries.length > 0) return; // allerede loadet
    setLoading(true);
    fetch(`${SUPABASE_URL}/rest/v1/knowledge_base?select=id,category,title,slug,emoji,summary,description,found_in,alternatives,health_notes,allergen_ids,diet_tags,risk_level,aliases,tags,sort_order&order=sort_order.asc,title.asc&limit=1000`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Accept": "application/json" },
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setEntries(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Filter + search ──
  const filtered = useMemo(() => {
    let results = entries;
    if (category !== "all") results = results.filter(e => e.category === category);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(e =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.summary || "").toLowerCase().includes(q) ||
        (e.aliases || []).some(a => a.toLowerCase().includes(q)) ||
        (e.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return results;
  }, [entries, category, search]);

  // ── Category counts ──
  const counts = useMemo(() => {
    const c = { all: entries.length };
    entries.forEach(e => { c[e.category] = (c[e.category] || 0) + 1; });
    return c;
  }, [entries]);

  // ── Open entry by slug (for deep-links from scan results) ──
  const openBySlug = (slug) => {
    const entry = entries.find(e => e.slug === slug);
    if (entry) setSelected(entry);
  };

  // ── DETAIL VIEW ──
  if (selected) {
    const risk = RISK_COLORS[selected.risk_level] || null;
    return (
      <div className="screen fade-in" style={{ paddingBottom: 120 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingTop: 16 }}>
          <button onClick={() => setSelected(null)}
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2"><path strokeLinecap="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
              {CATEGORIES.find(c => c.id === selected.category)?.label || selected.category}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-.4px" }}>
              {selected.emoji} {selected.title}
            </div>
          </div>
          {risk && (
            <div style={{ padding: "4px 10px", borderRadius: 100, background: risk.bg, border: `1px solid ${risk.color}22`, fontSize: 10, fontWeight: 700, color: risk.color }}>
              {risk.label}
            </div>
          )}
        </div>

        {/* Summary */}
        {selected.summary && (
          <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.65, marginBottom: 16, fontWeight: 500 }}>
            {selected.summary}
          </div>
        )}

        {/* Description */}
        {selected.description && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.7, fontWeight: 400 }}>
              {selected.description}
            </div>
          </div>
        )}

        {/* Health notes */}
        {selected.health_notes && (
          <div style={{ background: "var(--amber-lt)", border: "1px solid var(--amber-md)", borderRadius: 14, padding: 14, marginBottom: 12, display: "flex", gap: 10 }}>
            <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚕️</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>Sundhedsnoter</div>
              <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.65 }}>{selected.health_notes}</div>
            </div>
          </div>
        )}

        {/* Found in */}
        {selected.found_in?.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>🔍 Findes typisk i</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {selected.found_in.map((f, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: "var(--red-lt)", color: "var(--red)", border: "1px solid var(--red-md)" }}>
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alternatives */}
        {selected.alternatives?.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>✅ Alternativer</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {selected.alternatives.map((a, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: "var(--green-lt)", color: "var(--green)", border: "1px solid var(--green-mid)" }}>
                  {a}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aliases */}
        {selected.aliases?.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>📝 Også kendt som</div>
            <div style={{ fontSize: 12, color: "var(--ink)", lineHeight: 1.6 }}>
              {selected.aliases.join(" · ")}
            </div>
          </div>
        )}

        {/* Relaterede allergener — kun vis hvis vi kan finde entries med labels */}
        {(() => {
          if (!selected.allergen_ids?.length) return null;
          const linked = selected.allergen_ids.map(id => {
            const entry = entries.find(e => e.slug === id);
            const allergen = ALLERGENS.find(a => a.id === id);
            return { id, entry, label: entry?.title || allergen?.label || null, emoji: entry?.emoji || allergen?.emoji || null };
          }).filter(x => x.label);
          if (!linked.length) return null;
          return (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>🔗 Relaterede allergener</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {linked.map((x, i) => (
                  <div key={i}
                    onClick={() => { if (x.entry) setSelected(x.entry); }}
                    style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: "var(--red-lt)", color: "var(--red)", border: "1px solid var(--red-md)", cursor: x.entry ? "pointer" : "default" }}>
                    {x.emoji} {x.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Relevant for diæter — kun vis hvis vi kan finde labels */}
        {(() => {
          if (!selected.diet_tags?.length) return null;
          const linked = selected.diet_tags.map(id => {
            const entry = entries.find(e => e.slug === id);
            const diet = DIETS.find(d => d.id === id);
            return { id, entry, label: entry?.title || diet?.label || null, emoji: entry?.emoji || diet?.emoji || "🥗" };
          }).filter(x => x.label);
          if (!linked.length) return null;
          return (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>🥗 Relevant for disse diæter</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {linked.map((x, i) => (
                  <div key={i}
                    onClick={() => { if (x.entry) setSelected(x.entry); }}
                    style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: "var(--green-lt)", color: "var(--green)", border: "1px solid var(--green-mid)", cursor: x.entry ? "pointer" : "default" }}>
                    {x.emoji} {x.label}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // ── LIST VIEW ──
  const showingAll = category === "all" && !search.trim();

  return (
    <div className="screen fade-in" style={{ paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ paddingTop: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-.4px" }}>Viden</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>
          Lær om allergener, E-numre, diæter og ingredienser
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="search" size={16} color="var(--muted)" />
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg i leksikon..."
          style={{ width: "100%", padding: "12px 14px 12px 42px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", fontFamily: "var(--f)", fontSize: 14, color: "var(--ink)", outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* ── Kategorier som grid (når ingen søgning/filter er aktiv) ── */}
      {showingAll && !loading && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {CATEGORIES.filter(c => c.id !== "all").map(c => {
              const count = counts[c.id] || 0;
              return (
                <div key={c.id}
                  onClick={() => setCategory(c.id)}
                  style={{
                    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
                    padding: "16px 14px", cursor: "pointer", transition: "border-color .15s",
                  }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{c.emoji}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{count} {count === 1 ? "artikel" : "artikler"}</div>
                </div>
              );
            })}
          </div>

          {/* Fun fact of the day */}
          {(() => {
            const facts = entries.filter(e => e.category === "fun_fact");
            if (!facts.length) return null;
            const today = facts[new Date().getDate() % facts.length];
            return (
              <div style={{ background: "var(--surface)", borderLeft: "3px solid var(--green)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>💡 Vidste du</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>{today.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>{today.summary}</div>
              </div>
            );
          })()}
        </>
      )}

      {/* ── Aktiv kategori header + nulstil ── */}
      {!showingAll && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
            {search.trim()
              ? `${filtered.length} resultat${filtered.length !== 1 ? "er" : ""}`
              : `${CATEGORIES.find(c => c.id === category)?.emoji || ""} ${CATEGORIES.find(c => c.id === category)?.label || "Alle"}`}
          </div>
          <div onClick={() => { setCategory("all"); setSearch(""); }}
            style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", cursor: "pointer" }}>
            ← Alle kategorier
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div className="spinner" style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Indlæser leksikon...</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !showingAll && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>Ingen resultater</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            Prøv et andet søgeord eller vælg en anden kategori
          </div>
        </div>
      )}

      {/* Entry list — kun når en kategori er valgt eller der søges */}
      {!loading && !showingAll && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(entry => {
            const risk = RISK_COLORS[entry.risk_level] || null;
            return (
              <div key={entry.id}
                onClick={() => setSelected(entry)}
                style={{
                  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
                  padding: "12px 14px", cursor: "pointer",
                  display: "flex", gap: 10, alignItems: "center",
                }}>
                <div style={{ fontSize: 20, flexShrink: 0 }}>{entry.emoji || "📄"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{entry.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {entry.summary}
                  </div>
                </div>
                {risk && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: risk.color, flexShrink: 0 }} />
                )}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
