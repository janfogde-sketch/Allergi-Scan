// @ts-nocheck
// @vitest-environment jsdom
// Ensartede ikonknapper i appen og administrationen: samme CSS i begge, samme komponenter og samme størrelse.
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MenuButton, BackButton, SearchButton, RefreshIconButton } from "./IconButton.jsx";
import { CloseButton } from "./Sheets.jsx";
import { iconButtonCss } from "./iconButtonCss.js";
import { adminCss } from "./admin/adminTheme.js";
import { appCss } from "./theme.jsx";

afterEach(cleanup);
const read = (f) => readFileSync(join(process.cwd(), f), "utf8");

describe("fælles ikonknapper", () => {
  it("appens og administrationens stilark indeholder samme ikonknap-CSS", () => {
    expect(adminCss).toContain(iconButtonCss);
    expect(appCss).toContain(iconButtonCss);
  });
  it("hamburger, tilbage, søg og opdatér er runde knapper med navn og kalder onClick; trykfladen er 44 px, cirklen 38 px", () => {
    const fn = vi.fn();
    render(<><MenuButton onClick={fn} /><BackButton onClick={fn} /><SearchButton label="Søg i admin" onClick={fn} /><RefreshIconButton onClick={fn} /></>);
    for (const name of ["Åbn menu", "Tilbage", "Søg i admin", "Opdater"]) {
      const b = screen.getByRole("button", { name });
      expect(b.className).toContain("ibtn");
      expect(b.querySelector(".ibtn-c")).toBeTruthy();
      fireEvent.click(b);
    }
    expect(fn).toHaveBeenCalledTimes(4);
    expect(iconButtonCss).toMatch(/\.ibtn\{[^}]*width:44px;height:44px/);
    expect(iconButtonCss).toMatch(/\.ibtn-c\{[^}]*width:38px;height:38px/);
  });
  it("luk-knappen er den samme i appen og administrationen og hedder Luk", () => {
    const fn = vi.fn();
    render(<CloseButton onClick={fn} />);
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(fn).toHaveBeenCalled();
  });
  it("hamburger og tilbage bruges som fælles komponenter overalt, og de gamle specialknapper er væk", () => {
    expect(read("src/AppHeader.jsx")).toContain("MenuButton");
    expect(read("src/admin/AdminLayout.jsx")).toContain("MenuButton");
    for (const f of ["NotificationScreen", "RecallsListScreen", "TicketScreen", "PrivacyScreen", "TermsScreen"]) {
      expect(read(`src/${f}.jsx`), f).toContain("BackButton");
      expect(read(`src/${f}.jsx`), f).not.toContain("legal-topbar-back");
    }
  });
});
