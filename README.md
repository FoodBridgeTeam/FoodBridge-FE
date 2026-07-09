# BobEum Frontend

기호성 거부, 알러지 발견, 사료 교체로 남은 반려동물 사료·간식·용품을
필요한 보호자에게 연결하는 해커톤 MVP의 Next.js 프론트엔드입니다.

백엔드/DB 마이그레이션은 별도 `backend` 저장소에서 관리하는 것을 전제로
분리되어 있습니다.

## 기술 기반

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase PostgreSQL 및 Storage
- Gemini API 이미지 분석
- Kakao Maps JavaScript API
- Browser Geolocation API

## 로컬 실행

1. 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. 환경 파일을 만들고 Supabase, Kakao, Gemini 값을 입력합니다.

   ```bash
   cp .env.example .env.local
   ```

   `GEMINI_API_KEY`는 서버에서만 사용하는 비공개 키입니다.
   `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

3. 백엔드 저장소의 `supabase/migrations/` SQL 파일을 파일명 순서대로
   Supabase SQL Editor에서 실행하거나 Supabase CLI로 적용합니다.

4. 개발 서버를 실행합니다.

   ```bash
   npm run dev
   ```

## 디렉터리 구조

```text
src/
├── app/                 # 화면과 Route Handlers
├── features/            # registration, matching 도메인 로직
├── lib/
│   └── supabase/        # 브라우저/서버 연결 경계
└── types/               # DB 생성 타입과 공용 타입
docs/                    # 제품/DB/알고리즘 하네스 규칙 사본
```

`frontend/AGENTS.md`와 `frontend/docs/`는 프론트엔드 저장소 단위로
하네스 엔지니어링을 적용하기 위한 System of Record입니다.

## 현재 구현

- `/`: 밥이음 서비스 홈과 DB 기반 실시간 추천 카드
- `/foods`: 반려동물 프로필, 알러지, 처방식 여부, 위치를 기반으로 한 AI
  궁합 추천 목록 및 카카오 픽업 위치 지도
- `/foods/new`: 제품 사진·성분표 사진 업로드, Gemini 사진 분석 기반
  등록값 자동 입력, Supabase Storage 업로드, GPS/시연 좌표 기반 나눔 등록
- 수령 신청 시 `items.status`를 `reserved`로 변경하고 `matches` 기록 생성

AI 사진 분석은 등록 보조 기능입니다. 유통기한, 개봉일, 성분, 처방식 여부는
최종 등록 전 사람이 직접 확인해야 하며, 수의학적 진단을 제공하지 않습니다.
