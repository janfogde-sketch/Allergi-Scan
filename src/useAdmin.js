// @ts-nocheck
import { submissionAllergenFlags, cleanIngredientText, submissionMissingFields } from "./admin/submissionLogic.js";
import { useState, useRef } from "react";
import { SUPABASE_URL, ALLERGENS } from "./constants.jsx";
import { makeHeaders, apiCall, stripExcludedENumbers } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { mergeFlagsUpward } from "../supabase/functions/_shared/allergenEngine.js";

const USERS_PAGE = 200;
const SUBMISSIONS_PAGE = 100;
const TICKETS_PAGE = 100;
const TICKETS_PAGE_ALL = 200;
// Hver AI-reparse koster et AI-kald; loftet holder "Kør nu" til et overskueligt antal pr. tryk.
const MANUAL_REPARSE_LIMIT = 25;
// Serveren svarer ai_skipped:"daily_limit", når AI blev sprunget over pga. adminpuljen eller det samlede dagsloft (G29).
const AI_LIMIT_TEXT = "AI-loftet for i dag er nået. Produktet er gemt med nøgleordsmotoren (middel kvalitet); \"Kør nu\" under Import kan tage det igen i morgen.";

export function useAdmin(accessToken, userId) {
  // State
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [adminSection, setAdminSection] = useState("dashboard");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  // Listerne henter en side ad gangen og beder om én række mere end vist,
  // så admin kan se, at der er flere (ellers skjuler listen rækker uden besked).
  const [adminUsersHasMore, setAdminUsersHasMore] = useState(false);
  const [submissionsHasMore, setSubmissionsHasMore] = useState(false);
  const [ticketsHasMore, setTicketsHasMore] = useState(false);
  // Standard: kun aktive tickets (åbne og i gang). Løste hentes først, når nogen beder om det.
  const [adminTicketFilter, setAdminTicketFilter] = useState("active");
  const [ticketsIncludeDone, setTicketsIncludeDone] = useState(false);
  const [openAdminUser, setOpenAdminUser] = useState(null);
  const [editingAdminUser, setEditingAdminUser] = useState(null);
  const [adminUserActionLoading, setAdminUserActionLoading] = useState(false);
  const [revisionLog, setRevisionLog] = useState([]);
  const [revisionLogLoading, setRevisionLogLoading] = useState(false);
  const [revisionLogFilter, setRevisionLogFilter] = useState("all");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyInvites, setFamilyInvites] = useState([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyActionLoading, setFamilyActionLoading] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
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
      const url = `${SUPABASE_URL}/rest/v1/submissions?status=eq.${f}&order=created_at.desc&limit=${SUBMISSIONS_PAGE + 1}`;
      const data = await apiCall(url, { headers: makeHeaders(accessToken) });
      if (submissionsLoadToken.current !== myToken) return;
      const rows = Array.isArray(data) ? data : [];
      setSubmissionsHasMore(rows.length > SUBMISSIONS_PAGE);
      setSubmissions(rows.slice(0, SUBMISSIONS_PAGE));
    } catch (e) {
      if (submissionsLoadToken.current !== myToken) return;
      console.error("loadSubmissions:", e.status || "", e.message); setSubmissions([]);
      showToast("Kunne ikke hente indsendelser: " + e.message, "error");
    }
    if (submissionsLoadToken.current === myToken) setSubmissionsLoading(false);
  };

  // Dashboard-tal: én databasefunktion (admin_dashboard_stats) tæller det hele, så panelet ikke henter alle scanninger fra 30 dage.
  // Definitioner (scanning = found_via 'scan', søgning for sig, døgn i dansk tid) står i funktionen og i statsLogic.js.
  // Kaldes også efter handlinger, der ændrer sidebjælkens tal (indsendelser og tickets).
  const loadAdminStats = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_dashboard_stats`, {
        method: "POST", headers: makeHeaders(accessToken), body: JSON.stringify({ p_days: 30 }),
      });
      if (!data || typeof data !== "object") throw new Error("Uventet svar fra databasen");
      setAdminStats(data);
    } catch (e) {
      console.error("loadAdminStats fejl:", e.message);
      showToast("Kunne ikke hente statistik: " + e.message, "error");
    }
  };

  const loadTickets = async ({ includeDone } = {}) => {
    const withDone = includeDone ?? ticketsIncludeDone;
    setTicketsIncludeDone(withDone);
    setTicketsLoading(true);
    try {
      const filter = withDone ? "" : "status=in.(open,in_progress)&";
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/feedback_tickets?${filter}order=created_at.desc&limit=${(withDone ? TICKETS_PAGE_ALL : TICKETS_PAGE) + 1}`, {
        headers: makeHeaders(accessToken),
      });
      const rows = Array.isArray(data) ? data : [];
      const pageSize = withDone ? TICKETS_PAGE_ALL : TICKETS_PAGE;
      setTicketsHasMore(rows.length > pageSize);
      setAdminTickets(rows.slice(0, pageSize));
    } catch (e) {
      setAdminTickets([]);
      showToast("Kunne ikke hente tickets: " + e.message, "error");
    }
    setTicketsLoading(false);
  };

  // Åbner én ticket direkte (fx fra en opgave på To do-listen) — henter den selv, så det også virker for løste tickets,
  // som ikke er i den indlæste liste. Returnerer true, hvis ticketten blev fundet.
  const openTicketById = async (id) => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/feedback_tickets?id=eq.${encodeURIComponent(id)}&limit=1`, {
        headers: makeHeaders(accessToken),
      });
      const t = Array.isArray(data) ? data[0] : null;
      if (!t) { showToast("Ticketten findes ikke længere", "error"); return false; }
      setOpenTicket(t);
      return true;
    } catch (e) {
      showToast("Kunne ikke åbne ticketten: " + e.message, "error");
      return false;
    }
  };

  // more=true henter næste side og lægger den bagved den viste liste.
  const loadAdminUsers = async ({ more = false } = {}) => {
    const offset = more ? adminUsers.length : 0;
    try {
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/users?select=id,name,email,role,created_at,onboarding_completed,birth_year&order=created_at.desc&limit=${USERS_PAGE + 1}&offset=${offset}`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      if (Array.isArray(data)) {
        setAdminUsersHasMore(data.length > USERS_PAGE);
        const page = data.slice(0, USERS_PAGE);
        setAdminUsers(more ? (prev) => [...prev, ...page.filter(r => !prev.some(x => x.id === r.id))] : page);
      }
    } catch (e) {
      console.error("loadAdminUsers:", e);
      showToast("Kunne ikke hente brugere: " + e.message, "error");
    }
  };

  // Bekræftelse og låst egen række ligger i UsersSection; databasen nægter desuden at fjerne den sidste admin (G17).
  const updateUserRole = async (uid, role) => {
    if (uid === userId) { showToast("Du kan ikke ændre din egen rolle", "error"); return; }
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
        name: full.name || "", email: full.email || "",
        role: full.role || "user", birth_year: full.birth_year || "", gender: full.gender || "",
        e_numbers: (full.e_numbers || []).join(", "),
        allergen_levels: full.allergen_levels || {},
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
      const customList = editingAdminUser.custom_allergens.split(",").map(s => s.trim()).filter(Boolean);
      // Ét kald (admin_save_user_profile): profil og allergier gemmes i én transaktion, så et fejlet kald
      // aldrig efterlader personen uden allergier (G28). Adgangsregler og adminlog gælder som før.
      await apiCall(`${SUPABASE_URL}/rest/v1/rpc/admin_save_user_profile`, {
        method: "POST",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify({
          p_user: openAdminUser.id,
          p_profile: {
            name: editingAdminUser.name || null,
            email: editingAdminUser.email || null,
            role: editingAdminUser.role,
            birth_year: editingAdminUser.birth_year ? +editingAdminUser.birth_year : null,
            gender: editingAdminUser.gender || null,
            e_numbers: eNumbers,
            // Kun niveauer for allergener, der stadig er valgt
            allergen_levels: Object.fromEntries(Object.entries(editingAdminUser.allergen_levels || {}).filter(([id]) => editingAdminUser.allergen_ids.includes(id))),
            onboarding_completed: editingAdminUser.onboarding_completed,
          },
          p_allergens: editingAdminUser.allergen_ids,
          p_custom: customList,
        }),
      });

      setAdminUsers(us => us.map(x => x.id === openAdminUser.id ? { ...x, name: editingAdminUser.name, email: editingAdminUser.email, role: editingAdminUser.role, birth_year: editingAdminUser.birth_year, onboarding_completed: editingAdminUser.onboarding_completed } : x));
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
        origAllergenFlags: full?.allergen_flags || {},
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
          // Håndrettede allergener markeres "verified" (G4), så natjobbet og "Kør nu" springer produktet over.
          ...(JSON.stringify(editingProduct.allergen_flags || {}) !== JSON.stringify(editingProduct.origAllergenFlags || {}) ? { allergen_quality: "verified" } : {}),
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
      // Henvisninger fra historik, indkøbslister og ændringslog sættes til tom af databasen (G14), så en fejl her er reel.
      showToast("Kunne ikke slette produkt: " + e.message, "error");
    }
    setProductActionLoading(false);
  };

  // CSV-eksport sker i browseren; adminloggen får besked om den her (G13). Fejler logningen, stoppes eksporten ikke.
  const logAdminExport = async (target, count) => {
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/rpc/log_admin_export`, {
        method: "POST", headers: makeHeaders(accessToken),
        body: JSON.stringify({ p_target: target, p_count: count }),
      });
    } catch (e) { console.warn("logAdminExport:", e); }
  };

  // Skærmbilleder i feedback ligger i den lukkede bucket feedback-screenshots (G15); admin får et link, der udløber efter 10 minutter.
  const getTicketScreenshotUrl = async (path) => {
    const data = await apiCall(`${SUPABASE_URL}/storage/v1/object/sign/feedback-screenshots/${String(path).split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST", headers: makeHeaders(accessToken),
      body: JSON.stringify({ expiresIn: 600 }),
    });
    const signed = data?.signedURL || data?.signedUrl;
    if (!signed) throw new Error("Intet link");
    return signed.startsWith("http") ? signed : `${SUPABASE_URL}/storage/v1${signed}`;
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

  // ── Familie-overblik (support-værktøj) ──────────────────────────────────────
  // Krævede en RLS-migration (admin_can_read_family_invites) — family_members
  // tillod allerede admin-læsning, men family_invites kun inviteren/den der
  // accepterede selv. Henter begge tabeller + batch-opløser alle involverede
  // bruger-id'er (ejer/medlem/inviteret/accepteret) i ét kald, samme mønster
  // som loadRevisionLog.
  const loadFamilyOverview = async () => {
    setFamilyLoading(true);
    try {
      const [members, invites] = await Promise.all([
        apiCall(`${SUPABASE_URL}/rest/v1/family_members?select=*&order=family_owner_id`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }),
        apiCall(`${SUPABASE_URL}/rest/v1/family_invites?select=*&order=created_at.desc`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }),
      ]);
      const membersArr = Array.isArray(members) ? members : [];
      const invitesArr = Array.isArray(invites) ? invites : [];
      const userIds = [...new Set([
        ...membersArr.map(m => m.family_owner_id),
        ...invitesArr.map(i => i.invited_by),
        ...invitesArr.map(i => i.accepted_by),
      ].filter(Boolean))];
      const userRows = userIds.length
        ? await apiCall(`${SUPABASE_URL}/rest/v1/users?id=in.(${userIds.join(",")})&select=id,name,email`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }).catch(() => [])
        : [];
      const userMap = Object.fromEntries((Array.isArray(userRows) ? userRows : []).map(u => [u.id, u]));
      setFamilyMembers(membersArr.map(m => ({ ...m, owner: userMap[m.family_owner_id] || null })));
      setFamilyInvites(invitesArr.map(i => ({ ...i, inviter: userMap[i.invited_by] || null, accepter: i.accepted_by ? (userMap[i.accepted_by] || null) : null })));
    } catch (e) {
      setFamilyMembers([]); setFamilyInvites([]);
      showToast("Kunne ikke hente familie-overblik: " + e.message, "error");
    }
    setFamilyLoading(false);
  };

  // Fjerner et familiemedlem (support-værktøj — fx forældet/duplikeret profil).
  // Krævede admin-bypass på family_members' DELETE-policy (admin_can_manage_family_data).
  const adminRemoveFamilyMember = async (id) => {
    setFamilyActionLoading(true);
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/family_members?id=eq.${id}`, {
        method: "DELETE", headers: makeHeaders(accessToken),
      });
      setFamilyMembers(m => m.filter(x => x.id !== id));
      showToast("Familiemedlem fjernet");
    } catch (e) {
      showToast("Kunne ikke fjerne familiemedlem: " + e.message, "error");
    }
    setFamilyActionLoading(false);
  };

  // Annullerer en afventende invitation. family_invites havde slet ingen
  // DELETE-policy før admin_can_manage_family_data-migrationen.
  const adminCancelInvite = async (id) => {
    setFamilyActionLoading(true);
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/family_invites?id=eq.${id}`, {
        method: "DELETE", headers: makeHeaders(accessToken),
      });
      setFamilyInvites(i => i.filter(x => x.id !== id));
      showToast("Invitation annulleret");
    } catch (e) {
      showToast("Kunne ikke annullere invitation: " + e.message, "error");
    }
    setFamilyActionLoading(false);
  };

  // ── Global søgning ──────────────────────────────────────────────────────────
  // Søger på tværs af brugere/produkter/tickets i ét kald hver, ikke via en
  // samlet SQL-funktion — enkle ilike-opslag er hurtige nok ved denne
  // datamængde, og undgår en ny database-funktion for tre uafhængige tabeller.
  const runGlobalSearch = async (query) => {
    const q = (query ?? globalSearch).trim();
    if (!q) { setGlobalSearchResults(null); return; }
    setGlobalSearchLoading(true);
    try {
      const enc = encodeURIComponent(q);
      const [users, products, tickets] = await Promise.all([
        apiCall(`${SUPABASE_URL}/rest/v1/users?or=(name.ilike.*${enc}*,email.ilike.*${enc}*)&select=id,name,email,role&limit=20`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }).catch(() => []),
        apiCall(`${SUPABASE_URL}/rest/v1/products?or=(name.ilike.*${enc}*,brand.ilike.*${enc}*,ean.eq.${enc})&select=id,name,brand,ean&limit=20`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }).catch(() => []),
        apiCall(`${SUPABASE_URL}/rest/v1/feedback_tickets?description=ilike.*${enc}*&select=id,type,description,status,created_at&limit=20`, { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }).catch(() => []),
      ]);
      setGlobalSearchResults({
        users: Array.isArray(users) ? users : [],
        products: Array.isArray(products) ? products : [],
        tickets: Array.isArray(tickets) ? tickets : [],
      });
    } catch (e) {
      showToast("Global søgning fejlede: " + e.message, "error");
      setGlobalSearchResults(null);
    }
    setGlobalSearchLoading(false);
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
        `${SUPABASE_URL}/rest/v1/knowledge_base?${filter}select=id,category,title,slug,emoji,summary,status_label,updated_at&order=sort_order.asc,title.asc&limit=100`,
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
        status_label: full.status_label || "", sort_order: full.sort_order ?? 0,
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
      status_label: "", sort_order: 0, found_in: "", alternatives: "", diet_tags: "", allergen_ids: "", aliases: "", tags: "", sources: "",
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
        status_label: editingKnowledgeEntry.status_label?.trim() || null,
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
          nutrition: edited?.nutrition,
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
              // "high" kræver at Claude-fallbacket faktisk lykkedes (method
              // rummer "claude") — hvis force_ai:true stille fejlede (fx
              // manglende ANTHROPIC_API_KEY eller et API-kald der fejlede)
              // returnerer allergens-funktionen method:"keyword", og det
              // ville være løgn at skrive "high" i så fald. Samme
              // klassificering som auto-reparse allerede bruger. Se
              // products.allergen_source_method's kolonnekommentar (forslag
              // F fra allergen-detektions-gennemgangen, 25. sept. 2026).
              const method = allergenData.method || "keyword";
              await apiCall(`${SUPABASE_URL}/rest/v1/products?ean=eq.${ean}`, {
                method: "PATCH",
                headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
                body: JSON.stringify({
                  // Kun opadgående (G4): admins gennemgåede valg må ikke sænkes af en ny AI-beregning.
                  allergen_flags: mergeFlagsUpward(allergenFlags, allergenData.allergen_flags),
                  allergen_quality: method.includes("claude") ? "high" : "medium",
                  allergen_source_method: method,
                  reparsed_at: new Date().toISOString(),
                }),
              });
              if (!method.includes("claude")) showToast(allergenData.ai_skipped ? "Godkendt. " + AI_LIMIT_TEXT : "Godkendt, men AI-tjekket fejlede. Tjek produktets allergener under Produkter.", "error");
            }
          } catch (e) {
            console.warn("Reparse fejl efter godkendelse:", e);
            showToast("Godkendt, men AI-tjekket fejlede. Tjek produktets allergener under Produkter.", "error");
          }
        }
      }

      // Beskeder til indsender (N2a/N2b) og til dem der scannede produktet uden
      // resultat (N4) oprettes af databasen (trigger → notification_events) og
      // sendes af edge-funktionen `notify` — ikke fra browseren.
    } catch (e) {
      // submission blev fjernet fra listen optimistisk før kaldet ovenfor —
      // uden en synlig fejl her ville den bare forsvinde fra admins syne,
      // selvom produktet aldrig blev oprettet/opdateret server-side.
      // loadSubmissions henter listen frisk igen, så den dukker op igen,
      // men admin skal vide at godkendelsen reelt fejlede.
      console.error("updateSubmissionAndApprove:", e);
      showToast(e.status === 409 ? e.message : "Godkendelse fejlede: " + e.message + " — indsendelsen er ikke godkendt, listen er opdateret", "error");
      loadSubmissions(submissionFilter);
    }
    loadAdminStats(); // sidebjælkens tal (ventende indsendelser, åbne tickets) følger handlingen
  };

  // En afvisning skal have en begrundelse: den sendes til indsenderen (N3) og
  // notifikationen oprettes ikke uden. Enkel dialog indtil et rigtigt felt
  // designes i afvisnings-fladerne.
  const askRejectReason = (count = 1) => {
    const text = window.prompt(
      count > 1
        ? `Begrundelse til indsenderne (påkrævet, samme tekst sendes for alle ${count}):`
        : "Begrundelse til indsenderen (påkrævet — vises i beskeden):",
      ""
    );
    const reason = (text || "").trim();
    if (!reason) showToast("Afvisning kræver en begrundelse til indsenderen", "error");
    return reason || null;
  };

  const rejectSubmission = async (id) => {
    const reason = askRejectReason();
    if (!reason) return;
    setSubmissions(s => s.filter(x => x.id !== id));
    setOpenSubmission(null);
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${id}`, {
        method: "PATCH",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ status: "rejected", reviewed_by: userId, review_note: reason }),
      });
    } catch (e) {
      console.error("rejectSubmission:", e);
      showToast("Afvisning fejlede: " + e.message + " — indsendelsen er ikke afvist, listen er opdateret", "error");
      loadSubmissions(submissionFilter);
    }
    loadAdminStats();
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
  // G16: kun komplette indsendelser godkendes i bulk, efter en bekræftelse med antal; et fejlet AI-tjek tælles for sig.
  const bulkApproveSubmissions = async () => {
    const chosen = submissions.filter(s => selectedSubmissionIds.includes(s.id));
    if (chosen.length === 0) return;
    const ids = chosen.filter(s => submissionMissingFields(s).length === 0).map(s => s.id);
    const skipped = chosen.length - ids.length;
    if (ids.length === 0) {
      showToast(`Ingen af de ${chosen.length} valgte er komplette (navn, stregkode og ingrediensliste). Gennemgå dem enkeltvis.`, "error");
      return;
    }
    const question = `Godkend ${ids.length} indsendelse${ids.length === 1 ? "" : "r"}? De bliver synlige for alle brugere.`
      + (skipped > 0 ? `\n\n${skipped} mangler oplysninger og springes over (gennemgå dem enkeltvis).` : "");
    if (!window.confirm(question)) return;
    setBulkActionLoading(true);
    let succeeded = 0, failed = 0, aiFailed = 0, aiLimited = 0;
    for (const id of ids) {
      const submission = submissions.find(s => s.id === id);
      if (!submission) continue;
      try {
        // Både direkte og (ældre) indlejrede flag læses; kun angivne værdier sendes, manglende bliver aldrig til "nej"
        const allergenFlags = submissionAllergenFlags(submission);
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
              // Se den identiske begrundelse i updateSubmissionAndApprove
              // ovenfor — "high" kun når Claude-fallbacket faktisk lykkedes.
              const method = allergenData.method || "keyword";
              await apiCall(`${SUPABASE_URL}/rest/v1/products?ean=eq.${ean}`, {
                method: "PATCH", headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
                body: JSON.stringify({
                  // Kun opadgående (G4): admins gennemgåede valg må ikke sænkes af en ny AI-beregning.
                  allergen_flags: mergeFlagsUpward(allergenFlags, allergenData.allergen_flags),
                  allergen_quality: method.includes("claude") ? "high" : "medium",
                  allergen_source_method: method,
                  reparsed_at: new Date().toISOString(),
                }),
              });
              if (!method.includes("claude")) { if (allergenData.ai_skipped) aiLimited++; else aiFailed++; }
            }
            else aiFailed++;
          } catch (e) { console.warn("Bulk-reparse fejl:", e); aiFailed++; }
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
    const parts = [failed > 0 ? `${succeeded} af ${ids.length} godkendt, ${failed} fejlede` : `${succeeded} indsendelser godkendt`];
    if (aiFailed > 0) parts.push(`${aiFailed} uden AI-tjek (tjek dem under Produkter)`);
    if (aiLimited > 0) parts.push(`${aiLimited} uden AI-tjek, fordi AI-loftet for i dag er nået ("Kør nu" under Import kan tage dem igen i morgen)`);
    if (skipped > 0) parts.push(`${skipped} sprunget over`);
    showToast(parts.join(". "), failed > 0 || aiFailed > 0 || aiLimited > 0 ? "error" : "success");
    if (failed > 0) loadSubmissions(submissionFilter);
    loadAdminStats();
  };

  const bulkRejectSubmissions = async () => {
    const ids = [...selectedSubmissionIds];
    if (ids.length === 0) return;
    const reason = askRejectReason(ids.length);
    if (!reason) return;
    setBulkActionLoading(true);
    let succeeded = 0, failed = 0;
    for (const id of ids) {
      try {
        await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${id}`, {
          method: "PATCH",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ status: "rejected", reviewed_by: userId, review_note: reason }),
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
    loadAdminStats();
  };

  // `note` er teamets afsluttende kommentar; den gemmes som admin_note og vises i beskeden til brugeren (N6).
  const updateTicketStatus = async (id, status, note) => {
    const trimmed = typeof note === "string" ? note.trim() : "";
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/feedback_tickets?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=minimal" },
        body: JSON.stringify(trimmed ? { status, admin_note: trimmed } : { status }),
      });
      loadTickets();
      setOpenTicket(null);
      showToast("Ticketstatus ændret", "success");
    } catch (e) {
      console.error("updateTicketStatus:", e);
      showToast("Kunne ikke opdatere ticket-status: " + e.message, "error");
    }
    loadAdminStats();
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
      if (data.ai_skipped) showToast("AI-loftet for i dag er nået, så kun nøgleordsmotoren har tjekket teksten.", "error");
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
        // Kun opadgående: indsenderens ja/spor må ikke sænkes af AI'en.
        setEditingSubmission(s => ({ ...s, allergen_flags: mergeFlagsUpward(s.allergen_flags || {}, data.allergen_flags) }));
      }
      // Rens teksten: fjern kun næringstabellens linjer (tal og enhed); alle andre linjer kan være ingredienser (G12)
      const cleaned = cleanIngredientText(text);
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
        body: JSON.stringify({ manual, limit: manual ? MANUAL_REPARSE_LIMIT : 50 }),
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
    adminUsers, setAdminUsers, adminUsersHasMore, submissionsHasMore, ticketsHasMore,
    adminUsersLoading,
    adminTicketFilter, setAdminTicketFilter, ticketsIncludeDone,
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
    loadAdminStats,
    loadTickets,
    openTicketById,
    loadAdminUsers,
    updateUserRole, logAdminExport, getTicketScreenshotUrl,
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
    familyMembers, familyInvites, familyLoading, loadFamilyOverview,
    familyActionLoading, adminRemoveFamilyMember, adminCancelInvite,
    globalSearch, setGlobalSearch, globalSearchResults, setGlobalSearchResults, globalSearchLoading, runGlobalSearch,
  };
}
