// @ts-nocheck
// @vitest-environment jsdom
// Foreløbig vurdering og gode råd på "Produkt ikke fundet" (fejlrapport 16. okt. 2026).
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { PhotoVerdictCard, OcrUnreadableNotice, MissingSummary } from "./NotFoundParts.jsx";
import { missingSubmissionItems, allergensUnchecked } from "./submissionMissing.js";

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
    expect(screen.getByText("Ingen konflikter fundet i den aflæste tekst")).toBeTruthy();
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
    expect(screen.getByText("Billedet er ikke tydeligt nok til, at vi kan vurdere ingredienserne ud fra dine valgte præferencer. Prøv at tage et nyt billede.")).toBeTruthy();
    expect(screen.getByText("Sørg for, at hele ingredienslisten er synlig og fylder det meste af billedet.")).toBeTruthy();
    expect(screen.getByText("Tag billedet i godt lys uden skygger eller genskin.")).toBeTruthy();
    expect(screen.getByText("Hold telefonen stille, og sørg for, at teksten er skarp.")).toBeTruthy();
    expect(screen.getByText("Tag nyt billede")).toBeTruthy();
  });
});

describe("Det mangler vi (Jan 16. okt. 2026)", () => {
  const base = { name: "Havregryn", hasImage: true, hasIngredients: true, ocrUnreadable: false, nameUnread: false, unchecked: false, nutritionCount: 7 };

  it("intet mangler: ingen punkter og ingen boks", () => {
    expect(missingSubmissionItems(base)).toEqual([]);
    const { container } = render(<MissingSummary items={[]} onFix={() => {}} />);
    expect(container.textContent).toBe("");
  });

  it("samler alt, der ikke blev registreret, med det rigtige trin at rette på", () => {
    const items = missingSubmissionItems({ ...base, name: " ", nameUnread: true, hasImage: false, hasIngredients: false, ocrUnreadable: true, nutritionCount: 0 });
    expect(items.map(i => [i.key, i.step])).toEqual([["name", null], ["image", 1], ["ingredients", 2], ["nutrition", 3]]);
    expect(items[0].text).toMatch(/kunne ikke læse produktnavnet/);
    expect(items[2].text).toMatch(/kunne ikke læse ingredienslisten/);
  });

  it("allergener uden automatisk tjek nævnes kun, når der er ingredienser", () => {
    expect(missingSubmissionItems({ ...base, unchecked: true }).map(i => i.key)).toEqual(["allergens"]);
    expect(missingSubmissionItems({ ...base, hasIngredients: false, unchecked: true }).map(i => i.key)).toEqual(["ingredients"]);
  });

  it("allergenerne er ikke tjekket, når tjekket fejlede eller intet er læst", () => {
    expect(allergensUnchecked({ ocrText: "Havre", allergenCheckFailed: true })).toBe(true);
    expect(allergensUnchecked({ ocrText: "", allergenCheckFailed: false })).toBe(true);
    expect(allergensUnchecked({ ocrText: "Havre", allergenCheckFailed: false })).toBe(false);
  });

  it("Ret-knappen fører til trinnet", () => {
    const onFix = vi.fn();
    render(<MissingSummary items={missingSubmissionItems({ ...base, hasImage: false })} onFix={onFix} />);
    expect(screen.getByText("Det mangler vi")).toBeTruthy();
    fireEvent.click(screen.getByText("Ret"));
    expect(onFix).toHaveBeenCalledWith(1);
  });
});
