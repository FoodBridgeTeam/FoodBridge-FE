"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type ReactNode,
  useActionState,
  useEffect,
  useState,
} from "react";
import { useFormStatus } from "react-dom";

import {
  type FoodRegistrationState,
  registerFood,
} from "@/features/foods/actions";
import {
  BOBEUM_HOME_COORDINATES,
  DEMO_PICKUP_LOCATIONS,
  ITEM_CATEGORY_OPTIONS,
  ITEM_IMAGE_ACCEPTED_TYPES,
  TARGET_SPECIES_OPTIONS,
} from "@/features/foods/constants";
import type { ItemImageAnalysis } from "@/features/foods/image-analysis";
import {
  type FoodRegistrationField,
  type FoodRegistrationFieldErrors,
} from "@/features/foods/registration-schema";
import { useLocationSelection } from "@/hooks/use-location-selection";

type FieldProps = {
  children: ReactNode;
  error?: string;
  label: string;
  name: FoodRegistrationField;
};

function Field({ children, error, label, name }: FieldProps) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-black text-[var(--accent-dark)]"
        htmlFor={name}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-2 text-sm font-medium text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="brand-button-dark w-full disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "나눔을 등록하고 있어요..." : "나눔 등록하기"}
    </button>
  );
}

const inputClassName =
  "brand-input";

const INITIAL_FOOD_REGISTRATION_STATE: FoodRegistrationState = {
  status: "idle",
  message: "",
};

type AnalysisState =
  | { status: "idle"; message: ""; result: null }
  | { status: "loading"; message: string; result: null }
  | { status: "success"; message: string; result: ItemImageAnalysis }
  | { status: "error"; message: string; result: null };

function firstError(
  errors: FoodRegistrationFieldErrors | undefined,
  field: FoodRegistrationField,
) {
  return errors?.[field]?.[0];
}

function toDatetimeLocalValue(isoDate: string | null | undefined) {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs)
    .toISOString()
    .slice(0, 16);
}

function createMinimumExpiryDatetimeLocal() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  date.setHours(0, 0, 0, 0);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffsetMs)
    .toISOString()
    .slice(0, 16);
}

function createPreviewUrl(file: File | null) {
  return file ? URL.createObjectURL(file) : null;
}

export function FoodRegistrationForm() {
  const [state, formAction] = useActionState(
    registerFood,
    INITIAL_FOOD_REGISTRATION_STATE,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ingredientPreviewUrl, setIngredientPreviewUrl] = useState<
    string | null
  >(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedIngredientImage, setSelectedIngredientImage] =
    useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState>({
    status: "idle",
    message: "",
    result: null,
  });
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("dry_food");
  const [targetSpecies, setTargetSpecies] = useState("both");
  const [remainingAmount, setRemainingAmount] = useState("");
  const [opened, setOpened] = useState(false);
  const [openedAt, setOpenedAt] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [lifeStage, setLifeStage] = useState("");
  const [storageNote, setStorageNote] = useState("");
  const location = useLocationSelection(BOBEUM_HOME_COORDINATES);
  const requiresIngredientLabel = category !== "supply";
  const minimumExpiryDate = createMinimumExpiryDatetimeLocal();

  const errors = state.fieldErrors;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (ingredientPreviewUrl) URL.revokeObjectURL(ingredientPreviewUrl);
    };
  }, [previewUrl, ingredientPreviewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedImage(file);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return createPreviewUrl(file);
    });
    setAnalysis({ status: "idle", message: "", result: null });
  }

  function handleIngredientImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedIngredientImage(file);
    setIngredientPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return createPreviewUrl(file);
    });
  }

  async function handleAnalyzeImage() {
    if (!selectedImage) {
      setAnalysis({
        status: "error",
        message: "먼저 분석할 제품 사진을 선택해 주세요.",
        result: null,
      });
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);
    if (selectedIngredientImage) {
      formData.append("ingredient_image", selectedIngredientImage);
    }
    setAnalysis({
      status: "loading",
      message:
        "Gemini가 제품 사진과 성분표를 함께 읽고 있어요. 알러지 성분은 등록 전 꼭 확인해 주세요...",
      result: null,
    });

    try {
      const response = await fetch("/api/foods/analyze-image", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as {
        analysis?: ItemImageAnalysis;
        error?: string;
      };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error ?? "AI 분석에 실패했습니다.");
      }

      const result = payload.analysis;
      setAnalysis({
        status: "success",
        message:
          "AI 분석값을 입력칸에 반영했습니다. 등록 전 성분과 유통기한을 꼭 확인해 주세요.",
        result,
      });
      setName(result.name ?? "");
      setBrand(result.brand ?? "");
      setCategory(result.category ?? "unknown");
      setTargetSpecies(result.targetSpecies ?? "both");
      setRemainingAmount(result.remainingAmount ?? "");
      setOpened(result.opened ?? false);
      setExpiryDate(toDatetimeLocalValue(result.expiryDateCandidate));
      setIngredients(result.ingredients.join(", "));
      setLifeStage(result.lifeStage ?? "");
    } catch (error) {
      setAnalysis({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "AI 사진 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        result: null,
      });
    }
  }

  function handleDemoLocationChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedLocation = DEMO_PICKUP_LOCATIONS.find(
      (demoLocation) => demoLocation.id === event.target.value,
    );

    if (selectedLocation) {
      location.applyCoordinates(
        selectedLocation,
        `${selectedLocation.name} 시연 좌표를 반영했습니다.`,
      );
    }
  }

  async function handleUseCurrentLocation() {
    await location.useCurrentLocation();
  }

  if (state.status === "success") {
    return (
      <section className="brand-card animate-fade-up p-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          🐾
        </div>
        <h2 className="mt-5 text-3xl font-black text-[var(--accent-dark)]">
          나눔 등록 완료!
        </h2>
        <p className="mt-3 text-slate-600">{state.message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            className="brand-button"
            href="/foods"
          >
            추천 목록 보기
          </Link>
          <Link
            className="brand-button-soft"
            href="/foods/new"
          >
            다른 나눔 등록
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <section className="brand-card animate-fade-up p-6 md:p-8">
        <p className="brand-kicker">
          1단계 · AI 등록 도우미
        </p>
        <h2 className="mt-3 text-3xl font-black text-black">
          사진으로 먼저 등록하기
        </h2>
        <p className="mt-3 font-bold leading-7 text-slate-600">
          제품 사진을 올리면 AI가 이름, 브랜드, 수량, 대상 동물, 성분,
          유통기한 후보를 자동으로 채웁니다.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Field error={firstError(errors, "image")} label="제품 사진" name="image">
            <input
              accept={ITEM_IMAGE_ACCEPTED_TYPES.join(",")}
              className={inputClassName}
              id="image"
              name="image"
              onChange={handleImageChange}
              required
              type="file"
            />
            {previewUrl ? (
              <div className="relative mt-4 h-72 overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[var(--line)] bg-white">
                <Image
                  alt="선택한 제품 사진 미리보기"
                  className="object-cover"
                  fill
                  src={previewUrl}
                />
              </div>
            ) : null}
          </Field>

          <Field
            error={firstError(errors, "ingredient_image")}
            label={
              requiresIngredientLabel
                ? "성분표 사진(필수)"
                : "성분표 사진(용품은 선택)"
            }
            name="ingredient_image"
          >
            <input
              accept={ITEM_IMAGE_ACCEPTED_TYPES.join(",")}
              className={inputClassName}
              id="ingredient_image"
              name="ingredient_image"
              onChange={handleIngredientImageChange}
              required={requiresIngredientLabel}
              type="file"
            />
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              사료·간식·처방식은 알러지 궁합 판정을 위해 성분표 사진이
              필요합니다. 장난감·배변패드 같은 용품은 생략할 수 있어요.
            </p>
            {ingredientPreviewUrl ? (
              <div className="relative mt-4 h-44 overflow-hidden rounded-[1.5rem] border-2 border-dashed border-[var(--line)] bg-white">
                <Image
                  alt="선택한 성분표 사진 미리보기"
                  className="object-cover"
                  fill
                  src={ingredientPreviewUrl}
                />
              </div>
            ) : null}
          </Field>
        </div>

        <div className="brand-card-flat mt-6 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-black text-[var(--accent-dark)]">AI 사진 분석</h3>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                Gemini가 사진을 보고 등록값을 제안합니다. 안전을 위해 최종
                등록 전 보호자가 직접 확인해 주세요.
              </p>
            </div>
            <button
              className="brand-button-dark disabled:cursor-wait disabled:opacity-60"
              disabled={analysis.status === "loading"}
              onClick={handleAnalyzeImage}
              type="button"
            >
              {analysis.status === "loading" ? "분석 중..." : "AI로 사진 분석"}
            </button>
          </div>
          {analysis.message ? (
            <p
              className={
                analysis.status === "error"
                  ? "mt-4 text-sm font-bold text-rose-700"
                  : "mt-4 text-sm font-bold text-emerald-800"
              }
              role="status"
            >
              {analysis.message}
            </p>
          ) : null}
        </div>
      </section>

      <section className="brand-card animate-fade-up-delay-1 p-6 md:p-8">
        <p className="brand-kicker">
          2단계 · 확인 및 제출
        </p>
        <h2 className="mt-3 text-3xl font-black text-black">
          입력값 확인하기
        </h2>

        <input
          name="ai_analysis"
          type="hidden"
          value={analysis.result ? JSON.stringify(analysis.result) : ""}
        />

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field error={firstError(errors, "name")} label="물품명" name="name">
            <input
              className={inputClassName}
              id="name"
              maxLength={100}
              name="name"
              onChange={(event) => setName(event.target.value)}
              placeholder="예: 로얄캐닌 미니 인도어 어덜트"
              required
              type="text"
              value={name}
            />
          </Field>

          <Field error={firstError(errors, "brand")} label="브랜드" name="brand">
            <input
              className={inputClassName}
              id="brand"
              maxLength={80}
              name="brand"
              onChange={(event) => setBrand(event.target.value)}
              placeholder="예: 로얄캐닌"
              type="text"
              value={brand}
            />
          </Field>

          <Field
            error={firstError(errors, "category")}
            label="카테고리"
            name="category"
          >
            <select
              className={inputClassName}
              id="category"
              name="category"
              onChange={(event) => {
                setCategory(event.target.value);
                if (event.target.value === "supply") {
                  setIngredients("");
                }
              }}
              required
              value={category}
            >
              {ITEM_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            error={firstError(errors, "target_species")}
            label="대상 동물"
            name="target_species"
          >
            <select
              className={inputClassName}
              id="target_species"
              name="target_species"
              onChange={(event) => setTargetSpecies(event.target.value)}
              required
              value={targetSpecies}
            >
              {TARGET_SPECIES_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            error={firstError(errors, "remaining_amount")}
            label="남은 양"
            name="remaining_amount"
          >
            <input
              className={inputClassName}
              id="remaining_amount"
              maxLength={80}
              name="remaining_amount"
              onChange={(event) => setRemainingAmount(event.target.value)}
              placeholder="예: 2kg 중 1.2kg 남음 / 3개"
              required
              type="text"
              value={remainingAmount}
            />
          </Field>

          <Field
            error={firstError(errors, "expiry_date")}
            label="유통기한"
            name="expiry_date"
          >
            <input
              className={inputClassName}
              id="expiry_date"
              min={category === "supply" ? undefined : minimumExpiryDate}
              name="expiry_date"
              onChange={(event) => setExpiryDate(event.target.value)}
              type="datetime-local"
              value={expiryDate}
            />
            <p className="mt-2 text-xs font-bold text-slate-500">
              사료·간식·처방식은 수령·확인·급여 시간을 고려해 유통기한이
              최소 14일 이상 남은 물품만 등록할 수 있어요.
            </p>
          </Field>

          <Field
            error={firstError(errors, "opened_at")}
            label="개봉일"
            name="opened_at"
          >
            <input
              className={inputClassName}
              disabled={!opened}
              id="opened_at"
              name="opened_at"
              onChange={(event) => setOpenedAt(event.target.value)}
              type="datetime-local"
              value={openedAt}
            />
          </Field>

          <label className="brand-card-flat flex items-center gap-3 px-4 py-3 text-sm font-black text-[var(--accent-dark)]">
            <input name="opened" type="hidden" value="false" />
            <input
              checked={opened}
              className="size-4 accent-emerald-700"
              name="opened"
              onChange={(event) => setOpened(event.target.checked)}
              type="checkbox"
              value="true"
            />
            이미 개봉한 물품입니다
          </label>

          <Field
            error={firstError(errors, "ingredients")}
            label={
              requiresIngredientLabel
                ? "원재료/주의 성분"
                : "원재료/주의 성분(용품은 선택)"
            }
            name="ingredients"
          >
            <textarea
              className={`${inputClassName} min-h-28 resize-y`}
              id="ingredients"
              maxLength={500}
              name="ingredients"
              onChange={(event) => setIngredients(event.target.value)}
              placeholder="예: 닭고기, 쌀, 옥수수 / 알러지 유발 가능 성분"
              value={ingredients}
            />
          </Field>

          <Field
            error={firstError(errors, "life_stage")}
            label="권장 연령/단계"
            name="life_stage"
          >
            <input
              className={inputClassName}
              id="life_stage"
              maxLength={50}
              name="life_stage"
              onChange={(event) => setLifeStage(event.target.value)}
              placeholder="예: adult, puppy, senior"
              type="text"
              value={lifeStage}
            />
          </Field>

          <Field
            error={firstError(errors, "storage_note")}
            label="보관 상태/메모"
            name="storage_note"
          >
            <textarea
              className={`${inputClassName} min-h-28 resize-y`}
              id="storage_note"
              maxLength={300}
              name="storage_note"
              onChange={(event) => setStorageNote(event.target.value)}
              placeholder="예: 실온 보관, 직사광선 없음, 지퍼백 밀봉"
              value={storageNote}
            />
          </Field>
        </div>
      </section>

      <section className="brand-card animate-fade-up-delay-2 p-6 md:p-8">
        <p className="brand-kicker">
          3단계 · 픽업 위치
        </p>
        <h2 className="mt-3 text-3xl font-black text-black">
          픽업 위치 등록
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-black text-[var(--accent-dark)] md:col-span-2">
            시연용 위치
            <select
              className={`${inputClassName} mt-2`}
              defaultValue=""
              onChange={handleDemoLocationChange}
            >
              <option disabled value="">
                위치를 선택하세요
              </option>
              {DEMO_PICKUP_LOCATIONS.map((demoLocation) => (
                <option key={demoLocation.id} value={demoLocation.id}>
                  {demoLocation.name}
                </option>
              ))}
            </select>
          </label>

          <Field
            error={firstError(errors, "latitude")}
            label="위도"
            name="latitude"
          >
            <input
              className={inputClassName}
              id="latitude"
              max={90}
              min={-90}
              name="latitude"
              onChange={(event) => location.setLatitude(event.target.value)}
              required
              step="0.0000001"
              type="number"
              value={location.latitude}
            />
          </Field>

          <Field
            error={firstError(errors, "longitude")}
            label="경도"
            name="longitude"
          >
            <input
              className={inputClassName}
              id="longitude"
              max={180}
              min={-180}
              name="longitude"
              onChange={(event) => location.setLongitude(event.target.value)}
              required
              step="0.0000001"
              type="number"
              value={location.longitude}
            />
          </Field>

          <button
            className="brand-button-soft disabled:cursor-wait disabled:opacity-60 md:col-span-2"
            disabled={location.requestState === "loading"}
            onClick={handleUseCurrentLocation}
            type="button"
          >
            {location.requestState === "loading"
              ? "위치 확인 중..."
              : "현재 위치로 등록"}
          </button>
          {location.message ? (
            <p
              className={
                location.requestState === "error"
                  ? "text-sm font-semibold text-rose-700 md:col-span-2"
                  : "text-sm font-semibold text-emerald-800 md:col-span-2"
              }
              role="status"
            >
              {location.message}
            </p>
          ) : null}
        </div>
      </section>

      {state.status === "error" ? (
        <p className="rounded-2xl bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
