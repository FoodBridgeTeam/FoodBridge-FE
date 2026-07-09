import type { Metadata } from "next";
import Link from "next/link";

import { FoodRegistrationForm } from "@/features/foods/registration-form";

export const metadata: Metadata = {
  title: "나눔 등록 | 밥이음",
  description: "나눌 반려동물 사료·간식·용품과 픽업 위치를 등록합니다.",
};

export default function NewFoodPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 md:py-16">
      <Link
        className="inline-flex rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm transition hover:-translate-x-0.5 hover:text-emerald-950"
        href="/"
      >
        ← 밥이음 홈
      </Link>
      <header className="animate-fade-up mb-10 mt-8 overflow-hidden rounded-[2rem] bg-emerald-950 p-7 text-white shadow-2xl shadow-emerald-950/15 md:p-10">
        <p className="inline-flex rounded-full bg-emerald-300/15 px-4 py-2 text-sm font-black tracking-[0.16em] text-emerald-200 uppercase">
          Giver · AI assisted
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
          사진 한 장으로 나눔을 시작하세요
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-emerald-50/80">
          AI가 제품 사진과 성분표를 읽어 등록을 돕고, GPS 픽업 위치와 함께
          필요한 반려동물에게 추천합니다.
        </p>
      </header>
      <FoodRegistrationForm />
    </main>
  );
}
