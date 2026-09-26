// @ts-nocheck
import React, { useState, useEffect } from "react";
import { ALLERGENS, SCREENS, MADPAS_LANGUAGES, MADPAS_SECTIONS_T, MADPAS_SAFETY_NOTE_T, MADPAS_ALLERGY_HEADLINE_T, MADPAS_INTOLERANCE_HEADLINE_T, SUPABASE_URL } from "./constants.jsx";
import { initials, makeHeaders, apiCall } from "./helpers.js";
import { Icon, showToast } from "./SharedComponents.jsx";
import { madpasAllergenLabel, madpasDietLabel } from "./useMadpas.js";
import { useAuthContext } from "./AuthContext.jsx";
import { useProfileContext } from "./ProfileContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { UI } from "./styleUtils.js";

// ── Madpas-redesign (26. sept. 2026) ────────────────────────────────────────
// Målet: en tjener/ekspedient i udlandet skal kunne forstå de vigtigste
// kost-/allergioplysninger på FÅ SEKUNDER. Det betyder: strukturerede
// sektioner efter type (allergi/intolerance/kost/E-numre) i stedet for én
// generisk "kan ikke spise"-liste, ekstrem læsbarhed i tjener-visningen
// (stort sprog/flag, stor tekst, ingen dekorativ baggrund), og et madpas der
// ALTID afspejler den valgte profils AKTUELLE data — inkl. kostpræferencer
// og E-numre, som tidligere fejlagtigt altid fulgte den loggede bruger selv
// uanset hvilken profil der var valgt (rettet i App.jsx/useMadpas.js, se
// mpDiets/mpENumbers).
//
// Delings-linket (QR/kopiér) er nu et RIGTIGT, tilbagekaldeligt token
// (madpas_links-tabellen + get_madpas_by_token()-RPC'en, se
// src/CONTEXT.md) — det var tidligere bare `eatsafe.dk/madpas/<userId>`,
// en URL der ikke gjorde noget som helst, fordi der ingen offentlig
// visning fandtes for den (fundet under dette redesign). Den offentlige
// side, modtageren rent faktisk ser, er public/madpas-view.html.
export default function MadpasScreen({
  madpasLang, setMadpasLang,
  madpasProfileId, setMadpasProfileId,
  madpasSpeaking, setMadpasSpeaking,
  madpasBig,
  madpasWaiterView, setMadpasWaiterView,
  mpAllergens, mpCustom, mpDiets, mpENumbers,
  langOpen, setLangOpen,
  madpasSpeak,
}) {
  const { user, userId, accessToken } = useAuthContext();
  const { family } = useProfileContext();
  const { screen } = useNavigationContext();

  const profileRef = madpasProfileId === "self" ? "self" : madpasProfileId;

  // ── Delbart link (madpas_links) ─────────────────────────────────────────
  // Hentes/oprettes automatisk pr. valgt profil, så QR/kopiér-sektionen
  // virker med det samme uden en ekstra "opret link"-handling — men er nu
  // et rigtigt, tilbagekaldeligt token i stedet for den tidligere faste,
  // aldrig-fungerende userId-baserede URL.
  const [madpasLinkToken, setMadpasLinkToken] = useState(null);
  const [madpasLinkLoading, setMadpasLinkLoading] = useState(false);

  useEffect(() => {
    if (!userId || !accessToken) return;
    let cancelled = false;
    setMadpasLinkToken(null);
    setMadpasLinkLoading(true);
    (async () => {
      try {
        const rows = await apiCall(
          `${SUPABASE_URL}/rest/v1/madpas_links?user_id=eq.${userId}&profile_ref=eq.${encodeURIComponent(profileRef)}&status=eq.active&order=created_at.desc&limit=1`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        if (cancelled) return;
        if (Array.isArray(rows) && rows[0]) { setMadpasLinkToken(rows[0].token); return; }
        const created = await apiCall(`${SUPABASE_URL}/rest/v1/madpas_links`, {
          method: "POST",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
          body: JSON.stringify({ user_id: userId, profile_ref: profileRef, lang: madpasLang }),
        });
        if (!cancelled && Array.isArray(created) && created[0]) setMadpasLinkToken(created[0].token);
      } catch { /* del-sektionen skjules blot hvis linket ikke kunne hentes/oprettes */ }
      finally { if (!cancelled) setMadpasLinkLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [userId, accessToken, profileRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Holder linkets gemte sprog nogenlunde friskt (bruges kun som den
  // offentlige sides STANDARDsprog — modtageren kan altid selv skifte det).
  useEffect(() => {
    if (!madpasLinkToken || !accessToken) return;
    apiCall(`${SUPABASE_URL}/rest/v1/madpas_links?token=eq.${madpasLinkToken}`, {
      method: "PATCH", headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
      body: JSON.stringify({ lang: madpasLang }),
    }).catch(() => {});
  }, [madpasLang]); // eslint-disable-line react-hooks/exhaustive-deps

  const regenerateLink = async () => {
    setMadpasLinkLoading(true);
    try {
      if (madpasLinkToken) {
        await apiCall(`${SUPABASE_URL}/rest/v1/madpas_links?token=eq.${madpasLinkToken}`, {
          method: "PATCH", headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body: JSON.stringify({ status: "revoked" }),
        });
      }
      const created = await apiCall(`${SUPABASE_URL}/rest/v1/madpas_links`, {
        method: "POST", headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({ user_id: userId, profile_ref: profileRef, lang: madpasLang }),
      });
      setMadpasLinkToken(Array.isArray(created) && created[0] ? created[0].token : null);
      showToast("Nyt link oprettet — det gamle virker ikke længere");
    } catch {
      showToast("Kunne ikke generere nyt link. Prøv igen.", "error");
    }
    setMadpasLinkLoading(false);
  };

  const deactivateLink = async () => {
    if (!madpasLinkToken) return;
    setMadpasLinkLoading(true);
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/madpas_links?token=eq.${madpasLinkToken}`, {
        method: "PATCH", headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ status: "revoked" }),
      });
      setMadpasLinkToken(null);
      showToast("Linket er deaktiveret");
    } catch {
      showToast("Kunne ikke deaktivere linket. Prøv igen.", "error");
    }
    setMadpasLinkLoading(false);
  };

  const shareUrl = madpasLinkToken ? `https://eatsafe.dk/madpas/${madpasLinkToken}` : null;
  const qrUrl = shareUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}&bgcolor=0d1f12&color=4ADE80&qzone=2` : null;
  const [qrError, setQrError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  const handlePrint = () => {
    const style = document.createElement("style");
    style.id = "madpas-print-style";
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        #madpas-print { display: block !important; }
        @page { margin: 20mm; size: A4; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => {
      const el = document.getElementById("madpas-print-style");
      if (el) el.remove();
    }, 1000);
  };

  // ── Grupperede oplysninger efter type — fælles for preview, tjener-
  // visning og PDF, så alle tre altid viser præcis det samme (26. sept.
  // 2026). ALLERGENS.type ("allergi"/"intolerance") styrer grupperingen —
  // fritekst-tilføjelser ("Skriv selv") kan ikke kategoriseres og lægges i
  // allergi-sektionen som den mest forsigtige antagelse.
  const buildGroups = (lang) => {
    const allergenItems = mpAllergens.map(id => ALLERGENS.find(a => a.id === id)).filter(Boolean);
    return {
      allergyItems: allergenItems.filter(a => a.type === "allergi"),
      intoleranceItems: allergenItems.filter(a => a.type === "intolerance"),
      customItems: (mpCustom || []).filter(c => typeof c === "string" && !mpAllergens.includes(c)),
      dietItems: (mpDiets || []).map(id => ({ id, label: madpasDietLabel(id, lang) })).filter(x => x.label),
      eNumberItems: mpENumbers || [],
    };
  };

  const renderWaiterView = () => {
    const lang = madpasLang;
    const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
    const langInfo = MADPAS_LANGUAGES.find(l => l.code === lang);
    const { allergyItems, intoleranceItems, customItems, dietItems, eNumberItems } = buildGroups(lang);

    const sectionLbl = { fontSize:15, fontWeight:800, textTransform:"uppercase", letterSpacing:"1px", color:"var(--muted)", marginBottom:10 };
    const headline = { fontSize:19, fontWeight:700, color:"var(--ink)", marginBottom:14 };
    const itemRow = { display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom:"1px solid var(--border)" };
    const itemName = { fontSize:26, fontWeight:800, color:"var(--ink)", lineHeight:1.25 };

    return (
      <div style={{ position:"fixed", inset:0, zIndex:9999, background:"var(--paper)", display:"flex", flexDirection:"column" }} dir={rtl ? "rtl" : "ltr"}>

        {/* Stort flag/sprog øverst + luk (krav 5: "stort sprog/flag øverst",
            "ingen unødvendige knapper" — kun luk, ingen anden chrome). */}
        <div style={{ padding:"22px 24px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:44, lineHeight:1 }}>{langInfo?.flag}</span>
            <span style={{ fontSize:17, color:"var(--ink2)", fontWeight:700 }}>{langInfo?.name}</span>
          </div>
          <button onClick={() => { setMadpasWaiterView(false); if(madpasSpeaking){ window.speechSynthesis?.cancel(); setMadpasSpeaking(false); } }} aria-label="Luk"
            style={{ background:"var(--surface2)", border:"none", borderRadius:"50%", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <Icon name="x" size={20} color="var(--ink2)" />
          </button>
        </div>

        {/* Strukturerede sektioner — ingen lang høflighedstekst der skubber
            budskabet ned (krav 7), kun ægte indhold. */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 24px 32px" }}>
          {(allergyItems.length > 0 || customItems.length > 0) && (
            <div style={{ marginBottom:32 }}>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.allergies[lang] || MADPAS_SECTIONS_T.allergies.en}</div>
              <div style={headline}>{MADPAS_ALLERGY_HEADLINE_T[lang] || MADPAS_ALLERGY_HEADLINE_T.en}</div>
              <div>
                {allergyItems.map((a,i) => (
                  <div key={a.id} style={{ ...itemRow, borderBottom: (i===allergyItems.length-1 && customItems.length===0) ? "none" : itemRow.borderBottom }}>
                    <span style={UI.fs20}>{a.emoji}</span>
                    <span style={itemName}>{madpasAllergenLabel(a, lang)}</span>
                  </div>
                ))}
                {customItems.map((c,i) => (
                  <div key={`c${i}`} style={{ ...itemRow, borderBottom: i===customItems.length-1 ? "none" : itemRow.borderBottom }}>
                    <Icon name="warning" size={20} color="var(--amber)" />
                    <span style={itemName}>{c}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:"var(--ink2)", marginTop:14, lineHeight:1.5 }}>
                {MADPAS_SAFETY_NOTE_T[lang] || MADPAS_SAFETY_NOTE_T.en}
              </div>
            </div>
          )}

          {intoleranceItems.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.intolerances[lang] || MADPAS_SECTIONS_T.intolerances.en}</div>
              <div style={headline}>{MADPAS_INTOLERANCE_HEADLINE_T[lang] || MADPAS_INTOLERANCE_HEADLINE_T.en}</div>
              <div>
                {intoleranceItems.map((a,i) => (
                  <div key={a.id} style={{ ...itemRow, borderBottom: i===intoleranceItems.length-1 ? "none" : itemRow.borderBottom }}>
                    <span style={UI.fs20}>{a.emoji}</span>
                    <span style={itemName}>{madpasAllergenLabel(a, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dietItems.length > 0 && (
            <div style={{ marginBottom:32 }}>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.diet[lang] || MADPAS_SECTIONS_T.diet.en}</div>
              <div style={UI.udflex_flewrap_g8}>
                {dietItems.map(d => (
                  <div key={d.id} style={{ padding:"10px 18px", borderRadius:100, background:"var(--green-selected-bg)", border:"1px solid var(--border)", fontSize:17, fontWeight:700, color:"var(--ink)" }}>
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {eNumberItems.length > 0 && (
            <div>
              <div style={sectionLbl}>{MADPAS_SECTIONS_T.enumbers[lang] || MADPAS_SECTIONS_T.enumbers.en}</div>
              <div style={UI.udflex_flewrap_g8}>
                {eNumberItems.map((e,i) => (
                  <div key={i} style={{ padding:"10px 18px", borderRadius:100, background:"var(--surface2)", border:"1px solid var(--border)", fontSize:17, fontWeight:700, color:"var(--ink)" }}>
                    {e}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — kun oplæs-knappen (reel funktion, ikke dekoration) +
            diskret branding/dato. */}
        <div style={{ padding:"12px 24px 28px", borderTop:"1px solid var(--border)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, color:"var(--muted)" }}>EatSafe · {new Date().toLocaleDateString("da-DK")}</span>
          {window.speechSynthesis && (
            <button onClick={madpasSpeak} style={{
              background: madpasSpeaking ? "var(--amber)" : "var(--green)",
              border:"none", borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:700,
              color:"var(--on-green)", cursor:"pointer", fontFamily:"var(--f)",
              display:"flex", alignItems:"center", gap:8,
            }}>
              <Icon name={madpasSpeaking ? "speakerOff" : "speaker"} size={15} color="var(--on-green)" />
              {madpasSpeaking ? "Stop" : "Oplæs"}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCompactPreview = () => {
    const lang = madpasLang;
    const { allergyItems, intoleranceItems, customItems, dietItems, eNumberItems } = buildGroups(lang);
    const dietStyle = { background:"var(--green-selected-bg)", borderColor:"var(--border)", color:"var(--ink2)" };
    const enumberStyle = { background:"var(--surface2)", borderColor:"var(--border)", color:"var(--ink2)" };
    return (
      <div style={UI.mb14}>
        <div className="mp-section-lbl">Dit madpas</div>
        <div className="tags">
          {allergyItems.map(a => <div key={a.id} className="tag">{a.emoji} {madpasAllergenLabel(a, lang)}</div>)}
          {intoleranceItems.map(a => <div key={a.id} className="tag">{a.emoji} {madpasAllergenLabel(a, lang)}</div>)}
          {customItems.map((c,i) => <div key={`c${i}`} className="tag">{c}</div>)}
          {dietItems.map(d => <div key={d.id} className="tag" style={dietStyle}>{d.label}</div>)}
          {eNumberItems.map((e,i) => <div key={i} className="tag" style={enumberStyle}>{e}</div>)}
        </div>
      </div>
    );
  };

  const renderShareSection = () => (
    <div style={{ marginTop:16, background:"var(--surface2)", border:"1px solid var(--border2)", borderRadius:16, overflow:"hidden", boxShadow:"var(--sh)" }}>
      {/* Header */}
      <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8 }}>
        <Icon name="package" size={16} color="var(--ink2)" />
        <div>
          <div style={UI.boldInk13}>Del dit madpas</div>
          <div style={UI.muted11mt1}>Modtageren kan åbne madpasset i sin browser uden at installere EatSafe</div>
        </div>
      </div>

      {!shareUrl && (
        <div style={{ padding:16, fontSize:12, color:"var(--muted)" }}>
          {madpasLinkLoading ? "Opretter link…" : "Intet aktivt link."}
          {!madpasLinkLoading && (
            <button onClick={regenerateLink} style={{ marginLeft:8, background:"none", border:"none", color:"var(--green)", fontWeight:700, fontFamily:"var(--f)", fontSize:12, cursor:"pointer", padding:0 }}>
              Opret nyt link
            </button>
          )}
        </div>
      )}

      {shareUrl && (
        <>
          {/* QR popup — fullscreen overlay */}
          {qrOpen && (
            <div onClick={() => setQrOpen(false)}
              style={{ position:"fixed", inset:0, zIndex:9998, background:"rgba(0,0,0,.85)",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32 }}>
              <div onClick={e => e.stopPropagation()}
                style={{ background:"var(--sheet)", borderRadius:24, padding:"28px 24px", maxWidth:320, width:"100%", textAlign:"center" }}>
                <div style={{ fontSize:13, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Dit madpas</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:20, lineHeight:1.5 }}>
                  Bed tjeneren om at scanne denne QR-kode med sin telefon — så åbner dit madpas direkte i deres browser uden at de behøver installere noget.
                </div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(shareUrl)}&bgcolor=ffffff&color=0d3320&qzone=2`}
                  alt="QR-kode til madpas"
                  width={220} height={220}
                  style={{ borderRadius:16, border:"3px solid var(--green-mid)", display:"block", margin:"0 auto 20px" }}
                />
                <button onClick={() => setQrOpen(false)}
                  style={{ width:"100%", padding:"12px", borderRadius:12, background:"var(--green)", border:"none",
                    fontFamily:"var(--f)", fontSize:13, fontWeight:800, color:"var(--on-green)", cursor:"pointer", boxShadow:"0 2px 12px rgba(14,143,90,.25)" }}>
                  Luk
                </button>
              </div>
            </div>
          )}

          {/* QR + knapper side om side — INGEN rå URL vist som dominerende
              element (krav 8), kun QR + Kopiér + Del. */}
          <div style={{ padding:"16px", display:"flex", gap:16, alignItems:"center" }}>
            <div style={UI.shrink0}>
              {!qrError ? (
                <div onClick={() => setQrOpen(true)} style={{ cursor:"pointer", position:"relative" }}>
                  <img
                    src={qrUrl}
                    alt="QR-kode til madpas"
                    width={100} height={100}
                    onError={() => setQrError(true)}
                    style={{ borderRadius:10, display:"block", border:"2px solid rgba(14,143,90,.2)" }}
                  />
                </div>
              ) : (
                <div style={{ width:100, height:100, borderRadius:10, background:"var(--surface)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"var(--muted)", textAlign:"center", padding:8 }}>
                  QR ikke tilgængelig
                </div>
              )}
              <div style={{ fontSize:9, color:"var(--muted)", textAlign:"center", marginTop:6, fontWeight:600 }}>
                Tryk for at forstørre
              </div>
            </div>

            <div style={{ ...UI.flexMin, display:"flex", flexDirection:"column", gap:8 }}>
              <button onClick={copyLink}
                style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid var(--border2)",
                  background: copied ? "var(--green-lt)" : "var(--surface)",
                  fontFamily:"var(--f)", fontSize:12, fontWeight:700,
                  color: copied ? "var(--green)" : "var(--ink2)", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all .2s" }}>
                <Icon name={copied ? "check" : "link"} size={13} color={copied ? "var(--green)" : "var(--ink2)"} /> {copied ? "Kopieret!" : "Kopiér link"}
              </button>
              {navigator.share && (
                <button onClick={() => navigator.share({ title:"Mit EatSafe madpas", url:shareUrl })}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"none",
                    background:"var(--green)", fontFamily:"var(--f)", fontSize:12, fontWeight:800,
                    color:"var(--on-green)", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6, boxShadow:"0 2px 12px rgba(14,143,90,.25)" }}>
                  <Icon name="share" size={13} color="var(--on-green)" /> Del
                </button>
              )}
            </div>
          </div>

          {/* PDF-eksport */}
          <button
            onClick={handlePrint}
            style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px 16px", background:"var(--paper2)", border:"none", borderTop:"1px solid var(--border)", fontFamily:"var(--f)", fontSize:13, fontWeight:700, color:"var(--ink2)", cursor:"pointer" }}>
            <Icon name="file" size={16} color="var(--ink2)" />
            Gem som PDF / Print
          </button>

          {/* Privatliv/kontrol (krav 9): eksplicit undgået "offentligt
              tilgængelig" — kun personer med selve linket kan se det, og
              brugeren kan altid deaktivere/generere et nyt. */}
          <div style={{ padding:"12px 16px 14px", borderTop:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:6, fontSize:11, color:"var(--muted)", lineHeight:1.5, marginBottom:10 }}>
              <Icon name="shield" size={13} color="var(--muted)" /> Alle med linket kan se dette madpas. Linket er permanent, indtil du deaktiverer det.
            </div>
            <div style={{ display:"flex", gap:14 }}>
              <button onClick={regenerateLink} disabled={madpasLinkLoading}
                style={{ background:"none", border:"none", padding:0, color:"var(--green)", fontFamily:"var(--f)", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                Generér nyt link
              </button>
              <button onClick={deactivateLink} disabled={madpasLinkLoading}
                style={{ background:"none", border:"none", padding:0, color:"var(--red)", fontFamily:"var(--f)", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                Deaktiver link
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderMainContent = () => {
    const lang = madpasLang;
    const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
    return (
      <div style={{ paddingBottom:8 }} dir={rtl ? "rtl" : "ltr"}>
        {renderCompactPreview()}

        {/* VIS TIL TJENER */}
        <button className="mp-big-btn" onClick={() => setMadpasWaiterView(true)}>
          <span style={UI.fs18}>⤢</span>
          Vis til tjener
        </button>

        {renderShareSection()}
      </div>
    );
  };

  const renderPrintDiv = () => {
    const lang = madpasLang;
    const { allergyItems, intoleranceItems, customItems, dietItems, eNumberItems } = buildGroups(lang);
    const profileName = madpasProfileId === "self"
      ? user?.name || "Mig"
      : family?.find(m => m.id === madpasProfileId)?.name || "Familiemedlem";
    const langInfo = MADPAS_LANGUAGES.find(l => l.code === lang);

    const printSection = (title, children) => (
      <div style={UI.umb24}>
        <div style={UI.ufs13_fw700_ttuppercas_ls1px_c555_mb12}>{title}</div>
        {children}
      </div>
    );

    return (
      <div id="madpas-print" style={{ display:"none", fontFamily:"Georgia, serif", color:"#111", padding:40, maxWidth:600, margin:"0 auto" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"3px solid #111", paddingBottom:16, marginBottom:24 }}>
          <div>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:"-1px" }}>EatSafe</div>
            <div style={{ fontSize:13, color:"#555", marginTop:2 }}>Madpas · Meal Passport</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:16, fontWeight:700 }}>{profileName}</div>
            <div style={UI.ufs12_c555}>{new Date().toLocaleDateString("da-DK")}</div>
            {langInfo && <div style={UI.ufs12_c555}>{langInfo.flag} {langInfo.name}</div>}
          </div>
        </div>

        {(allergyItems.length > 0 || customItems.length > 0) && printSection(
          `${MADPAS_SECTIONS_T.allergies[lang] || MADPAS_SECTIONS_T.allergies.en} / ${MADPAS_SECTIONS_T.allergies.en}`,
          <div style={UI.udflex_flewrap_g8}>
            {allergyItems.map(a => (
              <div key={a.id} style={{ padding:"8px 16px", border:"2px solid #111", borderRadius:100, fontSize:15, fontWeight:700 }}>
                {a.emoji} {madpasAllergenLabel(a, lang)}
              </div>
            ))}
            {customItems.map((c,i) => (
              <div key={i} style={{ padding:"8px 16px", border:"2px solid #111", borderRadius:100, fontSize:15, fontWeight:700 }}>
                • {c}
              </div>
            ))}
          </div>
        )}

        {intoleranceItems.length > 0 && printSection(
          `${MADPAS_SECTIONS_T.intolerances[lang] || MADPAS_SECTIONS_T.intolerances.en} / ${MADPAS_SECTIONS_T.intolerances.en}`,
          <div style={UI.udflex_flewrap_g8}>
            {intoleranceItems.map(a => (
              <div key={a.id} style={{ padding:"8px 16px", border:"1px solid #111", borderRadius:100, fontSize:14 }}>
                {a.emoji} {madpasAllergenLabel(a, lang)}
              </div>
            ))}
          </div>
        )}

        {dietItems.length > 0 && printSection(
          `${MADPAS_SECTIONS_T.diet[lang] || MADPAS_SECTIONS_T.diet.en} / ${MADPAS_SECTIONS_T.diet.en}`,
          <div style={UI.udflex_flewrap_g8}>
            {dietItems.map(d => (
              <div key={d.id} style={{ padding:"6px 14px", border:"1px solid #111", borderRadius:100, fontSize:14 }}>{d.label}</div>
            ))}
          </div>
        )}

        {eNumberItems.length > 0 && printSection(
          `${MADPAS_SECTIONS_T.enumbers[lang] || MADPAS_SECTIONS_T.enumbers.en} / ${MADPAS_SECTIONS_T.enumbers.en}`,
          <div style={UI.udflex_flewrap_g8}>
            {eNumberItems.map((e,i) => (
              <div key={i} style={{ padding:"6px 14px", border:"1px solid #111", borderRadius:100, fontSize:14 }}>{e}</div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop:40, paddingTop:16, borderTop:"1px solid #ddd", display:"flex", justifyContent:"space-between", fontSize:11, color:"#888" }}>
          <span>Genereret via EatSafe · eatsafe.dk</span>
          <span>Dette dokument må ikke erstatte lægelig rådgivning</span>
        </div>
      </div>
    );
  };

  const hasAnyData = mpAllergens.length > 0 || mpCustom.length > 0 || mpDiets.length > 0 || mpENumbers.length > 0;

  return (
    <>
        {screen === SCREENS.MADPAS && (
          <div className="mp-page fade-in">

            {/* TJENER-VISNING — fullscreen overlay */}
            {madpasWaiterView && renderWaiterView()}

            <div className="mp-scroll">

              {/* HEADER */}
              <div className="mp-head">
                <div className="mp-title">Madpas</div>
                <div className="mp-subtitle">Vis dit madpas til restaurant- eller butikspersonale, så de hurtigt kan forstå dine allergier og kosthensyn.</div>

                {/* Profilvælger — kun vist når der reelt er noget at vælge
                    mellem (krav 2: "Hvis familien kun har én relevant
                    profil, kan den vises direkte"). */}
                {family.length > 0 && (
                  <div style={UI.mb14}>
                    <div className="mp-section-lbl">VIS MADPAS FOR</div>
                    <div style={UI.wrapGap7}>
                      <div className={`ap-chip${madpasProfileId==="self" ? " on" : ""}`} onClick={() => setMadpasProfileId("self")}>
                        <div style={UI.uw20_h20_br50_bggreen_dflex_aicenter_jccenter_fs10_fw800_cin}>{initials(user.name||"Mig")}</div>
                        {(user.name||"Mig").split(" ")[0]}
                      </div>
                      {family.map(m => (
                        <div key={m.id} className={`ap-chip${madpasProfileId===m.id ? " on" : ""}`} onClick={() => setMadpasProfileId(m.id)}>
                          <div style={{width:20,height:20,borderRadius:"50%",background:m.color||"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"var(--ink)"}}>{initials(m.name)}</div>
                          {m.name.split(" ")[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sprog-dropdown */}
                <div className="mp-section-lbl">VÆLG SPROG</div>
                {!langOpen ? (
                  <div className="mp-lang-dropdown" onClick={() => setLangOpen(true)}>
                    <span className="mp-lang-flag">{MADPAS_LANGUAGES.find(l=>l.code===madpasLang)?.flag||"🌍"}</span>
                    <span className="mp-lang-name">{MADPAS_LANGUAGES.find(l=>l.code===madpasLang)?.name||"English"}</span>
                    <span className="mp-lang-arrow">▾</span>
                  </div>
                ) : (
                  <div className="mp-lang-list">
                    {MADPAS_LANGUAGES.map(l => (
                      <div key={l.code} className={`mp-lang-opt${madpasLang===l.code?" on":""}`}
                        onClick={() => { setMadpasLang(l.code); localStorage.setItem("as_madpas_lang", l.code); setLangOpen(false); if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); }}}>
                        <span style={UI.fs20}>{l.flag}</span>
                        <span style={{ fontSize:14, fontWeight:madpasLang===l.code?800:600, color:madpasLang===l.code?"var(--green)":"var(--ink)" }}>{l.name}</span>
                        {madpasLang===l.code && <span style={{ marginLeft:"auto", display:"flex" }}><Icon name="check" size={13} color="var(--green)" /></span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tom state */}
              {!hasAnyData && (
                <div className="empty-state" style={{ paddingTop:32 }}>
                  <span className="empty-icon"><Icon name="shield" size={26} color="var(--muted)" /></span>
                  <div className="empty-txt">Ingen allergier registreret</div>
                  <div className="empty-sub">Tilføj dine allergier, intoleranser og diæter under Profil → Mine præferencer</div>
                </div>
              )}

              {hasAnyData && renderMainContent()}

            </div>
          </div>
        )}
      {/* ── PRINT-VENLIG DIV (skjult i app, vises ved print) ── */}
      {renderPrintDiv()}

    </>
  );
}
