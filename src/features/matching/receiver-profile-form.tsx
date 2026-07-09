"use client";

import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { DEMO_PICKUP_LOCATIONS } from "@/features/foods/constants";
import type { ReceiverProfile } from "@/features/matching/calculate-match-score";
import type { SymptomScreening } from "@/features/matching/symptom-screening";
import { useLocationSelection } from "@/hooks/use-location-selection";

type ReceiverProfileFormProps = {
  receiver: ReceiverProfile;
};

const inputClassName =
  "brand-input";

type SymptomAnalysisState = {
  message: string;
  status: "idle" | "loading" | "error" | "success";
};

export function ReceiverProfileForm({
  receiver,
}: ReceiverProfileFormProps) {
  const router = useRouter();
  const location = useLocationSelection(receiver);
  const [allergies, setAllergies] = useState(receiver.allergies.join(", "));
  const [conditionNote, setConditionNote] = useState(
    receiver.conditionNote ?? "",
  );
  const [cautionIngredients, setCautionIngredients] = useState(
    receiver.cautionIngredients,
  );
  const [toleratedIngredients, setToleratedIngredients] = useState(
    receiver.toleratedIngredients,
  );
  const [symptomTags, setSymptomTags] = useState(receiver.symptomTags);
  const [symptomSummary, setSymptomSummary] = useState(
    receiver.symptomSummary ?? "",
  );
  const [symptomImage, setSymptomImage] = useState<File | null>(null);
  const [symptomScreening, setSymptomScreening] =
    useState<SymptomScreening | null>(null);
  const [symptomAnalysisState, setSymptomAnalysisState] =
    useState<SymptomAnalysisState>({
      status: "idle",
      message: "",
    });

  function getProfileParams(form: HTMLFormElement | null) {
    const params = new URLSearchParams();
    const formData = form ? new FormData(form) : null;

    for (const key of [
      "pet_id",
      "pet_name",
      "species",
      "age",
      "weight",
      "allergies",
      "condition_note",
      "caution_ingredients",
      "tolerated_ingredients",
      "symptom_tags",
      "symptom_summary",
    ]) {
      const value = String(formData?.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }

    if (formData?.get("is_prescription_diet")) {
      params.set("is_prescription_diet", "true");
    }

    return params;
  }

  function moveReceiverLocation(latitude: string, longitude: string, form: HTMLFormElement | null) {
    const params = getProfileParams(form);
    params.set("latitude", latitude);
    params.set("longitude", longitude);
    router.push(`/foods?${params.toString()}`);
  }

  function handleDemoLocationChange(event: ChangeEvent<HTMLSelectElement>) {
    const selectedLocation = DEMO_PICKUP_LOCATIONS.find(
      (demoLocation) => demoLocation.id === event.target.value,
    );

    if (selectedLocation) {
      const nextCoordinates = location.applyCoordinates(
        selectedLocation,
        `${selectedLocation.name} 시연 좌표를 반영했습니다.`,
      );

      moveReceiverLocation(
        nextCoordinates.latitude,
        nextCoordinates.longitude,
        event.currentTarget.form,
      );
    }
  }

  async function handleUseCurrentLocation(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    const form = event.currentTarget.form;
    const nextCoordinates = await location.useCurrentLocation();

    if (!nextCoordinates) {
      return;
    }

    moveReceiverLocation(
      nextCoordinates.latitude,
      nextCoordinates.longitude,
      form,
    );
  }

  async function handleAnalyzeSymptomImage() {
    if (!symptomImage) {
      setSymptomAnalysisState({
        status: "error",
        message: "증상 사진을 먼저 선택해 주세요.",
      });
      return;
    }

    setSymptomAnalysisState({
      status: "loading",
      message:
        "AI가 사진에서 관찰 가능한 증상 태그만 정리하고 있어요. 진단이 아닌 기록용 분석입니다...",
    });

    const formData = new FormData();
    formData.set("image", symptomImage);
    formData.set("species", receiver.species);
    formData.set("allergies", allergies);
    formData.set("condition_note", conditionNote);

    try {
      const response = await fetch("/api/pets/analyze-symptom-image", {
        body: formData,
        method: "POST",
      });
      const payload = (await response.json()) as {
        message?: string;
        screening?: SymptomScreening;
      };

      if (!response.ok || !payload.screening) {
        setSymptomAnalysisState({
          status: "error",
          message:
            payload.message ??
            "AI 증상 사진 기록에 실패했습니다. 건강/급여 메모에 직접 입력해 주세요.",
        });
        return;
      }

      setSymptomScreening(payload.screening);
      setSymptomTags(payload.screening.observedSigns);
      setSymptomSummary(payload.screening.summary);
      setToleratedIngredients(payload.screening.toleratedIngredients);
      setSymptomAnalysisState({
        status: "success",
        message:
          "증상 사진 기록이 완료되었습니다. 주의 후보는 보호자가 확인한 뒤 추천 조건에 반영할 수 있어요.",
      });
    } catch {
      setSymptomAnalysisState({
        status: "error",
        message:
          "AI 증상 사진 기록 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
  }

  function applyCautionIngredientsToAllergies() {
    if (!symptomScreening) return;

    setCautionIngredients((currentIngredients) => [
      ...new Set([
        ...currentIngredients,
        ...symptomScreening.cautionIngredients,
      ]),
    ]);
  }

  return (
    <form
      action="/foods"
      className="brand-card animate-fade-up-delay-1 grid gap-4 p-5 md:grid-cols-4 md:items-end"
      method="get"
    >
      <div className="brand-card-flat flex flex-col gap-3 p-4 md:col-span-4 md:flex-row md:items-end">
        <label className="flex-1 text-sm font-black text-[var(--accent-dark)]">
          시연용 보호자 위치
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
          className="brand-button-soft disabled:cursor-wait disabled:opacity-60"
          disabled={location.requestState === "loading"}
          onClick={handleUseCurrentLocation}
          type="button"
        >
          {location.requestState === "loading"
            ? "위치 확인 중..."
            : "현재 위치 사용"}
        </button>
        {location.message ? (
          <p
            className={
              location.requestState === "error"
                ? "text-sm font-semibold text-rose-700 md:max-w-72"
                : "text-sm font-semibold text-emerald-800 md:max-w-72"
            }
            role="status"
          >
            {location.message}
          </p>
        ) : null}
      </div>
      <input
        name="caution_ingredients"
        type="hidden"
        value={cautionIngredients.join(", ")}
      />
      <input
        name="tolerated_ingredients"
        type="hidden"
        value={toleratedIngredients.join(", ")}
      />
      <input name="symptom_tags" type="hidden" value={symptomTags.join(", ")} />
      <input name="symptom_summary" type="hidden" value={symptomSummary} />
      <input name="pet_id" type="hidden" value={receiver.petId} />
      <label className="text-sm font-black text-[var(--accent-dark)]">
        반려동물 이름
        <input
          className={`${inputClassName} mt-2`}
          defaultValue={receiver.name}
          maxLength={50}
          name="pet_name"
          placeholder="예: 콩이"
          type="text"
        />
      </label>
      <label className="text-sm font-black text-[var(--accent-dark)]">
        종
        <select
          className={`${inputClassName} mt-2`}
          defaultValue={receiver.species}
          name="species"
        >
          <option value="dog">강아지</option>
          <option value="cat">고양이</option>
        </select>
      </label>
      <label className="text-sm font-black text-[var(--accent-dark)]">
        나이
        <input
          className={`${inputClassName} mt-2`}
          defaultValue={receiver.age ?? ""}
          min={0}
          name="age"
          placeholder="예: 4"
          step="0.1"
          type="number"
        />
      </label>
      <label className="text-sm font-black text-[var(--accent-dark)]">
        몸무게(kg)
        <input
          className={`${inputClassName} mt-2`}
          defaultValue={receiver.weight ?? ""}
          min={0}
          name="weight"
          placeholder="예: 5.2"
          step="0.1"
          type="number"
        />
      </label>
      <label className="text-sm font-black text-[var(--accent-dark)]">
        위도
        <input
          className={`${inputClassName} mt-2`}
          max={90}
          min={-90}
          name="latitude"
          onChange={(event) => location.setLatitude(event.target.value)}
          required
          step="0.0000001"
          type="number"
          value={location.latitude}
        />
      </label>
      <label className="text-sm font-black text-[var(--accent-dark)]">
        경도
        <input
          className={`${inputClassName} mt-2`}
          max={180}
          min={-180}
          name="longitude"
          onChange={(event) => location.setLongitude(event.target.value)}
          required
          step="0.0000001"
          type="number"
          value={location.longitude}
        />
      </label>
      <label className="text-sm font-black text-[var(--accent-dark)]">
        알러지 성분
        <input
          className={`${inputClassName} mt-2`}
          maxLength={50}
          name="allergies"
          onChange={(event) => setAllergies(event.target.value)}
          placeholder="예: 닭고기, 밀"
          type="text"
          value={allergies}
        />
      </label>
      <label className="text-sm font-black text-[var(--accent-dark)] md:col-span-2">
        건강/급여 메모
        <input
          className={`${inputClassName} mt-2`}
          maxLength={120}
          name="condition_note"
          onChange={(event) => setConditionNote(event.target.value)}
          placeholder="예: 피부가 예민해서 단백질원을 확인해요"
          type="text"
          value={conditionNote}
        />
      </label>
      <section className="brand-card-flat space-y-4 p-4 md:col-span-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="brand-kicker">AI 증상 기록</p>
            <h3 className="mt-2 text-xl font-black text-[var(--accent-dark)]">
              증상 사진으로 주의 후보 정리
            </h3>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              눈물 자국, 피부 붉어짐처럼 보이는 관찰 태그만 정리합니다. 알러지
              진단이 아니며, 문제 있었던 성분과 잘 맞았던 성분을 분리해 추천
              조건에 반영합니다.
            </p>
          </div>
          <button
            className="brand-button-soft disabled:cursor-wait disabled:opacity-60"
            disabled={symptomAnalysisState.status === "loading"}
            onClick={handleAnalyzeSymptomImage}
            type="button"
          >
            {symptomAnalysisState.status === "loading"
              ? "기록 중..."
              : "AI 증상 기록"}
          </button>
        </div>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="brand-input"
          onChange={(event) =>
            setSymptomImage(event.target.files?.[0] ?? null)
          }
          type="file"
        />
        {symptomAnalysisState.message ? (
          <p
            className={
              symptomAnalysisState.status === "error"
                ? "text-sm font-semibold text-rose-700"
                : "text-sm font-semibold text-emerald-800"
            }
            role="status"
          >
            {symptomAnalysisState.message}
          </p>
        ) : null}

        {symptomScreening ? (
          <div className="rounded-[1.4rem] border-2 border-orange-100 bg-orange-50 p-4">
            <p className="text-sm font-black text-orange-900">
              {symptomScreening.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {symptomTags.map((tag) => (
                <span
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
            {symptomScreening.toleratedIngredients.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-black text-emerald-800">
                  잘 맞았던 후보로 기록됨
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {symptomScreening.toleratedIngredients.map((ingredient) => (
                    <span
                      className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-black text-emerald-800"
                      key={ingredient}
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {symptomScreening.cautionIngredients.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-black text-orange-800">
                  보호자 확인 후 회피 후보로 반영 가능
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {symptomScreening.cautionIngredients.map((ingredient) => (
                    <span
                      className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-black text-orange-800"
                      key={ingredient}
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
                <button
                  className="brand-button mt-3"
                  onClick={applyCautionIngredientsToAllergies}
                  type="button"
                >
                  회피 후보를 추천 조건에 적용
                </button>
                {cautionIngredients.length > 0 ? (
                  <p className="mt-2 text-xs font-bold text-orange-900/80">
                    현재 적용된 회피 후보: {cautionIngredients.join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className="mt-3 text-xs font-bold leading-5 text-orange-900/80">
              {symptomScreening.disclaimer}
            </p>
          </div>
        ) : null}
      </section>
      <label className="brand-card-flat flex items-center gap-3 px-4 py-3 text-sm font-black text-[var(--accent-dark)]">
        <input
          className="size-4 accent-emerald-700"
          defaultChecked={receiver.isPrescriptionDiet}
          name="is_prescription_diet"
          type="checkbox"
        />
        처방식 급여 중
      </label>
      <button
        className="brand-button-dark"
        type="submit"
      >
        다시 추천
      </button>
    </form>
  );
}
