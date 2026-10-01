// @ts-nocheck
// @vitest-environment jsdom
import React, { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CustomAllergenField } from "./AllergenPicker.jsx";

afterEach(cleanup);

function Harness({ onChange }) {
  const [custom, setCustom] = useState([]);
  const [input, setInput] = useState("");
  return <CustomAllergenField customAllerg={custom} setCustomAllerg={setCustom} customInput={input} setCustomInput={setInput} onChange={onChange} />;
}

describe("CustomAllergenField (ens i onboarding, Rediger præferencer og familieformularen)", () => {
  it("plus-knappen hedder 'Tilføj', tilføjer med klik og med Enter, og tømmer feltet", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByLabelText("Egen allergi eller intolerance");
    fireEvent.change(input, { target: { value: "Fruktose" } });
    fireEvent.click(screen.getByRole("button", { name: "Tilføj" }));
    expect(screen.getByText("Fruktose")).toBeTruthy();
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { value: "Kiwi" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Kiwi")).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(2);
  });
  it("tom tekst tilføjer ingenting, og et tag kan fjernes", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Tilføj" }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Egen allergi eller intolerance"), { target: { value: "Kiwi" } });
    fireEvent.click(screen.getByRole("button", { name: "Tilføj" }));
    fireEvent.click(screen.getByRole("button", { name: 'Fjern "Kiwi"' }));
    expect(screen.queryByText("Kiwi")).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
