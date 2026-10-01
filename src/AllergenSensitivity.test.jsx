// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AllergenSensitivity } from "./AllergenPicker.jsx";

describe("AllergenSensitivity (følsomhed pr. allergen)", () => {
  it("viser ingenting uden valgte allergener", () => {
    const { container } = render(<AllergenSensitivity selected={[]} levels={{}} onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("standard er 'Også spor', og et tryk skifter til 'Kun direkte indhold' og tilbage", () => {
    const onChange = vi.fn();
    const { rerender } = render(<AllergenSensitivity selected={["maelkeallergi"]} levels={{}} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenLastCalledWith({ maelkeallergi: "direct_only" });
    rerender(<AllergenSensitivity selected={["maelkeallergi"]} levels={{ maelkeallergi: "direct_only" }} onChange={onChange} />);
    expect(screen.getByRole("switch").textContent).toBe("Kun direkte indhold");
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it("gluten viser en advarsel om cøliaki, når spor slås fra (men det forbydes ikke)", () => {
    render(<AllergenSensitivity selected={["gluten"]} levels={{ gluten: "direct_only" }} onChange={() => {}} />);
    expect(screen.getByText(/cøliaki/i)).toBeTruthy();
  });
});
