import type { Metadata } from "next";
import Link from "next/link";

import { FoodRegistrationForm } from "@/features/foods/registration-form";

export const metadata: Metadata = {
  title: "나눔 등록 | 밥이음",
  description: "나눌 반려동물 사료·간식·용품과 픽업 위치를 등록합니다.",
};

export default function NewFoodPage() {
  return (
    <main className="brand-shell max-w-5xl">
      <nav className="brand-nav animate-fade-up">
        <div className="flex items-center gap-3">
          <Link className="brand-nav-button" href="/">
            ←
          </Link>
          <div className="flex items-end gap-3">
            <Link className="brand-wordmark" href="/">
              BobEum
            </Link>
            <span className="brand-breadcrumb pb-1">
              / <span className="text-black">등록</span>
            </span>
          </div>
        </div>
        <Link className="brand-button-soft" href="/foods">
          추천 목록
        </Link>
      </nav>

      <header className="brand-card animate-fade-up-delay-1 mb-10 p-7 md:p-10">
        <p className="brand-kicker">나눔자 · AI 지원</p>
        <h1 className="brand-heading mt-5 text-5xl md:text-6xl">
          나눔
          <br />
          등록
        </h1>
        <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-slate-600">
          사진 한 장으로 제품명, 성분, 대상 동물, 유통기한 후보를 채우고
          픽업 위치까지 등록합니다.
        </p>
      </header>
      <FoodRegistrationForm />
    </main>
  );
}
