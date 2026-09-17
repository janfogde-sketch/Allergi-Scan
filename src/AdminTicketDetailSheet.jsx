// @ts-nocheck
import React from "react";
import { Icon, showToast } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";

export default function AdminTicketDetailSheet({ openTicket, setOpenTicket, updateTicketStatus }) {
  if (!openTicket) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9990, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"flex-end" }}
      onClick={e => e.target === e.currentTarget && setOpenTicket(null)}>
      <div style={UI.ubgsheet_br20px20px_p20px16px_w100_mxh90vh_ovyauto}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={UI.udflex_aicenter_g12_mb16}>
          <button onClick={() => setOpenTicket(null)} aria-label="Luk"
            style={UI.ubgsurface2_bdnone_br50_w32_h32_curpointer_fs18_cmuted}>×</button>
          <div style={{ flex:1, fontSize:16, fontWeight:800, color:"var(--ink)", display:"flex", alignItems:"center", gap:6 }}><Icon name="bug" size={15} color="var(--ink)" /> Ticket #{openTicket.id?.slice(0,8)}</div>
        </div>

        {/* Status knapper */}
        <div style={UI.udflex_g6_mb14}>
          {[
            { val:"open",        label:"Åben",   dot:"var(--red)" },
            { val:"in_progress", label:"I gang",  dot:"var(--amber)" },
            { val:"resolved",    label:"Løst",    dot:"var(--green)" },
          ].map(s => (
            <button key={s.val} onClick={() => updateTicketStatus(openTicket.id, s.val)}
              style={{ flex:1, padding:"8px 4px", borderRadius:10, border:`1px solid ${openTicket.status===s.val?"var(--green)":"var(--border)"}`,
                background: openTicket.status===s.val ? "var(--green-lt)" : "var(--surface)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                fontFamily:"var(--f)", fontSize:10, fontWeight:700,
                color: openTicket.status===s.val ? "var(--green)" : "var(--muted)", cursor:"pointer" }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Beskrivelse */}
        <div style={UI.ubgsurface_bd1pxsolid_br12_p14px_mb10}>
          <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700, marginBottom:6 }}>BESKRIVELSE</div>
          <div style={{ fontSize:14, color:"var(--ink)", lineHeight:1.7 }}>{openTicket.description}</div>
        </div>

        {/* Skærmbillede */}
        {openTicket.image_base64 && (
          <div style={UI.ubgsurface_bd1pxsolid_br12_p14px_mb10}>
            <div style={UI.ufs11_cmuted_fw700_mb8}>SKÆRMBILLEDE</div>
            <img src={`data:image/jpeg;base64,${openTicket.image_base64}`} alt="Screenshot"
              style={{ width:"100%", borderRadius:8, objectFit:"contain" }} />
          </div>
        )}

        {/* Diagnostisk info */}
        {openTicket.context && (
          <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px", marginBottom:10 }}>
            <div style={{ ...UI.ufs11_cmuted_fw700_mb8, display:"flex", alignItems:"center", gap:6 }}><Icon name="chart" size={11} color="var(--muted)" /> DIAGNOSTISK INFO</div>
            <div style={UI.grid2gap6}>
              {[
                ["Bruger",      openTicket.context.user_name || "Anonym"],
                ["Email",       openTicket.context.user_email || "—"],
                ["Skærm",       openTicket.context.screen_label || openTicket.context.screen || "—"],
                ["Side-ID",     openTicket.context.page_id || "—"],
                ["Enhed",       /iPhone|iPad/.test(openTicket.context.user_agent||"")?"iOS":/Android/.test(openTicket.context.user_agent||"")?"Android":"Desktop"],
                ["Viewport",    openTicket.context.viewport || "—"],
                ["Skærmstørrelse", openTicket.context.screen_size || "—"],
                ["Rolle",       openTicket.context.user_role || "—"],
                ["Version",     openTicket.context.app_version || "—"],
                ["Build",       openTicket.context.build_time
                  ? new Date(openTicket.context.build_time).toLocaleString("da-DK", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
                  : "—"],
                ["Commit",      openTicket.context.commit_sha || "—"],
                ["Allergener",  openTicket.context.allergens_count ?? "—"],
                ["Familie",     openTicket.context.family_count ?? "—"],
                ["Scanninger",  openTicket.context.history_count ?? "—"],
                ["Online",      openTicket.context.online ? "Ja" : "Nej"],
              ].map(([k, v]) => (
                <div key={k} style={{ background:"var(--surface)", borderRadius:8, padding:"8px 10px" }}>
                  <div style={{ fontSize:9, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:".4px" }}>{k}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:"var(--ink)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v ?? "—"}</div>
                </div>
              ))}
            </div>

            {/* Aktive allergener — bred celle */}
            {openTicket.context.allergens?.length > 0 && (
              <div style={UI.ubgsurface_br8_p8px10px_mt6}>
                <div style={UI.ufs9_cmuted_fw700_ttuppercas_ls4px_mb4}>ALLERGENER</div>
                <div style={UI.ufs11_cink_fw600}>{openTicket.context.allergens.join(", ")}</div>
              </div>
            )}

            {/* Produkt-kontekst hvis tilgængelig */}
            {(openTicket.context.scan_result_name || openTicket.context.scan_result_ean) && (
              <div style={UI.ubgsurface_br8_p8px10px_mt6}>
                <div style={UI.ufs9_cmuted_fw700_ttuppercas_ls4px_mb4}>PRODUKT VED FEEDBACK</div>
                <div style={UI.ufs11_cink_fw600}>
                  {openTicket.context.scan_result_name || "—"} {openTicket.context.scan_result_ean ? `[EAN: ${openTicket.context.scan_result_ean}]` : ""}
                </div>
              </div>
            )}

            {/* Madpas-sprog hvis relevant */}
            {openTicket.context.madpas_lang && (
              <div style={UI.ubgsurface_br8_p8px10px_mt6}>
                <div style={UI.ufs9_cmuted_fw700_ttuppercas_ls4px_mb4}>MADPAS SPROG</div>
                <div style={UI.ufs11_cink_fw600}>{openTicket.context.madpas_lang}</div>
              </div>
            )}
          </div>
        )}

        {/* Kopi til Claude */}
        <div style={{ background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:12, padding:"14px", marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}><Icon name="link" size={13} color="var(--ink)" /> Send til Claude til fejlretning</div>
          <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.6, marginBottom:10 }}>
            Kopiér nedenstående og indsæt direkte i Claude-chatten:
          </div>
          <button onClick={() => {
            const ctx = openTicket.context || {};
            const buildStr = ctx.build_time
              ? new Date(ctx.build_time).toLocaleString("da-DK", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
              : "—";
            const txt = `EatSafe Beta — Bug Report #${openTicket.id?.slice(0,8)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: ${openTicket.type}
Tidspunkt: ${new Date(openTicket.created_at).toLocaleString("da-DK")}

SKÆRM
  Beskrivelse: ${ctx.screen_label || ctx.screen || "—"}
  Side-ID:     ${ctx.page_id || "—"}
  URL:         ${ctx.url || "—"}

BRUGER
  Navn:        ${ctx.user_name || "Anonym"}
  Email:       ${ctx.user_email || "—"}
  Rolle:       ${ctx.user_role || "—"}
  Allergener:  ${ctx.allergens?.join(", ") || `${ctx.allergens_count ?? "—"} stk`}
  Familie:     ${ctx.family_count ?? "—"} profiler
  Scanninger:  ${ctx.history_count ?? "—"}

ENHED
  Platform:    ${ctx.platform || "—"}
  Viewport:    ${ctx.viewport || "—"}
  Skærm:       ${ctx.screen_size || "—"}
  Enhed:       ${/iPhone|iPad/.test(ctx.user_agent||"")?"iOS":/Android/.test(ctx.user_agent||"")?"Android":"Desktop"}
  Online:      ${ctx.online ? "Ja" : "Nej"}
  Sprog:       ${ctx.language || "—"}

BUILD
  Version:     ${ctx.app_version || "—"}
  Build:       ${buildStr}
  Commit:      ${ctx.commit_sha || "—"}
${ctx.scan_result_name ? `
PRODUKT VED FEEDBACK
  Navn:        ${ctx.scan_result_name}
  EAN:         ${ctx.scan_result_ean || "—"}` : ""}${ctx.madpas_lang ? `
MADPAS
  Sprog:       ${ctx.madpas_lang}` : ""}${ctx.selected_recipe ? `
OPSKRIFT
  Navn:        ${ctx.selected_recipe}` : ""}

BESKRIVELSE
${openTicket.description}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPGAVE TIL CLAUDE
Analysér denne fejlrapport, før du retter noget:
1. Forståelse — hvad rapporterer brugeren, og på hvilken skærm/flow sker det?
2. Analyse — undersøg relevant kode og find den sandsynlige rodårsag.
3. Løsningsforslag — beskriv kort den påtænkte rettelse, inden den implementeres.
Implementér derefter løsningen.`;
            navigator.clipboard?.writeText(txt).then(() => showToast("Kopieret til udklipsholder!")).catch(() => alert(txt));
          }}
            style={{ ...UI.uw100_bggreen_bdnone_br10_p10px_fff_fs13_fw700_congreen_curp, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <Icon name="link" size={14} color="var(--on-green)" /> Kopiér til Claude
          </button>
        </div>

        <button onClick={() => setOpenTicket(null)}
          style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"10px", fontFamily:"var(--f)", fontSize:13, fontWeight:600, color:"var(--ink)", cursor:"pointer" }}>
          Luk
        </button>
      </div>
    </div>
  );
}
