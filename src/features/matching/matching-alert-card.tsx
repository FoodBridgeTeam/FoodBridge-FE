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
      <section className="animate-fade-up-delay-1 rounded-[1.75rem] border border-amber-200 bg-amber-50/90 p-5 shadow-sm">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            🔔
          </div>
          <div>
            <p className="text-sm font-black tracking-[0.14em] text-amber-700 uppercase">
              Matching Alert
            </p>
            <h2 className="mt-1 text-2xl font-black text-amber-950">
              현재 반경 10km 안에 추천 가능한 나눔이 없습니다
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              보호자 위치를 바꾸거나 나눔자가 가까운 픽업 지점을 등록하면
              이곳에 추천 알림이 표시됩니다.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-up-delay-1 overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white/90 shadow-xl shadow-emerald-950/10 backdrop-blur">
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-800 to-orange-500 px-5 py-5 text-white">
        <p className="text-xs font-black tracking-[0.16em] text-emerald-300 uppercase">
          Matching Alert
        </p>
        <h2 className="mt-1 text-2xl font-black">
          🔔 현재 위치 기준 맞춤 나눔 {recommendedFoods.length}개 발견
        </h2>
        <p className="mt-2 text-sm text-emerald-50/80">
          가장 추천되는 나눔은 {topFood.name}입니다. 지도에서 사진 마커를
          눌러 픽업 위치를 확인하세요.
        </p>
      </div>

      <dl className="grid gap-3 p-5 md:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-4 transition hover:-translate-y-0.5">
          <dt className="text-sm font-bold text-emerald-700">최우선 추천</dt>
          <dd className="mt-2 text-lg font-black text-emerald-950">
            {topFood.name}
          </dd>
          <dd className="mt-1 text-sm text-slate-600">
            추천 점수 {Math.round(topFood.match.matchScore)}점
          </dd>
        </div>
        <div className="rounded-2xl bg-orange-50 p-4 transition hover:-translate-y-0.5">
          <dt className="text-sm font-bold text-orange-700">가장 긴급</dt>
          <dd className="mt-2 text-lg font-black text-amber-950">
            {urgentFood?.name}
          </dd>
          <dd className="mt-1 text-sm text-slate-600">
            {formatExpiryLeft(urgentFood?.expiry_date ?? null)}
          </dd>
        </div>
        <div className="rounded-2xl bg-sky-50 p-4 transition hover:-translate-y-0.5">
          <dt className="text-sm font-bold text-sky-700">가장 가까움</dt>
          <dd className="mt-2 text-lg font-black text-sky-950">
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
