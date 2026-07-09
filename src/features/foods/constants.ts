import type { ItemCategory, TargetSpecies } from "@/types/database";

export const ITEM_IMAGE_BUCKET = "item-images";
export const INGREDIENT_IMAGE_BUCKET = "ingredient-images";
export const ITEM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const ITEM_IMAGE_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const BOBEUM_HOME_COORDINATES = {
  latitude: 35.1338,
  longitude: 129.1057,
} as const;

export const ITEM_CATEGORY_OPTIONS: Array<{
  label: string;
  value: ItemCategory;
}> = [
  { label: "건식사료", value: "dry_food" },
  { label: "습식사료", value: "wet_food" },
  { label: "간식", value: "treat" },
  { label: "처방식", value: "prescription" },
  { label: "용품", value: "supply" },
  { label: "기타/알 수 없음", value: "unknown" },
];

export const TARGET_SPECIES_OPTIONS: Array<{
  label: string;
  value: TargetSpecies;
}> = [
  { label: "강아지", value: "dog" },
  { label: "고양이", value: "cat" },
  { label: "강아지/고양이 공용", value: "both" },
  { label: "기타", value: "other" },
  { label: "알 수 없음", value: "unknown" },
];

export const DEMO_PICKUP_LOCATIONS = [
  {
    id: "pukyong-daeyeon",
    name: "부경대학교 대연캠퍼스 인근",
    latitude: 35.1338,
    longitude: 129.1057,
  },
  {
    id: "kyungsung-pukyong-station",
    name: "경성대·부경대역 인근",
    latitude: 35.1375758,
    longitude: 129.1003743,
  },
  {
    id: "gwangalli",
    name: "광안리 반려동물 산책로 인근",
    latitude: 35.1542634,
    longitude: 129.1204897,
  },
] as const;

export function getItemImagePath(itemId: string): string {
  return `${itemId}/product-image`;
}

export function getIngredientImagePath(itemId: string): string {
  return `${itemId}/ingredient-label`;
}

export function getItemCategoryLabel(category: string | null): string {
  return (
    ITEM_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ??
    "알 수 없음"
  );
}

export function getTargetSpeciesLabel(species: string | null): string {
  return (
    TARGET_SPECIES_OPTIONS.find((option) => option.value === species)?.label ??
    "알 수 없음"
  );
}
