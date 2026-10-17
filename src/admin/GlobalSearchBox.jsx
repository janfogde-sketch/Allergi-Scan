// @ts-nocheck
// ─────────────────────────────────────────────────────────────────────────────
// GlobalSearchBox.jsx — topbar-søgning på tværs af brugere/produkter/tickets.
// Selvstændig komponent (ikke en fane) så den er tilgængelig uanset hvilken
// sektion admin står på — det er hele pointen med "global" søgning.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from "react";
import { useIsMobile } from "./useIsMobile.js";
import CloseX from "./CloseX.jsx";
import { SearchButton } from "../IconButton.jsx";

export default function GlobalSearchBox({
  globalSearch, setGlobalSearch, globalSearchResults, setGlobalSearchResults, globalSearchLoading, runGlobalSearch,
  setSection, setUserSearch, setProductSearch, loadProducts, localSearch,
}) {
  // localSearch: { value, onChange, placeholder }. På sider med egen søgning (fx Familie) styrer headerens søgefelt den side i stedet for den globale søgning.
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false); // mobil: søgningen åbner som egen visning
  const inputRef = useRef(null);
  useEffect(() => { if (sheetOpen) inputRef.current?.focus(); }, [sheetOpen]);
  useEffect(() => {
    if (!sheetOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setSheetOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  useEffect(() => {
    const onClickOutside = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    runGlobalSearch(globalSearch);
    setOpen(true);
  };

  const goToUser = (u) => {
    setSection("users"); setUserSearch(u.name || u.email || ""); setOpen(false); setSheetOpen(false);
  };
  const goToProduct = (p) => {
    setSection("products"); setProductSearch(p.ean || p.name || ""); loadProducts(p.ean || p.name || ""); setOpen(false); setSheetOpen(false);
  };
  const goToTicket = () => { setSection("tickets"); setOpen(false); setSheetOpen(false); };

  const total = globalSearchResults
    ? globalSearchResults.users.length + globalSearchResults.products.length + globalSearchResults.tickets.length
    : 0;

  const resultsBody = (
    <>
          {globalSearchLoading ? (
            <div className="admin-loading-row"><div className="admin-spinner" /> Søger…</div>
          ) : !globalSearchResults ? (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Skriv og tryk Enter for at søge</div>
          ) : total === 0 ? (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Ingen resultater for "{globalSearch}"</div>
          ) : (
            <>
              {globalSearchResults.users.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Brugere</div>
                  {globalSearchResults.users.map(u => (
                    <div key={u.id} onClick={() => goToUser(u)} style={{ padding: "6px 4px", cursor: "pointer", fontSize: 13, borderRadius: 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {u.name || "Ingen navn"} <span style={{ color: "var(--muted)" }}>({u.email})</span>
                    </div>
                  ))}
                </div>
              )}
              {globalSearchResults.products.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Produkter</div>
                  {globalSearchResults.products.map(p => (
                    <div key={p.id} onClick={() => goToProduct(p)} style={{ padding: "6px 4px", cursor: "pointer", fontSize: 13, borderRadius: 6 }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {p.name || "Ukendt"}{p.brand ? ` — ${p.brand}` : ""} <span style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>{p.ean}</span>
                    </div>
                  ))}
                </div>
              )}
              {globalSearchResults.tickets.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Tickets</div>
                  {globalSearchResults.tickets.map(t => (
                    <div key={t.id} onClick={goToTicket} style={{ padding: "6px 4px", cursor: "pointer", fontSize: 13, borderRadius: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {t.description}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <SearchButton label="Søg i admin" onClick={() => setSheetOpen(true)} />
        {sheetOpen && (
          <div className="admin-search-sheet" role="dialog" aria-modal="true" aria-label="Søg i admin">
            <div className="admin-search-sheet-bar">
              <form onSubmit={(e) => { e.preventDefault(); if (localSearch) { e.target.querySelector("input")?.blur(); setSheetOpen(false); } else runGlobalSearch(globalSearch); }}>
                {localSearch ? (
                  <input ref={inputRef} className="admin-search" type="search" style={{ width: "100%" }} placeholder={localSearch.placeholder} enterKeyHint="search"
                    value={localSearch.value} onChange={e => localSearch.onChange(e.target.value)} />
                ) : (
                  <input ref={inputRef} className="admin-search" style={{ width: "100%" }} placeholder="Søg brugere, produkter, tickets…" enterKeyHint="search"
                    value={globalSearch}
                    onChange={e => { setGlobalSearch(e.target.value); if (!e.target.value.trim()) setGlobalSearchResults(null); }} />
                )}
              </form>
              <CloseX inline onClick={() => setSheetOpen(false)} />
            </div>
            <div className="admin-search-sheet-body">{localSearch ? <div style={{ fontSize: 12, color: "var(--muted)" }}>{localSearch.value.trim() ? "Resultaterne vises på siden, når du lukker søgningen." : "Skriv for at søge på denne side."}</div> : resultsBody}</div>
          </div>
        )}
      </>
    );
  }

  return (
    <div ref={boxRef} style={{ position: "relative", width: 320 }}>
      <form onSubmit={localSearch ? (e) => e.preventDefault() : submit}>
        {localSearch ? (
          <input className="admin-search" type="search" placeholder={localSearch.placeholder} style={{ width: "100%" }} value={localSearch.value} onChange={e => localSearch.onChange(e.target.value)} />
        ) : (
          <input className="admin-search" placeholder="Søg brugere, produkter, tickets…" style={{ width: "100%" }}
            value={globalSearch}
            onChange={e => { setGlobalSearch(e.target.value); if (!e.target.value.trim()) setGlobalSearchResults(null); }}
            onFocus={() => { if (globalSearchResults) setOpen(true); }} />
        )}
      </form>
      {open && !localSearch && (
        <div className="admin-modal" style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 380, maxHeight: 420, overflowY: "auto", padding: 12, zIndex: 50 }}>
          {resultsBody}
        </div>
      )}
    </div>
  );
}
