// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useProduct.js
// Produkt-relateret state: OCR, indsend nyt produkt, suggest-edit flow.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { SUPABASE_URL, ALLERGENS, SCREENS } from "./constants.jsx";
import { makeHeaders, apiCall, compareAllergens, traceId, traceLog } from "./helpers.js";

export function useProduct({ accessToken, userId, activeProfiles,
                              notFoundEan, setNotFoundEan,
                              setScreen }) {

  // Scan-resultat state
  const [scanResult, setScanResult]           = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [scanError_, setScanError_]           = useState("");
  const [notFoundStep, setNotFoundStep]       = useState(1);
  const [submitting, setSubmitting]           = useState(false);

  // OCR state
  const [ocrText, setOcrText]                 = useState("");
  const [ocrLoading, setOcrLoading]           = useState(false);
  const [ocrImageBase64, setOcrImageBase64]   = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [productImageBase64, setProductImageBase64]   = useState(null);

  // Ny produkt form
  const [proposedName, setProposedName]       = useState("");
  const [proposedNutrition, setProposedNutrition] = useState({ energy:"", fat:"", saturated:"", carbs:"", sugars:"", protein:"", salt:"" });
  const [proposedNotes, setProposedNotes]     = useState("");
  const [proposedFlags, setProposedFlags]     = useState(null);

  // Suggest-edit state
  const [editStep, setEditStep]               = useState("start");
  const [editIngText, setEditIngText]         = useState("");
  const [editNote, setEditNote]               = useState("");
  const [editType, setEditType]               = useState(null);
  const [editProductImage, setEditProductImage]     = useState(null);
  const [editProductImageB64, setEditProductImageB64] = useState(null);
  const [editOcrLoading, setEditOcrLoading]   = useState(false);
  const [editOcrText, setEditOcrText]         = useState("");

  const extractProductName = (text) => {
    if (!text) return "";
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
    return lines.filter(l =>
      !/^[0-9\s\.,gkJ%]+$/.test(l) &&
      !/^(ingredienser|næringsindhold|opbevaring|bedst|energi|fedt|protein|salt|kulhydrat)/i.test(l) &&
      l.length > 3
    )[0] || "";
  };

  const handleProductImageCapture = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const tid = traceId("photo-product");
    traceLog(tid, "photo:start", { size: file.size, type: file.type });
    setOcrLoading(true);
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      setProductImageBase64(base64);
      setProductImagePreview(URL.createObjectURL(file));
      try {
        const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, { method:"POST", headers: makeHeaders(accessToken), body: JSON.stringify({ image_base64: base64, mode:"product_name" }) });
        if (ocrData.success && ocrData.text) { const name = extractProductName(ocrData.text); if (name) setProposedName(name); }
      } catch {}
    } catch { setScanError_("Billedet kunne ikke læses. Prøv igen."); }
    setOcrLoading(false);
    setNotFoundStep(2);
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const tid = traceId("ocr");
    traceLog(tid, "ocr:start", { size: file.size, type: file.type });
    setOcrLoading(true);
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      traceLog(tid, "ocr:base64-ready", { length: base64.length });
      setOcrImageBase64(base64);
      traceLog(tid, "ocr:image_ready", { size: Math.round(base64.length * 0.75 / 1024) + "kb" });
      const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, { method:"POST", headers: makeHeaders(accessToken), body: JSON.stringify({ image_base64: base64 }) });
      traceLog(tid, "ocr:response", { success: ocrData.success, textLength: ocrData.text?.length || 0, text: (ocrData.text || "").substring(0, 80) });
      if (ocrData.success && ocrData.text) {
        setOcrText(ocrData.text);
        if (!proposedName) setProposedName(extractProductName(ocrData.text));
        traceLog(tid, "ocr:allergen-call", { textLength: ocrData.text.length });
        const allergenData = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, { method:"POST", headers: makeHeaders(accessToken), body: JSON.stringify({ text: ocrData.text }) });
        traceLog(tid, "ocr:allergen-response", { success: allergenData.success, method: allergenData.method, flags: allergenData.allergen_flags });
        if (allergenData.success) setProposedFlags(allergenData.allergen_flags);
        setNotFoundStep(3); // → Næringsindhold
      } else {
        traceLog(tid, "ocr:empty", { error: "OCR returnerede tom tekst eller fejl", raw: JSON.stringify(ocrData).substring(0, 200) });
        setScanError_("Billedet kunne ikke læses. Prøv et klarere billede.");
      }
    } catch (e) {
      traceLog(tid, "ocr:error", { error: e?.message || String(e) });
      setScanError_("Billedet kunne ikke analyseres. Prøv igen.");
    }
    setOcrLoading(false);
  };

  const handleEditProductCapture = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setEditProductImage(URL.createObjectURL(file));
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = () => rej(); r.readAsDataURL(file); });
    setEditProductImageB64(b64);
  };

  const submitProduct = async () => {
    const tid = traceId("submit");
    traceLog(tid, "submit:start", { ean: notFoundEan, name: proposedName, hasOcr: !!ocrText, hasImage: !!productImageBase64 });
    setSubmitting(true);
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          ean: notFoundEan, submitted_by: userId,
          ocr_raw_text: ocrText, raw_label_image: ocrImageBase64 || null,
          ai_parsed_data: { ...proposedFlags, name: proposedName, product_image_base64: productImageBase64, nutrition: proposedNutrition, notes: proposedNotes },
          user_confirmed: true,
        }),
      });
      traceLog(tid, "submit:success", { ean: notFoundEan });
      setScreen(SCREENS.SUBMITTED);
    } catch (e) {
      traceLog(tid, "submit:error", { error: e.message });
      setScanError_("Indsendelse fejlede. Prøv igen.");
    }
    setSubmitting(false);
  };

  return {
    scanResult, setScanResult,
    loading, setLoading,
    scanError: scanError_, setScanError: setScanError_,
    notFoundStep, setNotFoundStep,
    submitting,
    ocrText, setOcrText,
    ocrLoading, setOcrLoading,
    ocrImageBase64, setOcrImageBase64,
    productImagePreview, setProductImagePreview,
    productImageBase64, setProductImageBase64,
    proposedName, setProposedName,
    proposedFlags, setProposedFlags,
    proposedNutrition, setProposedNutrition,
    proposedNotes, setProposedNotes,
    editStep, setEditStep,
    editIngText, setEditIngText,
    editNote, setEditNote,
    editType, setEditType,
    editProductImage, setEditProductImage,
    editProductImageB64, setEditProductImageB64,
    editOcrLoading, setEditOcrLoading,
    editOcrText, setEditOcrText,
    handleProductImageCapture,
    handleImageCapture,
    handleEditProductCapture,
    submitProduct,
  };
}
