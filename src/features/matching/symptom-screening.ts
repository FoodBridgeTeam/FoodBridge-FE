import { z } from "zod";

import { extractJsonObject } from "@/features/foods/image-analysis";

const CAUTION_INGREDIENT_CLAIMS = [
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
    canonical: "생선",
    patterns: [/생선/i, /fish/i],
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
  {
    canonical: "우유",
    patterns: [/우유/i, /유제품/i, /milk/i, /dairy/i],
  },
  {
    canonical: "계란",
    patterns: [/계란/i, /달걀/i, /egg/i],
  },
];

export const symptomScreeningSchema = z.object({
  observedSigns: z.array(z.string().trim().min(1).max(80)).max(8),
  cautionIngredients: z.array(z.string().trim().min(1).max(80)).max(12),
  toleratedIngredients: z
    .array(z.string().trim().min(1).max(80))
    .max(12)
    .default([]),
  summary: z.string().trim().min(1).max(500),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string().trim().min(1).max(180)).max(8),
  disclaimer: z.string().trim().min(1).max(300),
});

export type SymptomScreening = z.infer<typeof symptomScreeningSchema>;

export function getSymptomScreeningPrompt(context: {
  allergies: string;
  conditionNote: string;
  species: string;
}) {
  return `
You are an assistant for a Korean pet food donation MVP named BobEum.

Analyze the uploaded pet symptom photo ONLY as a non-diagnostic screening aid.
The goal is to help a guardian record visible signs and choose ingredient-avoidance candidates for recommendation filtering.

Pet context:
- species: ${context.species || "unknown"}
- guardian-entered allergy ingredients: ${context.allergies || "none"}
- feeding/health memo: ${context.conditionNote || "none"}

Return only valid JSON with this exact shape:
{
  "observedSigns": string[],
  "cautionIngredients": string[],
  "toleratedIngredients": string[],
  "summary": string,
  "confidence": number from 0 to 1,
  "warnings": string[],
  "disclaimer": string
}

Strict safety rules:
- Do NOT diagnose allergies, disease, dermatitis, infection, or any medical condition.
- Do NOT say a specific ingredient caused the symptom.
- Only describe visible, non-diagnostic observations such as "눈물 자국처럼 보임", "피부 붉어짐처럼 보임", "발 핥음 흔적 가능".
- If the image is unclear or does not show a relevant pet body area, say that clearly.
- cautionIngredients must be based only on guardian-entered allergy ingredients or memo text that explicitly says an ingredient caused worsening, reaction, allergy, avoidance, vomiting, diarrhea, itching, redness, or tears. Do not infer a food ingredient from symptoms alone.
- toleratedIngredients must include explicit memo text saying an ingredient seemed fine, improved condition, was tolerated, or caused no issue.
- If a memo says condition improved after eating an ingredient, put that ingredient in toleratedIngredients, not cautionIngredients.
- If the memo/allergy text mentions chicken, beef, wheat, soy, dairy, egg, fish, salmon, tuna, duck, pork, corn, or Korean equivalents, normalize them to Korean ingredient names.
- Always include a warning that this is not veterinary diagnosis and persistent/worsening symptoms require veterinary consultation.
- Prefer Korean output.
`.trim();
}

const POSITIVE_CONTEXT_PATTERN =
  /좋아졌|좋아짐|호전|괜찮|잘\s*맞|문제\s*없|무탈|안정|나아졌|개선/i;
const NEGATIVE_CONTEXT_PATTERN =
  /나빠|악화|심해|가려|붉|발적|눈물|설사|구토|토함|알러|알레르|피해야|회피|주의|문제|안\s*맞/i;

function hasIngredientEvidence(text: string, claim: (typeof CAUTION_INGREDIENT_CLAIMS)[number]) {
  return claim.patterns.some((pattern) => pattern.test(text));
}

function normalizeIngredientName(ingredient: string) {
  return (
    CAUTION_INGREDIENT_CLAIMS.find((claim) =>
      hasIngredientEvidence(ingredient, claim),
    )?.canonical ?? ingredient
  );
}

function hasContextualEvidence(
  text: string,
  claim: (typeof CAUTION_INGREDIENT_CLAIMS)[number],
  contextPattern: RegExp,
) {
  return text
    .split(/[.!?\n。！？]/)
    .some((sentence) => hasIngredientEvidence(sentence, claim) && contextPattern.test(sentence));
}

function enrichIngredientCandidates(
  analysis: SymptomScreening,
  extraEvidenceText = "",
): SymptomScreening {
  const evidenceText = [
    ...analysis.cautionIngredients,
    ...analysis.toleratedIngredients,
    analysis.summary,
    ...analysis.warnings,
    extraEvidenceText,
  ].join(" ");
  const cautionIngredients = new Set(
    analysis.cautionIngredients.map(normalizeIngredientName),
  );
  const toleratedIngredients = new Set(
    analysis.toleratedIngredients.map(normalizeIngredientName),
  );

  for (const claim of CAUTION_INGREDIENT_CLAIMS) {
    const hasNegativeEvidence = hasContextualEvidence(
      evidenceText,
      claim,
      NEGATIVE_CONTEXT_PATTERN,
    );
    const hasPositiveEvidence = hasContextualEvidence(
      evidenceText,
      claim,
      POSITIVE_CONTEXT_PATTERN,
    );

    if (hasNegativeEvidence) {
      cautionIngredients.add(claim.canonical);
    }

    if (hasPositiveEvidence) {
      toleratedIngredients.add(claim.canonical);
      if (!hasNegativeEvidence) {
        cautionIngredients.delete(claim.canonical);
      }
    }
  }

  return {
    ...analysis,
    cautionIngredients: [...cautionIngredients].slice(0, 12),
    toleratedIngredients: [...toleratedIngredients].slice(0, 12),
  };
}

export function parseSymptomScreening(
  text: string,
  extraEvidenceText = "",
): SymptomScreening {
  const parsed = symptomScreeningSchema.parse(extractJsonObject(text));
  return enrichIngredientCandidates(parsed, extraEvidenceText);
}
