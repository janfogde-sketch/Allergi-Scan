// Statisk forklaring uden opslag: listenavn og afsender vises først i appen, efter login (kodens indhold er ikke offentligt).
const code = (window.location.pathname.split("/list/")[1] || "").split("/")[0].replace(/[^A-Za-z0-9]/g, "").toUpperCase();
const content = document.getElementById("content");
const icon = '<div class="icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg></div>';
if (!code) {
  content.innerHTML = icon.replace('class="icon"', 'class="icon red"') + '<h1>Ugyldigt link</h1><p>Dette link til en indkøbsliste er ikke gyldigt.</p><a href="https://www.eatsafe.dk" class="btn">Gå til EatSafe</a>';
} else {
  const base = "https://www.eatsafe.dk/?join-list=" + code;
  content.innerHTML = icon +
    '<h1>Nogen vil dele en indkøbsliste med dig</h1>' +
    '<p>Fortsæt i EatSafe for at se, hvilken liste der deles, og hvem der deler den. Du bestemmer selv, om du vil tilslutte dig.</p>' +
    '<ul class="points">' +
      '<li>Hvis du tilslutter, kan du se, tilføje, afkrydse og fjerne varer på listen.</li>' +
      '<li>Kun denne liste deles. Dine allergier og øvrige profiloplysninger deles ikke.</li>' +
      '<li>Du kan når som helst forlade listen igen under Dine lister → Rediger.</li>' +
    '</ul>' +
    '<a href="' + base + '" class="btn">Opret konto</a>' +
    '<a href="' + base + '&login=1" class="btn btn-ghost">Jeg har en konto</a>';
}
