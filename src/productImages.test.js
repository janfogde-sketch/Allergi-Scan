import { describe, it, expect } from "vitest";
import { storagePathFromUrl, storageRef, privateImagePath, submissionImageRef, submissionImageRefs, pathsToDelete } from "../supabase/functions/_shared/productImages.js";

const B = "https://x.supabase.co/storage/v1/object/public/product-images/";
const P = "storage:submission-images/";

describe("productImages", () => {
  it("udleder filsti fra offentlig URL og ignorerer alt andet", () => {
    expect(storagePathFromUrl(B + "labels/123_1_label.jpg")).toBe("labels/123_1_label.jpg");
    expect(storagePathFromUrl(B + "labels/a%20b.jpg?t=1")).toBe("labels/a b.jpg");
    expect(storagePathFromUrl("https://images.openfoodfacts.org/x.jpg")).toBeNull();
    expect(storagePathFromUrl("/9j/4AAQSkZJRg==")).toBeNull();
    expect(storagePathFromUrl(null)).toBeNull();
    expect(storagePathFromUrl(P + "labels/1.jpg")).toBeNull();
  });

  it("kender henvisninger til den private bøtte", () => {
    expect(submissionImageRef("labels/1.jpg")).toBe(P + "labels/1.jpg");
    expect(privateImagePath(P + "labels/1.jpg")).toBe("labels/1.jpg");
    expect(privateImagePath(B + "labels/1.jpg")).toBeNull();
    expect(privateImagePath(P)).toBeNull();
    expect(storageRef(P + "extra/1.jpg")).toEqual({ bucket: "submission-images", path: "extra/1.jpg" });
    expect(storageRef(B + "products/1.jpg")).toEqual({ bucket: "product-images", path: "products/1.jpg" });
    expect(storageRef("https://images.openfoodfacts.org/x.jpg")).toBeNull();
  });

  it("finder etiket, produktbillede og ekstra billeder i begge bøtter", () => {
    const s = {
      raw_label_image: P + "labels/1_label.jpg",
      ai_parsed_data: { product_image_url: B + "products/1_product.jpg", images: [{ url: P + "extra/1_n_0.jpg" }, { url: null }] },
    };
    expect(submissionImageRefs(s)).toEqual([
      { bucket: "submission-images", path: "labels/1_label.jpg" },
      { bucket: "product-images", path: "products/1_product.jpg" },
      { bucket: "submission-images", path: "extra/1_n_0.jpg" },
    ]);
    expect(submissionImageRefs({ raw_label_image: "", ai_parsed_data: null })).toEqual([]);
  });

  it("bevarer offentlige filer, et produkt i databasen bruger, og sletter alt privat", () => {
    const subs = [
      { raw_label_image: B + "labels/1_label.jpg", ai_parsed_data: { product_image_url: B + "products/1_product.jpg" } },
      { raw_label_image: P + "labels/2_label.jpg", ai_parsed_data: { product_image_url: P + "products/2_product.jpg" } },
    ];
    // products/2_product.jpg findes også offentligt (kopieret ved godkendelse); den private kopi slettes alligevel.
    expect(pathsToDelete(subs, [B + "products/1_product.jpg", B + "products/2_product.jpg"])).toEqual({
      "product-images": ["labels/1_label.jpg"],
      "submission-images": ["labels/2_label.jpg", "products/2_product.jpg"],
    });
    expect(pathsToDelete(subs, [])["product-images"]).toHaveLength(2);
    expect(pathsToDelete([], [])).toEqual({});
  });
});
