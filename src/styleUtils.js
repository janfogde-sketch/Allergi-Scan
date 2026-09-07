// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// styleUtils.js
// Delte style-objekter for de mest gentagne inline style={{...}}-mønstre på
// tværs af skærmene. Hvert felt her matcher et objekt der optrådte identisk
// mindst 4 steder i kodebasen — udtrukket for at undgå at samme objekt-
// literal allokeres på ny ved hvert render, og for at gøre disse gentagne
// stilarter til ét sted at rette i stedet for dusinvis.
//
// Rent mekanisk oprydning: hvert UI.xxx herunder er byte-for-byte identisk
// med de inline style={{...}} den erstatter — ingen visuel eller funktionel
// ændring tilsigtet.
// ─────────────────────────────────────────────────────────────────────────────

export const UI = {
  flex1:        { flex:1 },
  flexMin:      { flex:1, minWidth:0 },
  shrink0:      { flexShrink:0 },
  hr:           { flex:1, height:1, background:"var(--border)" },

  mb4:  { marginBottom:4 },
  mb6:  { marginBottom:6 },
  mb8:  { marginBottom:8 },
  mb10: { marginBottom:10 },
  mb12: { marginBottom:12 },
  mb14: { marginBottom:14 },
  mb16: { marginBottom:16 },
  mb20: { marginBottom:20 },
  mt8:  { marginTop:8 },
  mt12: { marginTop:12 },
  pb120: { paddingBottom:120 },

  fs16: { fontSize:16 },
  fs18: { fontSize:18 },
  fs20: { fontSize:20 },
  fs20Shrink0: { fontSize:20, flexShrink:0 },
  emoji48mb12: { fontSize:48, marginBottom:12 },

  red:   { color:"var(--red)" },
  muted: { color:"var(--muted)" },
  redBadge9: { fontSize:9, fontWeight:800, color:"var(--red)" },

  muted10:      { fontSize:10, color:"var(--muted)" },
  muted11:      { fontSize:11, color:"var(--muted)" },
  muted11mt1:   { fontSize:11, color:"var(--muted)", marginTop:1 },
  muted11mt2:   { fontSize:11, color:"var(--muted)", marginTop:2 },
  muted12mt2:   { fontSize:12, color:"var(--muted)", marginTop:2 },
  muted13:      { fontSize:13, color:"var(--muted)" },
  muted2_12lh:  { fontSize:12, color:"var(--muted2)", lineHeight:1.5 },

  boldInk12:    { fontSize:12, fontWeight:700, color:"var(--ink)" },
  boldInk13:    { fontSize:13, fontWeight:800, color:"var(--ink)" },
  boldInk13mb2: { fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:2 },
  boldInk14:    { fontSize:14, fontWeight:700, color:"var(--ink)" },

  sectionLbl6:     { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 },
  sectionLbl8:     { fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 },
  sectionLbl4Ink:  { fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 },
  sectionLblInk3:  { fontSize:11, fontWeight:700, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:"1.2px", marginBottom:8 },

  colGap8:      { display:"flex", flexDirection:"column", gap:8 },
  rowGap8:      { display:"flex", gap:8 },
  wrapGap4:     { display:"flex", flexWrap:"wrap", gap:4 },
  wrapGap5:     { display:"flex", flexWrap:"wrap", gap:5 },
  wrapGap7:     { display:"flex", flexWrap:"wrap", gap:7 },
  rowBetweenMb10: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  rowBetweenMb16: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 },
  avatarRow:    { display:"flex", alignItems:"center", gap:12, padding:"16px 0 14px" },
  grid2gap6:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 },
  grid2gap8:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 },

  card:    { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:"var(--sh)" },
  iconBtn: { background:"none", border:"none", cursor:"pointer", padding:4 },
};
