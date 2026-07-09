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

const EDIBLE_ITEM_CATEGORIES = new Set([
  "dry_food",
  "wet_food",
  "treat",
  "prescription",
  "unknown",
]);

const EXPLICIT_INGREDIENT_CLAIMS = [
  {
    canonical: "닭고기",
    patterns: [/닭\s*고기/i, /치킨/i, /chicken/i, /계육/i],
  },
  {
    canonical: "소고기",
    patterns: [/소\s*고기/i, /쇠\s*고기/i, /beef/i],
  },
  {
    canonical: "돼지고기",
    patterns: [/돼지\s*고기/i, /pork/i],
  },
  {
    canonical: "오리고기",
    patterns: [/오리\s*고기/i, /duck/i],
  },
  {
    canonical: "연어",
    patterns: [/연어/i, /salmon/i],
  },
  {
    canonical: "참치",
    patterns: [/참치/i, /tuna/i],
  },
  {
    canonical: "생선",
    patterns: [/생선/i, /fish/i],
  },
  {
    canonical: "계란",
    patterns: [/계란/i, /달걀/i, /egg/i],
  },
  {
    canonical: "우유",
    patterns: [/우유/i, /유제품/i, /milk/i, /dairy/i],
  },
  {
    canonical: "밀",
    patterns: [/밀\b/i, /wheat/i],
  },
  {
    canonical: "옥수수",
    patterns: [/옥수수/i, /corn/i],
  },
  {
    canonical: "대두",
    patterns: [/대두/i, /콩\b/i, /soy/i],
  },
];

export const ITEM_IMAGE_ANALYSIS_PROMPT = `
You are an assistant for a Korean pet food and pet supply donation MVP named BobEum.

Analyze the supplied pet food, treat, prescription diet, or pet supply image.
The request may include both a product photo and an ingredient-label photo.
If an ingredient-label photo is supplied, use it as the primary source for ingredients.
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
- For dry_food, wet_food, treat, prescription, and unknown edible-looking items, ingredient-label evidence is important. If no readable ingredient label is available, keep ingredients as [] and add "성분표 확인 필요" to warnings.
- However, if the product front label clearly names a protein or flavor ingredient such as "쇠고기", "소고기", "닭고기", "연어", "참치", or "오리", include that explicit label claim in ingredients even if the detailed ingredient label is unreadable.
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
  return enrichExplicitIngredientClaims(
    itemImageAnalysisSchema.parse(extractJsonObject(text)),
  );
}

function enrichExplicitIngredientClaims(
  analysis: ItemImageAnalysis,
): ItemImageAnalysis {
  if (!EDIBLE_ITEM_CATEGORIES.has(analysis.category)) {
    return analysis;
  }

  const evidenceText = [
    analysis.name,
    analysis.explanation,
    ...analysis.warnings,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  const ingredients = new Set(analysis.ingredients);
  let addedIngredient = false;

  for (const claim of EXPLICIT_INGREDIENT_CLAIMS) {
    if (claim.patterns.some((pattern) => pattern.test(evidenceText))) {
      if (!ingredients.has(claim.canonical)) {
        ingredients.add(claim.canonical);
        addedIngredient = true;
      }
    }
  }

  if (!addedIngredient) {
    return analysis;
  }

  const warnings = analysis.warnings.includes(
    "전면 라벨의 주요 단백질원을 주의 성분에 반영했습니다.",
  )
    ? analysis.warnings
    : [
        ...analysis.warnings,
        "전면 라벨의 주요 단백질원을 주의 성분에 반영했습니다.",
      ].slice(0, 8);

  return {
    ...analysis,
    ingredients: [...ingredients].slice(0, 40),
    warnings,
  };
}
