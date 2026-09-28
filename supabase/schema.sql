create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.create_profile_for_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, phone text not null, relationship text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.saved_routes (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '', origin text, destination text, geometry jsonb, distance_meters double precision, duration_seconds double precision, created_at timestamptz not null default now()
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  location jsonb, description text not null, rating smallint check (rating between 1 and 5), status text not null default 'pending' check (status in ('pending','approved','rejected')), created_at timestamptz not null default now()
);
create table if not exists public.safety_reports (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null, description text not null, location jsonb, status text not null default 'pending' check (status in ('pending','approved','rejected')), created_at timestamptz not null default now()
);
create table if not exists public.danger_zones (
  id uuid primary key default gen_random_uuid(), name text not null, reason text, source text not null,
  verified boolean not null default false, geometry jsonb not null, updated_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table if not exists public.street_lighting (
  id uuid primary key default gen_random_uuid(), location jsonb not null, status text not null check (status in ('well_lit','limited','unknown')),
  source text not null, verified boolean not null default false, updated_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table if not exists public.crime_records (
  id uuid primary key default gen_random_uuid(), area text not null, incident_type text not null, occurred_at timestamptz,
  location jsonb, source text not null, verified boolean not null default false, created_at timestamptz not null default now(), created_by uuid references auth.users(id)
);
create table if not exists public.crowd_information (
  id uuid primary key default gen_random_uuid(), location jsonb not null, level text not null check (level in ('low','medium','high','unknown')),
  source text not null, observed_at timestamptz not null, verified boolean not null default false, created_by uuid references auth.users(id)
);
create table if not exists public.safety_data (
  id uuid primary key default gen_random_uuid(), category text not null, location jsonb, value jsonb not null,
  source text not null, verified boolean not null default false, valid_from timestamptz, valid_until timestamptz,
  created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.location_sharing_sessions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique, latitude double precision not null, longitude double precision not null,
  expires_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.saved_routes enable row level security;
alter table public.reviews enable row level security;
alter table public.safety_reports enable row level security;
alter table public.danger_zones enable row level security;
alter table public.street_lighting enable row level security;
alter table public.crime_records enable row level security;
alter table public.crowd_information enable row level security;
alter table public.safety_data enable row level security;
alter table public.location_sharing_sessions enable row level security;

create policy "profiles read own or admin" on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = 'user');

create policy "contacts private owner" on public.emergency_contacts for all to authenticated using (user_id = (select auth.uid()) or (select public.is_admin())) with check (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "routes private owner" on public.saved_routes for all to authenticated using (user_id = (select auth.uid()) or (select public.is_admin())) with check (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "reviews owner or admin" on public.reviews for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "reviews create own" on public.reviews for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reviews admin manage" on public.reviews for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "reports owner or admin read" on public.safety_reports for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "reports create own" on public.safety_reports for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reports admin manage" on public.safety_reports for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "public read danger zones" on public.danger_zones for select to anon, authenticated using (verified or (select public.is_admin()));
create policy "admin manage danger zones" on public.danger_zones for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public read lighting" on public.street_lighting for select to anon, authenticated using (verified or (select public.is_admin()));
create policy "admin manage lighting" on public.street_lighting for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public read crime records" on public.crime_records for select to anon, authenticated using (verified or (select public.is_admin()));
create policy "admin manage crime records" on public.crime_records for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public read crowd info" on public.crowd_information for select to anon, authenticated using (verified or (select public.is_admin()));
create policy "admin manage crowd info" on public.crowd_information for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "public read safety data" on public.safety_data for select to anon, authenticated using (verified or (select public.is_admin()));
create policy "admin manage safety data" on public.safety_data for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "share sessions owner access" on public.location_sharing_sessions for all to authenticated using (owner_id = (select auth.uid()) or (select public.is_admin())) with check (owner_id = (select auth.uid()) or (select public.is_admin()));

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.emergency_contacts, public.saved_routes to authenticated;
grant select, insert, update on public.reviews, public.safety_reports to authenticated;
grant select, insert, update, delete on public.danger_zones, public.street_lighting, public.crime_records, public.crowd_information, public.safety_data to anon, authenticated;
grant select, insert, update, delete on public.location_sharing_sessions to authenticated;