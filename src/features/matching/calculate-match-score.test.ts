import { describe, expect, it } from "vitest";

import {
  calculateHaversineDistanceKm,
  calculateMatchScore,
  rankFoodsByMatchScore,
  type MatchableItem,
  type ReceiverProfile,
} from "@/features/matching/calculate-match-score";

const now = new Date("2030-07-07T00:00:00.000Z");

const pet: ReceiverProfile = {
  age: 4,
  allergies: ["닭고기"],
  cautionIngredients: [],
  conditionNote: null,
  isPrescriptionDiet: false,
  latitude: 35.1338,
  longitude: 129.1057,
  name: "콩이",
  petId: "demo-kongi",
  species: "dog",
  symptomSummary: null,
  symptomTags: [],
  toleratedIngredients: [],
  weight: 5,
};

type TestItem = MatchableItem & { id: string; name: string };

function createItem(overrides: Partial<TestItem> = {}): TestItem {
  return {
    category: "dry_food",
    created_at: "2030-07-06T00:00:00.000Z",
    expiry_date: "2030-07-25",
    id: "item-1",
    ingredients: ["연어", "쌀"],
    latitude: 35.134,
    life_stage: "adult",
    longitude: 129.106,
    name: "강아지 사료",
    opened: false,
    opened_at: null,
    status: "available",
    target_species: "dog",
    ...overrides,
  };
}

describe("calculateMatchScore", () => {
  it("calculates geographic distance with the Haversine formula", () => {
    expect(
      calculateHaversineDistanceKm(
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
      ),
    ).toBeCloseTo(111.1949, 3);
  });

  it("scores suitable nearby items with compatibility, distance, and urgency", () => {
    const result = calculateMatchScore(createItem(), pet, now);

    expect(result.excluded).toBe(false);
    expect(result.compatibility).toBe("suitable");
    expect(result.compatibilityScore).toBe(100);
    expect(result.distanceScore).toBeGreaterThan(99);
    expect(result.urgencyScore).toBe(100);
    expect(result.matchScore).toBeGreaterThan(80);
  });

  it("excludes food items with less than 14 days left before expiry", () => {
    const result = calculateMatchScore(
      createItem({ expiry_date: "2030-07-20" }),
      pet,
      new Date("2030-07-07T12:00:00.000Z"),
    );

    expect(result.excluded).toBe(true);
    expect(result.exclusionReasons).toContain(
      "수령·확인·급여 시간을 위해 유통기한이 14일 미만 남은 사료·간식은 추천하지 않습니다.",
    );
    expect(result.matchScore).toBe(0);
  });

  it("excludes allergy conflicts", () => {
    const result = calculateMatchScore(
      createItem({ ingredients: ["닭고기", "쌀"] }),
      pet,
      now,
    );

    expect(result.excluded).toBe(true);
    expect(result.compatibility).toBe("unsuitable");
    expect(result.matchScore).toBe(0);
  });

  it("excludes symptom-screening caution ingredient conflicts", () => {
    const result = calculateMatchScore(
      createItem({ ingredients: ["소고기", "쌀"] }),
      {
        ...pet,
        allergies: [],
        cautionIngredients: ["소고기"],
      },
      now,
    );

    expect(result.excluded).toBe(true);
    expect(result.compatibility).toBe("unsuitable");
    expect(result.compatibilityReason).toContain("증상 기록 기반 주의 후보");
  });

  it("does not exclude recently tolerated ingredients", () => {
    const result = calculateMatchScore(
      createItem({ ingredients: ["소고기", "쌀"] }),
      {
        ...pet,
        allergies: [],
        toleratedIngredients: ["소고기"],
      },
      now,
    );

    expect(result.excluded).toBe(false);
    expect(result.compatibilityReason).toContain("최근 문제 없이 급여된 후보");
  });

  it("excludes items outside the recommended distance", () => {
    const result = calculateMatchScore(
      createItem({ latitude: 37.5665, longitude: 126.978 }),
      pet,
      now,
    );

    expect(result.distanceKm).toBeGreaterThan(300);
    expect(result.excluded).toBe(true);
    expect(result.matchScore).toBe(0);
  });

  it("sorts recommended items from highest to lowest match score", () => {
    const ranked = rankFoodsByMatchScore(
      [
        createItem({
          id: "far",
          latitude: 35.1796,
          longitude: 129.0756,
        }),
        createItem({
          id: "near",
          latitude: 35.134,
          longitude: 129.106,
        }),
      ],
      pet,
      now,
    );

    expect(ranked.map((item) => item.id)).toEqual(["near", "far"]);
  });
});
