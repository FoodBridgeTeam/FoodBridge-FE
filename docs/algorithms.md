# BobEum Algorithms

This document defines deterministic matching behavior for the BobEum MVP.

AI is used for extraction and compatibility reasoning, but final ranking must be deterministic and testable.

## 1. Core Concepts

BobEum matching uses three scores:

1. Compatibility score
2. Distance score
3. Donation priority score

Final score:

```txt
match_score = compatibility_score * 0.4
            + distance_score * 0.3
            + donation_priority_score * 0.3
```

All component scores are normalized from 0 to 100.

## 2. Hard Exclusion Rules

An item must be excluded from recommendations if any condition is true:

- item.status is not `available`
- item.expiry_date is before today
- item is food/treat/prescription and item.expiry_date is less than 14 days away
- distance is greater than 10km
- compatibility is `unsuitable`
- target species does not match pet species
- item has no usable location
- pet has no usable location
- item is food/treat but ingredients are missing and compatibility cannot be assessed

For supplies, such as bowls or pads, ingredient compatibility can be skipped.

## 3. Distance Calculation

Use Haversine distance.

Inputs:

- pet/user latitude
- pet/user longitude
- item latitude
- item longitude

Output:

- distance in kilometers

Pseudo-code:

```ts
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

## 4. Distance Score

10km is the MVP service radius.

```txt
distance_score = max(0, 100 - (distance_km / 10) * 100)
```

Examples:

| Distance | Score |
|---:|---:|
| 0km | 100 |
| 1km | 90 |
| 5km | 50 |
| 10km | 0 |
| 11km | excluded |

## 5. Donation Priority Score

Expired items are excluded. Food, treats, and prescription diets with less than 14 days left before expiry are also excluded.

For eligible food items, closer expiry increases donation priority only after the 14-day safety buffer is satisfied. This is a platform-side waste-reduction priority, not a claim that short-dated items are better for receivers.

MVP default:

```txt
days_left = expiry_date - today

if days_left < 0:
  exclude
else if days_left < 14:
  exclude
else if days_left <= 21:
  donation_priority_score = 100
else if days_left <= 30:
  donation_priority_score = 70
else if days_left <= 60:
  donation_priority_score = 35
else:
  donation_priority_score = 10
```

For non-food supplies:

```txt
donation_priority_score = 0
```

## 6. Compatibility Labels

Valid labels:

- `suitable`
- `conditional`
- `unsuitable`
- `not_applicable`

Meaning:

### suitable

The item appears compatible with the pet profile based on available data.

### conditional

The item may be usable but requires caution.

Examples:

- incomplete ingredient confidence
- prescription diet involved
- unclear life stage
- opened item with unknown opened date
- pet has condition requiring care

### unsuitable

The item should not be recommended to this pet profile.

Examples:

- allergy conflict
- species mismatch
- expired item
- incompatible life stage with strong evidence
- prescription diet mismatch
- unsafe/uncertain opened food condition

### not_applicable

Used for non-food supplies.

Examples:

- bowls
- pads
- toys
- carriers
- unused accessories

## 7. Compatibility Score

Map labels to base scores:

```txt
suitable       = 100
conditional    = 60
unsuitable     = 0
not_applicable = 80
```

Adjustments:

```txt
- explicit allergy conflict: force unsuitable, score 0
- species mismatch: force unsuitable, score 0
- expired item: force unsuitable, score 0
- prescription diet and pet condition mismatch: force unsuitable or conditional
- missing ingredients for food: conditional at best; registration should require an ingredient label image for edible categories before this fallback is needed
- unknown opened date for opened food: conditional at best
```

For MVP, use AI to produce a candidate compatibility result, then apply deterministic hard rules.

Safety UX requirements:

- AI compatibility is advisory and must not be presented as a guarantee.
- Show the original ingredient label image and extracted ingredient tokens on the recommendation card when available.
- Require receiver-side confirmation before reservation: the receiver reviewed the ingredient label, allergy information, and pet health context.

## 8. Allergy Matching

Pet allergies are stored as normalized Korean or English ingredient tokens.

Example allergy tokens:

```txt
chicken
beef
pork
duck
fish
salmon
tuna
grain
corn
wheat
soy
dairy
egg
```

Ingredient matching should be case-insensitive and should handle Korean synonyms where possible.

Example mapping:

```txt
닭, 닭고기, 치킨, chicken -> chicken
소, 소고기, beef -> beef
돼지, 돼지고기, pork -> pork
연어, salmon -> salmon
참치, tuna -> tuna
옥수수, corn -> corn
밀, wheat -> wheat
대두, 콩, soy -> soy
계란, 달걀, egg -> egg
우유, 유제품, dairy -> dairy
곡물, grain -> grain
```

If any normalized allergy token appears in normalized ingredients:

```txt
compatibility = unsuitable
score = 0
reason includes allergy conflict
```

## 8.1 Symptom Photo Screening Guardrails

Optional symptom photo screening is a non-diagnostic helper.

Allowed behavior:

- record visible, non-diagnostic observation tags
- summarize guardian-entered feeding/health context
- normalize guardian-provided or memo-mentioned ingredient names into caution candidates
- separate negatively described ingredients from recently tolerated or positively described ingredients
- let the guardian explicitly apply caution candidates to recommendation filtering

Forbidden behavior:

- diagnosing allergy, dermatitis, infection, or disease
- claiming a symptom was caused by a specific ingredient
- inferring a food ingredient from a symptom photo alone
- treating an ingredient as a caution candidate when the memo says the pet improved or had no issue after eating it
- guaranteeing safety

If a caution candidate is applied by the guardian and appears in item ingredients:

```txt
compatibility = unsuitable
score = 0
reason includes symptom-record caution candidate conflict
```

## 9. Species Matching

Item target species:

- `dog`
- `cat`
- `both`
- `other`

Pet species:

- `dog`
- `cat`

Rules:

```txt
if item.target_species === pet.species:
  pass

if item.target_species === "both":
  pass

otherwise:
  unsuitable
```

## 10. Life Stage Matching

Pet age groups:

For dogs:

```txt
puppy: age < 1
adult: 1 <= age < 7
senior: age >= 7
```

For cats:

```txt
kitten: age < 1
adult: 1 <= age < 10
senior: age >= 10
```

Item life stage candidates:

- `puppy`
- `kitten`
- `adult`
- `senior`
- `all_life_stages`
- `unknown`

Rules:

```txt
if item life stage is all_life_stages:
  suitable

if item life stage matches pet life stage:
  suitable

if item life stage unknown:
  conditional

if item life stage clearly mismatches:
  conditional or unsuitable depending on AI reason
```

For MVP, do not over-block life stage unless the mismatch is clear.

## 11. Opened Food Screening

Fields:

- opened: boolean
- opened_at: date or null
- storage_note: optional string

Rules:

```txt
if opened === false:
  pass

if opened === true and opened_at is null:
  compatibility = conditional at best

if opened === true and opened_at is very old:
  compatibility = conditional or unsuitable
```

MVP default threshold:

```txt
opened_days > 60:
  unsuitable for food/treat

opened_days > 30:
  conditional

opened_days <= 30:
  allowed
```

This is not a safety guarantee. UI must show advisory text.

## 12. Item Category Rules

Categories:

- `dry_food`
- `wet_food`
- `treat`
- `prescription`
- `supply`

Food categories requiring compatibility:

- dry_food
- wet_food
- treat
- prescription

Supply category:

- skip ingredients
- compatibility = not_applicable
- score = 80
- still apply distance and status rules
- expiry urgency score = 0 unless expiry date exists

Prescription category:

- always display caution
- if pet condition does not match prescription purpose, mark conditional or unsuitable
- include “수의사 상담 권장”

## 13. AI Product Analysis JSON

Gemini should return JSON matching this shape:

```ts
export type AiItemAnalysis = {
  name: string | null;
  brand: string | null;
  category:
    | "dry_food"
    | "wet_food"
    | "treat"
    | "prescription"
    | "supply"
    | "unknown";
  targetSpecies: "dog" | "cat" | "both" | "other" | "unknown";
  remainingAmount: string | null;
  opened: boolean | null;
  openedAtCandidate: string | null;
  expiryDateCandidate: string | null;
  ingredients: string[];
  lifeStage: "puppy" | "kitten" | "adult" | "senior" | "all_life_stages" | "unknown";
  confidence: number;
  explanation: string;
  warnings: string[];
};
```

Rules:

- Do not save invalid JSON directly.
- If confidence is low, show the fields as editable and warn the user.
- If expiry is uncertain, require manual user input.

## 14. AI Compatibility JSON

Gemini should return JSON matching this shape:

```ts
export type AiCompatibilityResult = {
  compatibility: "suitable" | "conditional" | "unsuitable" | "not_applicable";
  score: number;
  reason: string;
  allergyConflicts: string[];
  warnings: string[];
  alternativeRecommendationQuery: string | null;
};
```

After receiving this result, apply deterministic hard rules again.

## 15. Final Match Object

The recommendation engine should return:

```ts
export type MatchResult = {
  itemId: string;
  petId: string;
  compatibility: "suitable" | "conditional" | "unsuitable" | "not_applicable";
  compatibilityScore: number;
  compatibilityReason: string;
  distanceKm: number;
  distanceScore: number;
  urgencyScore: number;
  matchScore: number;
  excluded: boolean;
  exclusionReasons: string[];
};
```

## 16. Ranking

Sort recommendation results by:

1. matchScore descending
2. compatibilityScore descending
3. expiry date ascending
4. distanceKm ascending
5. created_at descending

## 17. Top Alert Cards

Given available recommendations, compute:

### Compatible count

Number of non-excluded items.

### Closest item

Lowest distanceKm among non-excluded items.

### Most urgent item

Earliest expiry date among non-excluded items.

### Top recommendation

Highest matchScore.

## 18. Reservation Algorithm

When receiver requests an item:

1. Confirm item status is `available`.
2. Create or update match row.
3. Set item status to `reserved`.
4. Set match status to `accepted`.
5. Exclude item from future recommendations.

Pseudo-code:

```ts
async function reserveItem(itemId: string, receiverId: string, matchScore: number) {
  const item = await getItem(itemId);

  if (!item || item.status !== "available") {
    throw new Error("이미 예약되었거나 신청할 수 없는 물품입니다.");
  }

  await createMatch({
    item_id: itemId,
    receiver_id: receiverId,
    match_score: matchScore,
    status: "accepted",
  });

  await updateItemStatus(itemId, "reserved");
}
```

## 19. Demo Data Guidelines

Use clear demo cases:

### Suitable case

- Pet: adult dog, no chicken allergy
- Item: dog dry food, no conflicting ingredients
- Result: suitable

### Allergy conflict case

- Pet: dog with chicken allergy
- Item: chicken-based dog food
- Result: unsuitable and excluded

### Conditional case

- Pet: senior cat
- Item: cat food with unclear life stage or opened date
- Result: conditional

### Supply case

- Item: unused pet bowl
- Result: not_applicable compatibility but still listable
