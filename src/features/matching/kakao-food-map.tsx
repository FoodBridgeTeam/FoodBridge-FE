"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  Coordinates,
  MatchScore,
} from "@/features/matching/calculate-match-score";

type MapFood = Coordinates & {
  id: string;
  imageUrl: string;
  match: MatchScore;
  name: string;
};

type KakaoFoodMapProps = {
  foods: MapFood[];
  javascriptKey: string | null;
  receiver: Coordinates;
};

function createReceiverLabel(): HTMLDivElement {
  const label = document.createElement("div");
  label.textContent = "나";
  label.setAttribute("aria-label", "보호자 위치");
  label.className =
    "flex size-10 items-center justify-center rounded-full border-4 border-white bg-sky-500 text-xs font-black text-white shadow-lg";
  return label;
}

function createFoodPhotoMarker(food: MapFood, rank: number): HTMLButtonElement {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className =
    "animate-marker-pop group relative flex w-20 flex-col items-center rounded-2xl border-4 border-[#fffdf7] bg-[#fffdf7] p-1 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl";
  marker.setAttribute(
    "aria-label",
    `${rank}위 추천 나눔 ${food.name} 지도 마커`,
  );

  const rankLabel = document.createElement("span");
  rankLabel.className =
    "absolute -top-3 -left-3 z-10 flex size-7 items-center justify-center rounded-full bg-[#06452f] text-xs font-black text-white shadow";
  rankLabel.textContent = String(rank);

  const image = document.createElement("img");
  image.alt = `${food.name} 사진`;
  image.className = "h-14 w-full rounded-xl object-cover";
  image.decoding = "async";
  image.loading = "lazy";
  image.src = food.imageUrl;

  const name = document.createElement("span");
  name.className =
    "mt-1 line-clamp-1 w-full text-center text-[0.65rem] font-black text-emerald-950";
  name.textContent = food.name;

  marker.append(rankLabel, image, name);
  return marker;
}

function createFoodDetailOverlay(food: MapFood, rank: number): HTMLDivElement {
  const content = document.createElement("div");
  content.className =
    "animate-marker-pop w-56 overflow-hidden rounded-2xl border-2 border-[#d9c9ae] bg-[#fffdf7] text-slate-900 shadow-2xl";

  const image = document.createElement("img");
  image.alt = `${food.name} 사진`;
  image.className = "h-28 w-full object-cover";
  image.decoding = "async";
  image.loading = "lazy";
  image.src = food.imageUrl;

  const body = document.createElement("div");
  body.className = "p-3";

  const rankLabel = document.createElement("p");
  rankLabel.className = "text-xs font-bold text-emerald-700";
  rankLabel.textContent = `추천 ${rank}위 · ${Math.round(food.match.matchScore)}점`;

  const name = document.createElement("strong");
  name.className = "mt-1 block text-base text-emerald-950";
  name.textContent = food.name;

  const coordinates = document.createElement("p");
  coordinates.className = "mt-1 text-xs text-slate-500";
  coordinates.textContent = `${food.latitude}, ${food.longitude}`;

  const distance = document.createElement("p");
  distance.className = "mt-2 text-xs font-bold text-slate-700";
  distance.textContent = `GPS 직선거리 ${food.match.distanceKm.toFixed(1)}km`;

  body.append(rankLabel, name, coordinates, distance);
  content.append(image, body);
  return content;
}

export function KakaoFoodMap({
  foods,
  javascriptKey,
  receiver,
}: KakaoFoodMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const handleSdkReady = useCallback(() => {
    if (!window.kakao) {
      setLoadError(true);
      return;
    }

    window.kakao.maps.load(() => {
      setLoadError(false);
      setSdkReady(true);
    });
  }, []);

  useEffect(() => {
    if (!sdkReady || !mapContainerRef.current || !window.kakao) {
      return;
    }

    const { maps } = window.kakao;
    const receiverPosition = new maps.LatLng(
      receiver.latitude,
      receiver.longitude,
    );
    const map = new maps.Map(mapContainerRef.current, {
      center: receiverPosition,
      level: 5,
    });
    const bounds = new maps.LatLngBounds();
    bounds.extend(receiverPosition);

    const receiverOverlay = new maps.CustomOverlay({
      content: createReceiverLabel(),
      map,
      position: receiverPosition,
      xAnchor: 0.5,
      yAnchor: 0.5,
    });

    const foodOverlays: KakaoCustomOverlay[] = [];
    const detailOverlays: KakaoCustomOverlay[] = [];
    const listeners: Array<{
      eventName: string;
      listener: () => void;
      target: HTMLElement;
    }> = [];

    foods.forEach((food, index) => {
      const position = new maps.LatLng(food.latitude, food.longitude);
      bounds.extend(position);

      const markerElement = createFoodPhotoMarker(food, index + 1);
      const detailElement = createFoodDetailOverlay(food, index + 1);
      const markerOverlay = new maps.CustomOverlay({
        content: markerElement,
        map,
        position,
        xAnchor: 0.5,
        yAnchor: 1,
      });
      const detailOverlay = new maps.CustomOverlay({
        content: detailElement,
        map: null,
        position,
        xAnchor: 0.5,
        yAnchor: 1.28,
      });
      const listener = () => {
        detailOverlays.forEach((overlay) => overlay.setMap(null));
        detailOverlay.setMap(map);
        detailOverlay.setZIndex(10);
      };
      const closeListener = () => {
        detailOverlay.setMap(null);
      };

      markerElement.addEventListener("click", listener);
      markerElement.addEventListener("dblclick", closeListener);

      foodOverlays.push(markerOverlay);
      detailOverlays.push(detailOverlay);
      listeners.push({
        eventName: "click",
        listener,
        target: markerElement,
      });
      listeners.push({
        eventName: "dblclick",
        listener: closeListener,
        target: markerElement,
      });
    });

    if (foods.length > 0) {
      map.setBounds(bounds);
    } else {
      map.setCenter(receiverPosition);
      map.setLevel(5);
    }

    return () => {
      listeners.forEach(({ eventName, target, listener }) => {
        target.removeEventListener(eventName, listener);
      });
      detailOverlays.forEach((overlay) => overlay.setMap(null));
      foodOverlays.forEach((overlay) => overlay.setMap(null));
      receiverOverlay.setMap(null);
    };
  }, [foods, receiver, sdkReady]);

  return (
    <section className="brand-panel-dark animate-fade-up-delay-2 overflow-hidden p-5 md:p-7">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black tracking-[0.14em] text-emerald-200 uppercase">
            카카오 지도
          </p>
          <h2 className="mt-2 text-2xl font-black">픽업 위치 지도</h2>
        </div>
        <p className="text-sm text-emerald-100/70">
          사진 마커를 누르면 나눔 정보를 볼 수 있습니다.
        </p>
      </div>

      {javascriptKey ? (
        <>
          <Script
            id="kakao-maps-sdk"
            onError={() => setLoadError(true)}
            onLoad={handleSdkReady}
            onReady={handleSdkReady}
            src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(javascriptKey)}&autoload=false`}
            strategy="afterInteractive"
          />
          <div
            aria-label="보호자와 등록 나눔의 카카오 지도"
            className="relative mt-6 h-[26rem] overflow-hidden rounded-[1.5rem] border-2 border-[#d9c9ae] bg-emerald-900/50"
            ref={mapContainerRef}
            role="application"
          >
            {!sdkReady && !loadError ? (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-emerald-100">
                카카오 지도를 불러오고 있어요...
              </div>
            ) : null}
            {loadError ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-bold text-rose-200">
                지도를 불러오지 못했습니다. JavaScript 키와 허용 도메인을
                확인해 주세요.
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border-2 border-amber-300/30 bg-amber-100/10 px-6 py-12 text-center text-sm font-bold text-amber-100">
          NEXT_PUBLIC_KAKAO_MAP_JAVASCRIPT_KEY 환경변수를 설정해 주세요.
        </div>
      )}
    </section>
  );
}
