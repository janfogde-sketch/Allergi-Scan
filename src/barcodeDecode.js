// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// barcodeDecode.js
// Stregkode-afkodning med ZXing (det eneste stregkode-bibliotek i appen).
// Bruges af live-kameraet og galleri/foto-scanning i useScanner.js.
// Billedet tegnes selv drejet (ZXings egen TRY_HARDER-rotation virker ikke på canvas-kilder),
// så skrå og lodrette koder også læses. ZXing tåler ca. ±20° pr. vinkel og læser på hovedet.
// ─────────────────────────────────────────────────────────────────────────────

import { normalizeScannedBarcode } from "./helpers.js";

let zxingPromise = null;

// Henter ZXing første gang og genbruger det derefter
export function loadZxing() {
  if (!zxingPromise) zxingPromise = import("@zxing/library").catch((e) => { zxingPromise = null; throw e; });
  return zxingPromise;
}

export async function createBarcodeReader() {
  const Z = await loadZxing();
  const hints = new Map();
  hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [
    Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E,
    Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.CODE_39, Z.BarcodeFormat.ITF,
  ]);
  hints.set(Z.DecodeHintType.TRY_HARDER, true);
  const reader = new Z.MultiFormatReader();
  reader.setHints(hints);
  return { Z, reader };
}

// Tegner `source` (canvas/video/billede, bredde w × højde h) drejet `deg` grader ind i canvas `rot` og afkoder.
// Returnerer en checksum-valideret kode eller null.
export function decodeRotated({ Z, reader }, source, w, h, deg, rot, rotCtx) {
  if (deg === 0) { rot.width = w; rot.height = h; }
  else if (deg === 90) { rot.width = h; rot.height = w; }
  else { rot.width = rot.height = Math.ceil(Math.hypot(w, h)); }
  rotCtx.fillStyle = "#888";
  rotCtx.fillRect(0, 0, rot.width, rot.height);
  rotCtx.translate(rot.width / 2, rot.height / 2);
  rotCtx.rotate(deg * Math.PI / 180);
  rotCtx.drawImage(source, -w / 2, -h / 2, w, h);
  rotCtx.setTransform(1, 0, 0, 1, 0, 0);
  try {
    const bitmap = new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(rot)));
    const result = reader.decode(bitmap);
    return normalizeScannedBarcode(result.getText(), Z.BarcodeFormat[result.getBarcodeFormat()]);
  } catch { return null; } // ingen kode i denne vinkel
}

// Afkoder en billedfil (galleri/foto) i alle retninger. Returnerer EAN eller null.
export async function decodeBarcodeFile(file) {
  const dec = await createBarcodeReader();
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    const rot = document.createElement("canvas");
    const rotCtx = rot.getContext("2d", { willReadFrequently: true });
    for (const deg of [0, 90, 45, 135]) {
      const code = decodeRotated(dec, img, w, h, deg, rot, rotCtx);
      if (code) return code;
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
