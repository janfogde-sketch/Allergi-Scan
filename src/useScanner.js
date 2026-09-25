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
import { SUPABASE_URL } from "./constants.jsx";
import { compressImageToBase64, isValidEanChecksum, apiCall, makeHeaders } from "./helpers.js";

// ── Delt to-trins stregkode-afkodning fra et billede ──────────────────────
// Trin 1: html5-qrcode (hurtig, gratis, ren billed-afkodning). Trin 2, kun
// hvis trin 1 fejler: Claude Vision OCR-fallback (samme model som scanPhotoForEan
// altid har brugt). Udtrukket 25. sept. 2026 — scanFromGallery (galleri-valgt
// billede) havde tidligere KUN trin 1, mens scanPhotoForEan (foto taget efter
// mislykket live-scan) havde begge. Et galleri-billede hvor html5-qrcode ikke
// kunne afkode koden fik derfor aldrig en chance for OCR-genopretning — en
// ubegrundet inkonsistens mellem to reelt ligeværdige indgange, ikke en
// bevidst designbeslutning. Returnerer den fundne, checksum-validerede EAN,
// eller null hvis begge trin fejler.
async function decodeBarcodeFromImage(file, accessToken) {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader-gallery");
    const result = await scanner.scanFile(file, true);
    scanner.clear();
    return result;
  } catch { /* fald igennem til Vision-OCR */ }

  try {
    const base64 = await compressImageToBase64(file);
    const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, {
      method: "POST",
      headers: makeHeaders(accessToken),
      body: JSON.stringify({ image_base64: base64, mode: "ean_from_image" }),
    });
    const rawText = ocrData.text || ocrData.ean || "";
    // Vision-OCR kan fejllæse et enkelt ciffer, så tjek EAN-checksummen før vi
    // bruger tallet — ellers risikerer vi et opslag på et forkert (men
    // tilfældigt eksisterende) produkt.
    const candidates = rawText.match(/\d{8,14}/g) || [];
    return candidates.find(isValidEanChecksum) || null;
  } catch {
    return null;
  }
}

export function useScanner({ setScanError, setLoading, onScanSuccess, accessToken }) {
  // ── Kamera-state ──────────────────────────────────────────────────────────
  const [cameraActive, setCameraActive]       = useState(false);
  // scanReady: true først når html5-qrcode reelt er i gang med at afkode billeder
  // (Html5Qrcode.start()'s promise er løst) — IKKE bare når cameraActive er sat,
  // hvilket sker før kamera-streamen reelt er klar. Bruges til at undgå at vise
  // scanner-laserlinjen over et endnu-ikke-levende kamerabillede.
  const [scanReady, setScanReady]             = useState(false);
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
  const startingRef      = useRef(false); // låser mod dobbelt-tap mens kameraet starter op
  const startRetriesRef  = useRef(0);

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
    setCameraActive(false); setTorchOn(false); setScanReady(false);
  }, []);

  // ── startCamera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    // cameraActive opdateres asynkront af React, så et hurtigt dobbelt-tap kan nå at
    // kalde startCamera igen før første kald har sat state — startingRef lukker det hul
    if (cameraActive || startingRef.current) return;
    startingRef.current = true;
    setScanError(""); setTorchOn(false); setScanZoom(1.0); scanZoomRef.current = 1.0; setShowPhotoHint(false); setScanReady(false);
    if (noScanTimerRef.current) { clearTimeout(noScanTimerRef.current); noScanTimerRef.current = null; }
    torchTrackRef.current = null; lastScannedRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Kamera ikke understøttet. Prøv Chrome eller Safari."); startingRef.current = false; return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const constraints = isIOS
      ? { video: { facingMode: { exact: "environment" } } }
      : { video: { facingMode: "environment", width: { min: 1280, ideal: 1920 }, height: { min: 720, ideal: 1080 },
          advanced: [{ focusMode: "continuous" }, { exposureMode: "continuous" }] } };

    try {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      if (track) torchTrackRef.current = track;
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setScanError("Kamera-adgang nægtet. Gå til telefonens indstillinger og tillad kamera for denne app.");
        return;
      } else if (e.name === "NotFoundError") {
        setScanError("Intet kamera fundet på denne enhed.");
        return;
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

      // Kun stregkode-formater (hurtigere decode). Tilføjet RSS_14/RSS_EXPANDED
      // (GS1 DataBar / DataBar Expanded, 25. sept. 2026) — bruges ofte på
      // variabel-vægt-varer i danske supermarkeder (løsvægt-frugt/grønt,
      // slagter-/delikatesse-disk), som appens egne bilka/nemlig-kilder
      // dækker tungt. Uden disse formater afkodede kameraet aldrig sådan et
      // produkts stregkode overhovedet — brugeren endte i foto-/OCR-fallback
      // for noget der reelt burde kunne live-scannes direkte. html5-qrcode
      // har allerede en dokumenteret afbødning for en kendt ZXing-kvirk med
      // RSS_14 (ny decoder-instans pr. scan) — ingen ekstra risiko ved at
      // slå formaterne til.
      const barcodeFormats = [3, 5, 8, 9, 10, 12, 13, 14, 15]; // CODE_39, CODE_128, ITF, EAN_13, EAN_8, RSS_14, RSS_EXPANDED, UPC_A, UPC_E

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

      // .start()'s promise er nu løst — kameraet er reelt i gang med at afkode,
      // så scanner-laserlinjen må gerne vises fra nu af.
      setScanReady(true);

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
      startRetriesRef.current = 0; // kameraet kørte succesfuldt — nulstil retry-tæller
    } catch (e) {
      setCameraActive(false);
      const isConstraintError = e.message?.includes("constraint") || e.message?.includes("Constraint");
      if (isConstraintError && startRetriesRef.current < 3) {
        startRetriesRef.current++;
        setTimeout(() => startCamera(), 500); // finally herunder frigiver låsen inden da
        return;
      }
      startRetriesRef.current = 0;
      setScanError("Kamera kunne ikke starte. Prøv at lukke andre apps og prøv igen.");
    }
    } finally {
      startingRef.current = false;
    }
  }, [cameraActive, setScanError, stopCamera]);

  // ── scanFromGallery ────────────────────────────────────────────────────────
  const scanFromGallery = useCallback(async (file) => {
    if (!file) return;
    setScanError(""); setLoading(true);
    // Galleri-knappen sidder oven på det aktive kamera-view — kameraet skal
    // stoppes her ligesom i scanPhotoForEan, ellers kører det unødigt videre
    // i baggrunden mens billedet behandles.
    stopCamera();
    try {
      const code = await decodeBarcodeFromImage(file, accessToken);
      setLoading(false);
      if (code) { onScanSuccessRef.current?.(code); return; }
      setScanError("Kunne ikke finde en gyldig stregkode i billedet. Prøv et klarere billede eller tættere på.");
    } catch {
      setLoading(false);
      setScanError("Foto-scan fejlede. Prøv igen.");
    }
  }, [setScanError, setLoading, stopCamera, accessToken]);

  // ── scanPhotoForEan — foto-fallback via html5-qrcode + Claude Vision ──────
  const scanPhotoForEan = useCallback(async (file) => {
    if (!file) return;
    setPhotoScanLoading(true); setScanError(""); setShowPhotoHint(false);
    stopCamera();
    try {
      const code = await decodeBarcodeFromImage(file, accessToken);
      setPhotoScanLoading(false);
      if (code) { onScanSuccessRef.current?.(code); return; }
      setScanError("Kunne ikke aflæse en gyldig stregkode fra billede. Prøv tæt på og i god belysning.");
    } catch {
      setPhotoScanLoading(false);
      setScanError("Foto-scan fejlede. Prøv igen.");
    }
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
    scanReady,
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
