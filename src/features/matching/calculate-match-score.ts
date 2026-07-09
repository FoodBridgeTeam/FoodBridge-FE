import type { Compatibility, Tables } from "@/types/database";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ReceiverProfile = Coordinates & {
  age: number | null;
  allergies: string[];
  conditionNote: string | null;
  isPrescriptionDiet: boolean;
  name: string;
  petId: string;
  species: "dog" | "cat";
  weight: number | null;
};

export type MatchableItem = Pick<
  Tables<"items">,
  | "category"
  | "created_at"
  | "expiry_date"
  | "id"
  | "ingredients"
  | "latitude"
  | "life_stage"
  | "longitude"
  | "opened"
  | "opened_at"
  | "status"
  | "target_species"
>;

export type MatchScore = {
  compatibility: Compatibility;
  compatibilityReason: string;
  compatibilityScore: number;
  distanceKm: number;
  distanceScore: number;
  excluded: boolean;
  exclusionReasons: string[];
  matchScore: number;
  urgencyScore: number;
};

const COMPATIBILITY_WEIGHT = 0.4;
const DISTANCE_WEIGHT = 0.3;
const URGENCY_WEIGHT = 0.3;
const EARTH_RADIUS_KM = 6371;
const MAX_RECOMMENDED_DISTANCE_KM = 10;

const FOOD_CATEGORIES = new Set(["dry_food", "wet_food", "treat", "prescription"]);

const ALLERGY_SYNONYMS: Record<string, string[]> = {
  chicken: ["chicken", "닭", "닭고기", "치킨"],
  beef: ["beef", "소", "소고기"],
  pork: ["pork", "돼지", "돼지고기"],
  duck: ["duck", "오리"],
  fish: ["fish", "생선", "어류"],
  salmon: ["salmon", "연어"],
  tuna: ["tuna", "참치"],
  grain: ["grain", "곡물"],
  corn: ["corn", "옥수수"],
  wheat: ["wheat", "밀"],
  soy: ["soy", "대두", "콩"],
  dairy: ["dairy", "우유", "유제품"],
  egg: ["egg", "계란", "달걀"],
};

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateHaversineDistanceKm(
  start: Coordinates,
  end: Coordinates,
): number {
  const startLatitude = degreesToRadians(start.latitude);
  const endLatitude = degreesToRadians(end.latitude);
  const latitudeDelta = degreesToRadians(end.latitude - start.latitude);
  const longitudeDelta = degreesToRadians(end.longitude - start.longitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  const normalizedHaversine = Math.min(1, Math.max(0, haversine));
  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(normalizedHaversine),
      Math.sqrt(1 - normalizedHaversine),
    );

  return EARTH_RADIUS_KM * angularDistance;
}

function getDistanceScore(distanceKm: number): number {
  return Math.max(0, 100 - (distanceKm / MAX_RECOMMENDED_DISTANCE_KM) * 100);
}

function getUrgencyScore(item: MatchableItem, now: Date): number {
  if (!item.expiry_date || !FOOD_CATEGORIES.has(item.category)) {
    return 0;
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(item.expiry_date);
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil(
    (expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (daysLeft < 0) return 0;
  if (daysLeft <= 1) return 100;
  if (daysLeft <= 3) return 85;
  if (daysLeft <= 7) return 65;
  if (daysLeft <= 14) return 40;
  if (daysLeft <= 30) return 20;
  return 10;
}

function normalizeToken(token: string): string {
  const lowered = token.trim().toLowerCase();

  for (const [normalized, aliases] of Object.entries(ALLERGY_SYNONYMS)) {
    if (aliases.some((alias) => lowered.includes(alias))) {
      return normalized;
    }
  }

  return lowered;
}

function getAllergyConflict(
  petAllergies: string[],
  ingredients: string[],
): string | null {
  const normalizedAllergies = new Set(petAllergies.map(normalizeToken));
  const normalizedIngredients = ingredients.map(normalizeToken);

  for (const allergy of normalizedAllergies) {
    if (normalizedIngredients.some((ingredient) => ingredient.includes(allergy))) {
      return allergy;
    }
  }

  return null;
}

function isTargetSpeciesMatched(item: MatchableItem, pet: ReceiverProfile) {
  return item.target_species === pet.species || item.target_species === "both";
}

function calculateCompatibility(
  item: MatchableItem,
  pet: ReceiverProfile,
  now: Date,
): Pick<
  MatchScore,
  | "compatibility"
  | "compatibilityReason"
  | "compatibilityScore"
  | "excluded"
  | "exclusionReasons"
> {
  const exclusionReasons: string[] = [];

  if (item.status !== "available") {
    exclusionReasons.push("이미 예약되었거나 신청할 수 없는 물품입니다.");
  }

  if (!isTargetSpeciesMatched(item, pet)) {
    exclusionReasons.push("반려동물 종과 대상 동물이 맞지 않습니다.");
  }

  if (item.expiry_date && new Date(item.expiry_date).getTime() < now.getTime()) {
    exclusionReasons.push("유통기한이 지난 물품입니다.");
  }

  if (!FOOD_CATEGORIES.has(item.category)) {
    return {
      compatibility: "not_applicable",
      compatibilityReason: "용품은 성분 궁합 판정을 생략하고 거리 기준으로 추천합니다.",
      compatibilityScore: 80,
      excluded: exclusionReasons.length > 0,
      exclusionReasons,
    };
  }

  if (item.ingredients.length === 0) {
    return {
      compatibility: "conditional",
      compatibilityReason:
        "원재료 정보가 부족해 조건부 추천입니다. 수령 전 성분표 확인이 필요합니다.",
      compatibilityScore: 60,
      excluded: exclusionReasons.length > 0,
      exclusionReasons,
    };
  }

  const allergyConflict = getAllergyConflict(pet.allergies, item.ingredients);
  if (allergyConflict) {
    exclusionReasons.push(`알러지 성분(${allergyConflict})과 충돌합니다.`);
  }

  if (item.category === "prescription" && !pet.isPrescriptionDiet) {
    return {
      compatibility: exclusionReasons.length > 0 ? "unsuitable" : "conditional",
      compatibilityReason:
        "처방식은 수의사 상담 후 급여해야 합니다. 현재 프로필에는 처방식 급여 여부가 확인되지 않았습니다.",
      compatibilityScore: exclusionReasons.length > 0 ? 0 : 60,
      excluded: exclusionReasons.length > 0,
      exclusionReasons,
    };
  }

  if (exclusionReasons.length > 0) {
    return {
      compatibility: "unsuitable",
      compatibilityReason: exclusionReasons.join(" "),
      compatibilityScore: 0,
      excluded: true,
      exclusionReasons,
    };
  }

  if (item.opened && !item.opened_at) {
    return {
      compatibility: "conditional",
      compatibilityReason:
        "개봉된 사료이지만 개봉 시점이 불명확합니다. 보관 상태 확인 후 수령하세요.",
      compatibilityScore: 60,
      excluded: false,
      exclusionReasons,
    };
  }

  return {
    compatibility: "suitable",
    compatibilityReason:
      "등록된 원재료와 반려동물 프로필 기준으로 명확한 충돌이 발견되지 않았습니다.",
    compatibilityScore: 100,
    excluded: false,
    exclusionReasons,
  };
}

export function calculateMatchScore(
  item: MatchableItem,
  pet: ReceiverProfile,
  now: Date = new Date(),
): MatchScore {
  const itemHasLocation =
    typeof item.latitude === "number" && typeof item.longitude === "number";
  const distanceKm = itemHasLocation
    ? calculateHaversineDistanceKm(pet, {
        latitude: item.latitude ?? 0,
        longitude: item.longitude ?? 0,
      })
    : Number.POSITIVE_INFINITY;
  const distanceScore = Number.isFinite(distanceKm)
    ? getDistanceScore(distanceKm)
    : 0;
  const urgencyScore = getUrgencyScore(item, now);
  const compatibility = calculateCompatibility(item, pet, now);
  const exclusionReasons = [...compatibility.exclusionReasons];

  if (!itemHasLocation) {
    exclusionReasons.push("픽업 위치가 없습니다.");
  }

  if (distanceKm > MAX_RECOMMENDED_DISTANCE_KM) {
    exclusionReasons.push("10km 추천 반경 밖입니다.");
  }

  const excluded =
    compatibility.excluded ||
    exclusionReasons.length > 0 ||
    compatibility.compatibility === "unsuitable";

  const matchScore = excluded
    ? 0
    : compatibility.compatibilityScore * COMPATIBILITY_WEIGHT +
      distanceScore * DISTANCE_WEIGHT +
      urgencyScore * URGENCY_WEIGHT;

  return {
    compatibility: compatibility.compatibility,
    compatibilityReason: compatibility.compatibilityReason,
    compatibilityScore: compatibility.compatibilityScore,
    distanceKm,
    distanceScore,
    excluded,
    exclusionReasons,
    matchScore,
    urgencyScore,
  };
}

export function rankFoodsByMatchScore<T extends MatchableItem>(
  items: T[],
  pet: ReceiverProfile,
  now: Date = new Date(),
) {
  return items
    .map((item) => ({
      ...item,
      match: calculateMatchScore(item, pet, now),
    }))
    .filter((item) => !item.match.excluded)
    .sort((left, right) => {
      if (right.match.matchScore !== left.match.matchScore) {
        return right.match.matchScore - left.match.matchScore;
      }

      if (right.match.compatibilityScore !== left.match.compatibilityScore) {
        return right.match.compatibilityScore - left.match.compatibilityScore;
      }

      const leftExpiry = left.expiry_date
        ? new Date(left.expiry_date).getTime()
        : Number.POSITIVE_INFINITY;
      const rightExpiry = right.expiry_date
        ? new Date(right.expiry_date).getTime()
        : Number.POSITIVE_INFINITY;

      if (leftExpiry !== rightExpiry) return leftExpiry - rightExpiry;
      if (left.match.distanceKm !== right.match.distanceKm) {
        return left.match.distanceKm - right.match.distanceKm;
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
}
