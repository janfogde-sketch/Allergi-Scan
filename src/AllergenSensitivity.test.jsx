// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

afterEach(cleanup);
import { AllergenSensitivity } from "./AllergenPicker.jsx";

describe("AllergenSensitivity (spor pr. allergen)", () => {
  it("viser ingenting uden valgte allergener", () => {
    const { container } = render(<AllergenSensitivity selected={[]} levels={{}} onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("standard er 'Advar ved spor', og valget skifter til 'Kun ved ingrediens' og tilbage", () => {
    const onChange = vi.fn();
    const { rerender } = render(<AllergenSensitivity selected={["maelkeallergi"]} levels={{}} onChange={onChange} />);
    expect(screen.getByText("Advar ved spor").closest("button").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByText("Kun ved ingrediens"));
    expect(onChange).toHaveBeenLastCalledWith({ maelkeallergi: "direct_only" });
    rerender(<AllergenSensitivity selected={["maelkeallergi"]} levels={{ maelkeallergi: "direct_only" }} onChange={onChange} />);
    expect(screen.getByText("Kun ved ingrediens").closest("button").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByText("Advar ved spor"));
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it("gluten og hvede har hver sin række og sin egen indstilling", () => {
    const onChange = vi.fn();
    render(<AllergenSensitivity selected={["hvede", "gluten"]} levels={{}} onChange={onChange} />);
    expect(screen.getAllByText("Kun ved ingrediens")).toHaveLength(2);
    fireEvent.click(screen.getByRole("group", { name: /^Hvede/ }).querySelectorAll("button")[1]);
    expect(onChange).toHaveBeenLastCalledWith({ hvede: "direct_only" });
  });

  it("viser cøliaki-vejledningen kun under Cøliaki, ikke under Gluten eller Hvede", () => {
    render(<AllergenSensitivity selected={["gluten", "hvede", "coeliaki"]} levels={{}} onChange={() => {}} />);
    const guidance = screen.getAllByText(/Har du cøliaki, bør du vælge Advar ved spor/);
    expect(guidance).toHaveLength(1);
    expect(screen.getByRole("group", { name: /^Cøliaki/ }).parentElement.textContent).toContain("Har du cøliaki");
    expect(screen.getByRole("group", { name: /^Glutenfølsomhed/ }).parentElement.textContent).not.toMatch(/cøliaki/i);
    expect(screen.getByRole("group", { name: /^Hvede/ }).parentElement.textContent).not.toMatch(/cøliaki/i);
  });

  it("Cøliaki er som standard på Advar ved spor (spor advarer)", () => {
    render(<AllergenSensitivity selected={["coeliaki"]} levels={{}} onChange={() => {}} />);
    expect(screen.getByRole("group", { name: /^Cøliaki/ }).querySelectorAll("button")[0].getAttribute("aria-pressed")).toBe("true");
  });

  it("viser ingen cøliaki-vejledning for gluten, hvede eller andre valg uden Cøliaki", () => {
    const { rerender } = render(<AllergenSensitivity selected={["gluten"]} levels={{}} onChange={() => {}} />);
    expect(screen.queryByText(/cøliaki/i)).toBeNull();
    rerender(<AllergenSensitivity selected={["hvede"]} levels={{}} onChange={() => {}} />);
    expect(screen.queryByText(/cøliaki/i)).toBeNull();
    expect(screen.getByText("Du advares både ved ingrediens og ved spor.")).toBeTruthy();
    rerender(<AllergenSensitivity selected={["maelkeallergi"]} levels={{}} onChange={() => {}} />);
    expect(screen.queryByText(/cøliaki/i)).toBeNull();
  });

  it("viser kun rækker for valgte allergener", () => {
    render(<AllergenSensitivity selected={["jordnoedder"]} levels={{ maelkeallergi: "direct_only" }} onChange={() => {}} />);
    expect(screen.getAllByRole("group")).toHaveLength(1);
  });
});
