// @ts-nocheck
import React, { useState } from "react";
import { showToast } from "../../SharedComponents.jsx";

const STATUS_LABELS = { open: "Åben", resolved: "Løst", ignored: "Ignoreret" };
const STATUS_PILL = { open: "admin-pill-red", resolved: "admin-pill-green", ignored: "admin-pill-neutral" };
const SOURCE_LABELS = { react: "Skærm-crash", window: "Script", promise: "Promise", app: "App" };

const fmt = (d) => new Date(d).toLocaleString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Færdig prompt til en Claude Code-session, samme idé som ved tickets.
function buildErrorPrompt(e) {
  return [
    `Undersøg denne fejl fra EatSafes fejltabel (client_errors, id ${e.id}) i Allergi-Scan-kodebasen.`,
    ``,
    `Besked: ${e.message}`,
    `Kilde: ${SOURCE_LABELS[e.source] || e.source} · Skærm: ${e.screen || "—"} · Sti: ${e.url || "—"}`,
    `Antal: ${e.occurrences} (første ${fmt(e.first_seen)}, seneste ${fmt(e.last_seen)})`,
    `Version: ${e.app_version || "—"} · Enhed: ${e.user_agent || "—"}`,
    ``,
    `Stack:`,
    e.stack || "(ingen)",
    ...(e.context?.componentStack ? [``, `Komponent-stack:`, e.context.componentStack] : []),
    ``,
    `Find rodårsagen i koden, forklar den kort, og foreslå en rettelse. Vent på min bekræftelse, før du retter.`,
  ].join("\n");
}

export default function ErrorsSection({ errors, loading, filter, setFilter, load, setStatus }) {
  const [openId, setOpenId] = useState(null);
  const filtered = errors.filter(e => filter === "all" || e.status === filter);
  const count = (s) => (s === "all" ? errors.length : errors.filter(e => e.status === s).length);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12 }}>
        <div className="admin-tabs" style={{ marginBottom: 0, border: "none" }}>
          {["open", "resolved", "ignored", "all"].map(s => (
            <button key={s} className={`admin-tab-btn${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>
              {s === "all" ? "Alle" : STATUS_LABELS[s]} ({count(s)})
            </button>
          ))}
        </div>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={load}>Opdater</button>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
        Fejl, som appen selv har registreret hos brugerne. Samme fejl inden for en time tælles sammen i én række. En løst fejl åbnes igen, hvis den sker igen.
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading-row"><div className="admin-spinner" /> Henter…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-table-empty">Ingen fejl her</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Fejl</th><th>Skærm</th><th>Antal</th><th>Seneste</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <React.Fragment key={e.id}>
                  <tr style={{ cursor: "pointer" }} onClick={() => setOpenId(openId === e.id ? null : e.id)}>
                    <td style={{ maxWidth: 420 }}>
                      <div style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{e.message}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{SOURCE_LABELS[e.source] || e.source}{e.app_version ? ` · ${e.app_version}` : ""}</div>
                    </td>
                    <td>{e.screen || "—"}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{e.occurrences}×</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(e.last_seen)}</td>
                    <td><span className={`admin-pill ${STATUS_PILL[e.status]}`}>{STATUS_LABELS[e.status]}</span></td>
                    <td style={{ display: "flex", gap: 6 }} onClick={(ev) => ev.stopPropagation()}>
                      {e.status !== "resolved" && <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setStatus(e.id, "resolved")}>Løst</button>}
                      {e.status === "open" && <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setStatus(e.id, "ignored")}>Ignorér</button>}
                      {e.status !== "open" && <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setStatus(e.id, "open")}>Genåbn</button>}
                    </td>
                  </tr>
                  {openId === e.id && (
                    <tr>
                      <td colSpan={6} style={{ background: "var(--surface2)" }}>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                          Første gang {fmt(e.first_seen)} · Sti {e.url || "—"} · {e.user_id ? `Bruger ${e.user_id}` : "Ikke logget ind"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, overflowWrap: "anywhere" }}>{e.user_agent || ""}</div>
                        <pre style={{ fontFamily: "var(--mono)", fontSize: 11, whiteSpace: "pre-wrap", overflowX: "auto", maxHeight: 280, margin: 0 }}>
                          {e.stack || "(ingen stack)"}
                          {e.context?.componentStack ? `\n\nKomponent-stack:${e.context.componentStack}` : ""}
                        </pre>
                        <button
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          style={{ marginTop: 8 }}
                          onClick={() => navigator.clipboard?.writeText(buildErrorPrompt(e))
                            .then(() => showToast("Prompt kopieret"))
                            .catch((err) => showToast("Kunne ikke kopiere: " + err.message, "error"))}>
                          Kopiér som prompt
                        </button>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
