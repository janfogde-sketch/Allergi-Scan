// @ts-check
import { submissionAllergenFlags, cleanIngredientText, submissionMissingFields } from "./admin/submissionLogic.js";
import { changedFields, buildProductsQuery, PRODUCT_PAGE } from "./admin/productsLogic.js";
import { useState, useRef } from "react";
import { SUPABASE_URL, ALLERGENS } from "./constants.jsx";
import { makeHeaders, apiCall, stripExcludedENumbers } from "./helpers.js";
import { showToast } from "./SharedComponents.jsx";
import { mergeFlagsUpward } from "../supabase/functions/_shared/allergenEngine.js";

const SUBMISSIONS_PAGE = 100;
const TICKETS_PAGE = 100;
const TICKETS_PAGE_ALL = 200;
// Serveren svarer ai_skipped:"daily_limit", når AI blev sprunget over pga. adminpuljen eller det samlede dagsloft (G29).
const AI_LIMIT_TEXT = "AI-loftet for i dag er nået. Produktet er gemt med nøgleordsmotoren (middel kvalitet); \"Kør genanalyse\" under Dataimport kan tage det igen i morgen.";

export function useAdmin(accessToken, userId) {
  // State
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [adminSection, setAdminSection] = useState("dashboard");
  // Listerne henter en side ad gangen og beder om én række mere end vist,
  // så admin kan se, at der er flere (ellers skjuler listen rækker uden besked).
  const [submissionsHasMore, setSubmissionsHasMore] = useState(false);
  const [ticketsHasMore, setTicketsHasMore] = useState(false);
  // Standard: kun aktive tickets (åbne og i gang). Løste hentes først, når nogen beder om det.
  const [adminTicketFilter, setAdminTicketFilter] = useState("active");
  const [ticketsIncludeDone, setTicketsIncludeDone] = useState(false);
  const [revisionLog, setRevisionLog] = useState([]);
  const [revisionLogLoading, setRevisionLogLoading] = useState(false);
  const [revisionLogFilter, setRevisionLogFilter] = useState("all");
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
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productFilters, setProductFiltersState] = useState({ category: "", source: "", status: "", sort: "updated_desc" });
  const productFiltersRef = useRef({ category: "", source: "", status: "", sort: "updated_desc" });
  const productSeq = useRef(0);
  const [productTotal, setProductTotal] = useState(null);
  const [productHasMore, setProductHasMore] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const [productsLoadingMore, setProductsLoadingMore] = useState(false);
  const [openProduct, setOpenProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productActionLoading, setProductActionLoading] = useState(false);

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

  const loadTickets = async (/** @type {{ includeDone?: boolean }} */ { includeDone } = {}) => {
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

  // ── Produkt-database (direkte søgning/redigering i products) ──────────────
  // Uden søgeord vises de senest opdaterede produkter — 20.000+ rækker i
  // tabellen gør det urealistisk at vise "alle", og en tom liste ville se ud
  // som en fejl i stedet for "søg for at finde noget".
  const loadProducts = async (query, filtersOverride, append = false) => {
    const mine = ++productSeq.current;
    if (append) setProductsLoadingMore(true); else setProductsLoading(true);
    setProductsError(false);
    try {
      const q = (query ?? productSearch).trim();
      const f = filtersOverride || productFiltersRef.current;
      let count = null;
      const offset = append ? products.length : 0;
      const data = await apiCall(
        `${SUPABASE_URL}/rest/v1/products?${buildProductsQuery({ q, ...f, offset })}`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json", Prefer: "count=exact" },
          onResponse: (res) => { const v = Number((res.headers.get("content-range") || "").split("/")[1]); count = Number.isFinite(v) ? v : null; } }
      );
      if (mine !== productSeq.current) return;
      const list = Array.isArray(data) ? data : [];
      const page = list.slice(0, PRODUCT_PAGE);
      setProducts(append ? (prev) => [...prev, ...page.filter((r) => !prev.some((x) => x.id === r.id))] : page);
      setProductHasMore(list.length > PRODUCT_PAGE);
      setProductTotal(count);
    } catch (e) {
      if (mine !== productSeq.current) return;
      // En fejl er aldrig en tom liste: de gamle rækker bliver stående, og siden viser en fejltilstand
      setProductsError(true);
    }
    if (mine === productSeq.current) { setProductsLoading(false); setProductsLoadingMore(false); }
  };

  const setProductFilters = (patch) => {
    const next = { ...productFiltersRef.current, ...patch };
    productFiltersRef.current = next;
    setProductFiltersState(next);
    loadProducts(undefined, next);
  };

  // Listen henter kun let-vægt felter (se loadProducts) — ingredients_text kan
  // være lang, og allergen_flags er ikke nødvendig for tabel-visningen, så
  // begge hentes først her, når admin rent faktisk åbner produktet.
  const openProductForEdit = async (p) => {
    setOpenProduct(p);
    setEditingProduct(null);
    try {
      const rows = await apiCall(
        `${SUPABASE_URL}/rest/v1/products?id=eq.${p.id}&select=name,brand,category,ingredients_text,allergen_flags,verified_status,source,allergen_quality,allergen_source_method,ingredients_verified_at,updated_at`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      const full = Array.isArray(rows) ? rows[0] : null;
      // Intet produkt = en fejl, aldrig en tom formular: ellers kunne en gemning overskrive ingredienser og allergener med tomme værdier
      if (!full) throw new Error("not found");
      const fields = {
        name: full.name || "", brand: full.brand || "", category: full.category || "",
        ingredients_text: full.ingredients_text || "",
        allergen_flags: full.allergen_flags || {},
        verified_status: full.verified_status || "unverified",
      };
      setEditingProduct({
        ...fields,
        orig: { ...fields, allergen_flags: JSON.parse(JSON.stringify(fields.allergen_flags)) },
        meta: { source: full.source, allergen_quality: full.allergen_quality, allergen_source_method: full.allergen_source_method, ingredients_verified_at: full.ingredients_verified_at, updated_at: full.updated_at },
      });
    } catch {
      setEditingProduct({ loadFailed: true });
    }
  };

  // Rettelseshistorik fra aktivitetsloggen (kun læsning)
  const loadProductHistory = async (id) => {
    try {
      const rows = await apiCall(
        `${SUPABASE_URL}/rest/v1/admin_audit_log?target_table=eq.products&target_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=8&select=action,created_at,details`,
        { headers: { ...makeHeaders(accessToken), "Accept": "application/json" } }
      );
      return { ok: true, rows: Array.isArray(rows) ? rows : [] };
    } catch { return { ok: false, rows: [] }; }
  };

  // Gemmer kun de ændrede felter og kun hvis produktet ikke er ændret siden åbning (updated_at), så en samtidig rettelse ikke overskrives i det skjulte.
  const saveProductEdit = async () => {
    if (!openProduct || !editingProduct || editingProduct.loadFailed) return { ok: false };
    const changes = changedFields(editingProduct.orig, editingProduct);
    if (Object.keys(changes).length === 0) { setOpenProduct(null); setEditingProduct(null); return { ok: true }; }
    setProductActionLoading(true);
    let result = { ok: false };
    try {
      const guard = editingProduct.meta?.updated_at ? `&updated_at=eq.${encodeURIComponent(editingProduct.meta.updated_at)}` : "";
      const updated = await apiCall(`${SUPABASE_URL}/rest/v1/products?id=eq.${openProduct.id}${guard}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify({
          ...changes,
          // Håndrettede allergener markeres "verified" (G4), så natjobbet og "Kør nu" springer produktet over.
          ...(changes.allergen_flags ? { allergen_quality: "verified" } : {}),
        }),
      });
      const row = Array.isArray(updated) ? updated[0] : null;
      if (!row) {
        showToast("Produktet er ændret, siden du åbnede det. Luk og åbn det igen, før du gemmer.", "error");
      } else {
        setProducts(ps => ps.map(p => p.id === row.id ? { ...p, ...row } : p));
        showToast("Produkt opdateret", "success");
        setOpenProduct(null); setEditingProduct(null);
        result = { ok: true };
      }
    } catch (e) {
      const msg = String(e?.body || e?.message || "");
      showToast(/23505|duplicate/i.test(msg) ? "Produktet kunne ikke gemmes (dublet)." : "Produktet kunne ikke gemmes. Dine ændringer er bevaret. Prøv igen.", "error");
    }
    setProductActionLoading(false);
    return result;
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
      showToast("Produktet blev ikke slettet. Prøv igen.", "error");
    }
    setProductActionLoading(false);
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
    if (aiLimited > 0) parts.push(`${aiLimited} uden AI-tjek, fordi AI-loftet for i dag er nået ("Kør genanalyse" under Dataimport kan tage dem igen i morgen)`);
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

  return {
    // State
    submissions, setSubmissions,
    submissionsLoading,
    adminStats,
    adminSection, setAdminSection,
    submissionsHasMore, ticketsHasMore,
    adminTicketFilter, setAdminTicketFilter, ticketsIncludeDone,
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
    getTicketScreenshotUrl,
    updateSubmissionAndApprove,
    rejectSubmission,
    updateTicketStatus,
    cleanOcrWithAI,
    products, productsLoading, productSearch, setProductSearch, loadProducts,
    productFilters, setProductFilters, productTotal, productHasMore, productsError, productsLoadingMore,
    openProduct, setOpenProduct, editingProduct, setEditingProduct,
    productActionLoading, openProductForEdit, saveProductEdit, deleteProduct, loadProductHistory,
    revisionLog, revisionLogLoading, revisionLogFilter, setRevisionLogFilter, loadRevisionLog,
    selectedSubmissionIds, toggleSubmissionSelection, selectAllSubmissions, clearSubmissionSelection,
    bulkActionLoading, bulkApproveSubmissions, bulkRejectSubmissions,
    globalSearch, setGlobalSearch, globalSearchResults, setGlobalSearchResults, globalSearchLoading, runGlobalSearch,
  };
}
