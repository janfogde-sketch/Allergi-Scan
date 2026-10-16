// @ts-nocheck
// @vitest-environment jsdom
// Fælles navigation og luk: kryds med navnet "Luk", ens markering overalt, "Tilbage til EatSafe" adskilt fra adminsiderne, ny header og menuhierarki, og advarsel ved ikke-gemte ændringer i de nye lukkeveje.
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import CloseX from "./CloseX.jsx";
import AdminLayout from "./AdminLayout.jsx";
import FeedbackButton from "./FeedbackButton.jsx";

afterEach(cleanup);

describe("CloseX", () => {
  it("er en ikonknap med tilgængelighedsnavnet Luk, uden tekst, og kalder onClick", () => {
    const onClick = vi.fn();
    render(<CloseX onClick={onClick} />);
    const b = screen.getByRole("button", { name: "Luk" });
    expect(b.textContent).toBe("");
    expect(b.className).toContain("admin-iconbtn");
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalled();
  });
  it("trykfladen er mindst 44 × 44 px i stilarket, og ingen admin-modal bruger en tekstknap 'Luk' til navigation", () => {
    const css = readFileSync(join(process.cwd(), "src/admin/adminTheme.js"), "utf8");
    expect(css).toMatch(/\.admin-iconbtn\{[^}]*width:44px;height:44px/);
    const dir = join(process.cwd(), "src/admin");
    const files = [...readdirSync(join(dir, "sections")).filter((f) => f.endsWith(".jsx") && !f.includes(".test.")).map((f) => join(dir, "sections", f)), join(dir, "GlobalSearchBox.jsx"), join(dir, "FeedbackButton.jsx")];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      // en tekstknap hvis eneste tekst er "Luk" i et modalvindue (selvstændige handlinger som 'Luk og åbn igen' er tilladt)
      expect(src, f).not.toMatch(/<button[^>]*admin-btn[^>]*>\s*Luk\s*<\/button>/);
    }
  });
});

describe("AdminLayout: header, hierarki og tilbage til EatSafe", () => {
  const base = { section: "dashboard", setSection: vi.fn(), userEmail: "a@x.dk", userId: "u", accessToken: "t", logout: vi.fn() };
  it("viser logoet og sektionsbetegnelsen 'Administration' (ikke 'Admin')", () => {
    const { container } = render(<AdminLayout {...base}><div /></AdminLayout>);
    const head = container.querySelector(".admin-sidebar-head");
    expect(head.querySelector("img[alt='EatSafe']")).toBeTruthy();
    expect(within(head).getByText("Administration")).toBeTruthy();
    expect(head.textContent).not.toMatch(/\bAdmin\b(?!istration)/);
  });
  it("'Tilbage til EatSafe' er et almindeligt link til appen, adskilt fra menupunkterne, og kræver ingen ny login", () => {
    const { container } = render(<AdminLayout {...base}><div /></AdminLayout>);
    const back = screen.getByRole("link", { name: /Tilbage til EatSafe/ });
    expect(back.getAttribute("href")).toBe("/");
    expect(container.querySelector(".admin-nav").contains(back)).toBe(false);
    expect(back.closest(".admin-sidebar-footer")).toBeTruthy();
  });
  it("hovedgrupper er semibold og mørke, underpunkter normal vægt, og den aktive gruppe er udfoldet med roteret chevron", () => {
    const css = readFileSync(join(process.cwd(), "src/admin/adminTheme.js"), "utf8");
    expect(css).toMatch(/\.admin-nav-group-head\{[^}]*font-weight:600;[^}]*color:var\(--ink\);/);
    expect(css).toMatch(/\.admin-nav-item\{[^}]*font-weight:500;/);
    expect(css).toMatch(/\.admin-nav-chev\.closed\{transform:rotate\(-90deg\);\}/);
    render(<AdminLayout {...base} section="tickets"><div /></AdminLayout>);
    expect(screen.getByRole("button", { name: /Til behandling/ }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: /Tickets/ }).getAttribute("aria-current")).toBe("page");
  });
});

describe("Feedback: lukning med ikke-gemt tekst", () => {
  it("X lukker straks uden tekst, men kræver bekræftelse med tekst", () => {
    render(<FeedbackButton accessToken="t" userId="u" userEmail="a@x.dk" section="dashboard" />);
    fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(screen.queryByText("Send feedback", { selector: "div" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Send feedback/ }));
    fireEvent.change(document.querySelector("textarea"), { target: { value: "En fejl" } });
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(screen.getByRole("alertdialog", { name: "Ikke-gemte ændringer" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Bliv og skriv" }));
    expect(document.querySelector("textarea").value).toBe("En fejl");
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    fireEvent.click(screen.getByRole("button", { name: "Kassér" }));
    expect(document.querySelector("textarea")).toBeNull();
  });
});
