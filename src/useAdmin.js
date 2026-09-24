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
  const [editingAdminUser, setEditingAdminUser] = useState(null);
  const [adminUserActionLoading, setAdminUserActionLoading] = useState(false);
  const [revisionLog, setRevisionLog] = useState([]);
  const [revisionLogLoading, setRevisionLogLoading] = useState(false);
  const [revisionLogFilter, setRevisionLogFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [userSearchParam, setUserSearchParam] = useState("all");
  const [openSubmission, setOpenSubmission] = useState(null);
  const [submissionFilter, setSubmissionFilter] = useState("pending");
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [cleaningOcr, setCleaningOcr] = useState(false);
  const [cleanedOcrText, setCleanedOcrText] = useState(null);
  const [adminTickets, setAdminTickets] = useState([]);
  const [openTicket, setOpenTicket] = useState(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ocrImagePreview, setOcrImagePreview] = useState(null);
  const [reparseLoading, setReparseLoading] = useState(false);
  const [reparseLog, setReparseLog] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [openProduct, setOpenProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productActionLoading, setProductActionLoading] = useState(false);
  const [knowledgeEntries, setKnowledgeEntries] = useState([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgeCategoryFilter, setKnowledgeCategoryFilter] = useState("all");
  const [openKnowledgeEntry, setOpenKnowledgeEntry] = useState(null);
  const [editingKnowledgeEntry, setEditingKnowledgeEntry] = useState(null);
  const [knowledgeActionLoading, setKnowledgeActionLoading] = useState(false);

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

  const openAdminUserForEdit = async (u) => {
    setOpenAdminUser(u);
    setEditingAdminUser(null);
    try {
      const rows = await apiCall(
        `${SUPABASE_URL}/rest/v1/users?id=eq.${u.id}&select=*`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      const full = Array.isArray(rows) ? rows[0] : null;
      if (!full) throw new Error("Bruger ikke fundet");
      // Brugerens EGNE allergener (family_member_id er altid null her — familie-
      // medlemmers allergener ligger på family_members-tabellen, ikke her).
      const allergenRows = await apiCall(
        `${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${u.id}&family_member_id=is.null&select=allergen,type`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      ).catch(() => []);
      const rowsArr = Array.isArray(allergenRows) ? allergenRows : [];
      setEditingAdminUser({
        name: full.name || "", email: full.email || "", phone: full.phone || "",
        role: full.role || "user", birth_year: full.birth_year || "", gender: full.gender || "",
        diets: full.diets || [], e_numbers: (full.e_numbers || []).join(", "),
        onboarding_completed: !!full.onboarding_completed,
        allergen_ids: rowsArr.filter(r => r.type === "allergen").map(r => r.allergen),
        custom_allergens: rowsArr.filter(r => r.type === "custom").map(r => r.allergen).join(", "),
      });
    } catch (e) {
      showToast("Kunne ikke hente brugerens fulde data: " + e.message, "error");
      setOpenAdminUser(null);
    }
  };

  const saveAdminUserEdit = async () => {
    if (!openAdminUser || !editingAdminUser) return;
    setAdminUserActionLoading(true);
    try {
      const eNumbers = editingAdminUser.e_numbers.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${openAdminUser.id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({
          name: editingAdminUser.name || null,
          email: editingAdminUser.email || null,
          phone: editingAdminUser.phone || null,
          role: editingAdminUser.role,
          birth_year: editingAdminUser.birth_year ? +editingAdminUser.birth_year : null,
          gender: editingAdminUser.gender || null,
          diets: editingAdminUser.diets,
          e_numbers: eNumbers,
          onboarding_completed: editingAdminUser.onboarding_completed,
        }),
      });

      // Samlet DELETE + én bulk-POST — samme mønster som ProfileScreen bruger
      // for sig selv — så et fejlet kald midtvejs ikke kan efterlade en
      // delvist gemt allergen-liste.
      const customList = editingAdminUser.custom_allergens.split(",").map(s => s.trim()).filter(Boolean);
      await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${openAdminUser.id}&family_member_id=is.null`, {
        method: "DELETE", headers: makeHeaders(accessToken),
      });
      const allergenRows = [
        ...editingAdminUser.allergen_ids.map(a => ({ user_id: openAdminUser.id, allergen: a, type: "allergen" })),
        ...customList.map(c => ({ user_id: openAdminUser.id, allergen: c, type: "custom" })),
      ];
      if (allergenRows.length > 0) {
        await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
          method: "POST", headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body: JSON.stringify(allergenRows),
        });
      }

      setAdminUsers(us => us.map(x => x.id === openAdminUser.id ? { ...x, name: editingAdminUser.name, email: editingAdminUser.email, phone: editingAdminUser.phone, role: editingAdminUser.role, birth_year: editingAdminUser.birth_year, onboarding_completed: editingAdminUser.onboarding_completed } : x));
      showToast("Bruger opdateret");
      setOpenAdminUser(null); setEditingAdminUser(null);
    } catch (e) {
      // Fanger bl.a. hvis admin forsøger at ændre email til én der allerede
      // er i brug (unique constraint) — vis den reelle årsag.
      showToast("Kunne ikke gemme bruger: " + e.message, "error");
    }
    setAdminUserActionLoading(false);
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

  // ── Produkt-database (direkte søgning/redigering i products) ──────────────
  // Uden søgeord vises de senest opdaterede produkter — 20.000+ rækker i
  // tabellen gør det urealistisk at vise "alle", og en tom liste ville se ud
  // som en fejl i stedet for "søg for at finde noget".
  const loadProducts = async (query) => {
    setProductsLoading(true);
    try {
      const q = (query ?? productSearch).trim();
      const filter = q
        ? `or=(name.ilike.*${encodeURIComponent(q)}*,brand.ilike.*${encodeURIComponent(q)}*,ean.eq.${encodeURIComponent(q)})&`
        : "";
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/products?${filter}select=id,ean,name,brand,category,source,verified_status,updated_at&order=updated_at.desc.nullslast&limit=50`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setProducts([]);
      showToast("Kunne ikke hente produkter: " + e.message, "error");
    }
    setProductsLoading(false);
  };

  // Listen henter kun let-vægt felter (se loadProducts) — ingredients_text kan
  // være lang, og allergen_flags er ikke nødvendig for tabel-visningen, så
  // begge hentes først her, når admin rent faktisk åbner produktet.
  const openProductForEdit = async (p) => {
    setOpenProduct(p);
    setEditingProduct(null);
    try {
      const rows = await apiCall(
        `${SUPABASE_URL}/rest/v1/products?id=eq.${p.id}&select=name,brand,category,ingredients_text,allergen_flags,verified_status`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      const full = Array.isArray(rows) ? rows[0] : null;
      setEditingProduct({
        name: full?.name || "", brand: full?.brand || "", category: full?.category || "",
        ingredients_text: full?.ingredients_text || "",
        allergen_flags: full?.allergen_flags || {},
        verified_status: full?.verified_status || "unverified",
      });
    } catch (e) {
      showToast("Kunne ikke hente produktets fulde data: " + e.message, "error");
      setEditingProduct({ name: p.name || "", brand: p.brand || "", category: p.category || "", ingredients_text: "", allergen_flags: {}, verified_status: p.verified_status || "unverified" });
    }
  };

  const saveProductEdit = async () => {
    if (!openProduct || !editingProduct) return;
    setProductActionLoading(true);
    try {
      const updated = await apiCall(`${SUPABASE_URL}/rest/v1/products?id=eq.${openProduct.id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({
          name: editingProduct.name, brand: editingProduct.brand, category: editingProduct.category,
          ingredients_text: editingProduct.ingredients_text,
          allergen_flags: editingProduct.allergen_flags,
          verified_status: editingProduct.verified_status,
        }),
      });
      const row = Array.isArray(updated) ? updated[0] : null;
      if (row) setProducts(ps => ps.map(p => p.id === row.id ? { ...p, ...row } : p));
      showToast("Produkt opdateret");
      setOpenProduct(null); setEditingProduct(null);
    } catch (e) {
      showToast("Kunne ikke gemme produkt: " + e.message, "error");
    }
    setProductActionLoading(false);
  };

  const deleteProduct = async (id) => {
    setProductActionLoading(true);
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
        method: "DELETE",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
      });
      setProducts(ps => ps.filter(p => p.id !== id));
      setOpenProduct(null); setEditingProduct(null);
      showToast("Produkt slettet");
    } catch (e) {
      // Fanger typisk en FK-fejl (produktet er stadig refereret fra fx en
      // indkøbsliste, scanningshistorik eller ændringslog) — vis den reelle
      // årsag i stedet for at lade sletningen fejle stille.
      showToast("Kunne ikke slette produkt: " + e.message, "error");
    }
    setProductActionLoading(false);
  };

  // ── Ændringshistorik (revision_log) — read-only viewer ─────────────────────
  // Bliver allerede skrevet til (submissions-godkendelse, produkt-redigering)
  // men havde ingen visning. Product/bruger-navne på rækkerne findes ikke i
  // selve revision_log (kun uuid'er), så de slås op i to batch-kald efter
  // hovedlisten er hentet i stedet for én ekstra roundtrip pr. række.
  const loadRevisionLog = async (filter) => {
    setRevisionLogLoading(true);
    try {
      const f = filter ?? revisionLogFilter;
      const typeFilter = f && f !== "all" ? `change_type=eq.${f}&` : "";
      const rows = await apiCall(
        `${SUPABASE_URL}/rest/v1/revision_log?${typeFilter}order=created_at.desc&limit=100`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      const entries = Array.isArray(rows) ? rows : [];
      const productIds = [...new Set(entries.map(r => r.product_id).filter(Boolean))];
      const userIds = [...new Set(entries.map(r => r.changed_by).filter(Boolean))];
      const [productRows, userRows] = await Promise.all([
        productIds.length
          ? apiCall(`${SUPABASE_URL}/rest/v1/products?id=in.(${productIds.join(",")})&select=id,name,ean`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }).catch(() => [])
          : [],
        userIds.length
          ? apiCall(`${SUPABASE_URL}/rest/v1/users?id=in.(${userIds.join(",")})&select=id,name,email`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }).catch(() => [])
          : [],
      ]);
      const productMap = Object.fromEntries((Array.isArray(productRows) ? productRows : []).map(p => [p.id, p]));
      const userMap = Object.fromEntries((Array.isArray(userRows) ? userRows : []).map(u => [u.id, u]));
      setRevisionLog(entries.map(r => ({
        ...r,
        product: r.product_id ? productMap[r.product_id] : null,
        user: r.changed_by ? userMap[r.changed_by] : null,
      })));
    } catch (e) {
      setRevisionLog([]);
      showToast("Kunne ikke hente ændringshistorik: " + e.message, "error");
    }
    setRevisionLogLoading(false);
  };

  // ── Leksikon (knowledge_base) — CRUD ───────────────────────────────────────
  // RLS på knowledge_base tillader allerede insert/update/delete for admins
  // direkte (users.role='admin'-tjek i policyen), så der er ikke brug for en
  // separat Edge Function her — samme direkte REST-mønster som Produkter.
  const KB_ARRAY_FIELDS = ["found_in", "alternatives", "diet_tags", "allergen_ids", "aliases", "tags", "sources"];

  const kbArraysToText = (row) => {
    const out = {};
    for (const f of KB_ARRAY_FIELDS) out[f] = (row?.[f] || []).join(", ");
    return out;
  };
  const kbTextToArrays = (form) => {
    const out = {};
    for (const f of KB_ARRAY_FIELDS) {
      out[f] = (form[f] || "").split(",").map(s => s.trim()).filter(Boolean);
    }
    return out;
  };

  const loadKnowledgeEntries = async (query, category) => {
    setKnowledgeLoading(true);
    try {
      const q = (query ?? knowledgeSearch).trim();
      const cat = category ?? knowledgeCategoryFilter;
      const filters = [];
      if (q) filters.push(`or=(title.ilike.*${encodeURIComponent(q)}*,slug.ilike.*${encodeURIComponent(q)}*,summary.ilike.*${encodeURIComponent(q)}*)`);
      if (cat && cat !== "all") filters.push(`category=eq.${cat}`);
      const filter = filters.length ? filters.join("&") + "&" : "";
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/knowledge_base?${filter}select=id,category,title,slug,emoji,summary,risk_level,updated_at&order=sort_order.asc,title.asc&limit=100`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      setKnowledgeEntries(Array.isArray(data) ? data : []);
    } catch (e) {
      setKnowledgeEntries([]);
      showToast("Kunne ikke hente leksikon-entries: " + e.message, "error");
    }
    setKnowledgeLoading(false);
  };

  const openKnowledgeEntryForEdit = async (row) => {
    setOpenKnowledgeEntry(row);
    setEditingKnowledgeEntry(null);
    try {
      const rows = await apiCall(
        `${SUPABASE_URL}/rest/v1/knowledge_base?id=eq.${row.id}&select=*`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      const full = Array.isArray(rows) ? rows[0] : null;
      if (!full) throw new Error("Entry ikke fundet");
      setEditingKnowledgeEntry({
        category: full.category, title: full.title, slug: full.slug, emoji: full.emoji || "",
        summary: full.summary || "", description: full.description || "", health_notes: full.health_notes || "",
        risk_level: full.risk_level || "", sort_order: full.sort_order ?? 0,
        ...kbArraysToText(full),
      });
    } catch (e) {
      showToast("Kunne ikke hente entry: " + e.message, "error");
      setOpenKnowledgeEntry(null);
    }
  };

  const openNewKnowledgeEntry = () => {
    setOpenKnowledgeEntry({ id: null, isNew: true });
    setEditingKnowledgeEntry({
      category: "ingredient", title: "", slug: "", emoji: "", summary: "", description: "", health_notes: "",
      risk_level: "", sort_order: 0, found_in: "", alternatives: "", diet_tags: "", allergen_ids: "", aliases: "", tags: "", sources: "",
    });
  };

  const saveKnowledgeEntry = async () => {
    if (!openKnowledgeEntry || !editingKnowledgeEntry) return;
    if (!editingKnowledgeEntry.title.trim() || !editingKnowledgeEntry.slug.trim()) {
      showToast("Titel og slug er påkrævet", "error"); return;
    }
    setKnowledgeActionLoading(true);
    try {
      const body = JSON.stringify({
        category: editingKnowledgeEntry.category,
        title: editingKnowledgeEntry.title.trim(),
        slug: editingKnowledgeEntry.slug.trim(),
        emoji: editingKnowledgeEntry.emoji || null,
        summary: editingKnowledgeEntry.summary || null,
        description: editingKnowledgeEntry.description || null,
        health_notes: editingKnowledgeEntry.health_notes || null,
        risk_level: editingKnowledgeEntry.risk_level || null,
        sort_order: editingKnowledgeEntry.sort_order || 0,
        ...kbTextToArrays(editingKnowledgeEntry),
      });
      if (openKnowledgeEntry.isNew) {
        await apiCall(`${SUPABASE_URL}/rest/v1/knowledge_base`, {
          method: "POST",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body,
        });
      } else {
        await apiCall(`${SUPABASE_URL}/rest/v1/knowledge_base?id=eq.${openKnowledgeEntry.id}`, {
          method: "PATCH",
          headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
          body,
        });
      }
      showToast(openKnowledgeEntry.isNew ? "Entry oprettet" : "Entry opdateret");
      setOpenKnowledgeEntry(null); setEditingKnowledgeEntry(null);
      loadKnowledgeEntries();
    } catch (e) {
      // Fanger bl.a. en dubleret slug (unique constraint) — vis den reelle
      // Postgres-fejl i stedet for at lade gemningen fejle stille.
      showToast("Kunne ikke gemme entry: " + e.message, "error");
    }
    setKnowledgeActionLoading(false);
  };

  const deleteKnowledgeEntry = async (id) => {
    setKnowledgeActionLoading(true);
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/knowledge_base?id=eq.${id}`, {
        method: "DELETE",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
      });
      setKnowledgeEntries(es => es.filter(e => e.id !== id));
      setOpenKnowledgeEntry(null); setEditingKnowledgeEntry(null);
      showToast("Entry slettet");
    } catch (e) {
      showToast("Kunne ikke slette entry: " + e.message, "error");
    }
    setKnowledgeActionLoading(false);
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

  const toggleSubmissionSelection = (id) => setSelectedSubmissionIds(ids =>
    ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
  );
  const selectAllSubmissions = (ids) => setSelectedSubmissionIds(ids);
  const clearSubmissionSelection = () => setSelectedSubmissionIds([]);

  // Bulk-godkendelse/afvisning er en bevidst SLANKERE version af
  // updateSubmissionAndApprove/rejectSubmission — ikke et loop der genbruger
  // dem, fordi begge sluger deres egne fejl internt og viser individuelle
  // toasts/lukker modaler, hvilket ville gøre det umuligt at tælle reelle
  // succes/fejl på tværs af en bulk-batch. Sender IKKE navn/brand-override
  // (submissions Edge Function's edit-gren patcher kun felter der rent
  // faktisk sendes, så et eksisterende produkts data forbliver urørt), og
  // springer push-notifikationer over for at holde en bulk-handling hurtig —
  // AI-reparse'en efter hver godkendelse sikrer stadig korrekte
  // allergen_flags uden manuel gennemgang.
  const bulkApproveSubmissions = async () => {
    const ids = [...selectedSubmissionIds];
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    let succeeded = 0, failed = 0;
    for (const id of ids) {
      const submission = submissions.find(s => s.id === id);
      if (!submission) continue;
      try {
        const allergenFlags = {};
        for (const a of ALLERGENS) {
          const v = submission.ai_parsed_data?.[a.id];
          if (v) allergenFlags[a.id] = v;
        }
        await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${id}`, {
          method: "PATCH",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({
            status: "approved", reviewed_by: userId,
            name: submission.ai_parsed_data?.name,
            brand: submission.ai_parsed_data?.brand,
            ingredients_text: submission.ocr_raw_text,
            allergen_flags: allergenFlags,
          }),
        });
        const ean = submission.ean;
        const ingredientsText = submission.ocr_raw_text || "";
        if (ean && ingredientsText) {
          try {
            const allergenData = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, {
              method: "POST", headers: makeHeaders(accessToken),
              body: JSON.stringify({ text: ingredientsText, force_ai: true }),
            });
            if (allergenData?.allergen_flags) {
              await apiCall(`${SUPABASE_URL}/rest/v1/products?ean=eq.${ean}`, {
                method: "PATCH", headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
                body: JSON.stringify({ allergen_flags: allergenData.allergen_flags, allergen_quality: "high", reparsed_at: new Date().toISOString() }),
              });
            }
          } catch (e) { console.warn("Bulk-reparse fejl:", e); }
        }
        succeeded++;
      } catch (e) {
        console.error("bulkApproveSubmissions:", id, e);
        failed++;
      }
    }
    setSubmissions(s => s.filter(x => !ids.includes(x.id)));
    setSelectedSubmissionIds([]);
    setBulkActionLoading(false);
    showToast(failed > 0 ? `${succeeded} af ${ids.length} godkendt — ${failed} fejlede` : `${succeeded} indsendelser godkendt`, failed > 0 ? "error" : "success");
    if (failed > 0) loadSubmissions(submissionFilter);
  };

  const bulkRejectSubmissions = async () => {
    const ids = [...selectedSubmissionIds];
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    let succeeded = 0, failed = 0;
    for (const id of ids) {
      try {
        await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${id}`, {
          method: "PATCH",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ status: "rejected", reviewed_by: userId }),
        });
        succeeded++;
      } catch (e) {
        console.error("bulkRejectSubmissions:", id, e);
        failed++;
      }
    }
    setSubmissions(s => s.filter(x => !ids.includes(x.id)));
    setSelectedSubmissionIds([]);
    setBulkActionLoading(false);
    showToast(failed > 0 ? `${succeeded} af ${ids.length} afvist — ${failed} fejlede` : `${succeeded} indsendelser afvist`, failed > 0 ? "error" : "success");
    if (failed > 0) loadSubmissions(submissionFilter);
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
    editingAdminUser, setEditingAdminUser, adminUserActionLoading,
    openAdminUserForEdit, saveAdminUserEdit,
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
    products, productsLoading, productSearch, setProductSearch, loadProducts,
    openProduct, setOpenProduct, editingProduct, setEditingProduct,
    productActionLoading, openProductForEdit, saveProductEdit, deleteProduct,
    knowledgeEntries, knowledgeLoading, knowledgeSearch, setKnowledgeSearch,
    knowledgeCategoryFilter, setKnowledgeCategoryFilter, loadKnowledgeEntries,
    openKnowledgeEntry, setOpenKnowledgeEntry, editingKnowledgeEntry, setEditingKnowledgeEntry,
    knowledgeActionLoading, openKnowledgeEntryForEdit, openNewKnowledgeEntry,
    saveKnowledgeEntry, deleteKnowledgeEntry,
    revisionLog, revisionLogLoading, revisionLogFilter, setRevisionLogFilter, loadRevisionLog,
    selectedSubmissionIds, toggleSubmissionSelection, selectAllSubmissions, clearSubmissionSelection,
    bulkActionLoading, bulkApproveSubmissions, bulkRejectSubmissions,
  };
}
