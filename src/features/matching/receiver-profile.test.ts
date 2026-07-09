import { describe, expect, it } from "vitest";

import { BOBEUM_HOME_COORDINATES } from "@/features/foods/constants";
import { parseReceiverProfile } from "@/features/matching/receiver-profile";

describe("parseReceiverProfile", () => {
  it("uses the BobEum demo pet profile and coordinates by default", () => {
    expect(parseReceiverProfile({})).toEqual({
      ...BOBEUM_HOME_COORDINATES,
      age: null,
      allergies: [],
      conditionNote: null,
      isPrescriptionDiet: false,
      name: "콩이",
      petId: "demo-kongi",
      species: "dog",
      weight: null,
    });
  });

  it("accepts valid coordinates and pet profile values", () => {
    expect(
      parseReceiverProfile({
        age: "5",
        allergies: "닭고기, 밀",
        condition_note: "피부가 예민함",
        is_prescription_diet: "true",
        latitude: "35.1796",
        longitude: "129.0756",
        pet_id: "demo",
        pet_name: "나비",
        species: "cat",
        weight: "4.2",
      }),
    ).toEqual({
      age: 5,
      allergies: ["닭고기", "밀"],
      conditionNote: "피부가 예민함",
      isPrescriptionDiet: true,
      latitude: 35.1796,
      longitude: 129.0756,
      name: "나비",
      petId: "demo",
      species: "cat",
      weight: 4.2,
    });
  });

  it("falls back when coordinates are outside their valid range", () => {
    expect(
      parseReceiverProfile({
        latitude: "100",
        longitude: "-200",
      }),
    ).toMatchObject(BOBEUM_HOME_COORDINATES);
  });
});
