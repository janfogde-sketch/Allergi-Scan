// @ts-nocheck
import { useState } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";
import { makeHeaders, apiCall } from "./helpers.js";

export function useAdmin(accessToken, userId, clearAuth) {
  // State
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [adminSection, setAdminSection] = useState("dashboard");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminTicketFilter, setAdminTicketFilter] = useState("all");
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [openAdminUser, setOpenAdminUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchParam, setUserSearchParam] = useState("all");
  const [openSubmission, setOpenSubmission] = useState(null);
  const [submissionFilter, setSubmissionFilter] = useState("pending");
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [cleaningOcr, setCleaningOcr] = useState(false);
  const [cleanedOcrText, setCleanedOcrText] = useState(null);
  const [adminTickets, setAdminTickets] = useState([]);
  const [openTicket, setOpenTicket] = useState(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ocrImagePreview, setOcrImagePreview] = useState(null);

  // Functions
  const loadSubmissions = async (filter) => {
    const f = filter || submissionFilter;
    if (f === "tickets") return;
    setSubmissionsLoading(true);
    try {
      const headers = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" };
      const url = `${SUPABASE_URL}/rest/v1/submissions?status=eq.${f}&order=created_at.desc&limit=100`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch { setSubmissions([]); }
    setSubmissionsLoading(false);
  };

  const deleteOwnAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "slet") return;
    setDeletingAccount(true);
    try {
      const h = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}` };
      await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/shopping_lists?owner_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/family_members?user_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?user_id=eq.${userId}`, { method:"DELETE", headers:h }),
        fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?submitted_by=eq.${userId}`, { method:"DELETE", headers:h }),
      ]);
      await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, { method:"DELETE", headers:h });
      clearAuth();
      setShowDeleteAccount(false);
    } catch (e) { alert("Fejl: " + e.message + "\nKontakt support@eatsafe.dk"); }
    setDeletingAccount(false);
  };

  const loadAdminStats = async () => {
    try {
      const h = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json", "Prefer": "count=exact" };
      const hNoCount = { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" };
      const today = new Date(); today.setHours(0,0,0,0);
      const todayISO = today.toISOString();
      const [users, products, scans, subs, families, tickets, scansToday, newUsersToday] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/users?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/products?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?select=id`, { headers: h }).then(async r => { const ct = r.headers.get("content-range"); return ct ? parseInt(ct.split("/")[1]) : (await r.json()).length; }),
        fetch(`${SUPABASE_URL}/rest/v1/product_submissions?status=eq.pending&select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/family_members?select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?status=eq.open&select=id`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/scan_history?select=id&scanned_at=gte.${todayISO}`, { headers: hNoCount }).then(r => r.json()),
        fetch(`${SUPABASE_URL}/rest/v1/users?select=id&created_at=gte.${todayISO}`, { headers: hNoCount }).then(r => r.json()),
      ]);
      setAdminStats({
        total_users: typeof users === "number" ? users : (Array.isArray(users) ? users.length : 0),
        total_products: typeof products === "number" ? products : (Array.isArray(products) ? products.length : 0),
        total_scans: typeof scans === "number" ? scans : (Array.isArray(scans) ? scans.length : 0),
        pending_submissions: Array.isArray(subs) ? subs.length : 0,
        total_families: Array.isArray(families) ? families.length : 0,
        open_tickets: Array.isArray(tickets) ? tickets.length : 0,
        scans_today: Array.isArray(scansToday) ? scansToday.length : 0,
        new_users_today: Array.isArray(newUsersToday) ? newUsersToday.length : 0,
      });
    } catch (e) { console.error("loadAdminStats fejl:", e.message); }
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback_tickets?order=created_at.desc&limit=100`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" },
      });
      const data = await res.json();
      setAdminTickets(Array.isArray(data) ? data : []);
    } catch { setAdminTickets([]); }
    setTicketsLoading(false);
  };

  const loadAdminUsers = async () => {
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/users?select=id,name,email,role,created_at,onboarding_completed&order=created_at.desc&limit=200`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      if (Array.isArray(data)) setAdminUsers(data);
    } catch (e) { console.error("loadAdminUsers:", e); }
  };

  const updateUserRole = async (uid, role) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ role }),
      });
      setAdminUsers(u => u.map(x => x.id === uid ? { ...x, role } : x));
    } catch (e) { console.error("updateUserRole:", e); }
  };

  const deleteUser = async (uid) => {
    try {
      const res = await apiCall(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ uid }),
      });
      if (res?.error) throw new Error(res.error);
      setAdminUsers(u => u.filter(x => x.id !== uid));
    } catch (e) { console.error("deleteUser:", e); }
  };

  const updateSubmissionAndApprove = async (submission, edited) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/submissions?id=eq.${submission.id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ status: "approved", ai_parsed_data: edited }),
      });
      loadSubmissions(submissionFilter);
      setOpenSubmission(null); setEditingSubmission(null);
    } catch (e) { console.error("updateSubmissionAndApprove:", e); }
  };

  const rejectSubmission = async (id) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/submissions?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ status: "rejected" }),
      });
      loadSubmissions(submissionFilter);
    } catch (e) { console.error("rejectSubmission:", e); }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/feedback_tickets?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ status }),
      });
      loadTickets();
      setOpenTicket(null);
    } catch (e) { console.error("updateTicketStatus:", e); }
  };

  const cleanOcrWithAI = async (text) => {
    if (!text) return;
    setCleaningOcr(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `Rens denne OCR-tekst fra en produktetikette til en kommasepareret ingrediensliste på originalsproget. Fjern labels, næringsindhold og unødvendig tekst. Returner KUN ingredienslisten:\n\n${text}` }],
        }),
      });
      const data = await res.json();
      const cleaned = data.content?.[0]?.text || text;
      setCleanedOcrText(cleaned);
      setEditingSubmission(s => ({ ...s, ocr_raw_text: cleaned }));
    } catch (e) { console.error("cleanOcrWithAI:", e); }
    setCleaningOcr(false);
  };

  return {
    // State
    submissions, setSubmissions,
    submissionsLoading,
    adminStats,
    adminSection, setAdminSection,
    adminUsers, setAdminUsers,
    adminUsersLoading,
    adminTicketFilter, setAdminTicketFilter,
    showDeleteAccount, setShowDeleteAccount,
    deleteConfirmText, setDeleteConfirmText,
    deletingAccount,
    openAdminUser, setOpenAdminUser,
    userSearch, setUserSearch,
    userSearchParam, setUserSearchParam,
    openSubmission, setOpenSubmission,
    submissionFilter, setSubmissionFilter,
    editingSubmission, setEditingSubmission,
    cleaningOcr,
    cleanedOcrText, setCleanedOcrText,
    adminTickets,
    openTicket, setOpenTicket,
    ticketsLoading,
    ocrImagePreview, setOcrImagePreview,
    // Functions
    loadSubmissions,
    deleteOwnAccount,
    loadAdminStats,
    loadTickets,
    loadAdminUsers,
    updateUserRole,
    deleteUser,
    updateSubmissionAndApprove,
    rejectSubmission,
    updateTicketStatus,
    cleanOcrWithAI,
  };
}
