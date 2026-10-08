(function () {
  var ENDPOINT = 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/report-unrequested-reset';
  var token = new URLSearchParams(location.search).get('t') || '';
  var ask = document.getElementById('ask'), done = document.getElementById('done'), bad = document.getElementById('bad');
  var btn = document.getElementById('send');

  function show(el) { ask.hidden = el !== ask; done.hidden = el !== done; bad.hidden = el !== bad; }
  function fail(title, text) {
    document.getElementById('bad-title').textContent = title;
    document.getElementById('bad-text').textContent = text;
    show(bad);
  }

  // Tokenen fjernes fra adresselinjen, så den ikke bliver liggende i historik eller deles ved et skærmbillede
  if (token && window.history && history.replaceState) history.replaceState(null, '', location.pathname);
  if (!token) { fail('Linket virker ikke', 'Linket er ufuldstændigt. Åbn det igen fra mailen.'); return; }

  btn.addEventListener('click', function () {
    btn.disabled = true;
    btn.textContent = 'Sender…';
    document.getElementById('net-err').hidden = true;
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token }) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (b) { return { status: res.status, body: b }; }); })
      .then(function (r) {
        if (r.status === 200 && r.body.ok) { show(done); return; }
        if (r.body.error === 'expired') { fail('Linket er udløbet', 'Linket er mere end 7 dage gammelt og kan ikke bruges længere.'); return; }
        if (r.body.error === 'invalid') { fail('Linket virker ikke', 'Linket er ugyldigt. Åbn det igen fra mailen.'); return; }
        throw new Error('server');
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Ja, giv EatSafe besked';
        document.getElementById('net-err').hidden = false;
      });
  });
})();
