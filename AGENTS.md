# AGENTS.md — 밥이음 BobEum Project Harness

## Project Identity

Current product: **밥이음 BobEum**

This repository was originally built as **FoodBridge**, a surplus human food matching MVP. It is now being pivoted into **BobEum**, a surplus pet food and pet supplies matching MVP.

Treat old FoodBridge naming such as `food`, `supplier`, `receiver`, `expiry`, and `match` as legacy domain language. When editing touched files, migrate user-facing language to the BobEum domain.

Core product flow:

등록 → AI 분석 → AI 궁합 판정 → 위치 기반 추천 → 수령 신청 → 상태 변경

## Source of Truth Documents

Read these before making product or database changes:

- `docs/product-specs.md` — product scope, UX, personas, MVP boundaries
- `docs/db-schema.md` — Supabase table structure and field meaning
- `docs/algorithms.md` — compatibility, matching score, distance, urgency algorithms

If code and docs disagree, prefer these docs unless existing production behavior clearly requires otherwise.

## MVP Scope

Implement only the BobEum MVP.

In scope:

- Main page
- Item registration page
- Pet profile registration page
- Recommendation/list page
- Supabase DB integration
- Supabase Storage image upload
- Gemini-based product image analysis
- Gemini-based ingredient/compatibility analysis
- GPS/manual location input
- Location-based matching
- Reservation status update
- Kakao map marker display
- In-page recommendation alert cards

Out of scope:

- Login/signup
- Payment
- Paid transactions
- Chat
- Admin page
- Push notifications
- Complex authorization
- Real route navigation
- Real veterinary diagnosis
- Real affiliate checkout

## Business Rule Hard Constraints

- This MVP is **donation-only**. Do not implement price, checkout, payment, bidding, escrow, or settlement.
- Items can be requested/reserved, not purchased.
- AI compatibility output is advisory. It must not be presented as veterinary diagnosis or guaranteed safety.
- Prescription diet items must show a “수의사 상담 권장” notice.
- Expired items must not appear in recommendation results.
- Items judged `unsuitable` for a pet must be excluded from that pet’s recommendation list.
- Reserved/completed items must not appear in available recommendations.

## Technical Stack

Keep the existing stack unless the user explicitly asks otherwise:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Storage
- Gemini API
- Kakao Maps JavaScript API
- Browser Geolocation API
- Vercel

## Implementation Rules

- Prefer small, reversible changes.
- Preserve existing working infrastructure from FoodBridge when possible.
- Rename UI/domain language only when needed for BobEum clarity.
- Keep server-only API keys out of client components.
- Use typed data shapes for AI responses.
- Validate AI JSON before writing it to the database.
- Do not trust OCR/AI output blindly; show editable fields to the user.
- Keep matching logic deterministic after AI compatibility values are produced.
- Do not add new external libraries unless necessary.

## UI Tone

Use Korean user-facing copy.

The service tone should be:

- Warm
- Trustworthy
- Practical
- Safety-aware
- Not overly cute

Preferred terms:

- 나눔자
- 수혜자
- 반려동물
- 사료
- 간식
- 용품
- AI 궁합 판정
- 수령 신청
- 예약됨

Avoid terms from the old FoodBridge domain in user-facing UI:

- 잉여 식품
- 급식소
- 편의점
- 음식 수령
- 식품 추천

## Done Criteria

A task is complete only when:

- Relevant UI copy uses BobEum terminology.
- Data model matches `docs/db-schema.md`.
- Matching behavior matches `docs/algorithms.md`.
- MVP boundaries in `docs/product-specs.md` are respected.
- `npm run build` passes if the project has a build script.
- No payment, sales, or veterinary-diagnosis behavior is introduced.
