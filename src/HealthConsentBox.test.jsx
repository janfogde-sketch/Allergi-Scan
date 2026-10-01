// @ts-nocheck
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import HealthConsentBox from "./HealthConsentBox.jsx";

afterEach(cleanup);

describe("HealthConsentBox", () => {
  it("er ikke forhåndsafkrydset og melder valget til forælderen", () => {
    const onChange = vi.fn();
    render(<HealthConsentBox checked={false} onChange={onChange} />);
    const box = screen.getByRole("checkbox");
    expect(box.checked).toBe(false);
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("viser samtykketeksten og et link til privatlivspolitikken, når det er sendt med", () => {
    const openPrivacy = vi.fn();
    render(<HealthConsentBox checked onChange={() => {}} openPrivacy={openPrivacy} />);
    expect(screen.getByText(/udtrykkeligt samtykke/)).toBeTruthy();
    fireEvent.click(screen.getByText("Læs privatlivspolitikken"));
    expect(openPrivacy).toHaveBeenCalled();
  });
});
