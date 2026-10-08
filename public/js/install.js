// iPadOS 13+ udgiver sig for Mac med touch-understøttelse — derfor det ekstra tjek
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

const checking = document.getElementById("checking");
checking.classList.add("hidden");

if (isStandalone) {
  document.getElementById("already-installed").classList.remove("hidden");
} else if (isIOS) {
  document.getElementById("ios-guide").classList.remove("hidden");
} else {
  // Android/Chrome (og alt andet): send videre til selve appen med et
  // markør-parameter — appen fanger browserens "beforeinstallprompt" og
  // viser selv en stor "Installér nu"-knap med det samme (se InstallPrompt.jsx).
  window.location.replace("https://eatsafe.dk/?src=beta-qr");
}
