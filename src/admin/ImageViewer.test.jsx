// @ts-nocheck
// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ImageViewer from "./ImageViewer.jsx";

afterEach(cleanup);

describe("ImageViewer", () => {
  it("viser billedet, zoomer i trin og kan ikke zoome ud over 100 % eller ind over 400 %", () => {
    render(<ImageViewer src="https://x/y.jpg" title="Foto af ingredienslisten" onClose={() => {}} />);
    const img = screen.getByAltText("Foto af ingredienslisten");
    expect(screen.getByText("100 %")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Zoom ud" }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Zoom ind" }));
    expect(screen.getByText("150 %")).toBeTruthy();
    expect(img.style.width).toBe("150%");
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole("button", { name: "Zoom ind" }));
    expect(screen.getByText("400 %")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Zoom ind" }).disabled).toBe(true);
  });
  it("lukkes med krydset", () => {
    const onClose = vi.fn();
    render(<ImageViewer src="https://x/y.jpg" title="Foto" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Luk" }));
    expect(onClose).toHaveBeenCalled();
  });
});
