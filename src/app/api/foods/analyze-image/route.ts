import { NextResponse } from "next/server";

import {
  ITEM_IMAGE_ACCEPTED_TYPES,
  ITEM_IMAGE_MAX_BYTES,
} from "@/features/foods/constants";
import {
  ITEM_IMAGE_ANALYSIS_PROMPT,
  parseItemImageAnalysis,
} from "@/features/foods/image-analysis";
import { getGeminiApiKey } from "@/lib/env";

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function getAnalysisText(response: GeminiGenerateContentResponse) {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((text): text is string => Boolean(text))
      .join("\n")
      .trim() ?? ""
  );
}

export async function POST(request: Request) {
  const geminiApiKey = getGeminiApiKey();

  if (!geminiApiKey) {
    return jsonError(
      "GEMINI_API_KEY 환경변수가 없습니다. 키를 설정하면 사진 AI 분석을 사용할 수 있어요.",
      503,
    );
  }

  const formData = await request.formData();
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return jsonError("분석할 사료·용품 사진을 선택해 주세요.", 400);
  }

  if (image.size > ITEM_IMAGE_MAX_BYTES) {
    return jsonError("사진은 5MB 이하만 분석할 수 있습니다.", 400);
  }

  if (
    !ITEM_IMAGE_ACCEPTED_TYPES.includes(
      image.type as (typeof ITEM_IMAGE_ACCEPTED_TYPES)[number],
    )
  ) {
    return jsonError("JPEG, PNG 또는 WebP 사진만 분석할 수 있습니다.", 400);
  }

  const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: ITEM_IMAGE_ANALYSIS_PROMPT },
              {
                inline_data: {
                  data: imageBase64,
                  mime_type: image.type,
                },
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.1,
        },
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  const geminiResponse =
    (await response.json()) as GeminiGenerateContentResponse;

  if (!response.ok) {
    console.error(
      "Gemini BobEum item image analysis failed:",
      geminiResponse.error?.message ?? response.statusText,
    );

    return jsonError("AI 사진 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.", 502);
  }

  try {
    const analysisText = getAnalysisText(geminiResponse);
    const analysis = parseItemImageAnalysis(analysisText);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Gemini BobEum item image analysis parse failed:", error);

    return jsonError(
      "AI 응답을 해석하지 못했습니다. 수동 입력으로 등록해 주세요.",
      502,
    );
  }
}
