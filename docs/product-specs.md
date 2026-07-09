# 밥이음 BobEum Product Specs

## 1. Product Summary

**밥이음**은 가정에서 남게 되는 반려동물 사료·간식·용품을 주변 이웃 반려인, 임시보호자, 캣맘, 소규모 보호소에게 연결하는 웹 기반 MVP 서비스이다.

사료가 남는 대표적인 이유:

- 반려동물이 먹지 않음
- 알러지 발견
- 처방식 전환
- 나이/체급 변화
- 펫로스
- 대용량 구매 후 잔여분 발생

기존 중고거래/나눔 게시판은 “누가 받을 수 있는지”를 판단해 주지 않는다. 밥이음은 AI가 사료 사진과 성분표를 분석하고, 수혜자의 반려동물 프로필과 비교해 **AI 궁합 판정**을 제공한다.

MVP 목표:

> 해커톤 시간 안에 “등록 → AI 분석 → AI 궁합 판정 → 위치 기반 추천 → 수령 신청 → 상태 변경” 흐름을 시연한다.

## 2. Core Problem

반려동물 가정에서는 잉여 사료와 용품이 반복적으로 발생하지만, 이를 안전하게 연결하는 전용 인프라가 부족하다.

핵심 문제:

1. 먹지 않는 사료가 집에 남지만 처리 출구가 부족하다.
2. 개봉 사료는 일반 기부처에서 받기 어렵다.
3. 범용 중고거래 플랫폼은 반려동물 프로필 기반 적합성 판단을 제공하지 않는다.
4. 수령자가 성분표를 직접 해석해야 하므로 신뢰가 낮다.
5. 알러지·나이·체급·처방식 여부가 맞지 않으면 잘못 급여할 위험이 있다.
6. 유통기한 임박 사료가 우선적으로 연결되지 않아 폐기될 수 있다.

## 3. Product Positioning

밥이음은 단순 나눔 게시판이 아니다.

It is:

- AI-assisted pet food donation matching platform
- Location-based surplus pet supply matching MVP
- Ingredient compatibility assistant for pet food sharing

It is not:

- 중고거래 앱
- 사료 판매 플랫폼
- 수의학 진단 서비스
- 처방식 대체 판단 서비스
- 결제/배송 플랫폼

## 4. Main Personas

### 4.1 나눔자

남는 사료나 용품을 가진 사람.

Examples:

- 사료를 샀지만 반려동물이 먹지 않음
- 알러지가 발견되어 급여 중단
- 처방식으로 전환
- 대용량 구매 후 많이 남음
- 펫로스로 남은 용품이 생김

Needs:

- 빠른 등록
- 사진 기반 자동 입력
- 주변에서 필요한 사람 찾기
- 돈 거래 없이 부담 없는 나눔
- 예약 상태 관리

### 4.2 수혜자

사료나 용품이 필요한 사람.

Examples:

- 이웃 반려인
- 캣맘
- 임시보호자
- 소규모 사설 보호소
- 다묘/다견 가정

Needs:

- 가까운 물품 찾기
- 우리 반려동물이 먹어도 되는지 확인
- 알러지 충돌 피하기
- 유통기한 임박 물품 우선 확인
- 수령 신청 및 픽업 위치 확인

### 4.3 반려동물 프로필

수혜자가 등록하는 매칭 기준.

Fields:

- 종: 강아지 / 고양이
- 품종
- 나이
- 몸무게
- 알러지 성분
- 질환/처방식 여부

## 5. MVP User Flow

### 5.1 나눔자 등록 Flow

1. 나눔자가 물품 등록 페이지로 이동한다.
2. 제품 전면 사진을 업로드한다.
3. 성분표 사진을 업로드한다.
4. AI가 제품명, 브랜드, 카테고리, 대상 동물, 잔여량, 개봉 상태, 유통기한 후보를 추정한다.
5. 나눔자가 AI 결과를 확인하고 수정한다.
6. 위치를 GPS 또는 수동 좌표로 입력한다.
7. 물품을 등록한다.
8. 등록된 물품은 `available` 상태가 된다.

### 5.2 수혜자 추천 Flow

1. 수혜자가 반려동물 프로필을 등록한다.
2. 현재 위치를 GPS 또는 수동 좌표로 입력한다.
3. 시스템이 `available` 물품을 조회한다.
4. AI 또는 저장된 성분 분석 결과를 바탕으로 반려동물과 물품의 궁합을 판정한다.
5. `unsuitable` 물품은 제외한다.
6. 거리, 유통기한 긴급도, AI 궁합 점수로 추천 점수를 계산한다.
7. 추천 목록과 지도 마커를 표시한다.
8. 수혜자가 수령 신청을 한다.
9. 물품 상태가 `reserved`로 변경된다.
10. 예약된 물품은 다른 추천 목록에서 제외된다.

## 6. Pages

### 6.1 Main Page

Purpose:

- 서비스 설명
- 나눔 등록 CTA
- 추천 물품 보기 CTA
- 프로젝트 핵심 가치 전달

Required copy points:

- 남는 사료를 필요한 반려동물에게
- AI 성분 궁합 판정
- 위치 기반 나눔 매칭
- 무상 나눔 전용

### 6.2 Item Registration Page

Required features:

- 제품 사진 업로드
- 성분표 사진 업로드
- AI 분석 버튼
- AI 분석 결과 미리 채우기
- 수정 가능한 입력 폼
- GPS 현재 위치 가져오기
- 수동 좌표 입력
- 시연용 위치 프리셋
- 등록 버튼

Required fields:

- 제품명
- 브랜드
- 카테고리
- 대상 동물
- 잔여량
- 개봉 여부
- 개봉 시점
- 유통기한
- 위도
- 경도
- 사진 URL
- 성분표 분석 결과

### 6.3 Pet Profile Page

Required features:

- 반려동물 등록
- 기존 프로필 선택
- 알러지 성분 다중 선택
- 질환/처방식 여부 입력

Required fields:

- 이름
- 종
- 품종
- 나이
- 몸무게
- 알러지 성분
- 질환/특이사항

### 6.4 Recommendation Page

Required features:

- 프로필 선택
- 현재 위치 입력
- 추천 목록
- AI 궁합 판정 표시
- 매칭 점수 표시
- 거리 표시
- 유통기한 표시
- 개봉 상태 표시
- 수령 신청 버튼
- 지도 마커
- 상단 알림 카드

Top alert cards:

- 우리 아이가 먹을 수 있는 물품 수
- 가장 가까운 물품
- 유통기한이 가장 긴급한 물품
- 추천 1순위 물품

### 6.5 Map

Required features:

- 수혜자 위치 마커
- 물품 위치 마커
- 제품 사진 기반 커스텀 마커 if existing project supports it
- 마커 클릭 시 물품 정보 표시
- AI 궁합 판정 결과 표시

Out of scope:

- 실시간 길찾기
- 거리 기반 배송 계산
- 라이더/배송 기능

## 7. AI Features

### 7.1 Product Image Analysis

Input:

- 제품 전면 사진
- optional 성분표 사진

Output:

- 제품명
- 브랜드
- 카테고리
- 대상 동물
- 잔여량 추정
- 개봉 상태 추정
- 유통기한 후보
- 원재료 후보
- 신뢰도
- 설명

The user must be able to review and edit AI-filled fields before saving.

### 7.2 Ingredient Compatibility Analysis

Input:

- item ingredients
- target species
- pet profile
- allergies
- age
- weight
- condition
- prescription diet flag

Output:

- compatibility: `suitable` / `conditional` / `unsuitable`
- score: 0 to 100
- reason
- warnings
- alternative recommendation query

Rules:

- Explicit allergy conflict should result in `unsuitable`.
- Species mismatch should result in `unsuitable`.
- Expired item should result in `unsuitable`.
- Prescription diet should show “수의사 상담 권장”.
- Unknown or uncertain ingredients should not be hidden.
- AI must not guarantee safety.

### 7.3 Alternative Feed Recommendation Mock

When compatibility is `unsuitable`, show a mock alternative recommendation card.

Required card fields:

- 추천 조건
- 피해야 할 성분
- 추천 사료 타입
- 예시 상품명
- 제휴 쇼핑몰 이동 버튼 mock

This is for business-model demonstration only. Do not implement real payment or checkout.

## 8. Matching Rules

Use the detailed scoring rules in `docs/algorithms.md`.

Summary:

- AI 궁합: 40%
- 거리: 30%
- 유통기한 긴급도: 30%

Hard exclusions:

- `status !== available`
- expired item
- distance greater than 10km
- compatibility is `unsuitable`
- species mismatch

## 9. Item Status

Valid item states:

- `available`: 신청 가능
- `reserved`: 예약됨
- `completed`: 수령 완료

MVP behavior:

- When a user requests an item, update status from `available` to `reserved`.
- Reserved items are excluded from recommendation lists.
- Completed state can exist in DB, but full completion flow is optional.

## 10. Safety and Policy

The MVP must include safety-aware UX.

Required notices:

- “AI 궁합 판정은 참고 정보이며, 최종 급여 판단은 보호자가 확인해야 합니다.”
- “알러지나 질환이 있는 반려동물은 수의사 상담을 권장합니다.”
- “처방식은 수의사 상담 후 급여하세요.”
- “유통기한이 지났거나 보관 상태가 불확실한 사료는 나눔 대상에서 제외됩니다.”

Product policy:

- Donation-only
- No price fields
- No payment
- No sale/auction/trade features
- No medical diagnosis
- No guarantee of safety
- No automatic approval without user review

Legal note:

- This MVP avoids sales functionality by design.
- Commercial launch requires legal review around pet food sharing, opened products, liability, privacy, and animal health claims.

## 11. Business Model

The donation transaction itself is not monetized.

Primary model:

### AI Alternative Feed Recommendation Commerce

Reasoning:

- A user donating food often has a purchase intent because the current food did not work.
- A receiver seeing `unsuitable` also has a purchase intent because they need a compatible alternative.
- The same AI compatibility pipeline can generate alternative feed suggestions.

MVP:

- Show mock affiliate cards.
- Do not implement real affiliate tracking unless explicitly requested.
- Do not implement checkout.

Future models:

- Affiliate commission on alternative pet food
- Brand sample targeting based on opt-in data
- Premium plan for shelters/cat caretakers with multi-pet profiles
- Local government/ESG animal welfare partnerships

Excluded in MVP:

- Profile-based targeted ads
- Selling user health/allergy data
- Paid trading of shared food

## 12. MVP Success Criteria

The MVP is successful if the demo can show:

1. A donor uploads pet food and ingredient photos.
2. AI fills product fields.
3. Donor edits and registers the item.
4. Receiver creates a pet profile with allergy/condition data.
5. AI judges item compatibility.
6. Unsuitable items are excluded.
7. Suitable/conditional items are ranked by compatibility, distance, and urgency.
8. Receiver reserves an item.
9. Reserved item disappears from available recommendations.
10. Map shows pickup location.
11. Unsuitable flow shows mock alternative feed recommendation.

## 13. Naming

Product name:

- Korean: 밥이음
- English code name: BobEum

Recommended UI slogan:

> 남는 사료를, 먹을 수 있는 아이에게.

Alternative slogan:

> 버려질 사료를 AI 궁합 매칭으로 필요한 반려동물에게 연결합니다.
