import { BOBEUM_HOME_COORDINATES } from "@/features/foods/constants";
import type { ReceiverProfile } from "@/features/matching/calculate-match-score";

export type ReceiverSearchParams = Record<
  string,
  string | string[] | undefined
>;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function coordinateOrDefault(
  value: string | string[] | undefined,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  const rawValue = firstValue(value).trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

function numberOrNull(value: string | string[] | undefined): number | null {
  const rawValue = firstValue(value).trim();
  if (!rawValue) return null;

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function booleanOrDefault(
  value: string | string[] | undefined,
  fallback: boolean,
): boolean {
  const rawValue = firstValue(value).trim().toLowerCase();
  if (!rawValue) return fallback;
  return ["1", "true", "yes", "on"].includes(rawValue);
}

function allergyList(value: string | string[] | undefined): string[] {
  const rawValue = firstValue(value);
  return rawValue
    .split(",")
    .map((allergy) => allergy.trim())
    .filter(Boolean);
}

export function parseReceiverProfile(
  searchParams: ReceiverSearchParams,
): ReceiverProfile {
  const species = firstValue(searchParams.species).trim();
  const petName = firstValue(searchParams.pet_name).trim();
  const petId = firstValue(searchParams.pet_id).trim();
  const conditionNote = firstValue(searchParams.condition_note).trim();
  const symptomSummary = firstValue(searchParams.symptom_summary).trim();

  return {
    age: numberOrNull(searchParams.age),
    allergies: allergyList(searchParams.allergies),
    cautionIngredients: allergyList(searchParams.caution_ingredients),
    conditionNote: conditionNote || null,
    isPrescriptionDiet: booleanOrDefault(
      searchParams.is_prescription_diet,
      false,
    ),
    latitude: coordinateOrDefault(
      searchParams.latitude,
      -90,
      90,
      BOBEUM_HOME_COORDINATES.latitude,
    ),
    longitude: coordinateOrDefault(
      searchParams.longitude,
      -180,
      180,
      BOBEUM_HOME_COORDINATES.longitude,
    ),
    name: petName || "콩이",
    petId: petId || "demo-kongi",
    species: species === "cat" ? "cat" : "dog",
    symptomSummary: symptomSummary || null,
    symptomTags: allergyList(searchParams.symptom_tags),
    toleratedIngredients: allergyList(searchParams.tolerated_ingredients),
    weight: numberOrNull(searchParams.weight),
  };
}
