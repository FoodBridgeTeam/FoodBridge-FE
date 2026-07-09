import { BellIcon } from "@/components/icons";
import type { MatchScore } from "@/features/matching/calculate-match-score";
import type { Tables } from "@/types/database";

type AlertFood = Tables<"items"> & {
  match: MatchScore;
};

type MatchingAlertCardProps = {
  foods: AlertFood[];
};

function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }

  return `${distanceKm.toFixed(1)}km`;
}

function formatExpiryLeft(expiryDate: string | null): string {
  if (!expiryDate) {
    return "용품";
  }

  const hoursLeft =
    (new Date(expiryDate).getTime() - Date.now()) / (60 * 60 * 1000);

  if (hoursLeft <= 0) {
    return "마감됨";
  }

  if (hoursLeft < 24) {
    return `${Math.ceil(hoursLeft)}시간 남음`;
  }

  return `${Math.ceil(hoursLeft / 24)}일 남음`;
}

export function MatchingAlertCard({ foods }: MatchingAlertCardProps) {
  const recommendedFoods = foods.filter((food) => food.match.matchScore > 0);
  const topFood = recommendedFoods[0] ?? null;
  const urgentFood =
    recommendedFoods.length > 0
      ? [...recommendedFoods].sort(
          (left, right) => right.match.urgencyScore - left.match.urgencyScore,
        )[0]
      : null;
  const nearestFood =
    recommendedFoods.length > 0
      ? [...recommendedFoods].sort(
          (left, right) => left.match.distanceKm - right.match.distanceKm,
        )[0]
      : null;

  if (!topFood) {
    return (
      <section className="brand-card animate-fade-up-delay-1 p-5">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[var(--line)] bg-orange-100 text-orange-700">
            <BellIcon className="size-6" />
          </div>
          <div>
            <p className="brand-kicker">
              매칭 알림
            </p>
            <h2 className="mt-2 text-2xl font-black text-black">
              현재 반경 10km 안에 추천 가능한 나눔이 없습니다
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              보호자 위치를 바꾸거나 나눔자가 가까운 픽업 지점을 등록하면
              이곳에 추천 알림이 표시됩니다.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="brand-panel-dark animate-fade-up-delay-1 overflow-hidden p-0">
      <div className="px-6 py-6 text-white">
        <p className="text-xs font-black tracking-[0.16em] text-emerald-200 uppercase">
          매칭 알림
        </p>
        <h2 className="mt-1 flex items-center gap-2 text-2xl font-black">
          <BellIcon className="size-5" />
          현재 위치 기준 맞춤 나눔 {recommendedFoods.length}개 발견
        </h2>
        <p className="mt-2 text-sm text-emerald-50/80">
          가장 추천되는 나눔은 {topFood.name}입니다. 지도에서 사진 마커를
          눌러 픽업 위치를 확인하세요.
        </p>
      </div>

      <dl className="grid gap-3 bg-[#fffdf7] p-5 text-black md:grid-cols-3">
        <div className="brand-card-flat p-4 transition hover:-translate-y-0.5">
          <dt className="text-sm font-black text-[var(--accent)]">최우선 추천</dt>
          <dd className="mt-2 text-lg font-black text-[var(--accent-dark)]">
            {topFood.name}
          </dd>
          <dd className="mt-1 text-sm text-slate-600">
            추천 점수 {Math.round(topFood.match.matchScore)}점
          </dd>
        </div>
        <div className="brand-card-flat p-4 transition hover:-translate-y-0.5">
          <dt className="text-sm font-black text-orange-700">가장 긴급</dt>
          <dd className="mt-2 text-lg font-black text-black">
            {urgentFood?.name}
          </dd>
          <dd className="mt-1 text-sm text-slate-600">
            {formatExpiryLeft(urgentFood?.expiry_date ?? null)}
          </dd>
        </div>
        <div className="brand-card-flat p-4 transition hover:-translate-y-0.5">
          <dt className="text-sm font-black text-sky-700">가장 가까움</dt>
          <dd className="mt-2 text-lg font-black text-black">
            {nearestFood?.name}
          </dd>
          <dd className="mt-1 text-sm text-slate-600">
            {formatDistance(nearestFood?.match.distanceKm ?? 0)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
