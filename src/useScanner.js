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
import { createBarcodeReader, decodeRotated, decodeBarcodeFile } from "./barcodeDecode.js";

// ── Delt to-trins stregkode-afkodning fra et billede ──────────────────────
// Trin 1: ZXing (gratis, ren billed-afkodning i alle retninger). Trin 2, kun
// hvis trin 1 fejler: Claude Vision OCR-fallback. Bruges af både galleri-valgt
// billede (scanFromGallery) og foto taget efter mislykket live-scan
// (scanPhotoForEan). Returnerer den fundne, checksum-validerede EAN,
// eller null hvis begge trin fejler.
async function decodeBarcodeFromImage(file, accessToken) {
  try {
    const code = await decodeBarcodeFile(file);
    if (code) return code;
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
  // scanReady: true først når videoen reelt kører
  // (video.play()'s promise er løst) — IKKE bare når cameraActive er sat,
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
  const cameraRef       = useRef(null); // { stop() } for det kørende kamera
  const torchTrackRef   = useRef(null);
  const lastScannedRef  = useRef(null);
  const scanZoomRef     = useRef(1.0);
  const noScanTimerRef  = useRef(null);
  const scanPausedRef   = useRef(false); // sand mens manuel indtastning er åben: kameraet står stille, og fund ignoreres
  const galleryInputRef = useRef(null);
  const photoFallbackRef = useRef(null);
  const startingRef      = useRef(false); // låser mod dobbelt-tap mens kameraet starter op
  const startRetriesRef  = useRef(0);
  const decodeLoopRef    = useRef(null);

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
    if (decodeLoopRef.current) { clearInterval(decodeLoopRef.current); decodeLoopRef.current = null; }
    if (cameraRef.current) { cameraRef.current.stop(); cameraRef.current = null; }
    if (torchTrackRef.current) {
      try { torchTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {}); } catch {}
      torchTrackRef.current = null;
    }
    scanZoomRef.current = 1.0;
    scanPausedRef.current = false;
    setCameraActive(false); setTorchOn(false); setScanReady(false);
    setScanZoom(1.0); setZoomSupported(false); setShowPhotoHint(false); setScanError("");
  }, [setScanError]);

  // ── Afkodning i alle retninger ──────────────────────────────────────────────
  // Billedet fra videoen tegnes selv drejet 0°/90°/45°/135° på skift (én vinkel pr. tick, så hver tick er let;
  // 0° får hver anden tick, da de fleste koder sidder vandret). Hvor browseren har BarcodeDetector (Chrome på
  // Android), bruges den til 0°; iOS Safari har ingen og bruger ZXing til alle vinkler.
  const startDecodeLoop = useCallback(async (videoEl) => {
    if (typeof window === "undefined" || !videoEl) return;
    const dec = await createBarcodeReader();
    if (!cameraRef.current) return; // kameraet blev lukket imens biblioteket hentedes
    let detector = null;
    try {
      if ("BarcodeDetector" in window) {
        detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"] });
      }
    } catch { detector = null; }
    const frame = document.createElement("canvas");
    const frameCtx = frame.getContext("2d", { willReadFrequently: true });
    const rot = document.createElement("canvas");
    const rotCtx = rot.getContext("2d", { willReadFrequently: true });
    const angles = [0, 90, 0, 45, 0, 135];
    let step = 0;
    let busy = false;
    const found = (code) => {
      if (!code || !decodeLoopRef.current || scanPausedRef.current) return;
      const now = Date.now();
      if (lastScannedRef.current?.code === code && now - lastScannedRef.current.time < 1500) return;
      lastScannedRef.current = { code, time: now };
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
    };
    decodeLoopRef.current = setInterval(async () => {
      if (busy || scanPausedRef.current || !videoEl.videoWidth || !videoEl.videoHeight) return;
      busy = true;
      try {
        const deg = angles[step++ % angles.length];
        if (deg === 0 && detector) {
          const hits = await detector.detect(videoEl);
          for (const hit of hits) {
            const code = normalizeScannedBarcode(hit.rawValue, String(hit.format || "").toUpperCase());
            if (code) { found(code); break; }
          }
          return;
        }
        const scale = Math.min(1, 800 / Math.max(videoEl.videoWidth, videoEl.videoHeight));
        const w = Math.round(videoEl.videoWidth * scale), h = Math.round(videoEl.videoHeight * scale);
        frame.width = w; frame.height = h;
        frameCtx.drawImage(videoEl, 0, 0, w, h);
        found(decodeRotated(dec, frame, w, h, deg, rot, rotCtx));
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
      const readerEl = document.getElementById("qr-reader-home");
      if (!readerEl) { setScanError("Kameraet kunne ikke vises. Genindlæs siden."); setCameraActive(false); return; }
      if (cameraRef.current) { cameraRef.current.stop(); cameraRef.current = null; }
      readerEl.innerHTML = "";

      const videoConstraints = isIOS
        ? { facingMode: { exact: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } };
      const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
      const videoNode = document.createElement("video");
      videoNode.setAttribute("playsinline", "true"); // iOS Safari kræver playsinline for at undgå fuldskærm
      videoNode.setAttribute("muted", "true");
      videoNode.muted = true;
      videoNode.autoplay = true;
      videoNode.srcObject = stream;
      readerEl.appendChild(videoNode);
      cameraRef.current = {
        stop: () => {
          stream.getTracks().forEach(t => t.stop());
          try { videoNode.pause(); } catch {}
          videoNode.srcObject = null;
          videoNode.remove();
        },
      };
      await videoNode.play();

      // Videoen kører — kameraet er reelt i gang, så scanner-laserlinjen må gerne vises fra nu af.
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
      startDecodeLoop(videoEl).catch(() => {});
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
  }, [cameraActive, setScanError, stopCamera, startDecodeLoop]);

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

  // ── scanPhotoForEan — foto-fallback via ZXing + Claude Vision ──────
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
  // Pause/genoptag under manuel indtastning (Bjørn, 8. okt. 2026). Videoen fryses direkte, og afkodningen ignoreres, så intet registreres bag arket.
  const pauseCamera = useCallback(() => {
    if (!cameraRef.current) return;
    scanPausedRef.current = true;
    try { document.querySelector("#qr-reader-home video")?.pause(); } catch { /* ignoreres */ }
  }, []);
  const resumeCamera = useCallback(() => {
    if (!scanPausedRef.current) return;
    scanPausedRef.current = false;
    try { document.querySelector("#qr-reader-home video")?.play()?.catch?.(() => {}); } catch { /* ignoreres */ }
  }, []);

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
    toggleZoom, pauseCamera, resumeCamera,
  };
}
