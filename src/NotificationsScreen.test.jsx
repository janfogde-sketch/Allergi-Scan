// @ts-nocheck
// @vitest-environment jsdom
// Beskeder: hele kortet åbner beskeden, ulæst/læst vises uden radioknap-ring, ingen sletning på oversigten, tom tilstand og scrollposition.
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import NotificationsScreen from "./NotificationsScreen.jsx";

afterEach(cleanup);
const items = [
  { id: "a", title: "Din indsendelse blev ikke godkendt", push_body: "Vi kunne ikke godkende din indsendelse om Osk. Se begrundelsen.", read_at: null, created_at: new Date().toISOString() },
  { id: "b", title: "Dit produkt er godkendt", push_body: "Tak for hjælpen.", read_at: "2026-10-16T10:00:00Z", created_at: "2026-10-16T09:00:00Z" },
];
const setup = (over = {}) => {
  const props = { items, loading: false, listError: false, loadList: vi.fn(), onOpen: vi.fn(), ...over };
  return { ...render(<NotificationsScreen {...props} />), props };
};

describe("NotificationsScreen", () => {
  it("hvert kort er én knap, der åbner beskeden, og der er ingen sletteknap på oversigten", () => {
    const { props } = setup();
    const cards = screen.getAllByRole("button");
    expect(cards).toHaveLength(2);
    expect(screen.queryByLabelText(/Slet besked/)).toBeNull();
    fireEvent.click(cards[1]);
    expect(props.onOpen).toHaveBeenCalledWith("b");
  });
  it("ulæst: udfyldt grøn prik og fed overskrift; læst: ingen prik og neutral overskrift (ingen ring)", () => {
    setup();
    const [unreadCard, readCard] = screen.getAllByRole("button");
    const dot = (c) => c.querySelector('span[aria-hidden="true"]');
    expect(dot(unreadCard).style.background).toBe("var(--green)");
    expect(dot(readCard).style.background).toBe("transparent");
    expect(dot(readCard).style.border).toBe("");
    const title = (c, t) => [...c.querySelectorAll("span")].find((s) => s.textContent.endsWith(t));
    expect(title(unreadCard, "ikke godkendt").style.fontWeight).toBe("800");
    expect(title(readCard, "er godkendt").style.fontWeight).toBe("600");
    expect(unreadCard.textContent).toContain("Ulæst");
    expect(readCard.textContent).not.toContain("Ulæst");
  });
  it("forhåndsvisningen afkortes efter to linjer", () => {
    setup();
    const preview = screen.getByText(/Se begrundelsen/);
    expect(preview.style.webkitLineClamp || preview.style.WebkitLineClamp || preview.getAttribute("style")).toMatch(/2/);
  });
  it("tom oversigt har den nye tekst og et beskedikon uden handlinger", () => {
    setup({ items: [] });
    expect(screen.getByText("Ingen beskeder endnu")).toBeTruthy();
    expect(screen.getByText("Her kan du se svar og opdateringer fra EatSafe.")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("gendanner scrollpositionen, når man kommer tilbage fra en besked", () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo;
    Object.defineProperty(window, "scrollY", { value: 420, configurable: true });
    const first = setup();
    fireEvent.click(screen.getAllByRole("button")[0]);
    first.unmount();
    setup(); // oversigten åbnes igen
    expect(scrollTo).toHaveBeenCalledWith(0, 420);
  });
});
