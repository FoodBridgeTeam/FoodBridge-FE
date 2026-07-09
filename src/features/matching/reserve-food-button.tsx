"use client";

import { useActionState } from "react";
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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="brand-button-dark w-full disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "신청 중..." : "수령 신청하기"}
    </button>
  );
}

export function ReserveFoodButton({ food }: ReserveFoodButtonProps) {
  const [state, formAction] = useActionState(reserveFood, INITIAL_STATE);

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
      <SubmitButton />
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
