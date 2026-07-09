import { describe, expect, it, vi } from "vitest";

import { parseFoodRegistration } from "@/features/foods/registration-schema";

function createValidFormData(): FormData {
  const formData = new FormData();
  formData.set("name", "강아지 건식사료");
  formData.set("brand", "멍멍브랜드");
  formData.set("category", "dry_food");
  formData.set("target_species", "dog");
  formData.set("remaining_amount", "2kg 중 1kg 남음");
  formData.set("opened", "false");
  formData.set("opened_at", "");
  formData.set("expiry_date", "2030-07-07T18:00");
  formData.set("ingredients", "연어, 쌀");
  formData.set("life_stage", "adult");
  formData.set("storage_note", "실온 보관");
  formData.set("latitude", "35.1338");
  formData.set("longitude", "129.1057");
  formData.set(
    "image",
    new File(["image"], "food.webp", { type: "image/webp" }),
  );
  formData.set(
    "ingredient_image",
    new File([], "empty.webp", { type: "image/webp" }),
  );
  return formData;
}

describe("parseFoodRegistration", () => {
  it("parses a complete BobEum item registration", () => {
    vi.setSystemTime(new Date("2030-07-06T12:00:00Z"));

    const result = parseFoodRegistration(createValidFormData());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        category: "dry_food",
        ingredients: ["연어", "쌀"],
        latitude: 35.1338,
        longitude: 129.1057,
        name: "강아지 건식사료",
        opened: false,
        target_species: "dog",
      });
    }

    vi.useRealTimers();
  });

  it("rejects expired food and an unsupported image", () => {
    vi.setSystemTime(new Date("2030-07-08T12:00:00Z"));
    const formData = createValidFormData();
    formData.set(
      "image",
      new File(["document"], "food.pdf", { type: "application/pdf" }),
    );

    const result = parseFoodRegistration(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.expiry_date).toContain(
        "유통기한이 지난 물품은 나눔 등록할 수 없습니다.",
      );
      expect(errors.image).toContain(
        "JPEG, PNG 또는 WebP 사진만 업로드할 수 있습니다.",
      );
    }

    vi.useRealTimers();
  });

  it("requires opened date for opened food items", () => {
    const formData = createValidFormData();
    formData.set("opened", "true");
    formData.set("opened_at", "");

    const result = parseFoodRegistration(formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.opened_at).toContain(
        "개봉한 사료·간식은 개봉 시점을 입력해 주세요.",
      );
    }
  });
});
