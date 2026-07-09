import type { Metadata } from "next";
import Link from "next/link";

import {
  rankFoodsByMatchScore,
  type ReceiverProfile,
} from "@/features/matching/calculate-match-score";
import { KakaoFoodMap } from "@/features/matching/kakao-food-map";
import { MatchingAlertCard } from "@/features/matching/matching-alert-card";
import { RankedFoodCard } from "@/features/matching/ranked-food-card";
import { ReceiverProfileForm } from "@/features/matching/receiver-profile-form";
import {
  parseReceiverProfile,
  type ReceiverSearchParams,
} from "@/features/matching/receiver-profile";
import { createClient } from "@/lib/supabase/server";
import { getKakaoMapJavascriptKey } from "@/lib/env";

export const metadata: Metadata = {
  title: "맞춤 나눔 추천 | 밥이음",
  description: "반려동물 프로필, 위치, 유통기한을 반영한 사료·용품 추천 목록",
};

type FoodsPageProps = {
  searchParams: Promise<ReceiverSearchParams>;
};

const FALLBACK_ITEM_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'%3E%3Crect width='640' height='420' fill='%23ecfdf5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='72'%3E%F0%9F%90%BE%3C/text%3E%3C/svg%3E";

async function getRankedFoods(receiver: ReceiverProfile) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("status", "available");

  if (error) {
    throw new Error(`등록 물품을 불러오지 못했습니다: ${error.message}`);
  }

  const rankedFoods = rankFoodsByMatchScore(data, receiver);

  return rankedFoods.flatMap((food) => {
    if (typeof food.latitude !== "number" || typeof food.longitude !== "number") {
      return [];
    }

    return [
      {
        ...food,
        imageUrl: food.image_url ?? FALLBACK_ITEM_IMAGE,
        latitude: food.latitude,
        longitude: food.longitude,
      },
    ];
  });
}

export default async function FoodsPage({ searchParams }: FoodsPageProps) {
  const receiver = parseReceiverProfile(await searchParams);
  const foods = await getRankedFoods(receiver);
  const kakaoMapJavascriptKey = getKakaoMapJavascriptKey();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          className="inline-flex rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:-translate-x-0.5 hover:text-emerald-950"
          href="/"
        >
          ← 밥이음 홈
        </Link>
        <Link
          className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800"
          href="/foods/new"
        >
          + 나눔 등록
        </Link>
      </div>

      <header className="animate-fade-up mt-8 rounded-[2rem] bg-white/75 p-7 shadow-sm backdrop-blur md:p-10">
        <p className="inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-black tracking-[0.16em] text-orange-700 uppercase">
          Pet profile · AI matching
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-emerald-950 md:text-5xl">
          우리 아이에게 맞는 나눔
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          10km 이내 사료·간식·용품을 대상으로 반려동물 종, 알러지, 처방식
          여부를 먼저 걸러낸 뒤 궁합 40%, 거리 30%, 유통기한 긴급도 30%로
          추천합니다.
        </p>
      </header>

      <section className="mt-8">
        <ReceiverProfileForm receiver={receiver} />
      </section>

      <div className="mt-6">
        <MatchingAlertCard foods={foods} />
      </div>

      <div className="mt-8">
        <KakaoFoodMap
          foods={foods}
          javascriptKey={kakaoMapJavascriptKey}
          receiver={receiver}
        />
      </div>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-emerald-700">AI MATCHING</p>
            <h2 className="mt-1 text-2xl font-black text-emerald-950">
              추천 결과
            </h2>
          </div>
          <span className="text-sm font-bold text-slate-500">
            {foods.length}개 나눔
          </span>
        </div>

        {foods.length > 0 ? (
          <div className="space-y-5">
            {foods.map((food, index) => (
              <RankedFoodCard food={food} key={food.id} rank={index + 1} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-white px-6 py-16 text-center">
            <h3 className="text-xl font-black text-emerald-950">
              추천 가능한 나눔이 없습니다
            </h3>
            <p className="mt-2 text-slate-500">
              보호자 위치를 바꾸거나 가까운 나눔이 등록되면 이곳에 추천 결과가
              표시됩니다.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
