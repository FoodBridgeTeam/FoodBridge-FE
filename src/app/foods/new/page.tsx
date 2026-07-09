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
          <div className="text-sm font-black text-slate-500 md:text-base">
            BobEum <span className="mx-2 text-[var(--line)]">/</span>
            <span className="text-black">Register</span>
          </div>
        </div>
        <div className="brand-search">
          <span>⌕</span>
          <span>Upload item photo first...</span>
        </div>
        <Link className="brand-avatar" href="/foods">
          AI
        </Link>
      </nav>

      <header className="brand-card animate-fade-up-delay-1 mb-10 p-7 md:p-10">
        <p className="brand-kicker">Giver · AI assisted</p>
        <h1 className="brand-heading mt-5 text-5xl md:text-6xl">
          REGISTER
          <br />
          SHARING
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
