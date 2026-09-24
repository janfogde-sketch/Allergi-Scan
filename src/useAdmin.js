// @ts-nocheck
import { useState, useRef } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY, ALLERGENS } from "./constants.jsx";
import { makeHeaders, apiCall, stripExcludedENumbers } from "./helpers.js";
import { sendPushToUser } from "./usePush.js";
import { showToast } from "./SharedComponents.jsx";

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
  const [reparseLoading, setReparseLoading] = useState(false);
  const [reparseLog, setReparseLog] = useState(null);

  // Functions
  // Værn mod hurtige fane-skift: uden et token-tjek kan et ældre, langsomt
  // svar (fx "pending") nå at lande EFTER et nyere, hurtigere svar (fx
  // "approved") og overskrive den liste admin faktisk ser lige nu med data
  // for en helt anden fane. Samme mønster som runLookupProduct i
  // useProduct.js.
  const submissionsLoadToken = useRef(0);
  const loadSubmissions = async (filter) => {
    const f = filter || submissionFilter;
    if (f === "tickets") return;
    if (!accessToken) { console.warn("loadSubmissions: ingen accessToken"); return; }
    const myToken = ++submissionsLoadToken.current;
    setSubmissionsLoading(true);
    try {
      const url = `${SUPABASE_URL}/rest/v1/submissions?status=eq.${f}&order=created_at.desc&limit=100`;
      const data = await apiCall(url, { headers: makeHeaders(accessToken) });
      if (submissionsLoadToken.current !== myToken) return;
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (e) {
      if (submissionsLoadToken.current !== myToken) return;
      console.error("loadSubmissions:", e.status || "", e.message); setSubmissions([]);
      showToast("Kunne ikke hente indsendelser: " + e.message, "error");
    }
    if (submissionsLoadToken.current === myToken) setSubmissionsLoading(false);
  };

  const deleteOwnAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "slet") return;
    setDeletingAccount(true);
    try {
      // Går via delete-user Edge Function i stedet for at slette tabel for
      // tabel herfra — den er den eneste der også sletter selve
      // auth.users-identiteten, så en "slettet" konto ikke stadig kan logge ind.
      const res = await apiCall(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ uid: userId }),
      });
      if (res?.error) throw new Error(res.error);
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
        fetch(`${SUPABASE_URL}/rest/v1/submissions?status=eq.pending&select=id`, { headers: hNoCount }).then(r => r.json()),
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
    } catch (e) {
      console.error("loadAdminStats fejl:", e.message);
      showToast("Kunne ikke hente statistik: " + e.message, "error");
    }
  };

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/feedback_tickets?order=created_at.desc&limit=100`, {
        headers: makeHeaders(accessToken),
      });
      setAdminTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      setAdminTickets([]);
      showToast("Kunne ikke hente tickets: " + e.message, "error");
    }
    setTicketsLoading(false);
  };

  const loadAdminUsers = async () => {
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/users?select=id,name,email,role,created_at,onboarding_completed,birth_year,phone&order=created_at.desc&limit=200`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      if (Array.isArray(data)) setAdminUsers(data);
    } catch (e) {
      console.error("loadAdminUsers:", e);
      showToast("Kunne ikke hente brugere: " + e.message, "error");
    }
  };

  const updateUserRole = async (uid, role) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${uid}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({ role }),
      });
      setAdminUsers(u => u.map(x => x.id === uid ? { ...x, role } : x));
    } catch (e) {
      console.error("updateUserRole:", e);
      showToast("Kunne ikke ændre rolle: " + e.message, "error");
    }
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
    } catch (e) {
      console.error("deleteUser:", e);
      showToast("Kunne ikke slette bruger: " + e.message, "error");
    }
  };

  const updateSubmissionAndApprove = async (submission, edited) => {
    // Optimistisk UI — luk og fjern med det samme
    setOpenSubmission(null); setEditingSubmission(null);
    setSubmissions(s => s.filter(x => x.id !== submission.id));
    try {
      // editingSubmission.allergen_flags rummer hele det oprindelige ai_parsed_data
      // (allergen-ids blandet med name/nutrition/notes) — filtrér til kun gyldige
      // allergen-ids, så vi ikke skriver fremmede felter ind i products.allergen_flags
      const allergenFlags = {};
      for (const a of ALLERGENS) {
        const v = edited?.allergen_flags?.[a.id];
        if (v) allergenFlags[a.id] = v;
      }
      // E-numre er ikke et selvstændigt gemt felt — de udledes altid live fra
      // ingredients_text (se useProduct.js). Et E-nummer admin har fravalgt
      // under gennemsyn skal derfor fjernes fra selve teksten HER, ved
      // godkendelse, så det ikke dukker op igen på det færdige produkt.
      const finalIngredientsText = stripExcludedENumbers(edited?.ingredients_text, edited?.excluded_enumbers);
      // Godkendelse skal ramme submissions Edge Function — den er den eneste der
      // rent faktisk OPRETTER produktet i products-tabellen. Et almindeligt PATCH
      // mod /rest/v1/submissions markerer kun status, uden at oprette produktet,
      // så brugeren fik en "produktet er tilgængeligt"-push for et produkt der
      // aldrig blev oprettet.
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${submission.id}`, {
        method: "PATCH",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          status: "approved",
          reviewed_by: userId,
          name: edited?.name,
          brand: edited?.brand,
          ingredients_text: finalIngredientsText,
          allergen_flags: allergenFlags,
        }),
      });

      // Reparse allergen-flags med AI-verifikation på det nu oprettede produkt
      if (submission.ean || edited?.ean) {
        const ean = edited?.ean || submission.ean;
        const ingredientsText = finalIngredientsText || submission.ocr_raw_text || "";
        if (ingredientsText) {
          try {
            const allergenData = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, {
              method: "POST",
              headers: makeHeaders(accessToken),
              body: JSON.stringify({ text: ingredientsText, force_ai: true }),
            });
            if (allergenData?.allergen_flags) {
              await apiCall(`${SUPABASE_URL}/rest/v1/products?ean=eq.${ean}`, {
                method: "PATCH",
                headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
                body: JSON.stringify({
                  allergen_flags: allergenData.allergen_flags,
                  allergen_quality: "high",
                  reparsed_at: new Date().toISOString(),
                }),
              });
            }
          } catch (e) { console.warn("Reparse fejl efter godkendelse:", e); }
        }
      }

      const isEdit = submission.type === "edit";

      // Send push til indsender
      if (submission.submitted_by) {
        const produktnavn = edited?.name || submission.name || "Dit produkt";
        await sendPushToUser(
          submission.submitted_by,
          isEdit ? "✅ Rettelse godkendt!" : "✅ Produkt godkendt!",
          isEdit
            ? `Din rettelse til ${produktnavn} er godkendt. Tak for din hjælp!`
            : `${produktnavn} er nu tilgængeligt i EatSafe-databasen.`,
          "https://eatsafe.dk",
          accessToken,
        );
      }

      // Send push til brugere der har scannet samme EAN som NOTFOUND — kun
      // relevant for helt nye produkter, en rettelse gælder et produkt der
      // allerede var fundet.
      const ean = submission.ean;
      if (ean && !isEdit) {
        try {
          const notFoundScanners = await apiCall(
            `${SUPABASE_URL}/rest/v1/scan_history?ean=eq.${ean}&status=eq.not_found&select=user_id`,
            { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
          );
          if (Array.isArray(notFoundScanners)) {
            const uniqueUserIds = [...new Set(
              notFoundScanners
                .map(s => s.user_id)
                .filter(id => id && id !== submission.submitted_by)
            )];
            const produktnavn = edited?.name || submission.name || "Et produkt";
            for (const uid of uniqueUserIds) {
              await sendPushToUser(
                uid,
                "🎉 Produkt nu tilgængeligt!",
                `${produktnavn} er nu i EatSafe-databasen — prøv at scanne igen.`,
                "https://eatsafe.dk",
                accessToken,
              );
            }
          }
        } catch (e) { console.warn("NOTFOUND push fejl:", e); }
      }
    } catch (e) {
      // submission blev fjernet fra listen optimistisk før kaldet ovenfor —
      // uden en synlig fejl her ville den bare forsvinde fra admins syne,
      // selvom produktet aldrig blev oprettet/opdateret server-side.
      // loadSubmissions henter listen frisk igen, så den dukker op igen,
      // men admin skal vide at godkendelsen reelt fejlede.
      console.error("updateSubmissionAndApprove:", e);
      showToast("Godkendelse fejlede: " + e.message + " — indsendelsen er ikke godkendt, listen er opdateret", "error");
      loadSubmissions(submissionFilter);
    }
  };

  const rejectSubmission = async (id) => {
    setSubmissions(s => s.filter(x => x.id !== id));
    setOpenSubmission(null);
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${id}`, {
        method: "PATCH",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ status: "rejected", reviewed_by: userId }),
      });
    } catch (e) {
      console.error("rejectSubmission:", e);
      showToast("Afvisning fejlede: " + e.message + " — indsendelsen er ikke afvist, listen er opdateret", "error");
      loadSubmissions(submissionFilter);
    }
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
    } catch (e) {
      console.error("updateTicketStatus:", e);
      showToast("Kunne ikke opdatere ticket-status: " + e.message, "error");
    }
  };

  const cleanOcrWithAI = async (text) => {
    if (!text) return;
    setCleaningOcr(true);
    try {
      // Brug allergens Edge Function med force_ai for AI-rensning
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ text, force_ai: true }),
      });
      if (data.success && data.allergen_flags) {
        // Opdater flags fra AI-analyse. VIGTIGT: skal ind under
        // .allergen_flags — UI'et og godkendelses-payloaden læser
        // editingSubmission.allergen_flags[id], IKKE editingSubmission[id]
        // direkte. Tidligere spredte dette de nye flag-værdier som
        // top-level-nøgler på editingSubmission i stedet for ind i dets
        // allergen_flags-objekt, så AI'ens korrekt genkendte allergener
        // (fx "jordnødder") aldrig nåede hverken toggle-grid'et eller det
        // der rent faktisk blev godkendt — stille forkert data uden nogen
        // synlig fejl (samme feltnavne-mismatch-mønster som customAllerg-
        // fundet, se CLAUDE.md afsnit 5).
        setEditingSubmission(s => ({ ...s, allergen_flags: { ...s.allergen_flags, ...data.allergen_flags } }));
      }
      // Rens teksten: fjern næringsindhold, labels, og behold kun ingredienser
      const lines = text.split(/\n/).map(l => l.trim()).filter(l => l.length > 3);
      const ingLines = lines.filter(l =>
        !/^(energi|fedt|protein|salt|kulhydrat|næringsindhold|opbevaring|bedst|pr\.?\s*100|kj|kcal)/i.test(l) &&
        !/^\d+[\s]*(g|mg|kj|kcal|%)/i.test(l)
      );
      const cleaned = ingLines.join(", ").replace(/,\s*,/g, ",").replace(/^[,\s]+|[,\s]+$/g, "");
      setCleanedOcrText(cleaned || text);
      // ingredients_text er feltet godkendelsen rent faktisk sender videre
      // (se updateSubmissionAndApprove) — sæt det med det samme, så rensningen
      // er anvendt uden at admin skal huske at trykke "Brug denne version" oveni.
      setEditingSubmission(s => ({ ...s, ocr_raw_text: cleaned || text, ingredients_text: cleaned || text }));
    } catch (e) {
      console.error("cleanOcrWithAI:", e);
      showToast("AI-renskrivning fejlede: " + e.message, "error");
    }
    setCleaningOcr(false);
  };

  const runReparse = async (manual = false) => {
    if (reparseLoading) return;
    setReparseLoading(true);
    setReparseLog(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/auto-reparse`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Content-Type": "application/json" },
        body: JSON.stringify({ manual, limit: manual ? 100 : 50 }),
      });
      const data = await res.json();
      setReparseLog(data);
    } catch (e) {
      console.error("runReparse fejl:", e);
      setReparseLog({ error: e.message });
    }
    setReparseLoading(false);
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
    reparseLoading, reparseLog, runReparse,
  };
}
