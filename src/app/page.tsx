import Image from "next/image";
import Link from "next/link";

import { BellIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

const FALLBACK_ITEM_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'%3E%3Crect width='640' height='420' fill='%23fff7e8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='72'%3E%F0%9F%90%BE%3C/text%3E%3C/svg%3E";

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

const overviewCards = [
  {
    label: "AI 안전 점검",
    title: "성분 궁합",
    value: "40%",
    delta: "+ 알러지 우선 필터",
    tone: "green",
  },
  {
    label: "픽업 반경",
    title: "거리 추천",
    value: "10km",
    delta: "가까운 나눔 우선",
    tone: "orange",
  },
  {
    label: "등록 도우미",
    title: "사진 분석",
    value: "Gemini",
    delta: "제품명·성분 자동 입력",
    tone: "green",
  },
  {
    label: "나눔 상태",
    title: "상태 관리",
    value: "3단계",
    delta: "등록 · 예약 · 완료",
    tone: "orange",
  },
];

const flow = [
  "사진으로 사료·간식·용품 등록",
  "AI가 대상 동물과 주의 성분 분석",
  "반려동물 프로필 기반으로 궁합 추천",
  "수령 신청 시 목록에서 자동 예약 처리",
];

function formatExpiryLeft(expiryDate: string | null): string {
  if (!expiryDate) return "용품 나눔";

  const hoursLeft =
    (new Date(expiryDate).getTime() - Date.now()) / (60 * 60 * 1000);

  if (hoursLeft <= 0) return "마감 임박";
  if (hoursLeft < 24) return `${Math.ceil(hoursLeft)}시간 남음`;
  return `${Math.ceil(hoursLeft / 24)}일 남음`;
}

function formatSpecies(targetSpecies: string) {
  if (targetSpecies === "dog") return "강아지";
  if (targetSpecies === "cat") return "고양이";
  if (targetSpecies === "both") return "강아지·고양이";
  return "대상 확인";
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

function TopNav() {
  return (
    <nav className="brand-nav animate-fade-up">
      <div className="text-sm font-black text-slate-500 md:text-base">
        BobEum <span className="mx-2 text-[var(--line)]">/</span>
        <span className="text-black">개요</span>
      </div>
      <div className="flex items-center gap-3">
        <Link className="brand-nav-button relative" href="/foods">
          <BellIcon className="size-5" />
          <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-[var(--accent)] text-xs text-white">
            3
          </span>
        </Link>
        <Link className="brand-button-soft" href="/foods/new">
          + 나눔 등록
        </Link>
      </div>
    </nav>
  );
}

function OverviewCard({
  card,
  index,
}: {
  card: (typeof overviewCards)[number];
  index: number;
}) {
  return (
    <article
      className="brand-card animate-fade-up p-6 transition hover:-translate-y-1 md:p-7"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-xl">
          {card.tone === "green" ? "▦" : "⌁"}
        </span>
        <div>
          <p className="text-sm font-black text-slate-600">{card.title}</p>
          <p className="text-xs font-bold text-slate-400">{card.label}</p>
        </div>
      </div>
      <strong className="mt-5 block text-4xl font-black tracking-tight text-black">
        {card.value}
      </strong>
      <span
        className={
          card.tone === "green"
            ? "brand-pill mt-8"
            : "brand-pill brand-pill-orange mt-8"
        }
      >
        ↗ {card.delta}
      </span>
      <div
        className={
          card.tone === "green"
            ? "brand-stat-line mt-4"
            : "brand-stat-line brand-orange-line mt-4"
        }
      />
    </article>
  );
}

function FeaturedItemCard({ item }: { item: FeaturedItem | null }) {
  return (
    <article className="brand-panel-dark animate-float-soft p-5 md:p-7">
      <div className="rounded-[1.8rem] bg-[#fffdf7] p-5 text-black md:p-7">
        <div className="flex items-center justify-between gap-4">
          <span className="brand-pill brand-pill-orange">긴급 매칭</span>
          <strong className="text-3xl font-black text-[var(--accent)]">
            {item ? "실시간" : "데모"}
          </strong>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-orange-100 via-[#f7f5d7] to-emerald-100 p-5">
          <div className="relative h-44 overflow-hidden rounded-[1.3rem] border-2 border-white bg-white shadow-sm">
            <Image
              alt={item ? `${item.name} 사진` : "밥이음 데모 나눔"}
              className="object-cover"
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              src={item?.image_url ?? FALLBACK_ITEM_IMAGE}
            />
          </div>
          <h2 className="mt-5 text-3xl font-black leading-tight text-[var(--accent-dark)] md:text-4xl">
            {item?.name ?? "강아지 사료 1.2kg"}
          </h2>
          <p className="mt-3 text-lg font-bold text-slate-600">
            {item
              ? `${item.remaining_amount ?? "수량 확인"} · ${formatExpiryLeft(item.expiry_date)} · ${formatSpecies(item.target_species)}`
              : "닭고기 성분 확인 · 1.2km · 5일 남음"}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <span className="rounded-2xl bg-sky-50 px-3 py-4 font-black text-sky-800">
            가까움
          </span>
          <span className="rounded-2xl bg-orange-50 px-3 py-4 font-black text-orange-800">
            안전
          </span>
          <span className="rounded-2xl bg-emerald-50 px-3 py-4 font-black text-emerald-800">
            AI 분석
          </span>
        </div>
      </div>
    </article>
  );
}

export default async function Home() {
  const featuredItem = await getFeaturedItem();

  return (
    <main className="brand-shell">
      <TopNav />

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <p className="brand-kicker animate-fade-up">반려동물 나눔 대시보드</p>
          <h1 className="brand-heading animate-fade-up-delay-1 mt-5 text-5xl md:text-7xl">
            BOBEUM
            <br />
            개요
          </h1>
          <p className="animate-fade-up-delay-2 mt-6 max-w-2xl text-xl font-bold leading-9 text-slate-600">
            안 맞아서 남은 반려동물 사료·간식·용품을 AI 성분 분석과 궁합
            매칭으로 필요한 보호자에게 연결합니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="brand-button-dark" href="/foods/new">
              + 사진으로 나눔 등록
            </Link>
            <Link className="brand-button-soft" href="/foods">
              맞춤 나눔 추천 보기
            </Link>
          </div>
        </div>

        <FeaturedItemCard item={featuredItem} />
      </section>

      <section className="mt-12 grid gap-7 md:grid-cols-2">
        {overviewCards.map((card, index) => (
          <OverviewCard card={card} index={index} key={card.title} />
        ))}
      </section>

      <section className="brand-card mt-12 p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="brand-kicker">서비스 흐름</p>
            <h2 className="mt-3 text-3xl font-black text-black md:text-4xl">
              시연 흐름
            </h2>
          </div>
          <Link className="brand-button" href="/foods/new">
            바로 시작
          </Link>
        </div>
        <ol className="mt-7 grid gap-4 md:grid-cols-4">
          {flow.map((item, index) => (
            <li className="brand-card-flat p-5" key={item}>
              <span className="brand-pill">{String(index + 1).padStart(2, "0")}</span>
              <p className="mt-4 text-lg font-black leading-7 text-[var(--accent-dark)]">
                {item}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
