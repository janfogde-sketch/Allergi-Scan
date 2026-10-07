// Fælles mini-markup for politiktekster: **fed**, \n = linjeskift, {mail}, [tekst](url).
export const LEGAL_MAIL = "hej@eatsafe.dk";

const TOKEN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|\{mail\}|\n/g;

// Returnerer en liste af dele: {type:"text"|"strong"|"link"|"mail"|"br", ...}
export function parseInline(s) {
  const out = [];
  let last = 0;
  for (const m of s.matchAll(TOKEN)) {
    if (m.index > last) out.push({ type: "text", text: s.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: "strong", text: m[1] });
    else if (m[2] !== undefined) out.push({ type: "link", text: m[2], href: m[3] });
    else if (m[0] === "{mail}") out.push({ type: "mail" });
    else out.push({ type: "br" });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ type: "text", text: s.slice(last) });
  return out;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function inlineToHtml(s) {
  return parseInline(s).map((p) => {
    if (p.type === "text") return esc(p.text);
    if (p.type === "strong") return `<strong>${esc(p.text)}</strong>`;
    if (p.type === "br") return "<br>";
    if (p.type === "mail") return `<a href="mailto:${LEGAL_MAIL}">${LEGAL_MAIL}</a>`;
    const ext = /^https?:/.test(p.href) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${p.href}"${ext}>${esc(p.text)}</a>`;
  }).join("");
}

export function legalBodyHtml(doc, indent = "    ") {
  const L = [];
  L.push(`<div class="updated">Sidst opdateret: ${esc(doc.updated)}</div>`, "");
  L.push(`<div class="draft-notice">`, `  ${inlineToHtml(doc.draftNotice)}`, `</div>`, "");
  for (const [kind, v] of doc.blocks) {
    if (kind === "h2") L.push("", `<h2>${inlineToHtml(v)}</h2>`);
    else if (kind === "p") L.push(`<p>${inlineToHtml(v)}</p>`);
    else if (kind === "ul") L.push(`<ul>`, ...v.map((li) => `  <li>${inlineToHtml(li)}</li>`), `</ul>`);
  }
  L.push("", `<div class="contact-box">`, `  <p>${inlineToHtml(doc.contactBox)}</p>`, `</div>`);
  return L.map((l) => (l ? indent + l : l)).join("\n");
}
