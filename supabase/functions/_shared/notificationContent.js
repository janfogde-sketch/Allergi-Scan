// supabase/functions/_shared/notificationContent.js
//
// Fælles, versionsstyret indhold for EatSafes notifikationer (30. sept. 2026).
// ÉN definition pr. type/variant danner alt, hvad en modtager ser:
//   * den korte pushtekst (title + pushBody)
//   * den fulde besked i appen (blocks + primaryAction)
//   * mailens emne, preheader og ren tekst (subject, preheader, blocksToText)
// Der må ikke opstå separat vedligeholdt brødtekst til app og mail. Teksterne
// er ordret fra de godkendte mails i udviklerpakken (Mails/Resend/*.txt);
// hilsen ("Hej {navn}"), afsenderoplysninger og afmeldingsfooter hører til
// mail-rammen og er derfor IKKE en del af blokkene.
//
// Almindelig JavaScript (ingen Deno/DOM), så både edge-funktionerne og Vitest
// (src/notificationContent.test.js) bruger præcis samme kode — samme mønster
// som allergenEngine.js.
//
// Trin 1 dækker de eksisterende hændelser: N2a, N2b, N3, N4, N5 og N6 (fire
// varianter). N7, P1, P2, P3 og P6 tilføjes som data i samme skema.

// Hver definition har en `version`, som skal hæves, når dens tekster ændres.
// Den gemmes på beskeden (notifications.template_version) sammen med et
// snapshot af den udfyldte tekst, så gamle beskeder aldrig omskrives.

import { isOfficialRecallUrl } from "./recallParser.js";

export const DISCLAIMER = "EatSafe er vejledende. Kontrollér altid produktets aktuelle ingrediens- og allergenoplysninger.";

/** Handlingstyper appen må bygge en rute ud fra. Alt andet afvises. */
export const ALLOWED_ACTIONS = ["open_product", "scan", "open_family", "open_ticket", "open_list"];

export const STATUS_LABELS = { open: "Åben", in_progress: "I gang", resolved: "Løst" };

const TICKET_EXCERPT_MAX = 250;

// ── Tekstrensning ───────────────────────────────────────────────────────────
// Ren tekst, ikke HTML: vi escaper ikke her (mail-rendereren escaper ved
// HTML-output), men fjerner kontroltegn, retningstegn og vores egen markup.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁠-⁩﻿]/g;

export function cleanText(value, { multiline = false } = {}) {
  // {{ og }} neutraliseres, så brugerskrevet tekst aldrig kan ligne en
  // skabelonvariabel (og dermed udløse kontrollen for uløste variabler).
  let s = String(value ?? "").replace(CONTROL, "").replace(/\*\*/g, "").replace(/\{\{/g, "{ {").replace(/\}\}/g, "} }");
  if (multiline) {
    s = s.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n");
  } else {
    s = s.replace(/\s+/g, " ");
  }
  return s.trim();
}

/** Afkort til max tegn med ellipsis. Bruges kun på variable, aldrig på selve sætningen. */
export function truncate(text, max) {
  const s = String(text ?? "");
  if (!max || s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

/** Mærke foran produktnavn, uden at gentage mærket, hvis navnet allerede starter med det. */
export function productLabel({ brand, name } = {}) {
  const b = cleanText(brand);
  const n = cleanText(name);
  if (b && n && !n.toLowerCase().startsWith(b.toLowerCase())) return `${b} ${n}`;
  return n || b || "";
}

// ── Definitioner ────────────────────────────────────────────────────────────
const H = (text) => ({ t: "heading", text });
const P = (text, opts = {}) => ({ t: "p", text, ...opts });
const PANEL = (title, blocks) => ({ t: "panel", title, blocks });
const DISC = { t: "disclaimer" };
const LINK = (label, url) => ({ t: "link", label, url });

const PRODUCT_VARS = { productName: { max: 34, pushFallback: "produktet", fallback: "produktet" } };
const TICKET_VARS = {
  ticketExcerpt: { fallback: "Din feedback i EatSafe" },
  message: { fallback: "", multiline: true }, // tom besked = afsnittet udelades (se renderBlock)
};

const TICKET_ACTION = { type: "open_ticket", label: "Se din feedback", params: ["ticketId"] };
const TICKET_ENTITY = { type: "ticket", idFrom: "ticketId" };
const SUBMISSION_ENTITY = { type: "submission", idFrom: "submissionId" };
const PRODUCT_ACTION = { type: "open_product", label: "Se produktet", params: ["ean"] };

const TICKET_QUOTE = { t: "quote", label: "Din feedback", text: "{{ticketExcerpt}}" };

// adders: fornavne på dem, der har tilføjet ("Jan", "Jan og Bjørn"); countText: "en vare"/"4 varer"; itemList: punktliste med varenavne,
// KUN i app og mail (noPush), aldrig i push.
const LIST_VARS = {
  listName: { max: 34, pushFallback: "jeres fælles indkøbsliste", fallback: "jeres fælles indkøbsliste" },
  adders: { max: 24, fallback: "Nogen" },
  countText: { fallback: "varer" },
  itemList: { fallback: "", multiline: true, noPush: true },
};
const LIST_BLOCKS = [
  H("{{adders}} har tilføjet {{countText}} til {{listName}}"),
  P("Det er varer, som andre, der deler **{{listName}}** med dig, har lagt på listen."),
  PANEL("Tilføjede varer", [P("{{itemList}}", { multiline: true })]),
  P("Åbn Indkøbslister i appen for at se den aktuelle liste og markere de varer, der er købt."),
];
// Titel + tekst læses sammen: "Jan har tilføjet 2 varer" / "til Weekend. Se listen i EatSafe." (titel ≤ 40 tegn). Overskriften i appen og mailen har hele sætningen.
const LIST_PUSH = { title: "{{adders}} har tilføjet {{countText}}", body: "til {{listName}}. Se listen i EatSafe." };
const LIST_MAIL = { subject: "{{adders}} har tilføjet {{countText}} til {{listName}}", preheader: "Se, hvad der er kommet på den indkøbsliste, du deler." };
const LIST_ACTION = { type: "open_list", label: "Åbn indkøbslisten", params: ["listId"] };
const LIST_ENTITY = { type: "list", idFrom: "listId" };

export const DEFINITIONS = {
  "N2a:default": {
    type: "N2a", variant: "default", category: "submission_status", version: 1, ttl: 86400,
    push: { title: "Dit produkt er godkendt", body: "{{productName}} er godkendt af vores team og nu tilgængeligt for alle." },
    mail: { subject: "Dit produkt er godkendt og tilføjet i EatSafe", preheader: "Vores team har godkendt dit produkt. Det er nu tilgængeligt for alle brugere i EatSafe." },
    vars: PRODUCT_VARS, required: [],
    blocks: [
      H("Dit produkt er nu tilføjet i EatSafe"),
      P("Vores team har gennemgået og godkendt din indsendelse af **{{productName}}**. Produktet er nu tilgængeligt for alle brugere i EatSafe."),
      PANEL(null, [P("Du kan finde produktet ved at scanne stregkoden eller søge efter det i appen. Her kan du se ingrediens- og allergenoplysningerne samt vurderingen ud fra din profil.")]),
      P("Dit bidrag hjælper både dig og andre brugere med at få bedre overblik over de produkter, I møder i hverdagen. Tak, fordi du er med til at gøre EatSafe bedre."),
      P("Opdager du oplysninger, der ikke stemmer med emballagen, kan du foreslå en rettelse på produktet i appen."),
      DISC,
    ],
    action: PRODUCT_ACTION, entity: SUBMISSION_ENTITY,
  },

  "N2b:default": {
    type: "N2b", variant: "default", category: "submission_status", version: 1, ttl: 86400,
    push: { title: "Din rettelse er godkendt", body: "Vores team har godkendt din rettelse til {{productName}}. Oplysningerne er opdateret." },
    mail: { subject: "Din rettelse er godkendt i EatSafe", preheader: "Vores team har godkendt din rettelse. Oplysningerne er nu opdateret for alle brugere." },
    vars: PRODUCT_VARS, required: [],
    blocks: [
      H("Tak for din rettelse"),
      P("Vores team har gennemgået og godkendt dit rettelsesforslag til **{{productName}}**. Produktets oplysninger er nu opdateret, og ændringen er tilgængelig for alle brugere i EatSafe."),
      PANEL(null, [P("Du kan se de opdaterede oplysninger ved at scanne produktets stregkode eller søge efter det i appen. Her finder du også vurderingen ud fra din profil.")]),
      P("Tak, fordi du gør os opmærksomme på oplysninger, der skal rettes. Din hjælp er med til at forbedre datakvaliteten og give alle brugere et bedre overblik over produkternes ingredienser og allergener."),
      P("Opdager du andre oplysninger, der ikke stemmer med emballagen, kan du foreslå en ny rettelse på produktet i appen."),
      DISC,
    ],
    action: PRODUCT_ACTION, entity: SUBMISSION_ENTITY,
  },

  "N3:default": {
    type: "N3", variant: "default", category: "submission_status", version: 1, ttl: 86400,
    push: { title: "Din indsendelse er ikke godkendt", body: "Vores team kunne ikke godkende din indsendelse af {{productName}}." },
    mail: { subject: "Din indsendelse kunne ikke godkendes", preheader: "Læs teamets begrundelse og se, hvordan du kan indsende oplysningerne igen." },
    vars: { ...PRODUCT_VARS, reason: { fallback: "", multiline: true } },
    // Begrundelsen er obligatorisk: en afvisning uden forklaring må aldrig sendes.
    required: ["reason"],
    blocks: [
      H("Vi kunne ikke godkende din indsendelse"),
      P("Tak, fordi du har indsendt oplysninger om **{{productName}}**."),
      P("Vores team har gennemgået din indsendelse, men har ikke kunnet godkende den på det nuværende grundlag."),
      PANEL("Begrundelse fra vores team", [P("{{reason}}", { multiline: true })]),
      P("Du er velkommen til at indsende oplysningerne igen, når du har fulgt vejledningen ovenfor. Sørg gerne for, at billederne tydeligt viser produktets stregkode og hele ingredienslisten."),
      P("Tak for din hjælp. Selvom denne indsendelse ikke blev godkendt, sætter vi pris på, at du bidrager til at gøre EatSafe bedre."),
      P("Hvis du har spørgsmål til vores svar, kan du kontakte os via feedbackknappen i appen."),
      DISC,
    ],
    action: { type: "scan", label: "Scan og indsend igen", params: [] }, entity: SUBMISSION_ENTITY,
  },

  "N4:default": {
    type: "N4", variant: "default", category: "missing_product_found", version: 1, ttl: 86400,
    push: { title: "Produktet findes nu i EatSafe", body: "{{productName}} er nu tilføjet. Scan igen for at se oplysningerne." },
    mail: { subject: "Et produkt, du har ledt efter, er nu i EatSafe", preheader: "Du kan nu scanne produktet igen og se oplysningerne samt vurderingen ud fra din profil." },
    vars: { productName: { max: 34, pushFallback: "produktet", fallback: "produktet, du tidligere har scannet" } }, required: [],
    blocks: [
      H("Nu kan du finde produktet i EatSafe"),
      P("Du har tidligere scannet **{{productName}}**, hvor produktet endnu ikke fandtes i EatSafe."),
      P("Produktet er nu tilføjet og tilgængeligt for alle brugere. Du kan derfor scanne stregkoden igen eller søge efter produktet i appen."),
      PANEL("Se, hvordan produktet passer til din profil", [
        P("I EatSafe kan du nu se produktets ingrediens- og allergenoplysninger samt vurderingen ud fra dine valgte allergener og intolerancer."),
        P("At produktet er tilføjet, betyder ikke i sig selv, at det passer til dig. Åbn appen for at se vurderingen og eventuelle advarsler."),
      ]),
      P("Vi tilføjer løbende flere produkter, så du kan få overblik over flere af de varer, du møder i hverdagen."),
      DISC,
    ],
    action: PRODUCT_ACTION, entity: { type: "product", idFrom: "ean" },
  },

  "N5:default": {
    type: "N5", variant: "default", category: "family", version: 2, ttl: 86400,
    push: { title: "Din invitation er accepteret", body: "{{memberName}} er nu tilføjet til din Familie i EatSafe." },
    mail: { subject: "Din familieinvitation er accepteret", preheader: "Se, hvordan I kan bruge EatSafe sammen i hverdagen." },
    vars: { memberName: { max: 28, pushFallback: "Et familiemedlem", fallback: "Et familiemedlem" } }, required: [],
    blocks: [
      H("{{memberName}} har accepteret din invitation"),
      P("{{memberName}} er nu tilføjet til din Familie i EatSafe."),
      PANEL("Brug EatSafe sammen", [
        P("Når du scanner et produkt, kan du vælge, hvilke personer i din Familie varen skal tjekkes for."),
        P("I kan også dele indkøbslister med hinanden. Du vælger selv, hvilke lister der deles og med hvem."),
      ]),
      DISC,
    ],
    action: { type: "open_family", label: "Se familien", params: [] }, entity: { type: "invitation", idFrom: "inviteId" },
  },

  // ── N10/N11: delt invitationslink (4. okt. 2026). Kun push og besked i appen, ingen mail (tidskritisk og kort), derfor `mail: null`.
  // N10 går til afsenderen, når nogen har bedt om forbindelse. N11 går til den, der bad, når afsenderen godkender eller afviser.
  "N10:default": {
    type: "N10", variant: "default", category: "family", version: 1, ttl: 86400,
    push: { title: "Anmodning om forbindelse", body: "{{memberName}} har brugt dit invitationslink og venter på din godkendelse." },
    mail: null,
    vars: { memberName: { max: 28, pushFallback: "En person", fallback: "En person" } }, required: [],
    blocks: [
      H("{{memberName}} vil forbindes med dig"),
      P("{{memberName}} har brugt dit invitationslink i EatSafe og venter på, at du godkender."),
      PANEL("Før du godkender", [
        P("Når I er forbundet, kan I se hinandens allergier og dele indkøbslister. Kender du ikke personen, så afvis anmodningen."),
      ]),
    ],
    action: { type: "open_family", label: "Se familien", params: [] }, entity: { type: "invitation", idFrom: "inviteId" },
  },

  "N11:approved": {
    type: "N11", variant: "approved", category: "family", version: 1, ttl: 86400,
    push: { title: "Du er nu i en familie", body: "{{memberName}} har godkendt din anmodning. I er nu forbundet i EatSafe." },
    mail: null,
    vars: { memberName: { max: 28, pushFallback: "Afsenderen", fallback: "Afsenderen" } }, required: [],
    blocks: [
      H("{{memberName}} har godkendt din anmodning"),
      P("I er nu forbundet i Familie, og I kan se hinandens allergier og dele indkøbslister."),
      PANEL("Brug EatSafe sammen", [
        P("Når du scanner et produkt, kan du vælge, hvilke personer i din Familie varen skal tjekkes for."),
      ]),
      DISC,
    ],
    action: { type: "open_family", label: "Se familien", params: [] }, entity: { type: "invitation", idFrom: "inviteId" },
  },

  "N11:declined": {
    type: "N11", variant: "declined", category: "family", version: 1, ttl: 86400,
    push: { title: "Anmodningen blev ikke godkendt", body: "{{memberName}} har ikke godkendt din anmodning om at blive forbundet." },
    mail: null,
    vars: { memberName: { max: 28, pushFallback: "Afsenderen", fallback: "Afsenderen" } }, required: [],
    blocks: [
      H("Anmodningen blev ikke godkendt"),
      P("{{memberName}} har ikke godkendt din anmodning om at blive forbundet i EatSafe, eller linket er trukket tilbage."),
      PANEL("Hvad nu?", [
        P("Du er ikke forbundet med {{memberName}}, og der er ikke delt noget. Hvis det var en fejl, kan du bede om et nyt link."),
      ]),
    ],
    action: { type: "open_family", label: "Se familien", params: [] }, entity: { type: "invitation", idFrom: "inviteId" },
  },

  "N6:in_progress": {
    type: "N6", variant: "in_progress", category: "feedback", version: 2, ttl: 86400,
    push: { title: "Vi arbejder på din feedback", body: "Vores team er gået i gang med at undersøge din feedback." },
    mail: { subject: "Vi arbejder på din feedback", preheader: "Læs den nye status og svaret fra EatSafe på din feedback." },
    vars: TICKET_VARS, required: [],
    blocks: [
      H("Vi arbejder på din feedback"),
      P("Vores team har set på din feedback og er gået i gang med at undersøge den."),
      TICKET_QUOTE,
      { t: "fact", label: "Status", value: STATUS_LABELS.in_progress },
      P("{{message}}", { multiline: true }),
    ],
    action: TICKET_ACTION, entity: TICKET_ENTITY,
  },

  "N6:resolved": {
    type: "N6", variant: "resolved", category: "feedback", version: 2, ttl: 86400,
    push: { title: "Din feedback er markeret som løst", body: "Vores team har behandlet din feedback. Prøv gerne funktionen igen." },
    mail: { subject: "Din feedback er markeret som løst", preheader: "Læs den nye status og svaret fra EatSafe på din feedback." },
    vars: TICKET_VARS, required: [],
    blocks: [
      H("Din feedback er markeret som løst"),
      P("Vores team har behandlet din feedback og markeret den som løst."),
      TICKET_QUOTE,
      { t: "fact", label: "Status", value: STATUS_LABELS.resolved },
      P("{{message}}", { multiline: true }),
    ],
    action: TICKET_ACTION, entity: TICKET_ENTITY,
  },

  "N6:reopened": {
    type: "N6", variant: "reopened", category: "feedback", version: 2, ttl: 86400,
    push: { title: "Din feedback er åbnet igen", body: "Vores team ser nærmere på din feedback igen." },
    mail: { subject: "Din feedback er åbnet igen", preheader: "Læs den nye status og svaret fra EatSafe på din feedback." },
    vars: TICKET_VARS, required: [],
    blocks: [
      H("Din feedback er åbnet igen"),
      P("Din feedback er blevet åbnet igen, så vores team kan se nærmere på den."),
      TICKET_QUOTE,
      { t: "fact", label: "Status", value: STATUS_LABELS.open },
      P("{{message}}", { multiline: true }),
    ],
    action: TICKET_ACTION, entity: TICKET_ENTITY,
  },

  "N6:reply": {
    type: "N6", variant: "reply", category: "feedback", version: 1, ttl: 86400,
    push: { title: "Nyt svar på din feedback", body: "Vores team har skrevet en ny besked til din feedback." },
    mail: { subject: "Der er et nyt svar på din feedback", preheader: "Vores team har skrevet en ny besked til dig. Læs svaret her." },
    vars: TICKET_VARS,
    // Et svar uden indhold er ikke et svar.
    required: ["message"],
    blocks: [
      H("Vi har svaret på din feedback"),
      P("Vores team har skrevet en ny besked til din feedback i EatSafe."),
      TICKET_QUOTE,
      PANEL("Svar fra EatSafe", [P("{{message}}", { multiline: true })]),
      P("Hvis du har spørgsmål eller flere oplysninger, kan du sende dem via feedbackknappen i appen. Henvis gerne til din tidligere feedback."),
    ],
    action: TICKET_ACTION, entity: TICKET_ENTITY,
  },

  // ── P2: familieinvitationen udløber snart (maks. én påmindelse pr. invitation) ──
  "P2:default": {
    type: "P2", variant: "default", category: "family", version: 1, ttl: 3600,
    push: { title: "Din invitation udløber snart", body: "Din familieinvitation er endnu ikke besvaret. Den udløber inden for fire timer." },
    mail: { subject: "Din familieinvitation udløber snart", preheader: "Der er stadig tid til at bruge invitationen, inden den udløber." },
    vars: { expiresAt: { fallback: "snart" } }, required: [],
    blocks: [
      H("Din invitation er stadig åben"),
      P("Din familieinvitation i EatSafe er endnu ikke blevet besvaret. Den udløber **{{expiresAt}}**."),
      PANEL("Vil du stadig forbinde familien?", [
        P("Har du sendt invitationen som mail, kan du minde personen om at finde mailen (tjek evt. spam-mappen). Har du delt et link, kan du dele det igen. Du finder begge under Familie. Personen skal selv sige ja i appen."),
      ]),
      P("Hvis invitationen når at udløbe, kan du sende en ny under Familie i appen. Du behøver ikke gøre noget, hvis invitationen ikke længere er relevant."),
    ],
    action: { type: "open_family", label: "Se familieinvitationer", params: [] }, entity: { type: "invitation", idFrom: "inviteId" },
  },

  // ── P1: allergenoplysninger er ændret for et produkt, modtageren bruger (kun stigende risiko) ──
  "P1:default": {
    type: "P1", variant: "default", category: "product_changes", version: 2, ttl: 86400,
    push: { title: "Allergenoplysninger er ændret", body: "Oplysninger om {{productName}} er ændret. Tjek emballagen." },
    mail: { subject: "Allergenoplysninger er ændret for et af dine produkter", preheader: "Se ændringen, og tjek emballagen, før du bruger produktet." },
    vars: { ...PRODUCT_VARS, changeSummary: { fallback: "Allergenoplysningerne er ændret." } }, required: [],
    blocks: [
      H("Nye oplysninger om dit produkt"),
      P("Allergenoplysningerne for **{{productName}}** er blevet opdateret i EatSafe. Ændringen vedrører allergener i din profil eller hos en person i din Familie."),
      PANEL("Det er ændret", [P("{{changeSummary}}")]),
      P("Ændringen kan skyldes nye eller rettede oplysninger. Den betyder ikke nødvendigvis, at producenten har ændret selve produktet."),
      P("Scan produktet igen eller søg efter det i appen for at se den opdaterede vurdering. Tjek emballagen, før du bruger produktet."),
      DISC,
    ],
    action: PRODUCT_ACTION, entity: { type: "product", idFrom: "ean" },
  },

  // ── P6: tilbagekaldelse fra Fødevarestyrelsen, matchet på EAN (aldrig på navn alene) ──
  "P6:default": {
    type: "P6", variant: "default", category: "recalls", version: 1, ttl: 86400,
    push: { title: "Et produkt er tilbagekaldt", body: "Der er en tilbagekaldelse for {{productName}}. Tjek de berørte partier." },
    mail: { subject: "Tilbagekaldelse af et produkt, du har brugt i EatSafe", preheader: "Kontrollér produktets oplysninger i den officielle tilbagekaldelse." },
    vars: {
      ...PRODUCT_VARS,
      recallReason: { fallback: "Se den officielle tilbagekaldelse for årsagen.", multiline: true },
      affectedBatches: { fallback: "Se den officielle tilbagekaldelse for berørte varer og partier.", multiline: true },
      recallAction: { fallback: "Følg Fødevarestyrelsens anvisninger i tilbagekaldelsen." },
      recallUrl: { fallback: "" },
    },
    required: ["recallUrl"],
    blocks: [
      H("Et produkt er tilbagekaldt"),
      P("Der er offentliggjort en tilbagekaldelse, som kan vedrøre **{{productName}}**, du har scannet eller gemt i EatSafe."),
      PANEL("Årsag til tilbagekaldelsen", [P("{{recallReason}}", { multiline: true })]),
      PANEL("Berørte varer og partier", [P("{{affectedBatches}}", { multiline: true })]),
      P("{{recallAction}}"),
      P("Sammenlign oplysningerne i tilbagekaldelsen med emballagen på dit produkt. En tilbagekaldelse kan gælde bestemte partier eller holdbarhedsdatoer."),
      LINK("Læs den officielle tilbagekaldelse", "{{recallUrl}}"),
      DISC,
    ],
    action: PRODUCT_ACTION, entity: { type: "recall", idFrom: "recallId" },
  },

  // ── P3: nye varer på en delt indkøbsliste (aggregeret; varenavne står ikke i pushen) ──
  "P3:one": {
    type: "P3", variant: "one", category: "shared_lists", version: 2, ttl: 7200,
    push: LIST_PUSH, mail: LIST_MAIL,
    vars: LIST_VARS, required: [],
    blocks: LIST_BLOCKS,
    action: LIST_ACTION, entity: LIST_ENTITY,
  },
  "P3:many": {
    type: "P3", variant: "many", category: "shared_lists", version: 2, ttl: 7200,
    push: LIST_PUSH, mail: LIST_MAIL,
    vars: LIST_VARS, required: [],
    blocks: LIST_BLOCKS,
    action: LIST_ACTION, entity: LIST_ENTITY,
  },
};

export class MissingRequiredError extends Error {
  constructor(key, name) {
    super(`Notifikation ${key} kan ikke oprettes uden ${name}`);
    this.name = "MissingRequiredError";
    this.code = "MISSING_REQUIRED";
    this.field = name;
  }
}

// ── Redigerbar push ─────────────────────────────────────────────────────────
export const PUSH_TITLE_MAX = 60;
export const PUSH_BODY_MAX = 180;

/** Variabelnavne, en pushtekst til denne notifikation må bruge. */
export function pushVariablesFor(key) {
  return Object.entries(DEFINITIONS[key]?.vars ?? {}).filter(([, spec]) => !spec.noPush).map(([name]) => name);
}

/** Tjekker en redigeret pushtekst: kendt notifikation, længder og kun tilladte {{variabler}}. */
export function validatePushOverride(key, { title, body } = {}) {
  const def = DEFINITIONS[key];
  if (!def) return { ok: false, error: "Ukendt notifikation" };
  const t = String(title ?? "").trim();
  const b = String(body ?? "").trim();
  if (!t && !b) return { ok: true };
  if (t.length > PUSH_TITLE_MAX) return { ok: false, error: `Titlen må højst være ${PUSH_TITLE_MAX} tegn` };
  if (b.length > PUSH_BODY_MAX) return { ok: false, error: `Teksten må højst være ${PUSH_BODY_MAX} tegn` };
  const allowed = new Set(pushVariablesFor(key));
  for (const text of [t, b]) {
    for (const m of text.matchAll(/\{\{\s*([a-zA-Z_]*)\s*\}\}/g)) {
      if (!allowed.has(m[1])) return { ok: false, error: `Ukendt variabel {{${m[1]}}}` };
    }
    if (/\{\{|\}\}/.test(text.replace(/\{\{\s*[a-zA-Z_]+\s*\}\}/g, ""))) return { ok: false, error: "Ugyldig variabel (brug {{navn}})" };
  }
  return { ok: true };
}

// ── Rendering ───────────────────────────────────────────────────────────────
/** Splitter "**fed**"-markup i dele. Variabelværdier er renset for ** på forhånd. */
function toParts(text) {
  const parts = [];
  text.split("**").forEach((chunk, i) => {
    if (chunk) parts.push(i % 2 === 1 ? { text: chunk, strong: true } : { text: chunk });
  });
  return parts;
}

// En værdi, der står først i en sætning, får stort forbogstav; midt i en sætning bruges den,
// som den er (F1-11: fallback "produktet" gav før "en tilbagekaldelse for Produktet").
function fillTemplate(template, values) {
  return template.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_, name, offset, whole) => {
    const v = values[name] ?? "";
    const sentenceStart = offset === 0 || /[.!?]\s+$/.test(whole.slice(0, offset));
    return sentenceStart && v ? v.charAt(0).toUpperCase() + v.slice(1) : v;
  });
}

function buildValues(def, key, data, { forPush }) {
  const values = {};
  for (const [name, spec] of Object.entries(def.vars)) {
    const raw = name === "ticketExcerpt" ? truncate(cleanText(data.ticketExcerpt ?? data.description), TICKET_EXCERPT_MAX)
      : cleanText(data[name], { multiline: !!spec.multiline });
    if (!raw && def.required.includes(name)) throw new MissingRequiredError(key, name);
    if (forPush && spec.noPush) { values[name] = ""; continue; } // fx varenavne: aldrig i push
    let v = raw || (forPush ? (spec.pushFallback ?? spec.fallback) : spec.fallback) || "";
    if (forPush && spec.max) v = truncate(v, spec.max);
    values[name] = v;
  }
  return values;
}

function renderBlock(block, values) {
  switch (block.t) {
    case "heading":
      return { type: "heading", text: fillTemplate(block.text, values) };
    case "p": {
      const text = fillTemplate(block.text, values);
      if (!text.trim()) return null; // tomt afsnit (fx ingen kommentar fra teamet) udelades
      return { type: "paragraph", parts: toParts(text), ...(block.multiline ? { multiline: true } : {}) };
    }
    case "panel":
      return { type: "panel", ...(block.title ? { title: block.title } : {}), blocks: block.blocks.map((b) => renderBlock(b, values)).filter(Boolean) };
    case "quote":
      return { type: "quote", label: block.label, text: fillTemplate(block.text, values) };
    case "fact":
      return { type: "fact", label: block.label, value: block.value };
    case "disclaimer":
      return { type: "disclaimer", text: DISCLAIMER };
    case "link": {
      // Kun officielle kilder (Fødevarestyrelsen, https) må blive et link; ellers udelades blokken.
      const url = fillTemplate(block.url, values);
      return isOfficialRecallUrl(url) ? { type: "link", label: block.label, url } : null;
    }
    default:
      throw new Error(`Ukendt blok: ${block.t}`);
  }
}

/**
 * Bygger en færdig, modtagerspecifik besked ud fra en definition og hændelsesdata.
 * Kaster MissingRequiredError, hvis en obligatorisk værdi mangler.
 * Resultatet er et snapshot: det gemmes uændret og omskrives aldrig bagefter.
 */
export function renderNotification(key, data = {}, options = {}) {
  const def = DEFINITIONS[key];
  if (!def) throw new Error(`Ukendt notifikation: ${key}`);

  const blockValues = buildValues(def, key, data, { forPush: false });
  const pushValues = buildValues(def, key, data, { forPush: true });

  const title = fillTemplate(def.push.title, blockValues);
  // Admin kan rette pushens tekst (tabellen notification_push_overrides). Mailen og beskeden i appen røres ikke.
  const override = options.pushOverride && validatePushOverride(key, options.pushOverride).ok ? options.pushOverride : null;
  const pushTitle = fillTemplate(override?.title || def.push.title, pushValues);
  const pushBody = fillTemplate(override?.body || def.push.body, pushValues);
  const blocks = def.blocks.map((b) => renderBlock(b, blockValues)).filter(Boolean);

  const params = {};
  for (const p of def.action.params) params[p] = cleanText(data[p]);
  const missingParam = def.action.params.find((p) => !params[p]);
  if (missingParam) throw new MissingRequiredError(key, missingParam);

  const entityId = def.entity.idFrom ? cleanText(data[def.entity.idFrom]) : null;

  const out = {
    key,
    type: def.type,
    variant: def.variant,
    category: def.category,
    templateVersion: def.version,
    ttlSeconds: def.ttl,
    title,
    pushTitle,
    pushBody,
    blocks,
    primaryAction: { type: def.action.type, label: def.action.label, ...(Object.keys(params).length ? { params } : {}) },
    entityType: def.entity.type,
    entityId: entityId || null,
    mail: def.mail ? { subject: fillTemplate(def.mail.subject, blockValues), preheader: def.mail.preheader } : null,
    // De samme rensede værdier som brødteksten bruger — sendes som variabler til mailskabelonen,
    // så app og mail aldrig kan vise forskellige tal/tekster for samme hændelse.
    mailVars: blockValues,
  };

  for (const s of [out.title, out.pushTitle, out.pushBody, JSON.stringify(out.blocks), out.mail?.subject ?? ""]) {
    if (/\{\{/.test(s)) throw new Error(`Uløst variabel i ${key}`);
  }
  return out;
}

// ── Ren tekst (mail) ────────────────────────────────────────────────────────
const partsToText = (parts) => parts.map((p) => p.text).join("");

function blockToText(b) {
  switch (b.type) {
    case "heading": return b.text;
    case "paragraph": return partsToText(b.parts);
    case "panel": return [b.title, ...b.blocks.map(blockToText)].filter(Boolean).join("\n\n");
    case "quote": return `${b.label}\n“${b.text}”`;
    case "fact": return `${b.label}: ${b.value}`;
    case "disclaimer": return b.text;
    case "link": return `${b.label}: ${b.url}`;
    default: return "";
  }
}

/** Beskedens indhold som ren tekst — samme tekst som appen viser, uden mailramme. */
export function blocksToText(blocks) {
  return blocks.map(blockToText).join("\n\n");
}
