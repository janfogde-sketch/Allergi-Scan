// Engangsflytning (plan 14. okt. 2026, Jans ja samme dag): indsendte fotos, som intet produkt bruger som billede, flyttes fra den
// offentlige bøtte product-images til den private submission-images, og indsendelsen peger derefter på den private kopi.
// Produktbilleder, som et produkt bruger, bliver offentlige. Køres af workflowet "Flyt indsendte billeder" (MODE=dry_run eller apply).
// Rækkefølge pr. fil: hent → læg i privat bøtte → ret indsendelsen → slet den offentlige kopi til sidst. Kan køres igen uden skade.
import { storagePathFromUrl, submissionImageRef, SUBMISSION_IMAGES_BUCKET, PRODUCT_IMAGES_BUCKET } from "../supabase/functions/_shared/productImages.js";

const { SUPABASE_ACCESS_TOKEN, PROJECT_REF, MODE = "dry_run" } = process.env;
if (!SUPABASE_ACCESS_TOKEN || !PROJECT_REF) throw new Error("SUPABASE_ACCESS_TOKEN og PROJECT_REF mangler");
const apply = MODE === "apply";
const BASE = `https://${PROJECT_REF}.supabase.co`;

const keys = await (await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys?reveal=true`, {
  headers: { Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}` },
})).json();
const key = keys.find?.((k) => k.name === "service_role")?.api_key;
if (!key) throw new Error("Kunne ikke hente service-nøglen");
const H = { apikey: key, Authorization: `Bearer ${key}` };

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, { ...opts, headers: { ...H, ...(opts.headers ?? {}) } });
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${path.split("?")[0]}: ${res.status} ${await res.text()}`);
  return res;
}
const enc = (p) => p.split("/").map(encodeURIComponent).join("/");

const subs = await (await req("/rest/v1/submissions?select=id,raw_label_image,ai_parsed_data")).json();
const prods = await (await req(`/rest/v1/products?select=image_url&image_url=ilike.*${PRODUCT_IMAGES_BUCKET}*`)).json();
const keep = new Set(prods.map((p) => storagePathFromUrl(p.image_url)).filter(Boolean));

// Erstat offentlige URL'er (som intet produkt bruger) med en privat henvisning; saml de filer, der skal flyttes.
const moves = new Set();
const toPrivate = (url) => {
  const path = storagePathFromUrl(url);
  if (!path || keep.has(path)) return url;
  moves.add(path);
  return submissionImageRef(path);
};
const updates = [];
for (const s of subs) {
  const parsed = s.ai_parsed_data ?? {};
  const next = {
    raw_label_image: toPrivate(s.raw_label_image),
    ai_parsed_data: {
      ...parsed,
      ...(parsed.product_image_url ? { product_image_url: toPrivate(parsed.product_image_url) } : {}),
      ...(Array.isArray(parsed.images) ? { images: parsed.images.map((im) => (im?.url ? { ...im, url: toPrivate(im.url) } : im)) } : {}),
    },
  };
  if (JSON.stringify(next) !== JSON.stringify({ raw_label_image: s.raw_label_image, ai_parsed_data: s.ai_parsed_data ?? {} })) updates.push({ id: s.id, next });
}

console.log(`Tilstand: ${apply ? "FLYTTER" : "kun visning (dry_run)"}`);
console.log(`Bliver offentlige (bruges af et produkt): ${keep.size}`);
console.log(`Flyttes til den private bøtte: ${moves.size}`);
for (const p of moves) console.log(`  ${p}`);
console.log(`Indsendelser der rettes: ${updates.length}`);
if (!apply) process.exit(0);

// 1) Kopiér hver fil til den private bøtte.
for (const path of moves) {
  const res = await req(`/storage/v1/object/${PRODUCT_IMAGES_BUCKET}/${enc(path)}`);
  const body = Buffer.from(await res.arrayBuffer());
  await req(`/storage/v1/object/${SUBMISSION_IMAGES_BUCKET}/${enc(path)}`, {
    method: "POST", headers: { "Content-Type": res.headers.get("content-type") ?? "image/jpeg", "x-upsert": "true" }, body,
  });
  const check = await req(`/storage/v1/object/${SUBMISSION_IMAGES_BUCKET}/${enc(path)}`);
  if ((await check.arrayBuffer()).byteLength !== body.length) throw new Error(`Kopien af ${path} har forkert størrelse`);
}
console.log(`Kopieret: ${moves.size}`);

// 2) Ret indsendelserne.
for (const u of updates) {
  await req(`/rest/v1/submissions?id=eq.${u.id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify(u.next),
  });
}
console.log(`Indsendelser rettet: ${updates.length}`);

// 3) Slet de offentlige kopier.
if (moves.size > 0) {
  const res = await req(`/storage/v1/object/${PRODUCT_IMAGES_BUCKET}`, {
    method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefixes: [...moves] }),
  });
  console.log(`Offentlige kopier slettet: ${(await res.json()).length}`);
}
