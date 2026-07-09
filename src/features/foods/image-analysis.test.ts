import { describe, expect, it } from "vitest";

import {
  extractJsonObject,
  ITEM_ANALYSIS_CATEGORIES,
  parseItemImageAnalysis,
} from "@/features/foods/image-analysis";

describe("ITEM_ANALYSIS_CATEGORIES", () => {
  it("keeps the allowed BobEum item categories explicit", () => {
    expect(ITEM_ANALYSIS_CATEGORIES).toEqual([
      "dry_food",
      "wet_food",
      "treat",
      "prescription",
      "supply",
      "unknown",
    ]);
  });
});

describe("extractJsonObject", () => {
  it("extracts JSON from fenced model output", () => {
    expect(
      extractJsonObject(`
        \`\`\`json
        {"name":"강아지 사료","confidence":0.9}
        \`\`\`
      `),
    ).toEqual({
      confidence: 0.9,
      name: "강아지 사료",
    });
  });

  it("throws when no JSON object exists", () => {
    expect(() => extractJsonObject("사료처럼 보입니다.")).toThrow(
      "AI 응답에서 JSON 객체를 찾지 못했습니다.",
    );
  });
});

describe("parseItemImageAnalysis", () => {
  it("accepts a safe pet item image analysis result", () => {
    expect(
      parseItemImageAnalysis(
        JSON.stringify({
          brand: "멍멍브랜드",
          category: "dry_food",
          confidence: 0.82,
          explanation: "제품 전면과 일부 성분 표시가 보입니다.",
          expiryDateCandidate: "2030-07-07",
          ingredients: ["닭고기", "쌀"],
          lifeStage: "adult",
          name: "강아지 건식사료",
          opened: false,
          openedAtCandidate: null,
          remainingAmount: "2kg 중 1kg 남음",
          targetSpecies: "dog",
          warnings: ["닭고기 알러지 반려견은 주의가 필요합니다."],
        }),
      ),
    ).toMatchObject({
      category: "dry_food",
      ingredients: ["닭고기", "쌀"],
      name: "강아지 건식사료",
      targetSpecies: "dog",
    });
  });

  it("rejects invented free-form categories", () => {
    expect(() =>
      parseItemImageAnalysis(
        JSON.stringify({
          category: "엄청 좋은 사료",
          brand: null,
          confidence: 0.8,
          explanation: "테스트",
          expiryDateCandidate: null,
          ingredients: [],
          lifeStage: "unknown",
          name: "강아지 사료",
          opened: false,
          openedAtCandidate: null,
          remainingAmount: "1개",
          targetSpecies: "dog",
          warnings: [],
        }),
      ),
    ).toThrow();
  });

  it("adds clearly labeled front-package proteins to ingredients", () => {
    expect(
      parseItemImageAnalysis(
        JSON.stringify({
          category: "wet_food",
          brand: "시저",
          confidence: 0.72,
          explanation:
            "제품 전면에 시저 쇠고기와 닭고기라고 표시되어 있으나 상세 성분표는 흐립니다.",
          expiryDateCandidate: null,
          ingredients: [],
          lifeStage: "unknown",
          name: "시저 쇠고기와 닭고기",
          opened: false,
          openedAtCandidate: null,
          remainingAmount: "1개",
          targetSpecies: "dog",
          warnings: ["성분표 확인 필요"],
        }),
      ),
    ).toMatchObject({
      ingredients: ["닭고기", "소고기"],
    });
  });
});
