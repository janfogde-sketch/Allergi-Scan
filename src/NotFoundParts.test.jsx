// @ts-nocheck
// @vitest-environment jsdom
// Foreløbig vurdering og gode råd på "Produkt ikke fundet" (fejlrapport 16. okt. 2026).
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PhotoVerdictCard, OcrUnreadableNotice } from "./NotFoundParts.jsx";

afterEach(cleanup);
const me = (o = {}) => ({ id: "me", name: "Anna", allergens: ["maelkeallergi"], custom: [], eNumbers: [], levels: {}, ...o });

describe("PhotoVerdictCard", () => {
  it("viser en konflikt tydeligt, når billedet viser et af dine allergener", () => {
    render(<PhotoVerdictCard profiles={[me()]} flags={{ maelkeallergi: "yes" }} ingredientsText="Sukker, mælkepulver, kakao" />);
    expect(screen.getByText("Foreløbig vurdering for dig")).toBeTruthy();
    expect(screen.getByText("Konflikt med din profil")).toBeTruthy();
    expect(screen.getByText("Indeholder mælk")).toBeTruthy();
  });

  it("er aldrig grøn, når intet er fundet", () => {
    render(<PhotoVerdictCard profiles={[me()]} flags={{ maelkeallergi: "no" }} ingredientsText="Sukker, kakao" />);
    expect(screen.getByText("Vi fandt ingen af dine allergier på billedet")).toBeTruthy();
    expect(screen.queryByText(/Ingen registrerede konflikter/)).toBeNull();
  });

  it("vises ikke uden ingrediensliste eller uden valgte allergier", () => {
    const { container } = render(<>
      <PhotoVerdictCard profiles={[me()]} flags={{ maelkeallergi: "yes" }} ingredientsText="" />
      <PhotoVerdictCard profiles={[me({ allergens: [] })]} flags={{ maelkeallergi: "yes" }} ingredientsText="Mælk" />
    </>);
    expect(container.textContent).toBe("");
  });
});

describe("OcrUnreadableNotice", () => {
  it("siger, at listen ikke kunne læses, med gode råd og en knap til nyt billede", () => {
    render(<OcrUnreadableNotice onCapture={() => {}} />);
    expect(screen.getByText("Vi kunne ikke læse ingredienslisten")).toBeTruthy();
    expect(screen.getByText(/ikke på skrå/)).toBeTruthy();
    expect(screen.getByText("Tag nyt billede")).toBeTruthy();
  });
});
