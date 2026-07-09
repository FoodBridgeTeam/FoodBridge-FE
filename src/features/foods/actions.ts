"use server";

import { revalidatePath } from "next/cache";

import {
  getIngredientImagePath,
  getItemImagePath,
  INGREDIENT_IMAGE_BUCKET,
  ITEM_IMAGE_BUCKET,
} from "@/features/foods/constants";
import {
  type FoodRegistrationFieldErrors,
  parseFoodRegistration,
} from "@/features/foods/registration-schema";
import { createClient } from "@/lib/supabase/server";
import type { Compatibility, Json } from "@/types/database";

export type FoodRegistrationState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: FoodRegistrationFieldErrors;
  foodId?: string;
};

export type FoodReservationState = {
  foodId?: string;
  message: string;
  status: "idle" | "error" | "success";
};

async function uploadImage(
  bucket: string,
  path: string,
  file: File,
): Promise<string | null> {
  const supabase = await createClient();
  const imageBytes = await file.arrayBuffer();

  const { error } = await supabase.storage.from(bucket).upload(path, imageBytes, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error(`Image upload failed for ${bucket}/${path}:`, error.message);
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function parseAiAnalysis(value: string | undefined): Json {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Json) : {};
  } catch {
    return {};
  }
}

export async function registerFood(
  _previousState: FoodRegistrationState,
  formData: FormData,
): Promise<FoodRegistrationState> {
  const parsed = parseFoodRegistration(formData);

  if (!parsed.success) {
    return {
      status: "error",
      message: "입력 내용을 다시 확인해 주세요.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const itemId = crypto.randomUUID();
  const productImagePath = getItemImagePath(itemId);
  const productImageUrl = await uploadImage(
    ITEM_IMAGE_BUCKET,
    productImagePath,
    parsed.data.image,
  );

  if (!productImageUrl) {
    return {
      status: "error",
      message:
        "제품 사진을 업로드하지 못했습니다. BobEum Storage 마이그레이션 적용 여부를 확인해 주세요.",
    };
  }

  let ingredientImageUrl: string | null = null;
  if (parsed.data.ingredient_image) {
    ingredientImageUrl = await uploadImage(
      INGREDIENT_IMAGE_BUCKET,
      getIngredientImagePath(itemId),
      parsed.data.ingredient_image,
    );

    if (!ingredientImageUrl) {
      return {
        status: "error",
        message:
          "성분표 사진을 업로드하지 못했습니다. Storage 정책을 확인해 주세요.",
      };
    }
  }

  const supabase = await createClient();
  const { error: itemError } = await supabase.from("items").insert({
    id: itemId,
    supplier_id: null,
    name: parsed.data.name,
    brand: parsed.data.brand,
    category: parsed.data.category,
    target_species: parsed.data.target_species,
    remaining_amount: parsed.data.remaining_amount,
    opened: parsed.data.opened,
    opened_at: parsed.data.opened_at,
    expiry_date: parsed.data.expiry_date,
    ingredients: parsed.data.ingredients,
    life_stage: parsed.data.life_stage,
    storage_note: parsed.data.storage_note,
    image_url: productImageUrl,
    ingredient_image_url: ingredientImageUrl,
    ai_analysis: parseAiAnalysis(parsed.data.ai_analysis),
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    status: "available",
  });

  if (itemError) {
    console.error("BobEum item registration failed:", itemError.message);
    return {
      status: "error",
      message:
        "물품 정보를 저장하지 못했습니다. BobEum DB/RLS 마이그레이션 적용 여부를 확인해 주세요.",
    };
  }

  revalidatePath("/");
  revalidatePath("/foods");

  return {
    status: "success",
    message: "나눔 물품이 등록되었습니다. 이제 필요한 반려동물에게 추천할 수 있어요.",
    foodId: itemId,
  };
}

export async function reserveFood(
  _previousState: FoodReservationState,
  formData: FormData,
): Promise<FoodReservationState> {
  const itemId = formData.get("foodId");
  const petId = formData.get("petId");
  const matchScore = Number(formData.get("matchScore") ?? 0);
  const compatibility = formData.get("compatibility");
  const compatibilityScore = Number(formData.get("compatibilityScore") ?? 0);
  const compatibilityReason = formData.get("compatibilityReason");
  const distanceKm = Number(formData.get("distanceKm") ?? 0);
  const urgencyScore = Number(formData.get("urgencyScore") ?? 0);

  if (typeof itemId !== "string" || itemId.length === 0) {
    return {
      status: "error",
      message: "수령 신청할 물품을 찾지 못했습니다.",
    };
  }

  const supabase = await createClient();
  const { error: matchError } = await supabase.from("matches").insert({
    item_id: itemId,
    pet_id: typeof petId === "string" && petId.length > 0 ? petId : null,
    match_score: Number.isFinite(matchScore) ? matchScore : 0,
    compatibility:
      typeof compatibility === "string"
        ? (compatibility as Compatibility)
        : "conditional",
    compatibility_score: Number.isFinite(compatibilityScore)
      ? compatibilityScore
      : 0,
    compatibility_reason:
      typeof compatibilityReason === "string" ? compatibilityReason : null,
    distance_km: Number.isFinite(distanceKm) ? distanceKm : null,
    urgency_score: Number.isFinite(urgencyScore) ? urgencyScore : null,
    status: "accepted",
  });

  if (matchError) {
    console.error("BobEum match creation failed:", matchError.message);
    return {
      foodId: itemId,
      status: "error",
      message:
        "신청 기록 생성에 실패했습니다. matches RLS 정책 적용 여부를 확인해 주세요.",
    };
  }

  const { error: itemError } = await supabase
    .from("items")
    .update({ status: "reserved" })
    .eq("id", itemId)
    .eq("status", "available");

  if (itemError) {
    console.error("BobEum item reservation failed:", itemError.message);
    return {
      foodId: itemId,
      status: "error",
      message:
        "수령 신청에 실패했습니다. 예약 상태 변경 정책 적용 여부를 확인해 주세요.",
    };
  }

  revalidatePath("/");
  revalidatePath("/foods");

  return {
    foodId: itemId,
    status: "success",
    message: "수령 신청이 완료되었습니다. 예약된 물품은 추천 목록에서 제외됩니다.",
  };
}
