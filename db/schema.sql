-- Job Tracker schema — run this once in the Supabase SQL Editor
-- (Project -> SQL Editor -> New query -> paste -> Run)

create extension if not exists "pgcrypto";

do $$ begin
  create type application_status as enum (
    'found', 'applied', 'phone_screen', 'interview', 'offer', 'rejected', 'withdrawn'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists postings (
  id uuid primary key default gen_random_uuid(),
  role_category text not null,       -- 'AI Product Manager' | 'Product Manager' | 'Product Owner' | 'Agile Coach'
  title text not null,
  company text not null,
  location text,
  work_type text,                    -- 'Remote' | 'Hybrid' | 'On-site'
  employment_type text,              -- 'Full-time' | 'Contract'
  salary_range text,
  description text,
  apply_url text,
  linkedin_name text,
  linkedin_title text,
  linkedin_url text,
  source text,                       -- where it was found (Indeed, Greenhouse, Lever, LinkedIn, etc.)
  date_found date not null default current_date,
  status application_status not null default 'found',
  date_applied date,
  date_responded date,               -- first response of any kind (phone screen / rejection / etc.)
  date_closed date,                  -- offer accepted, rejected, or withdrawn
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_postings_status on postings (status);
create index if not exists idx_postings_role_category on postings (role_category);
create index if not exists idx_postings_company on postings (company);

-- Keep updated_at current on every edit
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_postings_updated_at on postings;
create trigger trg_postings_updated_at
  before update on postings
  for each row execute function set_updated_at();

-- Row Level Security: this is a single-user tracker, so we allow the anon key
-- full read/write. If you ever add other users, tighten this to per-user rows.
alter table postings enable row level security;

drop policy if exists "public read" on postings;
create policy "public read" on postings for select using (true);

drop policy if exists "public write" on postings;
create policy "public write" on postings for insert with check (true);

drop policy if exists "public update" on postings;
create policy "public update" on postings for update using (true);

drop policy if exists "public delete" on postings;
create policy "public delete" on postings for delete using (true);
