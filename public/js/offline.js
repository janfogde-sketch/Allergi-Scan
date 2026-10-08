(function () {
  // Prøv igen genindlæser adressen; er nettet tilbage, åbner appen som normalt.
  document.getElementById('retry').addEventListener('click', function () { location.reload(); });
  // Kommer nettet tilbage af sig selv, genindlæses siden automatisk.
  window.addEventListener('online', function () { location.reload(); });
})();
