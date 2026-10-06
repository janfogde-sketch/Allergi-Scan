import { describe, it, expect } from "vitest";
import { storagePathFromUrl, submissionImagePaths, pathsToDelete } from "../supabase/functions/_shared/productImages.js";

const B = "https://x.supabase.co/storage/v1/object/public/product-images/";

describe("productImages", () => {
  it("udleder filsti fra offentlig URL og ignorerer alt andet", () => {
    expect(storagePathFromUrl(B + "labels/123_1_label.jpg")).toBe("labels/123_1_label.jpg");
    expect(storagePathFromUrl(B + "labels/a%20b.jpg?t=1")).toBe("labels/a b.jpg");
    expect(storagePathFromUrl("https://images.openfoodfacts.org/x.jpg")).toBeNull();
    expect(storagePathFromUrl("/9j/4AAQSkZJRg==")).toBeNull();
    expect(storagePathFromUrl(null)).toBeNull();
  });

  it("finder etiket, produktbillede og ekstra billeder", () => {
    const s = {
      raw_label_image: B + "labels/1_label.jpg",
      ai_parsed_data: { product_image_url: B + "products/1_product.jpg", images: [{ url: B + "extra/1_n_0.jpg" }, { url: null }] },
    };
    expect(submissionImagePaths(s).sort()).toEqual(["extra/1_n_0.jpg", "labels/1_label.jpg", "products/1_product.jpg"]);
    expect(submissionImagePaths({ raw_label_image: "", ai_parsed_data: null })).toEqual([]);
  });

  it("bevarer filer, et produkt i databasen bruger", () => {
    const subs = [
      { raw_label_image: B + "labels/1_label.jpg", ai_parsed_data: { product_image_url: B + "products/1_product.jpg" } },
      { raw_label_image: B + "labels/2_label.jpg", ai_parsed_data: {} },
    ];
    expect(pathsToDelete(subs, [B + "products/1_product.jpg"]).sort()).toEqual(["labels/1_label.jpg", "labels/2_label.jpg"]);
    expect(pathsToDelete(subs, [])).toHaveLength(3);
  });
});
