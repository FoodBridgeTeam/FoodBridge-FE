import { NextResponse } from "next/server";

import {
  ITEM_IMAGE_ACCEPTED_TYPES,
  ITEM_IMAGE_MAX_BYTES,
} from "@/features/foods/constants";
import {
  getSymptomScreeningPrompt,
  parseSymptomScreening,
} from "@/features/matching/symptom-screening";
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

function validateImageFile(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) {
    return {
      error: "분석할 증상 사진을 선택해 주세요.",
      file: null,
    };
  }

  if (file.size > ITEM_IMAGE_MAX_BYTES) {
    return {
      error: "증상 사진은 5MB 이하만 분석할 수 있습니다.",
      file: null,
    };
  }

  if (
    !ITEM_IMAGE_ACCEPTED_TYPES.includes(
      file.type as (typeof ITEM_IMAGE_ACCEPTED_TYPES)[number],
    )
  ) {
    return {
      error: "JPEG, PNG 또는 WebP 사진만 분석할 수 있습니다.",
      file: null,
    };
  }

  return { error: null, file };
}

async function createInlineImagePart(file: File) {
  return {
    inline_data: {
      data: Buffer.from(await file.arrayBuffer()).toString("base64"),
      mime_type: file.type,
    },
  };
}

export async function POST(request: Request) {
  const geminiApiKey = getGeminiApiKey();

  if (!geminiApiKey) {
    return jsonError(
      "GEMINI_API_KEY 환경변수가 없습니다. 키를 설정하면 증상 사진 기록을 사용할 수 있어요.",
      503,
    );
  }

  const formData = await request.formData();
  const imageValidation = validateImageFile(formData.get("image"));

  if (imageValidation.error || !imageValidation.file) {
    return jsonError(imageValidation.error, 400);
  }

  const prompt = getSymptomScreeningPrompt({
    allergies: String(formData.get("allergies") ?? ""),
    conditionNote: String(formData.get("condition_note") ?? ""),
    species: String(formData.get("species") ?? ""),
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { text: "반려동물 증상 기록용 사진입니다. 진단하지 말고 관찰 가능한 징후만 정리하세요." },
              await createInlineImagePart(imageValidation.file),
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
      "Gemini BobEum symptom screening failed:",
      geminiResponse.error?.message ?? response.statusText,
    );

    return jsonError(
      "AI 증상 사진 기록에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      502,
    );
  }

  try {
    const screeningText = getAnalysisText(geminiResponse);
    const screening = parseSymptomScreening(
      screeningText,
      String(formData.get("condition_note") ?? ""),
    );

    return NextResponse.json({ screening });
  } catch (error) {
    console.error("Gemini BobEum symptom screening parse failed:", error);

    return jsonError(
      "AI 응답을 해석하지 못했습니다. 건강/급여 메모에 직접 적어 주세요.",
      502,
    );
  }
}
