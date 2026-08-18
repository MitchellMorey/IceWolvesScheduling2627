-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: on-ice events are rink-wide and aren't tied to one team.
  team text,
  date date not null,
  time time,
  -- Only used by tournaments/on-ice events, which can cover a date range
  -- and/or a specific end time.
  end_date date,
  end_time time,
  all_day boolean not null default false,
  event_type text not null default 'Game',
  location text not null default 'home' check (location in ('home', 'away')),
  opponent text,
  notes text,
  -- 'allocation' = a standing marker for which team owns a recurring time
  -- slot (no game details). 'game' = the actual game/practice filled into
  -- a slot, as a separate row from the allocation that owns it.
  -- 'tournament' = a team + date range rink event that supersedes that
  -- team's individual ice-slot allocations for the dates it covers.
  -- 'on_ice_event' = a rink-wide event with a specific start/end time on
  -- one date, which supersedes any team's allocations in that time range.
  kind text not null default 'game'
    check (kind in ('allocation', 'game', 'tournament', 'on_ice_event')),
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
