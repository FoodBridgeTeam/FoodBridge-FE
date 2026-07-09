import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

const flow = [
  {
    title: "사진 AI 등록",
    description:
      "제품 사진과 성분표를 올리면 Gemini가 이름, 대상 동물, 성분, 유통기한 후보를 채워요.",
    icon: "📸",
  },
  {
    title: "반려동물 궁합 판정",
    description:
      "강아지·고양이 여부, 알러지, 처방식 여부를 먼저 확인해 위험한 매칭을 걸러요.",
    icon: "🐾",
  },
  {
    title: "가까운 나눔 우선 추천",
    description:
      "거리, 유통기한 긴급도, 궁합 점수를 합산해 바로 수령 가능한 나눔을 보여줘요.",
    icon: "🧭",
  },
];

const FALLBACK_ITEM_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'%3E%3Crect width='640' height='420' fill='%23ecfdf5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='72'%3E%F0%9F%90%BE%3C/text%3E%3C/svg%3E";

type FeaturedItem = Pick<
  Tables<"items">,
  | "category"
  | "expiry_date"
  | "id"
  | "image_url"
  | "name"
  | "remaining_amount"
  | "target_species"
>;

function formatExpiryLeft(expiryDate: string | null): string {
  if (!expiryDate) return "용품 나눔";

  const hoursLeft =
    (new Date(expiryDate).getTime() - Date.now()) / (60 * 60 * 1000);

  if (hoursLeft <= 0) return "마감 임박";
  if (hoursLeft < 24) return `${Math.ceil(hoursLeft)}시간 남음`;
  return `${Math.ceil(hoursLeft / 24)}일 남음`;
}

async function getFeaturedItem(): Promise<FeaturedItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(
      "category, expiry_date, id, image_url, name, remaining_amount, target_species",
    )
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function FeaturedItemCard({ item }: { item: FeaturedItem | null }) {
  return (
    <div className="animate-float-soft rounded-[2rem] bg-emerald-950 p-5 text-white shadow-2xl shadow-emerald-950/25">
      <div className="rounded-[1.5rem] bg-white p-4 text-emerald-950">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
            AI 궁합 추천
          </span>
          <span className="text-sm font-black text-emerald-700">
            {item ? "실시간" : "데모"}
          </span>
        </div>
        <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-emerald-100 p-5">
          {item ? (
            <>
              <div className="relative h-36 w-full overflow-hidden rounded-2xl shadow-sm">
                <Image
                  alt={`${item.name} 사진`}
                  className="object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 360px"
                  src={item.image_url ?? FALLBACK_ITEM_IMAGE}
                />
              </div>
              <h2 className="mt-4 text-2xl font-black">{item.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.remaining_amount} · {formatExpiryLeft(item.expiry_date)}
              </p>
            </>
          ) : (
            <>
              <p className="text-5xl">🐶</p>
              <h2 className="mt-4 text-2xl font-black">강아지 사료 1.2kg</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                닭고기 성분 확인 · 1.2km · 5일 남음
              </p>
            </>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
          <span className="rounded-xl bg-sky-50 px-2 py-3 text-sky-800">
            가까움
          </span>
          <span className="rounded-xl bg-orange-50 px-2 py-3 text-orange-800">
            안전 확인
          </span>
          <span className="rounded-xl bg-emerald-50 px-2 py-3 text-emerald-800">
            AI 분석
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const featuredItem = await getFeaturedItem();

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-12 md:py-20">
      <section className="surface-card relative w-full overflow-hidden rounded-[2.5rem] p-6 md:p-12">
        <div className="absolute -top-24 -right-20 size-72 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 size-80 rounded-full bg-emerald-300/25 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-fade-up">
            <p className="mb-5 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-black tracking-[0.14em] text-emerald-800 uppercase">
              BobEum · AI Pet Sharing
            </p>
            <h1 className="max-w-3xl text-4xl leading-tight font-black tracking-tight text-emerald-950 md:text-6xl">
              안 맞아서 남은 사료를
              <span className="block text-orange-500">
                필요한 반려동물에게.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              밥이음은 기호성 거부, 알러지 발견, 사료 교체로 남은 반려동물
              사료·간식·용품을 사진 AI 분석과 궁합 매칭으로 안전하게 연결하는
              나눔 플랫폼입니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="animate-pulse-glow rounded-2xl bg-emerald-700 px-6 py-4 text-center font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
                href="/foods/new"
              >
                사진으로 나눔 등록하기
              </Link>
              <Link
                className="rounded-2xl border border-emerald-900/15 bg-white px-6 py-4 text-center font-black text-emerald-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
                href="/foods"
              >
                우리 아이 맞춤 나눔 보기
              </Link>
            </div>
          </div>

          <div className="animate-fade-up-delay-1 relative">
            <FeaturedItemCard item={featuredItem} />
          </div>
        </div>

        <ul className="relative mt-10 grid gap-4 md:grid-cols-3">
          {flow.map((item, index) => (
            <li
              className="animate-fade-up-delay-2 rounded-3xl border border-emerald-900/10 bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              key={item.title}
              style={{ animationDelay: `${220 + index * 80}ms` }}
            >
              <span className="text-3xl">{item.icon}</span>
              <h3 className="mt-4 text-lg font-black text-emerald-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
