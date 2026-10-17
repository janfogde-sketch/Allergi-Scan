// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import RefreshButton from "./RefreshButton.jsx";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

afterEach(cleanup);

describe("RefreshButton", () => {
  it("er en ikonknap med skærmlæsertekst, kalder onClick og er slået fra under indlæsning", () => {
    const onClick = vi.fn();
    const { rerender } = render(<RefreshButton onClick={onClick} />);
    const btn = screen.getByRole("button", { name: "Opdater siden" });
    expect(btn.textContent).toBe(""); // kun ikon
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<RefreshButton onClick={onClick} loading />);
    expect(screen.getByRole("button", { name: "Opdater siden" }).disabled).toBe(true);
  });
  it("headervarianten har samme udseende som de øvrige headerikoner og roterer under indlæsning", () => {
    render(<RefreshButton onClick={() => {}} loading />);
    const btn = screen.getByRole("button", { name: "Opdater siden" });
    expect(btn.className).toContain("ibtn"); // samme runde ikonknap som hamburger og søg
    expect(btn.className).toContain("spinning");
    expect(btn.disabled).toBe(true);
  });
  it("ingen sektion har længere en tekstknap, der hedder Opdater", () => {
    const dir = join(process.cwd(), "src/admin/sections");
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".jsx") && !n.includes(".test."))) {
      expect(readFileSync(join(dir, f), "utf8"), f).not.toMatch(/>\s*Opdater\s*<\/button>/);
    }
  });
});
