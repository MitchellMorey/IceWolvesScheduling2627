-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds a new 'practice' entry kind: a team practice (team + date + time +
-- optional notes), separate from games and ice-slot holds. The app only
-- shows practices to logged-in users. Safe to re-run.

alter table events drop constraint if exists events_kind_check;
alter table events add constraint events_kind_check
  check (kind in ('allocation', 'game', 'tournament', 'on_ice_event', 'travel_block', 'practice'));
