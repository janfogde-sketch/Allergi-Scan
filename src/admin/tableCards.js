// @ts-check
// Tabeller bliver til kort på mobil (13. okt. 2026): hver celle får sin kolonneoverskrift som data-label, og CSS (adminTheme.js) viser rækken som et kort
// med "overskrift: værdi". Én fælles løsning for alle admin-tabeller i stedet for en særskilt mobilvisning pr. side. Tabeller med data-no-cards beholdes.
export function labelTableCells(/** @type {ParentNode} */ root) {
  const tables = root.querySelectorAll("table.admin-table:not([data-no-cards])");
  tables.forEach((table) => {
    const heads = Array.from(table.querySelectorAll("thead th")).map((th) => (th.textContent || "").trim());
    table.querySelectorAll("tbody tr").forEach((tr) => {
      Array.from(tr.children).forEach((td, i) => {
        if (!(td instanceof HTMLElement)) return;
        const label = heads[i] || "";
        if (label) { if (td.dataset.label !== label) td.dataset.label = label; }
        else if (td.dataset.label) delete td.dataset.label;
      });
    });
  });
}

/** Holder cellernes labels opdateret, mens indholdet ændrer sig. Returnerer en funktion, der stopper iagttagelsen. */
export function watchTableCells(/** @type {HTMLElement} */ root) {
  let queued = false;
  const run = () => { queued = false; labelTableCells(root); };
  const schedule = () => { if (!queued) { queued = true; (typeof requestAnimationFrame === "function" ? requestAnimationFrame : (f) => setTimeout(f, 0))(run); } };
  labelTableCells(root);
  const mo = new MutationObserver(schedule);
  mo.observe(root, { childList: true, subtree: true });
  return () => mo.disconnect();
}
