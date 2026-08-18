-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds support for "Rink Events" (Tournament and On-Ice Event) on top of
-- the existing events table. Safe to run more than once.

alter table events add column if not exists end_date date;
alter table events add column if not exists end_time time;
alter table events add column if not exists all_day boolean not null default false;

-- On-ice events are rink-wide (not tied to one team), so team needs to be
-- allowed to be blank for those rows.
alter table events alter column team drop not null;

-- Widen the kind check constraint to allow the two new event kinds.
alter table events drop constraint if exists events_kind_check;
alter table events add constraint events_kind_check
  check (kind in ('allocation', 'game', 'tournament', 'on_ice_event'));
