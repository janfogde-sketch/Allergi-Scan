import { describe, it, expect } from "vitest";
import { imageAttribution } from "./helpers.js";

describe("imageAttribution", () => {
  it("giver kildeangivelse for Open Food Facts-billeder", () => {
    expect(imageAttribution("https://images.openfoodfacts.org/images/products/301/front_en.400.jpg")).toBe("Billede: Open Food Facts, CC BY-SA");
  });
  it("giver ingenting for andre kilder eller manglende billede", () => {
    expect(imageAttribution("https://jegrpcflyguadyxialkm.supabase.co/storage/v1/x.jpg")).toBeNull();
    expect(imageAttribution("https://images.openfoodfacts.org.evil.com/x.jpg")).toBeNull();
    expect(imageAttribution(null)).toBeNull();
  });
});
