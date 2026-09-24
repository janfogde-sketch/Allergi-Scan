// @ts-nocheck
import React, { useState, useEffect } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast, ToastHost } from "../SharedComponents.jsx";
import { useAdmin } from "../useAdmin.js";
import { useAdminAuth } from "./useAdminAuth.js";
import AdminLayout from "./AdminLayout.jsx";
import DashboardSection from "./sections/DashboardSection.jsx";
import UsersSection from "./sections/UsersSection.jsx";
import SubmissionsSection from "./sections/SubmissionsSection.jsx";
import TicketsSection from "./sections/TicketsSection.jsx";
import MissingSection from "./sections/MissingSection.jsx";
import ImportSection from "./sections/ImportSection.jsx";
import RecipesSection from "./sections/RecipesSection.jsx";
import ProductsSection from "./sections/ProductsSection.jsx";
import KnowledgeSection from "./sections/KnowledgeSection.jsx";
import HistorySection from "./sections/HistorySection.jsx";
import FamilySection from "./sections/FamilySection.jsx";
import GlobalSearchBox from "./GlobalSearchBox.jsx";

export default function AdminApp() {
  const auth = useAdminAuth();
  const { accessToken, userId, checkingRole, isAdmin, roleCheckError, userEmail,
          loginEmail, setLoginEmail, loginPassword, setLoginPassword,
          authError, authLoading, handleLogin, logout } = auth;

  const admin = useAdmin(accessToken, userId, logout);
  const [section, setSection] = useState("dashboard");

  // ── Manglende EAN'er (porteret fra App.jsx — samme logik) ────────────────
  const [missingEans, setMissingEans] = useState([]);
  const [missingEansLoading, setMissingEansLoading] = useState(false);
  const loadMissingEans = async () => {
    setMissingEansLoading(true);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/missing_ean_log?select=ean,count,first_seen,last_seen&order=count.desc&limit=100`,
        { headers: makeHeaders(accessToken) }
      );
      if (Array.isArray(data)) setMissingEans(data);
    } catch (e) {
      showToast("Kunne ikke hente manglende EAN'er: " + e.message, "error");
    }
    setMissingEansLoading(false);
  };
  const deleteMissingEan = async (ean) => {
    try {
      await apiCall(
        `${SUPABASE_URL}/rest/v1/missing_ean_log?ean=eq.${encodeURIComponent(ean)}`,
        { method: "DELETE", headers: makeHeaders(accessToken) }
      );
      setMissingEans(prev => prev.filter(r => r.ean !== ean));
    } catch (e) {
      showToast("Kunne ikke slette EAN: " + e.message, "error");
    }
  };

  // ── OFF-import (porteret fra App.jsx — samme logik) ───────────────────────
  const [importLog, setImportLog] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const runImport = async () => {
    setImportLoading(true);
    setImportLog(null);
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/auto-import-off`, {
        method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify({}),
      });
      setImportLog(data);
    } catch (e) {
      setImportLog({ ok: false, error: e.message, stats: { imported: 0, not_on_off: 0, error: 1 }, log: [] });
      showToast("Import fejlede: " + e.message, "error");
    }
    setImportLoading(false);
  };

  // ── Opskrifter (porteret fra AdminScreen.jsx — samme logik) ───────────────
  const [adminRecipes, setAdminRecipes] = useState([]);
  const [adminRecipesLoading, setAdminRecipesLoading] = useState(false);
  const [adminRecipeFilter, setAdminRecipeFilter] = useState("pending");
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeActionLoading, setRecipeActionLoading] = useState(false);
  const loadAdminRecipes = async (filter = adminRecipeFilter) => {
    setAdminRecipesLoading(true);
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/recipes?status=eq.${filter}&order=created_at.desc&limit=100&select=id,title,category,status,submitted_by,created_at,allergen_flags,description,servings,prep_time_minutes,cook_time_minutes,tags,instructions,image_url`,
        { headers: makeHeaders(accessToken) }
      );
      setAdminRecipes(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast("Kunne ikke hente opskrifter: " + e.message, "error");
    }
    setAdminRecipesLoading(false);
  };
  const updateRecipeStatus = async (id, status) => {
    setRecipeActionLoading(true);
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${id}`, {
        method: "PATCH", headers: { ...makeHeaders(accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({ status }),
      });
      setAdminRecipes(prev => prev.filter(r => r.id !== id));
      setEditingRecipe(null);
    } catch (e) {
      showToast("Kunne ikke opdatere opskrift-status: " + e.message, "error");
    }
    setRecipeActionLoading(false);
  };
  const saveRecipeEdit = async () => {
    if (!editingRecipe) return;
    setRecipeActionLoading(true);
    try {
      const { id, ...fields } = editingRecipe;
      await apiCall(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${id}`, {
        method: "PATCH", headers: { ...makeHeaders(accessToken), Prefer: "return=minimal" },
        body: JSON.stringify(fields),
      });
      showToast("Gemt");
    } catch (e) {
      showToast("Kunne ikke gemme ændringer: " + e.message, "error");
    }
    setRecipeActionLoading(false);
  };

  // ── Sektion-skift henter frisk data ────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !isAdmin) return;
    if (section === "dashboard") admin.loadAdminStats();
    if (section === "users") admin.loadAdminUsers();
    if (section === "submissions") admin.loadSubmissions(admin.submissionFilter);
    if (section === "tickets") admin.loadTickets();
    if (section === "missing") loadMissingEans();
    if (section === "recipes") loadAdminRecipes();
    if (section === "products") admin.loadProducts();
    if (section === "knowledge") admin.loadKnowledgeEntries();
    if (section === "history") admin.loadRevisionLog();
    if (section === "family") admin.loadFamilyOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, accessToken, isAdmin]);

  if (!accessToken) {
    return (
      <div className="admin-login-wrap">
        <ToastHost />
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="admin-login-logo">Eat<span>Safe</span> Admin</div>
          <div className="admin-login-sub">Log ind med din admin-konto</div>
          {authError && <div className="admin-error">{authError}</div>}
          <div className="admin-field">
            <label htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} autoFocus />
          </div>
          <div className="admin-field">
            <label htmlFor="admin-password">Kodeord</label>
            <input id="admin-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary admin-btn-full" disabled={authLoading}>
            {authLoading ? "Logger ind…" : "Log ind"}
          </button>
        </form>
      </div>
    );
  }

  if (checkingRole) {
    return <div className="admin-loading-row"><div className="admin-spinner" /> Tjekker adgang…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="admin-login-wrap">
        <ToastHost />
        <div className="admin-login-card">
          <div className="admin-login-logo">Eat<span>Safe</span> Admin</div>
          <div className="admin-error">
            {roleCheckError
              ? `Kunne ikke bekræfte admin-adgang: ${roleCheckError}. Prøv at logge ind igen.`
              : "Din konto har ikke admin-adgang."}
          </div>
          <button className="admin-btn admin-btn-ghost admin-btn-full" onClick={logout}>Log ud</button>
        </div>
      </div>
    );
  }

  return (
    <>
    <ToastHost />
    <AdminLayout
      section={section} setSection={setSection}
      userEmail={userEmail} userId={userId} accessToken={accessToken} logout={logout}
      pendingSubmissions={admin.adminStats?.pending_submissions}
      openTickets={admin.adminStats?.open_tickets}
      topbarExtra={
        <GlobalSearchBox
          globalSearch={admin.globalSearch} setGlobalSearch={admin.setGlobalSearch}
          globalSearchResults={admin.globalSearchResults} setGlobalSearchResults={admin.setGlobalSearchResults}
          globalSearchLoading={admin.globalSearchLoading} runGlobalSearch={admin.runGlobalSearch}
          setSection={setSection} setUserSearch={admin.setUserSearch}
          setProductSearch={admin.setProductSearch} loadProducts={admin.loadProducts}
        />
      }
    >
      {section === "dashboard" && (
        <DashboardSection adminStats={admin.adminStats} setSection={setSection} />
      )}
      {section === "users" && (
        <UsersSection
          adminUsers={admin.adminUsers} adminUsersLoading={admin.adminUsersLoading}
          userSearch={admin.userSearch} setUserSearch={admin.setUserSearch}
          currentUserId={userId} updateUserRole={admin.updateUserRole} deleteUser={admin.deleteUser}
          openAdminUser={admin.openAdminUser} setOpenAdminUser={admin.setOpenAdminUser}
          editingAdminUser={admin.editingAdminUser} setEditingAdminUser={admin.setEditingAdminUser}
          adminUserActionLoading={admin.adminUserActionLoading}
          openAdminUserForEdit={admin.openAdminUserForEdit} saveAdminUserEdit={admin.saveAdminUserEdit}
        />
      )}
      {section === "submissions" && (
        <SubmissionsSection
          submissions={admin.submissions} submissionsLoading={admin.submissionsLoading}
          submissionFilter={admin.submissionFilter} setSubmissionFilter={admin.setSubmissionFilter}
          loadSubmissions={admin.loadSubmissions}
          openSubmission={admin.openSubmission} setOpenSubmission={admin.setOpenSubmission}
          editingSubmission={admin.editingSubmission} setEditingSubmission={admin.setEditingSubmission}
          cleanedOcrText={admin.cleanedOcrText} cleaningOcr={admin.cleaningOcr} cleanOcrWithAI={admin.cleanOcrWithAI}
          updateSubmissionAndApprove={admin.updateSubmissionAndApprove} rejectSubmission={admin.rejectSubmission}
          accessToken={accessToken}
          selectedSubmissionIds={admin.selectedSubmissionIds} toggleSubmissionSelection={admin.toggleSubmissionSelection}
          selectAllSubmissions={admin.selectAllSubmissions} clearSubmissionSelection={admin.clearSubmissionSelection}
          bulkActionLoading={admin.bulkActionLoading} bulkApproveSubmissions={admin.bulkApproveSubmissions}
          bulkRejectSubmissions={admin.bulkRejectSubmissions}
        />
      )}
      {section === "tickets" && (
        <TicketsSection
          adminTickets={admin.adminTickets} ticketsLoading={admin.ticketsLoading}
          adminTicketFilter={admin.adminTicketFilter} setAdminTicketFilter={admin.setAdminTicketFilter}
          openTicket={admin.openTicket} setOpenTicket={admin.setOpenTicket}
          updateTicketStatus={admin.updateTicketStatus}
        />
      )}
      {section === "missing" && (
        <MissingSection
          missingEans={missingEans} missingEansLoading={missingEansLoading}
          loadMissingEans={loadMissingEans} deleteMissingEan={deleteMissingEan}
        />
      )}
      {section === "import" && (
        <ImportSection
          importLog={importLog} importLoading={importLoading} runImport={runImport}
          reparseLog={admin.reparseLog} reparseLoading={admin.reparseLoading} runReparse={admin.runReparse}
        />
      )}
      {section === "recipes" && (
        <RecipesSection
          adminRecipes={adminRecipes} adminRecipesLoading={adminRecipesLoading}
          adminRecipeFilter={adminRecipeFilter} setAdminRecipeFilter={setAdminRecipeFilter}
          loadAdminRecipes={loadAdminRecipes} updateRecipeStatus={updateRecipeStatus}
          editingRecipe={editingRecipe} setEditingRecipe={setEditingRecipe}
          recipeActionLoading={recipeActionLoading} saveRecipeEdit={saveRecipeEdit}
        />
      )}
      {section === "products" && (
        <ProductsSection
          products={admin.products} productsLoading={admin.productsLoading}
          productSearch={admin.productSearch} setProductSearch={admin.setProductSearch}
          loadProducts={admin.loadProducts}
          openProduct={admin.openProduct} setOpenProduct={admin.setOpenProduct}
          editingProduct={admin.editingProduct} setEditingProduct={admin.setEditingProduct}
          productActionLoading={admin.productActionLoading}
          openProductForEdit={admin.openProductForEdit} saveProductEdit={admin.saveProductEdit}
          deleteProduct={admin.deleteProduct}
        />
      )}
      {section === "knowledge" && (
        <KnowledgeSection
          knowledgeEntries={admin.knowledgeEntries} knowledgeLoading={admin.knowledgeLoading}
          knowledgeSearch={admin.knowledgeSearch} setKnowledgeSearch={admin.setKnowledgeSearch}
          knowledgeCategoryFilter={admin.knowledgeCategoryFilter} setKnowledgeCategoryFilter={admin.setKnowledgeCategoryFilter}
          loadKnowledgeEntries={admin.loadKnowledgeEntries}
          openKnowledgeEntry={admin.openKnowledgeEntry} setOpenKnowledgeEntry={admin.setOpenKnowledgeEntry}
          editingKnowledgeEntry={admin.editingKnowledgeEntry} setEditingKnowledgeEntry={admin.setEditingKnowledgeEntry}
          knowledgeActionLoading={admin.knowledgeActionLoading}
          openKnowledgeEntryForEdit={admin.openKnowledgeEntryForEdit} openNewKnowledgeEntry={admin.openNewKnowledgeEntry}
          saveKnowledgeEntry={admin.saveKnowledgeEntry} deleteKnowledgeEntry={admin.deleteKnowledgeEntry}
        />
      )}
      {section === "history" && (
        <HistorySection
          revisionLog={admin.revisionLog} revisionLogLoading={admin.revisionLogLoading}
          revisionLogFilter={admin.revisionLogFilter} setRevisionLogFilter={admin.setRevisionLogFilter}
          loadRevisionLog={admin.loadRevisionLog}
        />
      )}
      {section === "family" && (
        <FamilySection
          familyMembers={admin.familyMembers} familyInvites={admin.familyInvites} familyLoading={admin.familyLoading}
          familyActionLoading={admin.familyActionLoading} adminRemoveFamilyMember={admin.adminRemoveFamilyMember} adminCancelInvite={admin.adminCancelInvite}
        />
      )}
    </AdminLayout>
    </>
  );
}
