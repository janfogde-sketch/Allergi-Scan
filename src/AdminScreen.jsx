// @ts-nocheck
import React, { useState, useRef } from "react";
import { SCREENS, SUPABASE_URL } from "./constants.jsx";
import { apiCall, makeHeaders } from "./helpers.js";
import { useAuthContext } from "./AuthContext.jsx";
import { useAdminContext } from "./AdminContext.jsx";
import { useNavigationContext } from "./NavigationContext.jsx";
import { Icon, showToast } from "./SharedComponents.jsx";
import { UI } from "./styleUtils.js";
import AdminTicketDetailSheet from "./AdminTicketDetailSheet.jsx";
import AdminDashboardSection from "./AdminDashboardSection.jsx";
import AdminUsersSection from "./AdminUsersSection.jsx";
import AdminUserDetailSheet from "./AdminUserDetailSheet.jsx";
import AdminSubmissionsSection, { AdminSubmissionReview } from "./AdminSubmissionsSection.jsx";
import AdminTicketsSection from "./AdminTicketsSection.jsx";
import AdminMissingSection from "./AdminMissingSection.jsx";
import AdminImportSection from "./AdminImportSection.jsx";
import AdminDebugSection from "./AdminDebugSection.jsx";
import AdminRecipesSection from "./AdminRecipesSection.jsx";

export default function AdminScreen() {
  const { userId, accessToken } = useAuthContext();
  const {
    adminSection, setAdminSection, adminStats,
    adminUsers, adminUsersLoading,
    adminTickets, adminTicketFilter, setAdminTicketFilter,
    submissions, submissionsLoading, submissionFilter, setSubmissionFilter,
    openSubmission, setOpenSubmission,
    editingSubmission, setEditingSubmission,
    openAdminUser, setOpenAdminUser,
    openTicket, setOpenTicket,
    cleanedOcrText, cleaningOcr,
    loadAdminStats, loadAdminUsers, loadSubmissions, loadTickets,
    updateUserRole, deleteUser,
    missingEans, missingEansLoading, loadMissingEans, deleteMissingEan,
    importLog, importLoading, runImport,
    reparseLog, reparseLoading, runReparse,
    updateSubmissionAndApprove, rejectSubmission,
    updateTicketStatus, cleanOcrWithAI,
    ticketsLoading,
    userSearch, setUserSearch, userSearchParam, setUserSearchParam,
  } = useAdminContext();
  const { screen, setScreen } = useNavigationContext();

  // Åbn en indsendelse til gennemsyn. For et rettelsesforslag (type "edit")
  // hentes det eksisterende produkt først, så navn/brand/allergener forudfyldes
  // med de RIGTIGE nuværende værdier — ellers ville en godkendelse uden ændringer
  // blanke dem, fordi et rettelsesforslag ikke selv indeholder et fuldt produktnavn.
  const openSubmissionForReview = async (s) => {
    setOpenSubmission(s);
    if (s.type === "edit" && s.product_id) {
      try {
        const rows = await apiCall(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${s.product_id}&select=name,brand,allergen_flags`,
          { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
        );
        const product = Array.isArray(rows) ? rows[0] : null;
        setEditingSubmission({
          name: product?.name || "",
          brand: product?.brand || "",
          allergen_flags: product?.allergen_flags || {},
          ingredients_text: s.ai_parsed_data?.edit_type === "ingredients" ? (s.ocr_raw_text || "") : "",
        });
      } catch (e) {
        console.error("openSubmissionForReview:", e);
        setEditingSubmission({ name: "", brand: "", allergen_flags: {} });
      }
    } else {
      setEditingSubmission({ name: s.ai_parsed_data?.name || s.product_name || "", brand: s.ai_parsed_data?.brand || s.brand || "", allergen_flags: s.ai_parsed_data || {} });
    }
    // Renskriv automatisk med det samme i stedet for at kræve et ekstra
    // admin-klik — ingredienslisten fra OCR er sjældent klar til godkendelse som den er.
    if (s.ocr_raw_text) cleanOcrWithAI(s.ocr_raw_text);
  };

  // ── Admin opskrifter — lokal state ──────────────────────────────────────────
  // Holdt her (i stedet for i AdminRecipesSection) fordi fane-baren nedenfor
  // skal kunne kalde loadAdminRecipes() direkte ved klik på "Opskrifter"-fanen.
  const [adminRecipes, setAdminRecipes] = useState([]);
  const [adminRecipesLoading, setAdminRecipesLoading] = useState(false);
  const [adminRecipeFilter, setAdminRecipeFilter] = useState("pending");
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeActionLoading, setRecipeActionLoading] = useState(false);

  // Værn mod hurtige fane-skift — samme mønster som loadSubmissions i
  // useAdmin.js: uden det kan et ældre svar for en tidligere valgt fane nå
  // at overskrive listen efter et nyere, hurtigere svar for den fane admin
  // faktisk ser nu.
  const adminRecipesLoadToken = useRef(0);
  const loadAdminRecipes = async (filter = adminRecipeFilter) => {
    const myToken = ++adminRecipesLoadToken.current;
    setAdminRecipesLoading(true);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/recipes?status=eq.${filter}&order=created_at.desc&limit=100&select=id,title,category,status,submitted_by,created_at,allergen_flags,description,servings,prep_time_minutes,cook_time_minutes,tags,instructions,image_url`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      if (adminRecipesLoadToken.current !== myToken) return;
      setAdminRecipes(Array.isArray(data) ? data : []);
    } catch (e) {
      if (adminRecipesLoadToken.current !== myToken) return;
      console.error("loadAdminRecipes:", e);
    }
    if (adminRecipesLoadToken.current === myToken) setAdminRecipesLoading(false);
  };

  const updateRecipeStatus = async (id, status) => {
    setRecipeActionLoading(true);
    try {
      await apiCall(
        `${SUPABASE_URL}/rest/v1/recipes?id=eq.${id}`,
        { method: "PATCH", headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body: JSON.stringify({ status }) }
      );
      setAdminRecipes(prev => prev.filter(r => r.id !== id));
      setEditingRecipe(null);
    } catch (e) { showToast("Fejl: " + e.message, "error"); }
    setRecipeActionLoading(false);
  };

  const saveRecipeEdit = async () => {
    if (!editingRecipe) return;
    setRecipeActionLoading(true);
    try {
      const { id, ...fields } = editingRecipe;
      await apiCall(
        `${SUPABASE_URL}/rest/v1/recipes?id=eq.${id}`,
        { method: "PATCH", headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body: JSON.stringify(fields) }
      );
      showToast("Gemt");
    } catch (e) { showToast("Fejl: " + e.message, "error"); }
    setRecipeActionLoading(false);
  };

  return (
    <>
        <AdminTicketDetailSheet openTicket={openTicket} setOpenTicket={setOpenTicket} updateTicketStatus={updateTicketStatus} />

        {/* ══ ADMIN ══ */}
        {screen === SCREENS.ADMIN && !openSubmission && !openTicket && (
          <div className="screen fade-in" style={UI.pb120}>

            {/* Header */}
            <div style={UI.avatarRow}>
              <button onClick={() => setScreen(SCREENS.PROFILE)}
                style={UI.iconBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink2)" strokeWidth="2"><path strokeLinecap="round" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div style={{ flex:1, fontSize:18, fontWeight:900, color:"var(--ink)", display:"flex", alignItems:"center", gap:8 }}><Icon name="shield" size={17} color="var(--ink)" /> Admin</div>
              <button onClick={() => { loadAdminStats(); if (adminSection==="submissions") loadSubmissions(submissionFilter); if (adminSection==="tickets") loadTickets(); if (adminSection==="missing") loadMissingEans(); }}
                style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"6px 12px", fontFamily:"var(--f)", fontSize:12, fontWeight:700, color:"var(--ink)", cursor:"pointer", display:"flex" }}>
                <Icon name="refresh" size={14} color="var(--ink)" />
              </button>
            </div>

            {/* Sektion tabs — store knapper */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
              {[
                { id:"dashboard",   icon:"chart",  label:"Dashboard" },
                { id:"users",       icon:"family",  label:"Brugere" },
                { id:"submissions", icon:"package", label:"Indsendelser" },
                { id:"tickets",     icon:"bug",     label:"Tickets" },
                { id:"debug",       icon:"search",  label:"Debug" },
                { id:"missing",    icon:"info",    label:"Manglende" },
                { id:"import",     icon:"download",label:"Import" },
                { id:"recipes",    icon:"book",    label:"Opskrifter" },
              ].map(s => (
                <button key={s.id} className="admin-tab"
                  onClick={() => {
                    setAdminSection(s.id); if (s.id==="missing") loadMissingEans(); if (s.id==="import") runImport(false);
                    if (s.id === "submissions") loadSubmissions(submissionFilter);
                    if (s.id === "tickets") loadTickets();
                    if (s.id === "dashboard") loadAdminStats();
                    if (s.id === "users") loadAdminUsers();
                    if (s.id === "recipes") loadAdminRecipes();
                  }}
                  style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", gap:4, padding:"14px 16px",
                    background: adminSection===s.id ? "var(--green-lt)" : "var(--surface)",
                    border: `1px solid ${adminSection===s.id ? "var(--green)" : "var(--border)"}`,
                    borderRadius:14, boxShadow:"var(--sh)", fontFamily:"var(--f)", textAlign:"left" }}>
                  <Icon name={s.icon} size={20} color={adminSection===s.id ? "var(--green)" : "var(--ink2)"} />
                  <span style={{ fontSize:13, fontWeight:800, color: adminSection===s.id ? "var(--green)" : "var(--ink)" }}>{s.label}</span>
                </button>
              ))}
            </div>

            {/* ── DASHBOARD ── */}
            {adminSection === "dashboard" && (
              <AdminDashboardSection
                adminStats={adminStats} setAdminSection={setAdminSection} setSubmissionFilter={setSubmissionFilter}
                loadSubmissions={loadSubmissions} loadTickets={loadTickets} loadAdminUsers={loadAdminUsers}
              />
            )}

            {/* ── BRUGERE ── */}
            {adminSection === "users" && (
              <AdminUsersSection
                userId={userId} adminUsers={adminUsers} adminUsersLoading={adminUsersLoading}
                userSearch={userSearch} setUserSearch={setUserSearch}
                userSearchParam={userSearchParam} setUserSearchParam={setUserSearchParam}
                setOpenAdminUser={setOpenAdminUser}
              />
            )}

            {/* ── SUBMISSIONS ── */}
            {adminSection === "submissions" && (
              <AdminSubmissionsSection
                submissions={submissions} submissionsLoading={submissionsLoading}
                submissionFilter={submissionFilter} setSubmissionFilter={setSubmissionFilter}
                loadSubmissions={loadSubmissions} openSubmissionForReview={openSubmissionForReview}
              />
            )}

            {/* ── TICKETS ── */}
            {adminSection === "tickets" && (
              <AdminTicketsSection
                adminTickets={adminTickets} adminTicketFilter={adminTicketFilter} setAdminTicketFilter={setAdminTicketFilter}
                ticketsLoading={ticketsLoading} updateTicketStatus={updateTicketStatus} setOpenTicket={setOpenTicket}
              />
            )}

          </div>
        )}


        {screen === SCREENS.ADMIN && openAdminUser && (
          <AdminUserDetailSheet
            openAdminUser={openAdminUser} setOpenAdminUser={setOpenAdminUser} userId={userId} accessToken={accessToken}
            updateUserRole={updateUserRole} deleteUser={deleteUser}
            setAdminSection={setAdminSection} setSubmissionFilter={setSubmissionFilter} loadSubmissions={loadSubmissions}
          />
        )}

        {/* ══ ADMIN — ÅBEN SUBMISSION ══ */}
        {screen === SCREENS.ADMIN && openSubmission && editingSubmission && (
          <AdminSubmissionReview
            openSubmission={openSubmission} setOpenSubmission={setOpenSubmission}
            editingSubmission={editingSubmission} setEditingSubmission={setEditingSubmission}
            cleanedOcrText={cleanedOcrText} cleaningOcr={cleaningOcr} cleanOcrWithAI={cleanOcrWithAI}
            updateSubmissionAndApprove={updateSubmissionAndApprove} rejectSubmission={rejectSubmission}
          />
        )}

        {adminSection === "missing" && (
          <AdminMissingSection
            missingEans={missingEans} missingEansLoading={missingEansLoading}
            loadMissingEans={loadMissingEans} deleteMissingEan={deleteMissingEan}
          />
        )}

        {adminSection === "import" && (
          <AdminImportSection
            importLog={importLog} importLoading={importLoading} runImport={runImport}
            reparseLog={reparseLog} reparseLoading={reparseLoading} runReparse={runReparse}
          />
        )}

        {adminSection === "debug" && (
          <AdminDebugSection />
        )}

        {adminSection === "recipes" && (
          <AdminRecipesSection
            adminRecipes={adminRecipes} adminRecipesLoading={adminRecipesLoading}
            adminRecipeFilter={adminRecipeFilter} setAdminRecipeFilter={setAdminRecipeFilter}
            loadAdminRecipes={loadAdminRecipes}
            editingRecipe={editingRecipe} setEditingRecipe={setEditingRecipe}
            recipeActionLoading={recipeActionLoading} saveRecipeEdit={saveRecipeEdit}
            updateRecipeStatus={updateRecipeStatus}
          />
        )}

    </>
  );
}
