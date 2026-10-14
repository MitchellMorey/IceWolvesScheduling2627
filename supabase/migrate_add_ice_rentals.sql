-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Prerequisite: migrate_add_practice_schedule.sql (adds the title column
-- that rentals use for the renter's name).
--
-- Adds a new 'ice_rental' entry kind: ice rented out to an outside group
-- (renter, date, start/end time, notes). Not tied to a team and only shown
-- to logged-in users. Safe to re-run.

alter table events drop constraint if exists events_kind_check;
alter table events add constraint events_kind_check
  check (kind in ('allocation', 'game', 'tournament', 'on_ice_event', 'travel_block', 'practice', 'ice_rental'));
