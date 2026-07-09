import { z } from "zod";

export const ITEM_ANALYSIS_CATEGORIES = [
  "dry_food",
  "wet_food",
  "treat",
  "prescription",
  "supply",
  "unknown",
] as const;

export const TARGET_SPECIES_VALUES = [
  "dog",
  "cat",
  "both",
  "other",
  "unknown",
] as const;

export const LIFE_STAGE_VALUES = [
  "puppy",
  "kitten",
  "adult",
  "senior",
  "all_life_stages",
  "unknown",
] as const;

export const itemImageAnalysisSchema = z.object({
  name: z.string().trim().min(1).max(120).nullable(),
  brand: z.string().trim().min(1).max(80).nullable(),
  category: z.enum(ITEM_ANALYSIS_CATEGORIES),
  targetSpecies: z.enum(TARGET_SPECIES_VALUES),
  remainingAmount: z.string().trim().max(80).nullable(),
  opened: z.boolean().nullable(),
  openedAtCandidate: z.iso.date().nullable(),
  expiryDateCandidate: z.iso.date().nullable(),
  ingredients: z.array(z.string().trim().min(1).max(80)).max(40),
  lifeStage: z.enum(LIFE_STAGE_VALUES),
  confidence: z.number().min(0).max(1),
  explanation: z.string().trim().min(1).max(600),
  warnings: z.array(z.string().trim().min(1).max(160)).max(8),
});

export type ItemImageAnalysis = z.infer<typeof itemImageAnalysisSchema>;

export const ITEM_IMAGE_ANALYSIS_PROMPT = `
You are an assistant for a Korean pet food and pet supply donation MVP named BobEum.

Analyze the supplied pet food, treat, prescription diet, or pet supply image.
If an ingredient label is visible, extract ingredients. If ingredients are not visible, return an empty array.

Return only valid JSON with this exact shape:
{
  "name": string | null,
  "brand": string | null,
  "category": "dry_food" | "wet_food" | "treat" | "prescription" | "supply" | "unknown",
  "targetSpecies": "dog" | "cat" | "both" | "other" | "unknown",
  "remainingAmount": string | null,
  "opened": boolean | null,
  "openedAtCandidate": "YYYY-MM-DD" | null,
  "expiryDateCandidate": "YYYY-MM-DD" | null,
  "ingredients": string[],
  "lifeStage": "puppy" | "kitten" | "adult" | "senior" | "all_life_stages" | "unknown",
  "confidence": number from 0 to 1,
  "explanation": string,
  "warnings": string[]
}

Rules:
- Prefer Korean product names and Korean explanations.
- This is donation-only. Do not mention price, sale, purchase, or checkout.
- Extract expiryDateCandidate ONLY if the exact expiration date text is clearly visible and readable.
- Never guess expiration dates, opened dates, ingredients, or medical suitability.
- If the package says prescription diet, category must be "prescription" and warnings must include "처방식은 수의사 상담 권장".
- If the item is a bowl, pad, toy, carrier, or other non-food product, category should be "supply", ingredients should be [].
- If ingredients are blurry, hidden, or incomplete, keep ingredients as [] and add a warning.
- AI output is only an editable helper. Do not guarantee safety.
`.trim();

export function extractJsonObject(text: string): unknown {
  const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedJson?.[1] ?? text;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || firstBrace > lastBrace) {
    throw new Error("AI 응답에서 JSON 객체를 찾지 못했습니다.");
  }

  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
}

export function parseItemImageAnalysis(text: string): ItemImageAnalysis {
  return itemImageAnalysisSchema.parse(extractJsonObject(text));
}
