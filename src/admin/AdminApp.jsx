// @ts-nocheck
import React, { useState, useEffect } from "react";
import { SUPABASE_URL } from "../constants.jsx";
import { apiCall, makeHeaders } from "../helpers.js";
import { showToast, ToastHost, EatSafeLogo } from "../SharedComponents.jsx";
import { useAdmin } from "../useAdmin.js";
import { useAdminAuth } from "./useAdminAuth.js";
import AdminLayout from "./AdminLayout.jsx";
import DashboardSection from "./sections/DashboardSection.jsx";
import UsersSection from "./sections/UsersSection.jsx";
import SubmissionsSection from "./sections/SubmissionsSection.jsx";
import TicketsSection from "./sections/TicketsSection.jsx";
import MissingSection from "./sections/MissingSection.jsx";
import ImportSection from "./sections/ImportSection.jsx";
import ProductsSection from "./sections/ProductsSection.jsx";
import KnowledgeSection from "./sections/KnowledgeSection.jsx";
import { useAdminKnowledge } from "./useAdminKnowledge.js";
import { useAdminMissing } from "./useAdminMissing.js";
import { useAdminImport } from "./useAdminImport.js";
import { useAdminHistory } from "./useAdminHistory.js";
import HistorySection from "./sections/HistorySection.jsx";
import FamilySection from "./sections/FamilySection.jsx";
import ErrorsSection from "./sections/ErrorsSection.jsx";
import AiUsageSection from "./sections/AiUsageSection.jsx";
import { useAiUsage } from "./useAiUsage.js";
import OnboardingFunnelSection from "./sections/OnboardingFunnelSection.jsx";
import { useOnboardingFunnel } from "./useOnboardingFunnel.js";
import { useAdminFamily } from "./useAdminFamily.js";
import RecallsSection from "./sections/RecallsSection.jsx";
import { useAdminRecalls } from "./useAdminRecalls.js";
import NotificationsSection from "./sections/NotificationsSection.jsx";
import { useAdminNotifications } from "./useAdminNotifications.js";
import { needsReviewCount } from "./recallLogic.js";
import TodoSection from "./sections/TodoSection.jsx";
import { useAdminTodos } from "./useAdminTodos.js";
import { myOpenCount, isOverdue } from "./todoLogic.js";
import { useClientErrors } from "./useClientErrors.js";
import { useAdminUsers } from "./useAdminUsers.js";
import { useAuditLog } from "./useAuditLog.js";
import AuditLogSection from "./sections/AuditLogSection.jsx";
import GlobalSearchBox from "./GlobalSearchBox.jsx";
import { RefreshContext } from "./RefreshContext.js";

export default function AdminApp() {
  const auth = useAdminAuth();
  const { accessToken, userId, checkingRole, isAdmin, roleCheckError, userEmail,
          loginEmail, setLoginEmail, loginPassword, setLoginPassword,
          authError, authLoading, handleLogin, logout } = auth;

  const admin = useAdmin(accessToken, userId);
  const [section, setSection] = useState("dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const clientErrors = useClientErrors(accessToken);
  const knowledge = useAdminKnowledge(isAdmin ? accessToken : null);
  const missing = useAdminMissing(isAdmin ? accessToken : null);
  const dataImport = useAdminImport(isAdmin ? accessToken : null);
  const history = useAdminHistory(isAdmin ? accessToken : null);
  const adminUsers = useAdminUsers(accessToken);
  const auditLog = useAuditLog(accessToken);
  const [todoPreset, setTodoPreset] = useState(null);
  // Et filter fra Dashboard gælder kun den ene åbning af To do: forlades siden, ryddes det, så menuen åbner den almindelige liste
  useEffect(() => { if (section !== "todo") setTodoPreset(null); }, [section]);
  const aiUsage = useAiUsage(accessToken);
  const onboardingFunnel = useOnboardingFunnel(accessToken);
  const adminFamily = useAdminFamily(accessToken);
  const [familySearch, setFamilySearch] = useState("");
  const todos = useAdminTodos(isAdmin ? accessToken : null, { active: section === "todo" });
  const recalls = useAdminRecalls(isAdmin ? accessToken : null);
  const notifications = useAdminNotifications(isAdmin ? accessToken : null, userId);

  // ── Sektion-skift henter frisk data ────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !isAdmin) return;
    if (section === "dashboard") admin.loadAdminStats();
    if (section === "submissions") admin.loadSubmissions(admin.submissionFilter);
    if (section === "tickets") admin.loadTickets();
    if (section === "missing") missing.load({});
    if (section === "import") dataImport.load();
    if (section === "products") admin.loadProducts();
    if (section === "knowledge") knowledge.load({});
    if (section === "history") history.load({});
    if (section === "errors") clientErrors.load();
    if (section === "ai-usage") aiUsage.load();
    if (section === "todo") todos.load();
    if (section === "recalls") recalls.load();
    if (section === "notifications") notifications.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bevidst: hent kun ved sektionsskift eller login; indlæsningsfunktionerne genskabes hver gang og må ikke udløse nye hent
  }, [section, accessToken, isAdmin]);

  // Opdatering fra headeren: genhenter den aktuelle sides data med de nuværende filtre (indlæsningsfunktionerne bruger selv de gemte filtre).
  // Sider uden data, der kan opdateres (Import), har ingen knap. Gentagne tryk ignoreres, mens en opdatering kører.
  const REFRESHERS = {
    dashboard: () => Promise.all([admin.loadAdminStats(), todos.load()]),
    todo: () => todos.load(),
    submissions: () => admin.loadSubmissions(),
    recalls: () => recalls.load(),
    tickets: () => admin.loadTickets(),
    products: () => admin.loadProducts(),
    knowledge: () => knowledge.load({}),
    missing: () => missing.load({}),
    import: () => dataImport.load(),
    history: () => history.load({}),
    users: () => adminUsers.load(),
    family: () => adminFamily.load(),
    notifications: () => notifications.load(),
    onboarding: () => onboardingFunnel.load(),
    errors: () => clientErrors.load(),
    "ai-usage": () => aiUsage.load(),
    audit: () => auditLog.load(),
  };
  const refreshCurrent = async () => {
    const fn = REFRESHERS[section];
    if (!fn || refreshing) return;
    setRefreshing(true);
    try { await fn(); } catch (e) { showToast("Kunne ikke opdatere siden: " + (e && e.message ? e.message : "ukendt fejl"), "error"); }
    setRefreshing(false);
  };

  if (!accessToken) {
    return (
      <div className="admin-login-wrap">
        <ToastHost />
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="admin-login-logo"><EatSafeLogo variant="horizontal" size={22} /> Admin</div>
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
          <div className="admin-login-logo"><EatSafeLogo variant="horizontal" size={22} /> Admin</div>
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
    <RefreshContext.Provider value={refreshing}>
    <AdminLayout
      section={section} setSection={setSection}
      userEmail={userEmail} userId={userId} accessToken={accessToken} logout={logout}
      pendingSubmissions={admin.adminStats?.pending_submissions}
      openTickets={admin.adminStats?.open_tickets}
      todoAttention={todos.loaded ? myOpenCount(todos.todos, userId) : undefined}
      todoOverdue={todos.loaded ? todos.todos.filter((t) => isOverdue(t) && t.assignee_id === userId).length : undefined}
      pendingRecalls={needsReviewCount(recalls.recalls)}
      onRefresh={REFRESHERS[section] ? refreshCurrent : undefined} refreshing={refreshing} refreshLabel={section === "audit" ? "Opdater aktivitetslog" : undefined}
      topbarExtra={
        <GlobalSearchBox
          globalSearch={admin.globalSearch} setGlobalSearch={admin.setGlobalSearch}
          globalSearchResults={admin.globalSearchResults} setGlobalSearchResults={admin.setGlobalSearchResults}
          globalSearchLoading={admin.globalSearchLoading} runGlobalSearch={admin.runGlobalSearch}
          setSection={setSection} setUserSearch={admin.setUserSearch}
          setProductSearch={admin.setProductSearch} loadProducts={admin.loadProducts}
          localSearch={section === "family" ? { value: familySearch, onChange: setFamilySearch, placeholder: "Søg i familier (ejer, navn, e-mail)…" } : undefined}
        />
      }
    >
      {section === "dashboard" && (
        <DashboardSection adminStats={admin.adminStats} setSection={setSection} todos={todos.todos} todosLoaded={todos.loaded} admins={todos.admins}
          openTodos={(preset) => { setTodoPreset({ id: Date.now(), ...preset }); setSection("todo"); }}
          openTickets={() => { admin.setAdminTicketFilter("open"); setSection("tickets"); }}
          openSubmissions={() => { admin.setSubmissionFilter("pending"); setSection("submissions"); }} />
      )}
      {section === "users" && (
        <UsersSection {...adminUsers} userSearch={admin.userSearch} setUserSearch={admin.setUserSearch} currentUserId={userId} />
      )}
      {section === "submissions" && (
        <SubmissionsSection
          submissions={admin.submissions} submissionsHasMore={admin.submissionsHasMore} submissionsLoading={admin.submissionsLoading}
          submissionFilter={admin.submissionFilter} setSubmissionFilter={admin.setSubmissionFilter}
          loadSubmissions={admin.loadSubmissions}
          openSubmission={admin.openSubmission} setOpenSubmission={admin.setOpenSubmission}
          editingSubmission={admin.editingSubmission} setEditingSubmission={admin.setEditingSubmission}
          cleanedOcrText={admin.cleanedOcrText} setCleanedOcrText={admin.setCleanedOcrText} cleaningOcr={admin.cleaningOcr} cleanOcrWithAI={admin.cleanOcrWithAI}
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
          adminTickets={admin.adminTickets} ticketsHasMore={admin.ticketsHasMore} ticketsLoading={admin.ticketsLoading}
          adminTicketFilter={admin.adminTicketFilter} setAdminTicketFilter={admin.setAdminTicketFilter}
          ticketsIncludeDone={admin.ticketsIncludeDone} loadTickets={admin.loadTickets}
          openTicket={admin.openTicket} setOpenTicket={admin.setOpenTicket}
          getTicketScreenshotUrl={admin.getTicketScreenshotUrl}
          updateTicketStatus={async (id, status, note) => { await admin.updateTicketStatus(id, status, note); todos.load({ quiet: true }); }}
        />
      )}
      {section === "missing" && (
        <MissingSection missing={missing} onOpenProduct={(ean) => { admin.setProductSearch(ean); admin.loadProducts(ean); setSection("products"); }} />
      )}
      {section === "import" && <ImportSection imp={dataImport} />}
      {section === "products" && (
        <ProductsSection
          products={admin.products} productsLoading={admin.productsLoading}
          productSearch={admin.productSearch} setProductSearch={admin.setProductSearch}
          loadProducts={admin.loadProducts}
          openProduct={admin.openProduct} setOpenProduct={admin.setOpenProduct}
          editingProduct={admin.editingProduct} setEditingProduct={admin.setEditingProduct}
          productActionLoading={admin.productActionLoading}
          openProductForEdit={admin.openProductForEdit} saveProductEdit={admin.saveProductEdit}
          deleteProduct={admin.deleteProduct} loadProductHistory={admin.loadProductHistory}
          productFilters={admin.productFilters} setProductFilters={admin.setProductFilters} productTotal={admin.productTotal}
          productHasMore={admin.productHasMore} productsError={admin.productsError} productsLoadingMore={admin.productsLoadingMore}
        />
      )}
      {section === "knowledge" && (
        <KnowledgeSection knowledge={knowledge} />
      )}
      {section === "history" && <HistorySection history={history} onOpenProduct={(ean) => { admin.setProductSearch(ean); admin.loadProducts(ean); setSection("products"); }} />}
      {section === "errors" && <ErrorsSection {...clientErrors} />}
      {section === "audit" && <AuditLogSection {...auditLog} />}
      {section === "ai-usage" && <AiUsageSection {...aiUsage} />}
      {section === "onboarding" && <OnboardingFunnelSection {...onboardingFunnel} />}
      {section === "recalls" && <RecallsSection {...recalls} />}
      {section === "notifications" && <NotificationsSection {...notifications} userId={userId} />}
      {section === "todo" && (
        <TodoSection {...todos} userId={userId} preset={todoPreset}
          onOpenTicket={(ticketId) => { setSection("tickets"); admin.openTicketById(ticketId); }} />
      )}
      {section === "family" && <FamilySection {...adminFamily} q={familySearch} setQ={setFamilySearch} />}
    </AdminLayout>
    </RefreshContext.Provider>
    </>
  );
}
