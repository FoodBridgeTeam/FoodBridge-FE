"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  reserveFood,
  type FoodReservationState,
} from "@/features/foods/actions";
import type { MatchScore } from "@/features/matching/calculate-match-score";

type ReserveFoodButtonProps = {
  food: {
    id: string;
    match: MatchScore;
  };
};

const INITIAL_STATE: FoodReservationState = {
  status: "idle",
  message: "",
};

function SubmitButton({ confirmed }: { confirmed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="brand-button-dark w-full disabled:cursor-wait disabled:opacity-60"
      disabled={pending || !confirmed}
      type="submit"
    >
      {pending ? "신청 중..." : "수령 신청하기"}
    </button>
  );
}

export function ReserveFoodButton({ food }: ReserveFoodButtonProps) {
  const [state, formAction] = useActionState(reserveFood, INITIAL_STATE);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <form action={formAction} className="mt-5">
      <input name="foodId" type="hidden" value={food.id} />
      <input name="petId" type="hidden" value="" />
      <input
        name="matchScore"
        type="hidden"
        value={food.match.matchScore.toFixed(2)}
      />
      <input
        name="compatibility"
        type="hidden"
        value={food.match.compatibility}
      />
      <input
        name="compatibilityScore"
        type="hidden"
        value={food.match.compatibilityScore.toFixed(2)}
      />
      <input
        name="compatibilityReason"
        type="hidden"
        value={food.match.compatibilityReason}
      />
      <input
        name="distanceKm"
        type="hidden"
        value={food.match.distanceKm.toFixed(3)}
      />
      <input
        name="urgencyScore"
        type="hidden"
        value={food.match.urgencyScore.toFixed(2)}
      />
      <label className="mb-3 flex cursor-pointer gap-3 rounded-[1.2rem] border-2 border-orange-100 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-950">
        <input
          checked={confirmed}
          className="mt-1 h-4 w-4 accent-[var(--orange)]"
          name="safetyConfirmed"
          onChange={(event) => setConfirmed(event.target.checked)}
          type="checkbox"
          value="true"
        />
        <span>
          AI 분석은 참고용입니다. 성분표 원본과 우리 반려동물의 알러지·질환
          정보를 직접 확인했고, 필요 시 수의사 상담이 필요함을 이해했습니다.
        </span>
      </label>
      <SubmitButton confirmed={confirmed} />
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "mt-2 text-sm font-semibold text-rose-700"
              : "mt-2 text-sm font-semibold text-emerald-700"
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
