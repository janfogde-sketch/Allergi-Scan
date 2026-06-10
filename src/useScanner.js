// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useScanner.js
// Al kamera- og scan-logik: start/stop kamera, gallery-scan, foto-fallback,
// auto-zoom, tap-to-focus, lommelygte.
//
// Afhænger af: setScanError, setLoading (fra useProduct), onScanSuccess
// (lookupProduct fra App.jsx via ref for at undgå TDZ-problemer).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.jsx";

export function useScanner({ setScanError, setLoading, onScanSuccess, accessToken }) {
  // ── Kamera-state ──────────────────────────────────────────────────────────
  const [cameraActive, setCameraActive]       = useState(false);
  const [torchOn, setTorchOn]                 = useState(false);
  const [scanZoom, setScanZoom]               = useState(1.0);
  const [showPhotoHint, setShowPhotoHint]     = useState(false);
  const [photoScanLoading, setPhotoScanLoading] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const html5QrRef      = useRef(null);
  const torchTrackRef   = useRef(null);
  const lastScannedRef  = useRef(null);
  const scanZoomRef     = useRef(1.0);
  const noScanTimerRef  = useRef(null);
  const galleryInputRef = useRef(null);
  const photoFallbackRef = useRef(null);

  // onScanSuccess gemmes i ref for at undgå TDZ-problemer
  // (lookupProduct defineres efter useScanner initialiseres i App.jsx)
  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);

  // ── stopCamera ─────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (noScanTimerRef.current) { clearTimeout(noScanTimerRef.current); noScanTimerRef.current = null; }
    if (html5QrRef.current) { html5QrRef.current.stop().catch(() => {}); html5QrRef.current = null; }
    if (torchTrackRef.current) {
      try { torchTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }); } catch {}
      torchTrackRef.current = null;
    }
    setCameraActive(false); setTorchOn(false);
  }, []);

  // ── startCamera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (cameraActive) return;
    setScanError(""); setTorchOn(false); setScanZoom(1.0); scanZoomRef.current = 1.0; setShowPhotoHint(false);
    if (noScanTimerRef.current) { clearTimeout(noScanTimerRef.current); noScanTimerRef.current = null; }
    torchTrackRef.current = null; lastScannedRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Kamera ikke understøttet. Prøv Chrome eller Safari."); return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const constraints = isIOS
      ? { video: { facingMode: { exact: "environment" } } }
      : { video: { facingMode: "environment", width: { min: 1280, ideal: 1920 }, height: { min: 720, ideal: 1080 },
          advanced: [{ focusMode: "continuous" }, { exposureMode: "continuous" }] } };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      if (track) torchTrackRef.current = track;
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setScanError("Kamera-adgang nægtet. Gå til telefonens indstillinger og tillad kamera for denne app.");
      } else if (e.name === "NotFoundError") {
        setScanError("Intet kamera fundet på denne enhed.");
      } else if (e.name === "OverconstrainedError" && isIOS) {
        try { const s2 = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); s2.getTracks().forEach(t => t.stop()); }
        catch { setScanError("Kunne ikke starte kamera. Prøv at genindlæse siden."); return; }
      } else { setScanError("Kamera fejl: " + e.message); return; }
    }

    setCameraActive(true);
    await new Promise(r => setTimeout(r, isIOS ? 300 : 150));

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const readerId = "qr-reader-home";
      if (html5QrRef.current) { try { await html5QrRef.current.stop(); } catch {} html5QrRef.current = null; }
      const readerEl = document.getElementById(readerId);
      if (!readerEl) { setScanError("Kamera-element ikke fundet. Genindlæs siden."); setCameraActive(false); return; }

      html5QrRef.current = new Html5Qrcode(readerId, { verbose: false });

      // Kun stregkode-formater (hurtigere decode)
      const barcodeFormats = [3, 5, 8, 9, 10, 14, 15]; // CODE_39, CODE_128, ITF, EAN_13, EAN_8, UPC_A, UPC_E

      const qrConfig = {
        fps: isIOS ? 25 : 24,
        qrbox: (w, h) => ({
          width:  Math.round(w * 0.92),
          height: Math.round(h * 0.55),
        }),
        aspectRatio: undefined,
        disableFlip: false,
        formatsToSupport: barcodeFormats,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        videoConstraints: isIOS
          ? { facingMode: { exact: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
      };

      await html5QrRef.current.start(
        { facingMode: isIOS ? { exact: "environment" } : "environment" }, qrConfig,
        (code) => {
          const now = Date.now();
          if (lastScannedRef.current?.code === code && now - lastScannedRef.current.time < 1500) return;
          lastScannedRef.current = { code, time: now };
          // Vibration + lyd
          if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 1800; gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
          } catch {}
          stopCamera();
          onScanSuccessRef.current?.(code);
        },
        () => {}
      );

      await new Promise(r => setTimeout(r, 500));
      const videoEl = document.querySelector("#qr-reader-home video");
      if (videoEl?.srcObject) {
        const track = videoEl.srcObject.getVideoTracks()[0];
        if (track) {
          torchTrackRef.current = track;
          try {
            const caps = track.getCapabilities?.() || {};
            const adv = [];
            if (caps.focusMode?.includes("continuous"))       adv.push({ focusMode: "continuous" });
            if (caps.exposureMode?.includes("continuous"))    adv.push({ exposureMode: "continuous" });
            if (caps.whiteBalanceMode?.includes("continuous")) adv.push({ whiteBalanceMode: "continuous" });
            if (caps.focusDistance)                           adv.push({ focusDistance: caps.focusDistance.min });
            if (adv.length) await track.applyConstraints({ advanced: adv });
          } catch (e) { console.warn("Camera constraints fejlede:", e); }

          // Auto-zoom efter 3s/7s
          const applyZoom = async (zoomLevel) => {
            try {
              const caps = track.getCapabilities?.() || {};
              if (caps.zoom && caps.zoom.max >= zoomLevel) {
                await track.applyConstraints({ advanced: [{ zoom: zoomLevel }] });
                scanZoomRef.current = zoomLevel;
                setScanZoom(zoomLevel);
              }
            } catch {}
          };

          setTimeout(() => setShowPhotoHint(true), 5000);
          noScanTimerRef.current = setTimeout(async () => {
            if (scanZoomRef.current === 1.0) await applyZoom(1.5);
            noScanTimerRef.current = setTimeout(async () => {
              if (scanZoomRef.current === 1.5) await applyZoom(2.0);
            }, 4000);
          }, 3000);

          // Tap-to-focus
          videoEl.onclick = async (ev) => {
            try {
              const caps = track.getCapabilities?.() || {};
              if (caps.focusMode?.includes("manual") && caps.pointsOfInterest !== undefined) {
                const rect = videoEl.getBoundingClientRect();
                const x = (ev.clientX - rect.left) / rect.width;
                const y = (ev.clientY - rect.top) / rect.height;
                await track.applyConstraints({ advanced: [{ pointsOfInterest: [{ x, y }], focusMode: "single-shot" }] });
                setTimeout(() => track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(() => {}), 1500);
              }
            } catch {}
          };
        }
      }
    } catch (e) {
      setCameraActive(false);
      if (e.message?.includes("constraint") || e.message?.includes("Constraint")) setTimeout(() => startCamera(), 500);
      else setScanError("Kamera kunne ikke starte. Prøv at lukke andre apps og prøv igen.");
    }
  }, [cameraActive, setScanError, stopCamera]);

  // ── scanFromGallery ────────────────────────────────────────────────────────
  const scanFromGallery = useCallback(async (file) => {
    if (!file) return;
    setScanError(""); setLoading(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader-gallery");
      const result = await scanner.scanFile(file, true);
      scanner.clear();
      onScanSuccessRef.current?.(result);
    } catch {
      setLoading(false);
      setScanError("Ingen stregkode fundet i billedet. Prøv et klarere billede.");
    }
  }, [setScanError, setLoading]);

  // ── scanPhotoForEan — foto-fallback via Claude Vision ─────────────────────
  const scanPhotoForEan = useCallback(async (file) => {
    if (!file) return;
    setPhotoScanLoading(true); setScanError(""); setShowPhotoHint(false);
    stopCamera();
    try {
      // Trin 1: prøv html5-qrcode direkte
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("qr-reader-gallery");
        const result = await scanner.scanFile(file, true);
        scanner.clear();
        setPhotoScanLoading(false);
        onScanSuccessRef.current?.(result);
        return;
      } catch { /* html5-qrcode fejlede — prøv Claude Vision */ }

      // Trin 2: Claude Vision via OCR Edge Function
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      const ocrRes = await fetch(`${SUPABASE_URL}/functions/v1/ocr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ image_base64: base64, mode: "ean_from_image" }),
      });

      const ocrData = await ocrRes.json();
      const rawText = ocrData.text || ocrData.ean || "";
      const eanMatch = rawText.match(/(\d{8,14})/);
      if (eanMatch) {
        setPhotoScanLoading(false);
        onScanSuccessRef.current?.(eanMatch[1]);
        return;
      }

      setScanError("Kunne ikke aflæse stregkode fra billede. Prøv tæt på og i god belysning.");
    } catch {
      setScanError("Foto-scan fejlede. Prøv igen.");
    }
    setPhotoScanLoading(false);
  }, [setScanError, stopCamera, accessToken]);

  // ── toggleTorch ────────────────────────────────────────────────────────────
  const toggleTorch = useCallback(async () => {
    try {
      const videoEl = document.querySelector("#qr-reader-home video");
      const track = videoEl?.srcObject?.getVideoTracks?.()?.[0] || torchTrackRef.current;
      if (!track) return;
      const capabilities = track.getCapabilities?.();
      if (!capabilities?.torch) { setScanError("Lygte ikke understøttet på denne enhed."); return; }
      const newState = !torchOn;
      await track.applyConstraints({ advanced: [{ torch: newState }] });
      setTorchOn(newState);
    } catch (e) { setScanError("Kunne ikke tænde lygte: " + e.message); }
  }, [torchOn, setScanError]);

  // ── Ryd op ved unmount ─────────────────────────────────────────────────────
  useEffect(() => () => stopCamera(), []);

  return {
    // State
    cameraActive, setCameraActive,
    torchOn, setTorchOn,
    scanZoom, setScanZoom,
    showPhotoHint, setShowPhotoHint,
    photoScanLoading,
    // Refs (sendes direkte til ScannerScreen som input-refs)
    galleryInputRef,
    photoFallbackRef,
    lastScannedRef,
    // Funktioner
    startCamera,
    stopCamera,
    scanFromGallery,
    scanPhotoForEan,
    toggleTorch,
  };
}
