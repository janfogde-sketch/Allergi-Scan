// @ts-nocheck
// Fælles byggeklodser til leksikonformularen: lister med chips (ingen kommasepareret tekst), kilder, tilknyttede allergener og tilstande (delt efter hvad de er) og emoji-vælger.
import React, { useState } from "react";
import { AllergenGlyph, Icon } from "../../SharedComponents.jsx";
import { addItem, parseSource, sourceLabel, RELATION_GROUPS, relationOptions, relationGroup } from "../knowledgeLogic.js";
import { ALLERGENS } from "../../constants.jsx";

/** Liste af værdier som chips: skriv, tryk Tilføj eller Enter, fjern med krydset. Dubletter og tomme værdier afvises, og værdier med komma bevares som én værdi. */
export function ChipList({ id, label, values, onChange, placeholder, hint, kind = "text", error }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const add = () => {
    const raw = text.trim();
    if (!raw) return;
    if (kind === "url" && /^[a-z]+:\/\//i.test(raw) && !parseSource(raw).ok) { setMsg("Adressen er ugyldig."); return; }
    const r = addItem(values, raw);
    if (!r.added) { setMsg(r.reason === "duplicate" ? "Findes allerede." : ""); if (r.reason === "duplicate") setText(""); return; }
    setMsg(""); setText(""); onChange(r.list);
  };
  return (
    <div className="admin-field kb-chips">
      <label htmlFor={id}>{label}</label>
      {hint && <div className="usr-hint" style={{ marginTop: 0, marginBottom: 6 }}>{hint}</div>}
      {values.length > 0 && (
        <ul className="usr-chips" aria-label={label}>
          {values.map((v) => (
            <li key={v} className="usr-chip on kb-chip">
              <span title={v}>{kind === "url" ? sourceLabel(v) : v}</span>
              <button type="button" className="usr-chip-x" aria-label={`Fjern ${kind === "url" ? sourceLabel(v) : v}`} onClick={() => onChange(values.filter((x) => x !== v))}><Icon name="x" size={12} color="var(--ink2)" /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="usr-add">
        <input id={id} value={text} placeholder={placeholder} aria-invalid={!!(msg || error)} autoCapitalize="off" autoCorrect="off" spellCheck={false} inputMode={kind === "url" ? "url" : undefined}
          onChange={(e) => { setText(e.target.value); setMsg(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm admin-touch" onClick={add} disabled={!text.trim()}>Tilføj</button>
      </div>
      {(msg || error) && <div className="usr-err" role="alert">{msg || error}</div>}
    </div>
  );
}

/** Tilknyttede allergener og tilstande, delt i allergier, intolerancer, medicinske tilstande og andre registrerede id'er. Intet vælges automatisk. */
export function RelationPicker({ label, selected, onChange }) {
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const unknown = selected.filter((id) => !ALLERGENS.some((a) => a.id === id));
  return (
    <div className="admin-field" role="group" aria-label={label}>
      <label>{label}</label>
      {RELATION_GROUPS.map(([g, title, help]) => {
        const opts = g === "other" ? unknown.map((id) => ({ id, label: id, other: true })) : relationOptions(g);
        if (opts.length === 0) return null;
        return (
          <div key={g} className="kb-rel-group">
            <div className="kb-rel-title">{title}<span> · {help}</span></div>
            <div className="usr-chips">
              {opts.map((a) => {
                const on = selected.includes(a.id);
                return (
                  <button key={a.id} type="button" className={`usr-chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggle(a.id)}>
                    {on && <Icon name="check" size={12} color="var(--green)" />}{!a.other && <AllergenGlyph a={a} size={13} />}<span>{a.pickerLabel || a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {selected.length > 0 && <div className="usr-hint">Valgt: {selected.map((id) => `${ALLERGENS.find((a) => a.id === id)?.label || id} (${{ allergy: "allergi", intolerance: "intolerance", condition: "tilstand", other: "andet" }[relationGroup(id)]})`).join(", ")}</div>}
    </div>
  );
}

const EMOJIS = ["🥜", "🌰", "🥛", "🥚", "🐟", "🦐", "🌾", "🍞", "🥩", "🍗", "🥬", "🍅", "🥕", "🍎", "🍌", "🍇", "🍓", "🍋", "🥑", "🥦", "🌽", "🥔", "🧀", "🍫", "🍬", "🍯", "🍷", "🍺", "☕", "🧂", "🌿", "🌱", "🫘", "🍄", "🥣", "🍝", "🍕", "🍔", "🥗", "🥫", "🧈", "🍚", "🍜", "💊", "🩺", "⚠️", "ℹ️", "❓", "💡", "🔬", "🧪"];

/** Kontrolleret emoji-valg med forhåndsvisning (ingen fri tekst). Emojien er kun pynt og siger intet om risiko. */
export function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const list = value && !EMOJIS.includes(value) ? [value, ...EMOJIS] : EMOJIS;
  return (
    <div className="admin-field">
      <label id="kb-emoji-l">Emoji</label>
      <button type="button" className="admin-btn admin-btn-ghost admin-touch kb-emoji-btn" aria-labelledby="kb-emoji-l" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="kb-emoji-cur" aria-hidden="true">{value || "–"}</span> {value ? "Skift" : "Vælg"}
      </button>
      {open && (
        <div className="kb-emoji-grid" role="listbox" aria-label="Vælg emoji">
          <button type="button" role="option" aria-selected={!value} className={`kb-emoji${!value ? " on" : ""}`} onClick={() => { onChange(""); setOpen(false); }}>Ingen</button>
          {list.map((e) => <button key={e} type="button" role="option" aria-selected={value === e} className={`kb-emoji${value === e ? " on" : ""}`} onClick={() => { onChange(e); setOpen(false); }}>{e}</button>)}
        </div>
      )}
      <div className="usr-hint">Kun pynt. Emojien siger intet om risiko eller alvor.</div>
    </div>
  );
}
