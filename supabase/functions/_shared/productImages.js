// Fælles hjælp til billeder i lagerbøtten product-images (indsendte produktfotos).
// Bruges af delete-user (billeder fjernes ved kontosletning) og cleanup-orphan-images.

export const PRODUCT_IMAGES_BUCKET = "product-images";
const MARKER = `/object/public/${PRODUCT_IMAGES_BUCKET}/`;

// Filstien i bøtten ud fra en offentlig URL; null hvis det ikke er en URL til vores bøtte (fx base64 eller en OFF-URL).
export function storagePathFromUrl(url) {
  if (typeof url !== "string") return null;
  const i = url.indexOf(MARKER);
  if (i === -1) return null;
  const path = decodeURIComponent(url.slice(i + MARKER.length).split(/[?#]/)[0]);
  return path || null;
}

// Alle filstier en indsendelse peger på: etiketbillede, produktbillede og ekstra billeder.
export function submissionImagePaths(submission) {
  const parsed = submission?.ai_parsed_data ?? {};
  const urls = [
    submission?.raw_label_image,
    parsed.product_image_url,
    ...(Array.isArray(parsed.images) ? parsed.images.map((im) => im?.url) : []),
  ];
  return urls.map(storagePathFromUrl).filter(Boolean);
}

// Stier der skal slettes: alle brugerens filer undtagen dem, et produkt i produktdatabasen bruger som billede.
export function pathsToDelete(submissions, productImageUrls) {
  const keep = new Set((productImageUrls ?? []).map(storagePathFromUrl).filter(Boolean));
  const all = new Set((submissions ?? []).flatMap(submissionImagePaths));
  return [...all].filter((p) => !keep.has(p));
}
