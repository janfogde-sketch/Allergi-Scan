// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// useScanner.js
// Al kamera- og scan-logik: start/stop kamera, gallery-scan, foto-fallback,
// 2×-zoom på knap, tap-to-focus, lommelygte.
//
// Afhænger af: setScanError, setLoading (fra useProduct), onScanSuccess
// (lookupProduct fra App.jsx via ref for at undgå TDZ-problemer).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";
import { SUPABASE_URL } from "./constants.jsx";
import { compressImageToBase64, isValidEanChecksum, normalizeScannedBarcode, apiCall, makeHeaders } from "./helpers.js";
import { reportError } from "./errorReporter.js";

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
  const [zoomSupported, setZoomSupported]     = useState(false);
  const [showPhotoHint, setShowPhotoHint]     = useState(false);
  const [photoScanLoading, setPhotoScanLoading] = useState(false);
  // Sandt specifikt når getUserMedia fejlede med NotAllowedError/
  // PermissionDeniedError (28. sept. 2026, FINAL POLISH – SCANNER, krav 9)
  // — adskilt fra den generiske `scanError`-tekst, så ScannerScreen.jsx kan
  // vise en tydelig, dedikeret "kameraadgang slået fra"-tilstand med egne
  // handlinger (Billede/Indtast EAN) i stedet for bare et lille rødt banner
  // under et ellers misvisende, stadig-klikbart "Scan produkt"-forsøg.
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

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
  const rotatedLoopRef   = useRef(null);

  // onScanSuccess gemmes i ref for at undgå TDZ-problemer
  // (lookupProduct defineres efter useScanner initialiseres i App.jsx)
  const onScanSuccessRef = useRef(onScanSuccess);
  useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);

  // ── stopCamera ─────────────────────────────────────────────────────────────
  // Fuld nulstilling af al midlertidig scanner-state (28. sept. 2026,
  // BUGFIX – scanner state) — ikke kun kamera-hardwaren selv. Ramte
  // tidligere kun cameraActive/torchOn/scanReady, så zoom-niveau, en evt.
  // fejlbesked og "kan den ikke scannes?"-hintet kunne overleve et
  // kamera-luk og stå tilbage som forældet state. `photoScanLoading`
  // røres BEVIDST IKKE her — scanFromGallery/scanPhotoForEan sætter den
  // til `true` og kalder derefter selv stopCamera() som et undertrin,
  // mens billedet stadig behandles; at nulstille den her ville afbryde
  // deres egen loading-indikator på samme tick.
  const stopCamera = useCallback(() => {
    if (noScanTimerRef.current) { clearTimeout(noScanTimerRef.current); noScanTimerRef.current = null; }
    if (rotatedLoopRef.current) { clearInterval(rotatedLoopRef.current); rotatedLoopRef.current = null; }
    if (html5QrRef.current) { html5QrRef.current.stop().catch(() => {}); html5QrRef.current = null; }
    if (torchTrackRef.current) {
      try { torchTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {}); } catch {}
      torchTrackRef.current = null;
    }
    scanZoomRef.current = 1.0;
    setCameraActive(false); setTorchOn(false); setScanReady(false);
    setScanZoom(1.0); setZoomSupported(false); setShowPhotoHint(false); setScanError("");
  }, [setScanError]);

  // ── Afkodning i alle retninger ──────────────────────────────────────────────
  // html5-qrcode afkoder kun vandrette koder (og iOS Safari har ingen BarcodeDetector). ZXings
  // egen TRY_HARDER-rotation virker ikke på canvas-kilder (målt: 90°/270° fejler), så billedet
  // tegnes selv drejet 0°/90°/45°/135° på skift (én vinkel pr. tick, så hver tick er let).
  // ZXing tåler ca. ±20° pr. vinkel og læser også på hovedet, så alle retninger er dækket.
  const startRotatedDecodeLoop = useCallback(async (videoEl) => {
    if (typeof window === "undefined" || !videoEl) return;
    const Z = await import("@zxing/library");
    if (!html5QrRef.current) return; // kameraet blev lukket imens biblioteket hentedes
    const hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [
      Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E,
      Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.CODE_39, Z.BarcodeFormat.ITF,
    ]);
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    const reader = new Z.MultiFormatReader();
    reader.setHints(hints);
    const frame = document.createElement("canvas");
    const frameCtx = frame.getContext("2d", { willReadFrequently: true });
    const rot = document.createElement("canvas");
    const rotCtx = rot.getContext("2d", { willReadFrequently: true });
    const angles = [90, 45, 90, 135]; // 0° (og 180°) afkodes allerede af html5-qrcode
    let step = 0;
    let busy = false;
    rotatedLoopRef.current = setInterval(() => {
      if (busy || !videoEl.videoWidth || !videoEl.videoHeight) return;
      busy = true;
      try {
        const scale = Math.min(1, 800 / Math.max(videoEl.videoWidth, videoEl.videoHeight));
        const w = Math.round(videoEl.videoWidth * scale), h = Math.round(videoEl.videoHeight * scale);
        frame.width = w; frame.height = h;
        frameCtx.drawImage(videoEl, 0, 0, w, h);
        const deg = angles[step++ % angles.length];
        if (deg === 0) { rot.width = w; rot.height = h; }
        else if (deg === 90) { rot.width = h; rot.height = w; }
        else { rot.width = rot.height = Math.ceil(Math.hypot(w, h)); }
        rotCtx.fillStyle = "#888";
        rotCtx.fillRect(0, 0, rot.width, rot.height);
        rotCtx.translate(rot.width / 2, rot.height / 2);
        rotCtx.rotate(deg * Math.PI / 180);
        rotCtx.drawImage(frame, -w / 2, -h / 2);
        rotCtx.setTransform(1, 0, 0, 1, 0, 0);
        const bitmap = new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(rot)));
        const result = reader.decode(bitmap);
        const code = normalizeScannedBarcode(result.getText(), Z.BarcodeFormat[result.getBarcodeFormat()]);
        if (!code || !rotatedLoopRef.current) return;
        if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
        stopCamera();
        onScanSuccessRef.current?.(code);
      } catch { /* ingen kode i denne vinkel */ }
      finally { busy = false; }
    }, 50);
  }, [stopCamera]);

  // ── startCamera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    // cameraActive opdateres asynkront af React, så et hurtigt dobbelt-tap kan nå at
    // kalde startCamera igen før første kald har sat state — startingRef lukker det hul
    if (cameraActive || startingRef.current) return;
    startingRef.current = true;
    setScanError(""); setTorchOn(false); setScanZoom(1.0); scanZoomRef.current = 1.0; setShowPhotoHint(false); setScanReady(false); setCameraPermissionDenied(false);
    if (noScanTimerRef.current) { clearTimeout(noScanTimerRef.current); noScanTimerRef.current = null; }
    torchTrackRef.current = null; lastScannedRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError("Kamera ikke understøttet. Prøv Chrome eller Safari."); startingRef.current = false; return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const constraints = isIOS
      ? { video: { facingMode: { exact: "environment" } } }
      : { video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 },
          advanced: [{ focusMode: "continuous" }, { exposureMode: "continuous" }] } };

    try {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      if (track) torchTrackRef.current = track;
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setCameraPermissionDenied(true);
        setScanError("Kameraadgang er slået fra. Tillad kameraadgang for at scanne stregkoder.");
        return;
      } else if (e.name === "NotFoundError") {
        setScanError("Intet kamera fundet på denne enhed.");
        return;
      } else if (e.name === "OverconstrainedError" && isIOS) {
        try { const s2 = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); s2.getTracks().forEach(t => t.stop()); }
        catch { setScanError("Kunne ikke starte kamera. Prøv at genindlæse siden."); return; }
      } else { reportError(e, { source: "camera-start" }); setScanError("Kameraet kunne ikke startes. Prøv igen."); return; }
    }

    setCameraActive(true);
    await new Promise(r => setTimeout(r, isIOS ? 300 : 150));

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const readerId = "qr-reader-home";
      if (html5QrRef.current) { try { await html5QrRef.current.stop(); } catch {} html5QrRef.current = null; }
      const readerEl = document.getElementById(readerId);
      if (!readerEl) { setScanError("Kameraet kunne ikke vises. Genindlæs siden."); setCameraActive(false); return; }

      // formatsToSupport og experimentalFeatures er KONSTRUKTØR-config i html5-qrcode;
      // som del af start()-config blev de ignoreret (RSS-formaterne var aldrig slået til).
      html5QrRef.current = new Html5Qrcode(readerId, {
        verbose: false,
        formatsToSupport: [3, 5, 8, 9, 10, 12, 13, 14, 15], // CODE_39, CODE_128, ITF, EAN_13, EAN_8, RSS_14, RSS_EXPANDED, UPC_A, UPC_E
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      });

      const qrConfig = {
        fps: isIOS ? 12 : 20, // lavere fps på iOS: html5-qrcodes afkodning deler tråd med rotationsløkken
        // Hele kamerabilledet afkodes (ikke kun et udsnit), så koden kan sidde hvor som helst i billedet.
        qrbox: (w, h) => ({ width: w, height: h }),
        aspectRatio: undefined,
        disableFlip: false,
        videoConstraints: isIOS
          ? { facingMode: { exact: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
      };

      await html5QrRef.current.start(
        { facingMode: isIOS ? { exact: "environment" } : "environment" }, qrConfig,
        (rawCode, decoded) => {
          // Kameraet er allerede stoppet (en kode er under behandling):
          // ignorér sene afkodninger, så samme scanning ikke sendes to gange.
          if (!html5QrRef.current) return;
          // Ugyldig/garblet afkodning ignoreres stille og scanningen
          // fortsætter (28. sept. 2026, FINAL POLISH – SCANNER, krav 12) —
          // et enkelt fejlaflæst frame er normalt og forbigående, så et
          // afbrydende fejlbanner ville være mere distraherende end
          // hjælpsomt her (i modsætning til manuel EAN-indtastning, hvor
          // samme validering VISER en fejltekst, se ScannerScreen.jsx).
          const code = normalizeScannedBarcode(rawCode, decoded?.result?.format?.formatName);
          if (!code) return;
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
            if (adv.length) await track.applyConstraints({ advanced: adv });
          } catch (e) { console.warn("Camera constraints fejlede:", e); }

          // Ingen automatisk zoom (Bjørn, 8. okt. 2026): brugeren slår selv
          // 2× til og fra med toggleZoom. Knappen vises kun, hvis kameraet
          // understøtter zoom på mindst 2×.
          try {
            const caps = track.getCapabilities?.() || {};
            setZoomSupported(!!(caps.zoom && caps.zoom.max >= 2));
          } catch { setZoomSupported(false); }

          // Hjælpeteksten efter 5 s; timeren ryddes i stopCamera, så den ikke
          // dukker op efter en vellykket scanning.
          noScanTimerRef.current = setTimeout(() => setShowPhotoHint(true), 5000);

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
      startRotatedDecodeLoop(videoEl).catch(() => {});
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
  }, [cameraActive, setScanError, stopCamera, startRotatedDecodeLoop]);

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
      setScanError("Vi kunne ikke finde en tydelig stregkode på billedet. Prøv et andet billede eller indtast EAN manuelt.");
    } catch {
      setLoading(false);
      setScanError("Billedet kunne ikke læses. Prøv igen.");
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
      setScanError("Vi kunne ikke finde en tydelig stregkode på billedet. Prøv et andet billede eller indtast EAN manuelt.");
    } catch {
      setPhotoScanLoading(false);
      setScanError("Billedet kunne ikke læses. Prøv igen.");
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
    } catch (e) { reportError(e, { source: "camera-torch" }); setScanError("Lygten kunne ikke tændes."); }
  }, [torchOn, setScanError]);

  // ── toggleZoom (1× ↔ 2×, kun når brugeren trykker) ──────────────────────
  const toggleZoom = useCallback(async () => {
    try {
      const videoEl = document.querySelector("#qr-reader-home video");
      const track = videoEl?.srcObject?.getVideoTracks?.()?.[0] || torchTrackRef.current;
      if (!track) return;
      const caps = track.getCapabilities?.() || {};
      if (!caps.zoom || caps.zoom.max < 2) return;
      const next = scanZoomRef.current >= 2 ? Math.max(1, caps.zoom.min || 1) : 2;
      await track.applyConstraints({ advanced: [{ zoom: next }] });
      scanZoomRef.current = next;
      setScanZoom(next);
    } catch (e) { reportError(e, { source: "camera-zoom" }); }
  }, []);

  // ── Ryd op ved unmount ─────────────────────────────────────────────────────
  useEffect(() => () => stopCamera(), []);

  return {
    // State
    cameraActive, setCameraActive,
    scanReady,
    torchOn, setTorchOn,
    scanZoom, setScanZoom,
    zoomSupported,
    showPhotoHint, setShowPhotoHint,
    photoScanLoading,
    cameraPermissionDenied,
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
    toggleZoom,
  };
}
