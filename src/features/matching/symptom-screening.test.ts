import { describe, expect, it } from "vitest";

import { parseSymptomScreening } from "@/features/matching/symptom-screening";

describe("parseSymptomScreening", () => {
  it("parses non-diagnostic symptom screening output", () => {
    expect(
      parseSymptomScreening(
        JSON.stringify({
          observedSigns: ["눈물 자국처럼 보임"],
          cautionIngredients: ["chicken"],
          toleratedIngredients: [],
          summary:
            "사진상 눈 주변 착색처럼 보이는 부분이 있습니다. 알러지 진단은 아닙니다.",
          confidence: 0.72,
          warnings: ["진단이 아니며 증상이 지속되면 수의사 상담 권장"],
          disclaimer: "본 결과는 수의학적 진단이 아닌 기록용 참고 정보입니다.",
        }),
      ),
    ).toMatchObject({
      cautionIngredients: ["닭고기"],
      observedSigns: ["눈물 자국처럼 보임"],
    });
  });

  it("moves positively described ingredients away from caution candidates", () => {
    expect(
      parseSymptomScreening(
        JSON.stringify({
          observedSigns: ["눈물 자국처럼 보임"],
          cautionIngredients: ["소고기"],
          toleratedIngredients: [],
          summary: "사진상 눈 주변 자국이 관찰됩니다.",
          confidence: 0.7,
          warnings: ["진단이 아닙니다."],
          disclaimer: "본 결과는 수의학적 진단이 아닌 기록용 참고 정보입니다.",
        }),
        "소고기를 먹고나서 상태가 좋아짐",
      ),
    ).toMatchObject({
      cautionIngredients: [],
      toleratedIngredients: ["소고기"],
    });
  });
});
