import { z } from "zod";

import {
  ITEM_CATEGORY_OPTIONS,
  ITEM_IMAGE_ACCEPTED_TYPES,
  ITEM_IMAGE_MAX_BYTES,
  TARGET_SPECIES_OPTIONS,
} from "@/features/foods/constants";

const categoryValues = ITEM_CATEGORY_OPTIONS.map((option) => option.value) as [
  (typeof ITEM_CATEGORY_OPTIONS)[number]["value"],
  ...(typeof ITEM_CATEGORY_OPTIONS)[number]["value"][],
];

const targetSpeciesValues = TARGET_SPECIES_OPTIONS.map(
  (option) => option.value,
) as [
  (typeof TARGET_SPECIES_OPTIONS)[number]["value"],
  ...(typeof TARGET_SPECIES_OPTIONS)[number]["value"][],
];

const requiredNumber = (message: string, constraints: z.ZodNumber) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number({ error: message }).pipe(constraints),
  );

const optionalDate = z.preprocess(
  (value) => {
    if (value === "" || value === null) return null;
    if (typeof value !== "string") return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  },
  z.string().datetime().nullable(),
);

const itemRegistrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "제품명을 입력해 주세요.")
      .max(120, "제품명은 120자 이하로 입력해 주세요."),
    brand: z.string().trim().max(80, "브랜드는 80자 이하로 입력해 주세요."),
    category: z.enum(categoryValues, {
      error: "카테고리를 선택해 주세요.",
    }),
    target_species: z.enum(targetSpeciesValues, {
      error: "대상 동물을 선택해 주세요.",
    }),
    remaining_amount: z
      .string()
      .trim()
      .min(1, "잔여량을 입력해 주세요.")
      .max(80, "잔여량은 80자 이하로 입력해 주세요."),
    opened: z.enum(["true", "false"], {
      error: "개봉 여부를 선택해 주세요.",
    }),
    opened_at: optionalDate,
    expiry_date: optionalDate,
    ingredients: z
      .string()
      .trim()
      .max(1000, "원재료는 1000자 이하로 입력해 주세요."),
    life_stage: z.string().trim().max(40),
    storage_note: z.string().trim().max(200),
    latitude: requiredNumber(
      "위도를 입력해 주세요.",
      z
        .number()
        .min(-90, "위도는 -90 이상이어야 합니다.")
        .max(90, "위도는 90 이하여야 합니다."),
    ),
    longitude: requiredNumber(
      "경도를 입력해 주세요.",
      z
        .number()
        .min(-180, "경도는 -180 이상이어야 합니다.")
        .max(180, "경도는 180 이하여야 합니다."),
    ),
    image: z
      .custom<File>((value) => value instanceof File, {
        message: "제품 사진을 선택해 주세요.",
      })
      .refine((file) => file.size > 0, "제품 사진을 선택해 주세요.")
      .refine(
        (file) => file.size <= ITEM_IMAGE_MAX_BYTES,
        "사진은 5MB 이하만 업로드할 수 있습니다.",
      )
      .refine(
        (file) =>
          ITEM_IMAGE_ACCEPTED_TYPES.includes(
            file.type as (typeof ITEM_IMAGE_ACCEPTED_TYPES)[number],
          ),
        "JPEG, PNG 또는 WebP 사진만 업로드할 수 있습니다.",
      ),
    ingredient_image: z
      .custom<File | null>(
        (value) => value === null || value instanceof File,
        {
          message: "성분표 사진 형식이 올바르지 않습니다.",
        },
      )
      .refine(
        (file) => file === null || file.size <= ITEM_IMAGE_MAX_BYTES,
        "성분표 사진은 5MB 이하만 업로드할 수 있습니다.",
      )
      .refine(
        (file) =>
          file === null ||
          file.size === 0 ||
          ITEM_IMAGE_ACCEPTED_TYPES.includes(
            file.type as (typeof ITEM_IMAGE_ACCEPTED_TYPES)[number],
          ),
        "JPEG, PNG 또는 WebP 성분표 사진만 업로드할 수 있습니다.",
      ),
    ai_analysis: z.preprocess(
      (value) => (value === null ? undefined : value),
      z.string().trim().optional(),
    ),
  })
  .superRefine((value, context) => {
    const isFoodCategory = value.category !== "supply";

    if (value.opened === "true" && value.opened_at === null) {
      context.addIssue({
        code: "custom",
        message: "개봉한 사료·간식은 개봉 시점을 입력해 주세요.",
        path: ["opened_at"],
      });
    }

    if (isFoodCategory && value.expiry_date === null) {
      context.addIssue({
        code: "custom",
        message: "사료·간식은 유통기한을 입력해 주세요.",
        path: ["expiry_date"],
      });
    }

    if (
      value.expiry_date !== null &&
      new Date(value.expiry_date).getTime() < new Date().setHours(0, 0, 0, 0)
    ) {
      context.addIssue({
        code: "custom",
        message: "유통기한이 지난 물품은 나눔 등록할 수 없습니다.",
        path: ["expiry_date"],
      });
    }
  })
  .transform((value) => ({
    ...value,
    brand: value.brand.length > 0 ? value.brand : null,
    opened: value.opened === "true",
    ingredients: value.ingredients
      .split(/[,，\n]/)
      .map((ingredient) => ingredient.trim())
      .filter(Boolean),
    life_stage: value.life_stage.length > 0 ? value.life_stage : "unknown",
    storage_note: value.storage_note.length > 0 ? value.storage_note : null,
    ingredient_image:
      value.ingredient_image instanceof File && value.ingredient_image.size > 0
        ? value.ingredient_image
        : null,
  }));

export type FoodRegistrationInput = z.infer<typeof itemRegistrationSchema>;
export type FoodRegistrationField = keyof FoodRegistrationInput;
export type FoodRegistrationFieldErrors = Partial<
  Record<FoodRegistrationField, string[]>
>;

export function parseFoodRegistration(formData: FormData) {
  return itemRegistrationSchema.safeParse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    category: formData.get("category"),
    target_species: formData.get("target_species"),
    remaining_amount: formData.get("remaining_amount"),
    opened: formData.get("opened"),
    opened_at: formData.get("opened_at"),
    expiry_date: formData.get("expiry_date"),
    ingredients: formData.get("ingredients"),
    life_stage: formData.get("life_stage"),
    storage_note: formData.get("storage_note"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    image: formData.get("image"),
    ingredient_image: formData.get("ingredient_image"),
    ai_analysis: formData.get("ai_analysis"),
  });
}
