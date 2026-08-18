-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  team text not null,
  date date not null,
  time time,
  event_type text not null default 'Game',
  location text not null default 'home' check (location in ('home', 'away')),
  opponent text,
  notes text,
  created_at timestamptz not null default now()
);

-- Row Level Security: turned on, with open policies so anyone with the
-- public anon key (i.e. any visitor to the site) can read and write.
-- This matches "anyone visiting can add/edit" from the site's requirements.
-- If you ever want to lock this down later, you can tighten these policies
-- without changing any app code.

alter table events enable row level security;

create policy "Public can read events"
  on events for select
  using (true);

create policy "Public can insert events"
  on events for insert
  with check (true);

create policy "Public can update events"
  on events for update
  using (true);

create policy "Public can delete events"
  on events for delete
  using (true);
