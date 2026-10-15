// Fælles hjælp til billeder i lagerbøtterne product-images (offentlig: godkendte produktbilleder) og
// submission-images (privat: indsendte fotos, kun admin og serveren kan læse dem).
// Bruges af submissions, delete-user (billeder fjernes ved kontosletning), cleanup-orphan-images og admin-panelet.

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const SUBMISSION_IMAGES_BUCKET = "submission-images";
// Indsendelser gemmer en henvisning til den private bøtte i stedet for en offentlig URL, fx "storage:submission-images/labels/1_label.jpg".
export const SUBMISSION_REF_PREFIX = `storage:${SUBMISSION_IMAGES_BUCKET}/`;
const MARKER = `/object/public/${PRODUCT_IMAGES_BUCKET}/`;

export const submissionImageRef = (path) => SUBMISSION_REF_PREFIX + path;

// Filstien i den private bøtte ud fra en henvisning; null for alt andet.
export function privateImagePath(ref) {
  if (typeof ref !== "string" || !ref.startsWith(SUBMISSION_REF_PREFIX)) return null;
  return ref.slice(SUBMISSION_REF_PREFIX.length) || null;
}

// Filstien i product-images ud fra en offentlig URL; null hvis det ikke er en URL til vores bøtte (fx base64 eller en OFF-URL).
export function storagePathFromUrl(url) {
  if (typeof url !== "string") return null;
  const i = url.indexOf(MARKER);
  if (i === -1) return null;
  const path = decodeURIComponent(url.slice(i + MARKER.length).split(/[?#]/)[0]);
  return path || null;
}

// {bucket, path} for en offentlig product-images-URL eller en privat henvisning; null for alt andet.
export function storageRef(url) {
  const priv = privateImagePath(url);
  if (priv) return { bucket: SUBMISSION_IMAGES_BUCKET, path: priv };
  const pub = storagePathFromUrl(url);
  return pub ? { bucket: PRODUCT_IMAGES_BUCKET, path: pub } : null;
}

// Alle filer en indsendelse peger på: etiketbillede, produktbillede og ekstra billeder.
export function submissionImageRefs(submission) {
  const parsed = submission?.ai_parsed_data ?? {};
  const urls = [
    submission?.raw_label_image,
    parsed.product_image_url,
    ...(Array.isArray(parsed.images) ? parsed.images.map((im) => im?.url) : []),
  ];
  return urls.map(storageRef).filter(Boolean);
}

// Filer der skal slettes, som {bucket: [stier]}: alle brugerens filer undtagen dem i product-images,
// som et produkt i produktdatabasen bruger som billede.
export function pathsToDelete(submissions, productImageUrls) {
  const keep = new Set((productImageUrls ?? []).map(storagePathFromUrl).filter(Boolean));
  const out = {};
  for (const r of (submissions ?? []).flatMap(submissionImageRefs)) {
    if (r.bucket === PRODUCT_IMAGES_BUCKET && keep.has(r.path)) continue;
    const list = (out[r.bucket] ??= []);
    if (!list.includes(r.path)) list.push(r.path);
  }
  return out;
}
