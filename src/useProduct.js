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
    traceLog(tid, "ocr:start", { ean: notFoundEan });
    setOcrLoading(true);
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      setOcrImageBase64(base64);
      traceLog(tid, "ocr:image_ready", { size: Math.round(base64.length * 0.75 / 1024) + "kb" });
      const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, { method:"POST", headers: makeHeaders(accessToken), body: JSON.stringify({ image_base64: base64 }) });
      if (ocrData.success) {
        traceLog(tid, "ocr:text_extracted", { chars: ocrData.text?.length || 0 });
        setOcrText(ocrData.text);
        if (!proposedName) setProposedName(extractProductName(ocrData.text));
        const allergenData = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, { method:"POST", headers: makeHeaders(accessToken), body: JSON.stringify({ text: ocrData.text }) });
        if (allergenData.success) {
          traceLog(tid, "ocr:allergens_parsed", { flags: allergenData.allergen_flags });
          setProposedFlags(allergenData.allergen_flags);
        }
        setNotFoundStep(3);
      } else {
        traceLog(tid, "ocr:failed", { reason: "ocr not success" });
        setScanError_("Billedet kunne ikke læses. Prøv et klarere billede.");
      }
    } catch (e) {
      traceLog(tid, "ocr:error", { error: e.message });
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
    traceLog(tid, "submit:start", { ean: notFoundEan, name: proposedName });
    setSubmitting(true);
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          ean: notFoundEan, submitted_by: userId,
          ocr_raw_text: ocrText, raw_label_image: ocrImageBase64 || null,
          ai_parsed_data: { ...proposedFlags, name: proposedName, product_image_base64: productImageBase64 },
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
