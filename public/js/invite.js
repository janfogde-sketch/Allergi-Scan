const SUPABASE_URL = "https://jegrpcflyguadyxialkm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ3JwY2ZseWd1YWR5eGlhbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjY5NjQsImV4cCI6MjA5NDc0Mjk2NH0.QErfbw2xmsdYjTZCS1WUOUwQHv6G2PKQRldyj8rdGq8";

const token = window.location.pathname.split("/invite/")[1]?.split("/")[0];
const spinner = document.getElementById("spinner");
const content = document.getElementById("content");

// Stregikoner fra appens eget ikonbibliotek (SharedComponents.jsx), så siden ser ens ud på alle platforme.
const ICONS = {
  family: '<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
};
const icon = (name, red) => `<div class="icon${red ? " red" : ""}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[name]}</svg></div>`;

// Navnet kommer fra en bruger og indsættes som HTML, så det skal escapes.
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));

// Browsere inde i apps (Messenger, Instagram m.fl.) har deres egen lagring og kan ikke bruge Google-login. Her guides modtageren
// til at åbne invitationen i den rigtige browser, før kontoen oprettes. Installation kan ikke registreres fra en browser, så guiden
// vises for alle, der ikke allerede kører som installeret app.
const inAppBrowser = /Viber|FBAN|FBAV|FB_IAB|Messenger|Instagram|Snapchat|Line\/|MicroMessenger|TikTok|Twitter|LinkedInApp|Pinterest|GSA\//i.test(navigator.userAgent);
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
// iPadOS (siden 13) udgiver sig for at være en Mac i browserstrengen, men har berøringsskærm: tæl den med som iOS.
const isIOS = (/iPad|iPhone|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 0)) && !window.MSStream;
const isAndroid = /Android/i.test(navigator.userAgent);
const isSamsungBrowser = /SamsungBrowser/i.test(navigator.userAgent);
const isFirefox = /Firefox|FxiOS/i.test(navigator.userAgent);
const isEdge = /EdgA|EdgiOS|Edg\//.test(navigator.userAgent);
const isOpera = /OPR\/|OPT\//.test(navigator.userAgent);
// Navnet på den browser, modtageren skal åbne linket i: Safari på iPhone/iPad, ellers Chrome eller Samsung Internet på Android.
const browserName = isIOS ? "Safari" : "Chrome, Samsung Internet, Firefox eller Edge";

// Kort installationsråd, tilpasset browseren. Alle større mobilbrowsere kan føje en webapp til startskærmen via menuen.
const installTip = () => {
  if (isIOS) return "På iPhone og iPad skal du bruge Safari: tryk på Del-ikonet og vælg Føj til hjemmeskærm.";
  if (!isAndroid) return "EatSafe er lavet til telefonen. Åbn invitationen på din telefon, og installér appen derfra. På computer kan du bruge browserens menu (fx Installér app eller Føj til Dock), hvis din browser tilbyder det.";
  if (isSamsungBrowser) return "I Samsung Internet åbner du menuen og vælger Tilføj side til → Startskærm.";
  if (isFirefox) return "I Firefox åbner du menuen (⋮) og vælger Installér.";
  if (isEdge) return "I Edge åbner du menuen (⋯) og vælger Føj til telefon eller Installér app.";
  if (isOpera) return "I Opera åbner du menuen og vælger Startskærm.";
  return "På Android åbner du menuen i din browser (fx Chrome) og vælger Installér app eller Føj til startskærm.";
};

const inAppNotice = () => !inAppBrowser ? "" : `
  <div class="notice" role="alert">
    <strong>Åbn invitationen i din browser</strong>
    <p>Du ser siden i en app (fx Messenger eller Instagram). Her kan du ikke logge ind med Google, og dine oplysninger bliver ikke husket. Åbn linket i ${browserName}: tryk på menuen (⋯ eller del-ikonet) og vælg "Åbn i browser" eller "Åbn i ${isIOS ? "Safari" : "Chrome"}". Eller kopiér linket og indsæt det i ${browserName}.</p>
    <button type="button" class="btn btn-ghost" id="copy-link">Kopiér link</button>
  </div>`;

const installGuide = () => isStandalone ? "" : `
  <div class="install">
    <strong>Første gang i EatSafe?</strong>
    <p>EatSafe virker bedst som app på din startskærm, og kun dér kan du få pushbeskeder. Når du har oprettet dig, kan du installere den. ${installTip()}</p>
    <a href="https://www.eatsafe.dk/install.html" class="btn btn-ghost">Sådan installerer du EatSafe</a>
  </div>`;

function wireCopy() {
  const b = document.getElementById("copy-link");
  if (!b) return;
  b.addEventListener("click", async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); b.textContent = "Link kopieret"; }
    catch {
      const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); b.textContent = "Link kopieret"; } catch { b.textContent = "Tryk og hold på adressen for at kopiere"; }
      t.remove();
    }
  });
}

function show(html) {
  spinner.style.display = "none";
  content.style.display = "block";
  content.innerHTML = html;
}

async function checkToken() {
  if (!token) {
    show(`
      ${icon("alert", true)}
      <h1>Ugyldig invitation</h1>
      <p>Denne invitation er ikke gyldig.</p>
      <a href="https://www.eatsafe.dk" class="btn">Gå til EatSafe</a>
    `);
    return;
  }

  // Tjek om token eksisterer og er gyldigt — via get_invite_preview()-RPC'en
  // (SECURITY DEFINER), IKKE en direkte tabel-læsning. En bred SELECT-policy
  // ville lade enhver dumpe ALLE aktive invitations-tokens på tværs af hele
  // appen; RPC'en returnerer kun den ene invitation der matcher det token
  // man rent faktisk har.
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_invite_preview`,
      {
        method: "POST",
        headers: { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ p_token: token }),
      }
    );
    const data = await res.json();

    if (!data?.found) {
      show(`
        ${icon("alert", true)}
        <h1>Ugyldig invitation</h1>
        <p>Denne invitation findes ikke.</p>
        <a href="https://www.eatsafe.dk" class="btn">Gå til EatSafe</a>
      `);
      return;
    }

    const invite = data;
    if (invite.status === "accepted") {
      show(`
        ${icon("check")}
        <h1>Allerede accepteret</h1>
        <p>Denne invitation er allerede brugt.</p>
        <a href="https://www.eatsafe.dk" class="btn">Åbn EatSafe</a>
      `);
      return;
    }

    if (invite.status === "revoked") {
      show(`
        ${icon("alert", true)}
        <h1>Invitationen er trukket tilbage</h1>
        <p>Bed afsenderen om en ny invitation.</p>
        <a href="https://www.eatsafe.dk" class="btn">Gå til EatSafe</a>
      `);
      return;
    }

    if (invite.status !== "pending" || new Date(invite.expires_at) < new Date()) {
      show(`
        ${icon("clock", true)}
        <h1>Invitationen er udløbet</h1>
        <p>Bed familiemedlemmet om at sende en ny invitation til din e-mailadresse.</p>
        <a href="https://www.eatsafe.dk" class="btn">Gå til EatSafe</a>
      `);
      return;
    }

    // Delt link, som en anden allerede har brugt: linket virker til én person. (Den, der selv har brugt det, venter på afsenderens godkendelse.)
    if (invite.kind === "link" && invite.locked) {
      show(`
        ${icon("alert", true)}
        <h1>Linket er allerede brugt</h1>
        <p>Et delt link virker kun til én person. Har du selv brugt det, venter afsenderen på at godkende dig i EatSafe. Ellers kan du bede afsenderen om et nyt link.</p>
        <a href="https://www.eatsafe.dk" class="btn">Åbn EatSafe</a>
      `);
      return;
    }

    // Gyldigt link — vis accept-flow
    show(`
      ${icon("family")}
      <h1>Du er inviteret!</h1>
      <p>${invite.inviter_first_name ? `${esc(invite.inviter_first_name)} har inviteret dig til sin familie i EatSafe.` : "Du er blevet inviteret til en familie i EatSafe."} Når du siger ja, kan I se hinandens allergier og kostvalg, så I kan tjekke varer for hinanden, og I kan dele indkøbslister. Du styrer selv dine egne oplysninger og kan til enhver tid afslutte forbindelsen igen.</p>
      ${invite.invitee_email_hint ? `<p><strong>Tip:</strong> Opret dig eller log ind med den e-mailadresse, invitationen blev sendt til (${esc(invite.invitee_email_hint)}). Bruger du Facebook eller en anden adresse, er det også fint: tryk på knapperne herunder, og log ind i den samme browser, så vises invitationen i appen. Du bestemmer selv, om du vil forbindes.</p>` : ""}
      ${invite.kind === "link" ? `<p><strong>Sådan virker det:</strong> Opret dig eller log ind, og tryk ja i appen. Så får ${invite.inviter_first_name ? esc(invite.inviter_first_name) : "afsenderen"} en anmodning og skal godkende, før I bliver forbundet. Linket virker til én person.</p>` : ""}
      ${inAppNotice()}
      <a href="https://www.eatsafe.dk?invite=${encodeURIComponent(token)}" class="btn">Opret konto</a>
      <a href="https://www.eatsafe.dk?invite=${encodeURIComponent(token)}&login=1" class="btn btn-ghost">Log ind</a>
      <p class="expiry">Invitationen udløber ${new Date(invite.expires_at).toLocaleDateString("da-DK")}</p>
      ${installGuide()}
    `);
    wireCopy();
  } catch {
    show(`
      ${icon("alert", true)}
      <h1>Noget gik galt</h1>
      <p>Tjek din internetforbindelse og prøv igen.</p>
      <a href="https://www.eatsafe.dk" class="btn">Gå til EatSafe</a>
    `);
  }
}

checkToken();
