"use client";

import type { ChangeEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";

import { DEMO_PICKUP_LOCATIONS } from "@/features/foods/constants";
import type { ReceiverProfile } from "@/features/matching/calculate-match-score";
import { useLocationSelection } from "@/hooks/use-location-selection";

type ReceiverProfileFormProps = {
  receiver: ReceiverProfile;
};

const inputClassName =
  "brand-input";

export function ReceiverProfileForm({
  receiver,
}: ReceiverProfileFormProps) {
  const router = useRouter();
  const location = useLocationSelection(receiver);

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
          defaultValue={receiver.allergies.join(", ")}
          maxLength={50}
          name="allergies"
          placeholder="예: 닭고기, 밀"
          type="text"
        />
      </label>
      <label className="text-sm font-black text-[var(--accent-dark)] md:col-span-2">
        건강/급여 메모
        <input
          className={`${inputClassName} mt-2`}
          defaultValue={receiver.conditionNote ?? ""}
          maxLength={120}
          name="condition_note"
          placeholder="예: 피부가 예민해서 단백질원을 확인해요"
          type="text"
        />
      </label>
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
