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
  DEMO_PICKUP_LOCATIONS,
  FOOD_IMAGE_ACCEPTED_TYPES,
  PUKYONG_DAEYEON_COORDINATES,
} from "@/features/foods/constants";
import type { FoodImageAnalysis } from "@/features/foods/image-analysis";
import {
  type FoodRegistrationField,
  type FoodRegistrationFieldErrors,
} from "@/features/foods/registration-schema";
import { BarcodeScanner } from "@/features/foods/barcode-scanner";
import { parseGS1Barcode } from "@/features/foods/barcode";
import { useLocationSelection } from "@/hooks/use-location-selection";

type FieldProps = {
  children: ReactNode;
  error?: string;
  label: string;
  name: FoodRegistrationField;
};

function Field({ children, error, label, name }: FieldProps) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label
        className="mb-2 block text-sm font-bold text-emerald-950"
        htmlFor={name}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-2 text-sm font-medium text-rose-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-2xl bg-emerald-700 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-700/50"
      disabled={pending}
      type="submit"
    >
      {pending ? "등록하고 있어요..." : "식품 등록하기"}
    </button>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-emerald-950/15 bg-white/95 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100";

const INITIAL_FOOD_REGISTRATION_STATE: FoodRegistrationState = {
  status: "idle",
  message: "",
};

type AnalysisState =
  | { status: "idle"; message: ""; result: null }
  | { status: "loading"; message: string; result: null }
  | { status: "success"; message: string; result: FoodImageAnalysis }
  | { status: "error"; message: string; result: null };

function firstError(
  errors: FoodRegistrationFieldErrors | undefined,
  field: FoodRegistrationField,
) {
  return errors?.[field]?.[0];
}

function toDatetimeLocalValue(isoDate: string | null) {
  if (!isoDate) {
    return "";
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs)
    .toISOString()
    .slice(0, 16);
}

export function FoodRegistrationForm() {
  const [state, formAction] = useActionState(
    registerFood,
    INITIAL_FOOD_REGISTRATION_STATE,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState>({
    status: "idle",
    message: "",
    result: null,
  });
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [category, setCategory] = useState("");
  const location = useLocationSelection(PUKYONG_DAEYEON_COORDINATES);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");

  function handleBarcodeScanSuccess(decodedText: string) {
    setIsScannerOpen(false);
    const parsed = parseGS1Barcode(decodedText);
    if (parsed) {
      setName(parsed.name);
      setCategory(parsed.category);
      if (parsed.expiryDate) {
        setExpiryDate(parsed.expiryDate);
      }
      setQuantity("1");
      setAnalysis({
        status: "success",
        message: `바코드(${parsed.barcode}) 스캔 완료! 상품 정보 및 유통기한을 자동 입력했습니다.`,
        result: {
          name: parsed.name,
          category: parsed.category as
            | "간편식"
            | "베이커리"
            | "음료"
            | "신선식품"
            | "유제품"
            | "기타",
          expiry_date: parsed.expiryDate
            ? new Date(parsed.expiryDate).toISOString()
            : null,
          quantity: 1,
          storage: "냉장",
          ready_to_eat: true,
          confidence: 1.0,
          notes: "GS1 DataMatrix 바코드 파싱 성공",
        },
      });
    } else {
      setAnalysis({
        status: "error",
        message: `스캔된 바코드(${decodedText})는 데모 상품 딕셔너리에 존재하지 않습니다. 수동 등록하거나 사진 AI 분석을 시도해 주세요.`,
        result: null,
      });
    }
  }

  function handleManualBarcodeSubmit() {
    const trimmedBarcode = manualBarcode.trim();
    if (!trimmedBarcode) {
      setAnalysis({
        status: "error",
        message: "바코드 번호를 입력한 뒤 적용해 주세요.",
        result: null,
      });
      return;
    }

    handleBarcodeScanSuccess(trimmedBarcode);
  }

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setSelectedImage(file ?? null);
    setAnalysis({ status: "idle", message: "", result: null });
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleAnalyzeImage() {
    if (!selectedImage) {
      setAnalysis({
        status: "error",
        message: "먼저 분석할 식품 사진을 선택해 주세요.",
        result: null,
      });
      return;
    }

    setAnalysis({
      status: "loading",
      message: "AI가 사진에서 식품 정보를 읽고 있어요...",
      result: null,
    });

    const formData = new FormData();
    formData.set("image", selectedImage);

    try {
      const response = await fetch("/api/foods/analyze-image", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as {
        analysis?: FoodImageAnalysis;
        message?: string;
      };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.message ?? "AI 사진 분석에 실패했습니다.");
      }

      const nextExpiryDate = toDatetimeLocalValue(
        payload.analysis.expiry_date,
      );

      if (payload.analysis.name) {
        setName(payload.analysis.name);
      }

      if (payload.analysis.quantity) {
        setQuantity(String(payload.analysis.quantity));
      }

      if (payload.analysis.category) {
        setCategory(payload.analysis.category);
      }

      if (nextExpiryDate) {
        setExpiryDate(nextExpiryDate);
      }

      setAnalysis({
        status: "success",
        message: nextExpiryDate
          ? "AI 분석 결과를 입력칸에 반영했습니다. 등록 전 한 번만 확인해 주세요."
          : "AI 분석 결과를 반영했습니다. 유통기한은 사진에서 확실히 보이지 않아 직접 입력해 주세요.",
        result: payload.analysis,
      });
    } catch (error) {
      setAnalysis({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "AI 사진 분석에 실패했습니다.",
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

  if (state.status === "success") {
    return (
      <section className="rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h2 className="mt-6 text-3xl font-black text-emerald-950">
          등록 완료
        </h2>
        <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
          {state.message}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800"
            onClick={() => window.location.reload()}
            type="button"
          >
            다른 식품 등록
          </button>
          <Link
            className="rounded-xl border border-emerald-900/15 px-5 py-3 font-bold text-emerald-900 hover:bg-emerald-50"
            href="/"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  const errors = state.fieldErrors;

  return (
    <form
      action={formAction}
      className="surface-card animate-fade-up-delay-1 space-y-7 rounded-[2.25rem] p-6 md:p-10"
    >
      <section className="rounded-[1.75rem] border border-emerald-900/10 bg-gradient-to-br from-emerald-50 to-orange-50/70 p-5">
        <div className="mb-4">
          <p className="text-xs font-black tracking-[0.16em] text-emerald-700 uppercase">
            Step 1 · AI & Barcode registration helper
          </p>
          <h2 className="mt-2 text-2xl font-black text-emerald-950">
            사진 또는 바코드로 먼저 등록하기
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            식품 사진을 업로드해 AI 분석을 실행하거나 편의점 식품의 바코드를
            스캔하면 제품명과 유통기한이 자동으로 입력됩니다.
          </p>
        </div>

        <Field error={firstError(errors, "image")} label="식품 사진" name="image">
          <label
            className="relative flex min-h-80 cursor-pointer items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-emerald-900/20 bg-white p-6 text-center shadow-inner transition hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50/30"
            htmlFor="image"
          >
            {previewUrl ? (
              <Image
                alt="선택한 식품 사진 미리보기"
                className="object-cover"
                fill
                src={previewUrl}
                unoptimized
              />
            ) : (
              <span>
                <strong className="block text-lg text-emerald-900">
                  사진을 눌러 선택하세요
                </strong>
                <span className="mt-2 block text-sm text-slate-500">
                  JPEG, PNG, WebP · 최대 5MB
                </span>
              </span>
            )}
          </label>
          <input
            accept={FOOD_IMAGE_ACCEPTED_TYPES.join(",")}
            aria-describedby="image-error"
            className="sr-only"
            id="image"
            name="image"
            onChange={handleImageChange}
            required
            type="file"
          />
        </Field>

        <div className="mt-5 space-y-4 rounded-2xl border border-emerald-900/10 bg-white/90 p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-4">
              <p className="text-sm font-black text-emerald-950">
                방법 A. AI 사진 분석
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                선택한 식품 사진을 Gemini가 인식하여 이름, 수량, 유통기한 후보를
                자동 입력합니다.
              </p>
              <button
                className="mt-3 w-full rounded-xl bg-orange-500 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/15 transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
                disabled={analysis.status === "loading"}
                onClick={handleAnalyzeImage}
                type="button"
              >
                {analysis.status === "loading"
                  ? "AI 분석 중..."
                  : "AI 사진 분석 실행"}
              </button>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/20 p-4">
              <p className="text-sm font-black text-emerald-950">
                방법 B. 편의점 바코드 카메라 스캔
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                편의점 신선 식품(도시락, 삼각김밥 등)의 2D 바코드를 찍어 즉시
                유통기한을 연동합니다. 가까이 대기보다 15~25cm 떨어뜨려
                초점을 맞추는 편이 안정적입니다.
              </p>
              <button
                className="mt-3 w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800"
                onClick={() => setIsScannerOpen(true)}
                type="button"
              >
                🎥 바코드 스캐너 열기
              </button>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white/85 p-3">
                <label
                  className="text-xs font-black text-slate-600"
                  htmlFor="manualBarcode"
                >
                  카메라 실패 시 바코드 직접 입력
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    id="manualBarcode"
                    inputMode="numeric"
                    onChange={(event) => setManualBarcode(event.target.value)}
                    placeholder="예: 010880100707742117260712"
                    type="text"
                    value={manualBarcode}
                  />
                  <button
                    className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-700"
                    onClick={handleManualBarcodeSubmit}
                    type="button"
                  >
                    적용
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-bold text-slate-500">
              대회 시연용 원클릭 바코드 프리셋
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                onClick={() =>
                  handleBarcodeScanSuccess("010880100707742117260712")
                }
                type="button"
              >
                🍙 참치마요 삼각김밥 모의 스캔
              </button>
              <button
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                onClick={() =>
                  handleBarcodeScanSuccess("010880106840215617260712")
                }
                type="button"
              >
                🍱 백종원 제육도시락 모의 스캔
              </button>
              <button
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                onClick={() =>
                  handleBarcodeScanSuccess("010880111511415517260712")
                }
                type="button"
                // 01(AI) + 08801115114155(GTIN) + 17(AI) + 260712(YYMMDD)
              >
                🥪 인기 아이돌 샌드위치 모의 스캔
              </button>
            </div>
          </div>

          {analysis.message ? (
            <p
              className={
                analysis.status === "error"
                  ? "mt-3 text-sm font-semibold text-rose-700"
                  : "mt-3 text-sm font-semibold text-emerald-800"
              }
              role="status"
            >
              {analysis.message}
            </p>
          ) : null}

          {analysis.result ? (
            <dl className="mt-4 grid gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-slate-700 md:grid-cols-3">
              <div>
                <dt className="font-bold text-emerald-950">보관</dt>
                <dd className="mt-1">
                  {analysis.result.storage ?? "알 수 없음"}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-emerald-950">바로 섭취</dt>
                <dd className="mt-1">
                  {analysis.result.ready_to_eat === null
                    ? "알 수 없음"
                    : analysis.result.ready_to_eat
                      ? "가능"
                      : "확인 필요"}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-emerald-950">신뢰도</dt>
                <dd className="mt-1">
                  {Math.round(analysis.result.confidence * 100)}%
                </dd>
              </div>
              {analysis.result.notes ? (
                <div className="md:col-span-3">
                  <dt className="font-bold text-emerald-950">AI 메모</dt>
                  <dd className="mt-1">{analysis.result.notes}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </section>

      <section>
        <p className="text-xs font-black tracking-[0.16em] text-emerald-700 uppercase">
          Step 2 · Review and submit
        </p>
        <h2 className="mt-2 text-2xl font-black text-emerald-950">
          입력값 확인하기
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          AI가 채운 값은 제안일 뿐입니다. 식품명, 유통기한, 카테고리를 확인한
          뒤 필요한 값만 수정해 주세요.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Field error={firstError(errors, "name")} label="식품명" name="name">
          <input
            aria-describedby="name-error"
            className={inputClassName}
            id="name"
            maxLength={100}
            name="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 통밀 식빵"
            required
            type="text"
            value={name}
          />
        </Field>

        <Field
          error={firstError(errors, "quantity")}
          label="수량"
          name="quantity"
        >
          <input
            aria-describedby="quantity-error"
            className={inputClassName}
            id="quantity"
            min={1}
            name="quantity"
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="예: 3"
            required
            step={1}
            type="number"
            value={quantity}
          />
        </Field>

        <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/80 p-4 md:col-span-2">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex-1 text-sm font-bold text-emerald-950">
              시연용 픽업 위치
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
            <button
              className="rounded-2xl border border-emerald-700 bg-white px-5 py-3 font-bold text-emerald-800 transition hover:-translate-y-0.5 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60"
              disabled={location.requestState === "loading"}
              onClick={location.useCurrentLocation}
              type="button"
            >
              {location.requestState === "loading"
                ? "위치 확인 중..."
                : "현재 위치 한 번 사용"}
            </button>
          </div>
          {location.message ? (
            <p
              className={
                location.requestState === "error"
                  ? "mt-3 text-sm font-semibold text-rose-700"
                  : "mt-3 text-sm font-semibold text-emerald-800"
              }
              role="status"
            >
              {location.message}
            </p>
          ) : null}
        </div>

        <Field
          error={firstError(errors, "expiry_date")}
          label="유통기한"
          name="expiry_date"
        >
          <input
            aria-describedby="expiry_date-error"
            className={inputClassName}
            id="expiry_date"
            name="expiry_date"
            onChange={(event) => setExpiryDate(event.target.value)}
            required
            type="datetime-local"
            value={expiryDate}
          />
        </Field>

        <Field
          error={firstError(errors, "category")}
          label="카테고리"
          name="category"
        >
          <input
            aria-describedby="category-error"
            className={inputClassName}
            id="category"
            maxLength={50}
            name="category"
            onChange={(event) => setCategory(event.target.value)}
            placeholder="예: 베이커리"
            required
            type="text"
            value={category}
          />
        </Field>

        <Field
          error={firstError(errors, "latitude")}
          label="픽업 위치 위도"
          name="latitude"
        >
          <input
            aria-describedby="latitude-error"
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
          label="픽업 위치 경도"
          name="longitude"
        >
          <input
            aria-describedby="longitude-error"
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
      </div>

      {state.status === "error" ? (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}

      <p className="rounded-2xl bg-orange-50 px-5 py-4 text-sm leading-6 text-slate-600">
        위치 권한은 버튼을 누른 경우에만 한 번 요청합니다. 대회 시연에서는
        부경대학교 주변 프리셋을 선택해 여러 픽업 지점을 준비할 수 있습니다.
      </p>

      <SubmitButton />

      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScanSuccess}
      />
    </form>
  );
}
