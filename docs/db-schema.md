# BobEum Database Schema

This document defines the Supabase PostgreSQL schema for the BobEum MVP.

The existing FoodBridge schema may be migrated or replaced. Prefer preserving working infrastructure, but user-facing domain should become BobEum.

## 1. Entity Overview

Main entities:

- users: demo users, either donor or receiver
- pets: receiver pet profiles
- items: shared pet food/supplies
- matches: reservation and compatibility records

MVP does not require login/auth.

## 2. Enum Values

Use text fields with constraints or TypeScript unions.

### user role

```txt
giver
receiver
both
```

### species

```txt
dog
cat
other
```

### item category

```txt
dry_food
wet_food
treat
prescription
supply
unknown
```

### target species

```txt
dog
cat
both
other
unknown
```

### item status

```txt
available
reserved
completed
```

### compatibility

```txt
suitable
conditional
unsuitable
not_applicable
```

### match status

```txt
pending
accepted
completed
cancelled
```

## 3. SQL Schema

```sql
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'both'
    check (role in ('giver', 'receiver', 'both')),
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  name text not null,
  species text not null
    check (species in ('dog', 'cat', 'other')),
  breed text,
  age numeric,
  weight numeric,
  allergies text[] not null default '{}',
  condition_note text,
  is_prescription_diet boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.users(id) on delete set null,

  name text not null,
  brand text,
  category text not null default 'unknown'
    check (category in ('dry_food', 'wet_food', 'treat', 'prescription', 'supply', 'unknown')),
  target_species text not null default 'unknown'
    check (target_species in ('dog', 'cat', 'both', 'other', 'unknown')),

  remaining_amount text,
  opened boolean,
  opened_at date,
  expiry_date date,

  ingredients text[] not null default '{}',
  life_stage text default 'unknown',
  storage_note text,

  image_url text,
  ingredient_image_url text,

  ai_analysis jsonb not null default '{}'::jsonb,

  latitude double precision,
  longitude double precision,

  status text not null default 'available'
    check (status in ('available', 'reserved', 'completed')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),

  item_id uuid not null references public.items(id) on delete cascade,
  receiver_id uuid references public.users(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,

  match_score numeric not null default 0,

  compatibility text not null default 'conditional'
    check (compatibility in ('suitable', 'conditional', 'unsuitable', 'not_applicable')),

  compatibility_score numeric not null default 0,
  compatibility_reason text,
  distance_km numeric,
  urgency_score numeric,

  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'completed', 'cancelled')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 4. Indexes

```sql
create index if not exists idx_users_role on public.users(role);

create index if not exists idx_pets_owner_id on public.pets(owner_id);
create index if not exists idx_pets_species on public.pets(species);

create index if not exists idx_items_supplier_id on public.items(supplier_id);
create index if not exists idx_items_status on public.items(status);
create index if not exists idx_items_category on public.items(category);
create index if not exists idx_items_target_species on public.items(target_species);
create index if not exists idx_items_expiry_date on public.items(expiry_date);
create index if not exists idx_items_location on public.items(latitude, longitude);

create index if not exists idx_matches_item_id on public.matches(item_id);
create index if not exists idx_matches_receiver_id on public.matches(receiver_id);
create index if not exists idx_matches_pet_id on public.matches(pet_id);
create index if not exists idx_matches_status on public.matches(status);
create index if not exists idx_matches_compatibility on public.matches(compatibility);
```

## 5. Updated At Trigger

```sql
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_pets_updated_at on public.pets;
create trigger set_pets_updated_at
before update on public.pets
for each row execute function public.set_updated_at();

drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at
before update on public.items
for each row execute function public.set_updated_at();

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();
```

## 6. Field Meaning

### users

| Field | Meaning |
|---|---|
| id | Demo user id |
| name | User display name |
| role | giver, receiver, or both |
| latitude | User default latitude |
| longitude | User default longitude |

### pets

| Field | Meaning |
|---|---|
| owner_id | User who owns/manages this pet profile |
| name | Pet name |
| species | dog/cat/other |
| breed | Optional breed |
| age | Age in years |
| weight | Weight in kg |
| allergies | Normalized allergy tokens |
| condition_note | Health/condition note |
| is_prescription_diet | Whether pet is on prescription diet |

### items

| Field | Meaning |
|---|---|
| supplier_id | Donor user |
| name | Product name |
| brand | Product brand |
| category | Food/treat/prescription/supply |
| target_species | dog/cat/both/other |
| remaining_amount | Human-readable remaining amount |
| opened | Whether item is opened |
| opened_at | Opened date if opened |
| expiry_date | Expiry date |
| ingredients | Parsed ingredient list |
| life_stage | puppy/kitten/adult/senior/all_life_stages/unknown |
| storage_note | Optional storage information |
| image_url | Main product image |
| ingredient_image_url | Ingredient label image |
| ai_analysis | Raw AI analysis JSON |
| latitude | Pickup latitude |
| longitude | Pickup longitude |
| status | available/reserved/completed |

### matches

| Field | Meaning |
|---|---|
| item_id | Target item |
| receiver_id | Receiver user |
| pet_id | Pet profile used for compatibility |
| match_score | Final recommendation score |
| compatibility | AI/rule compatibility label |
| compatibility_score | 0-100 score |
| compatibility_reason | Human-readable reason |
| distance_km | Haversine distance |
| urgency_score | Donation priority score based on expiry |
| status | pending/accepted/completed/cancelled |

## 7. Storage Buckets

Recommended Supabase Storage buckets:

```txt
item-images
ingredient-images
```

Paths:

```txt
item-images/{itemId or tempId}/{timestamp}.jpg
ingredient-images/{itemId or tempId}/{timestamp}.jpg
```

## 8. Demo Seed Data

Create demo users:

```txt
나눔자: 해운대 보호자
수혜자: 닭 알러지 강아지 보호자
수혜자: 캣맘 다묘 프로필
```

Create demo pets:

```txt
강아지 콩이
- species: dog
- age: 7
- weight: 5
- allergies: ['chicken']

고양이 나비
- species: cat
- age: 3
- weight: 4
- allergies: []
```

Create demo items:

```txt
Item A:
- dog dry food
- ingredients include chicken
- should be unsuitable for 콩이

Item B:
- dog dry food
- ingredients do not include chicken
- should be suitable for 콩이

Item C:
- cat food
- should be suitable for 나비

Item D:
- pet bowl
- category supply
- compatibility not_applicable
```

## 9. Migration Notes From FoodBridge

Likely old tables:

- foods
- users
- matches

Mapping:

```txt
foods -> items
food.name -> item.name
food.category -> item.category
food.quantity -> item.remaining_amount
food.expiry_date -> item.expiry_date
food.status -> item.status
food.image_url -> item.image_url
food.latitude/longitude -> item.latitude/longitude
```

New required table:

```txt
pets
```

New item fields:

```txt
brand
target_species
opened
opened_at
ingredients
life_stage
ingredient_image_url
ai_analysis
```

New match fields:

```txt
pet_id
compatibility
compatibility_score
compatibility_reason
distance_km
urgency_score
```

## 10. MVP Simplification

If migration is too risky during the hackathon:

- Keep old table names internally if required.
- Add compatibility fields.
- Rename UI strings first.
- Create adapter functions that map legacy `food` objects to BobEum `item` objects.
- Do not break existing working upload/map/reservation behavior.
