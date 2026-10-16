// @ts-nocheck
// @vitest-environment jsdom
// Headerens søgning: global (brugere, produkter, tickets) som standard, men på sider med egen søgning (Familie) styrer feltet den side i stedet.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import GlobalSearchBox from "./GlobalSearchBox.jsx";

vi.mock("./useIsMobile.js", () => ({ useIsMobile: () => false }));
afterEach(cleanup);
const props = (o = {}) => ({
  globalSearch: "", setGlobalSearch: vi.fn(), globalSearchResults: null, setGlobalSearchResults: vi.fn(), globalSearchLoading: false, runGlobalSearch: vi.fn(),
  setSection: vi.fn(), setUserSearch: vi.fn(), setProductSearch: vi.fn(), loadProducts: vi.fn(), ...o,
});

describe("GlobalSearchBox", () => {
  it("uden lokal søgning er den global og uændret", () => {
    const p = props();
    render(<GlobalSearchBox {...p} />);
    const input = screen.getByPlaceholderText("Søg brugere, produkter, tickets…");
    fireEvent.change(input, { target: { value: "mælk" } });
    expect(p.setGlobalSearch).toHaveBeenCalledWith("mælk");
    fireEvent.submit(input.closest("form"));
    expect(p.runGlobalSearch).toHaveBeenCalled();
  });
  it("med lokal søgning styrer feltet siden: hver tastning sendes til siden, og den globale søgning kaldes ikke", () => {
    const local = { value: "", onChange: vi.fn(), placeholder: "Søg i familier…" };
    const p = props({ localSearch: local });
    render(<GlobalSearchBox {...p} />);
    const input = screen.getByPlaceholderText("Søg i familier…");
    fireEvent.change(input, { target: { value: "alex" } });
    expect(local.onChange).toHaveBeenCalledWith("alex");
    fireEvent.submit(input.closest("form"));
    expect(p.runGlobalSearch).not.toHaveBeenCalled();
    expect(p.setGlobalSearch).not.toHaveBeenCalled();
  });
});
