import Image from "next/image";

import type { MatchScore } from "@/features/matching/calculate-match-score";
import { ReserveFoodButton } from "@/features/matching/reserve-food-button";
import type { Tables } from "@/types/database";

type RankedFoodCardProps = {
  food: Tables<"items"> & {
    imageUrl: string;
    match: MatchScore;
  };
  rank: number;
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatExpiryLeft(expiryDate: string | null): string {
  if (!expiryDate) {
    return "용품";
  }

  const hoursLeft =
    (new Date(expiryDate).getTime() - Date.now()) / (60 * 60 * 1000);

  if (hoursLeft <= 0) {
    return "마감";
  }
  if (hoursLeft < 24) {
    return `${Math.ceil(hoursLeft)}시간 남음`;
  }
  return `${Math.ceil(hoursLeft / 24)}일 남음`;
}

function weightedScore(score: number, weight: number): string {
  return `${(score * weight).toFixed(1)}점`;
}

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }

  return `${distanceKm.toFixed(1)}km`;
}

function getIngredientEvidenceBadge(food: RankedFoodCardProps["food"]) {
  if (food.category === "supply") {
    return {
      className: "brand-pill",
      label: "용품 · 성분표 선택",
    };
  }

  if (food.ingredient_image_url && food.ingredients.length > 0) {
    return {
      className: "brand-pill",
      label: "성분 분석 완료",
    };
  }

  return {
    className: "brand-pill brand-pill-orange",
    label: "성분 확인 필요",
  };
}

function SafetyEvidencePanel({ food }: { food: RankedFoodCardProps["food"] }) {
  const isSupply = food.category === "supply";
  const ingredients = food.ingredients.slice(0, 16);

  return (
    <section className="brand-card-flat mt-4 p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <p className="text-xs font-black tracking-[0.18em] text-orange-700">
            SAFETY CHECK
          </p>
          <h3 className="mt-2 text-lg font-black text-[var(--accent-dark)]">
            보호자 최종 확인 필요
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            AI는 제품 사진과 성분표를 읽어 알러지 충돌을 줄이는 보조 도구입니다.
            실제 수령 전에는 원본 성분표, 개봉 상태, 유통기한, 반려동물의
            알러지·질환 정보를 보호자가 직접 확인해야 합니다.
          </p>

          {food.category === "prescription" ? (
            <p className="mt-3 rounded-2xl border-2 border-orange-200 bg-orange-50 px-4 py-3 text-sm font-black text-orange-800">
              처방식은 반려동물 상태에 따라 적합성이 달라질 수 있어 수의사 상담을
              권장합니다.
            </p>
          ) : null}

          <div className="mt-4">
            <p className="text-xs font-black text-slate-500">AI 추출 원재료·주의 성분</p>
            {ingredients.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {ingredients.map((ingredient) => (
                  <span
                    className="rounded-full border border-orange-100 bg-white px-3 py-1.5 text-xs font-black text-orange-800 shadow-sm"
                    key={ingredient}
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-500">
                {isSupply
                  ? "용품은 성분표 확인 대상이 아닙니다."
                  : "AI가 확실한 성분을 추출하지 못했습니다. 원본 성분표를 우선 확인해 주세요."}
              </p>
            )}
          </div>
        </div>

        <div className="lg:w-56">
          <p className="mb-2 text-xs font-black text-slate-500">성분표 원본</p>
          {food.ingredient_image_url ? (
            <a
              className="group block"
              href={food.ingredient_image_url}
              rel="noreferrer"
              target="_blank"
            >
              <span className="relative block h-40 overflow-hidden rounded-[1.25rem] border-2 border-[var(--line)] bg-white">
                <Image
                  alt={`${food.name} 성분표 사진`}
                  className="object-cover transition group-hover:scale-105"
                  fill
                  sizes="224px"
                  src={food.ingredient_image_url}
                />
              </span>
              <span className="mt-2 block text-xs font-black text-[var(--accent)]">
                원본 크게 보기 →
              </span>
            </a>
          ) : (
            <div className="rounded-[1.25rem] border-2 border-dashed border-slate-200 bg-white p-4 text-sm font-bold leading-6 text-slate-500">
              {isSupply
                ? "용품은 성분표 사진 없이 등록할 수 있습니다."
                : "성분표 사진이 없습니다. 수령 전 현장에서 반드시 확인해 주세요."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function RankedFoodCard({ food, rank }: RankedFoodCardProps) {
  const scorePercent = Math.round(food.match.matchScore);
  const ingredientEvidenceBadge = getIngredientEvidenceBadge(food);
  const expiryLabel = food.expiry_date
    ? dateFormatter.format(new Date(food.expiry_date))
    : "해당 없음";
  const targetLabel =
    food.target_species === "dog"
      ? "강아지"
      : food.target_species === "cat"
        ? "고양이"
        : "강아지·고양이";

  return (
    <article className="brand-card animate-fade-up grid overflow-hidden transition hover:-translate-y-1 sm:grid-cols-[15rem_1fr]">
      <div className="relative m-4 min-h-64 overflow-hidden rounded-[1.5rem] border-2 border-[var(--line)] bg-emerald-100 sm:min-h-[calc(100%-2rem)]">
        <Image
          alt={`${food.name} 사진`}
          className="object-cover"
          fill
          sizes="(max-width: 640px) 100vw, 224px"
          src={food.imageUrl}
        />
        <span className="absolute top-4 left-4 rounded-full bg-[var(--accent-dark)] px-3 py-1 text-sm font-black text-white shadow-lg">
          추천 {rank}위
        </span>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--accent-dark)]/45 to-transparent" />
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="brand-pill">{food.category}</span>
              <span className={ingredientEvidenceBadge.className}>
                {ingredientEvidenceBadge.label}
              </span>
            </div>
            <h2 className="mt-3 text-3xl font-black text-[var(--accent-dark)]">
              {food.name}
            </h2>
          </div>
          <div className="brand-card-flat px-4 py-3 text-right">
            <p className="text-xs font-black text-[var(--accent)]">AI 추천</p>
            <strong className="text-3xl font-black text-[var(--accent)]">
              {scorePercent}
            </strong>
            <span className="ml-1 text-sm font-bold text-slate-500">점</span>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="brand-card-flat p-3">
            <dt className="text-slate-500">수량</dt>
            <dd className="mt-1 font-bold text-slate-900">
              {food.remaining_amount}
            </dd>
          </div>
          <div className="brand-card-flat p-3">
            <dt className="text-slate-500">남은 시간</dt>
            <dd className="mt-1 font-bold text-slate-900">
              {formatExpiryLeft(food.expiry_date)}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-slate-500">
          대상 {targetLabel} · 유통기한 {expiryLabel}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          픽업 좌표 {food.latitude}, {food.longitude}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          GPS 직선거리 {formatDistance(food.match.distanceKm)}
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sky-800 shadow-sm">
            거리 {weightedScore(food.match.distanceScore, 0.3)}
          </span>
          <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-orange-800 shadow-sm">
            나눔 우선도 {weightedScore(food.match.urgencyScore, 0.3)}
          </span>
          <span className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-violet-800 shadow-sm">
            궁합 {weightedScore(food.match.compatibilityScore, 0.4)}
          </span>
        </div>
        <p className="brand-card-flat mt-3 px-4 py-3 text-sm leading-6 text-slate-600">
          {food.match.compatibilityReason}
        </p>

        <SafetyEvidencePanel food={food} />

        <ReserveFoodButton food={food} />
      </div>
    </article>
  );
}
