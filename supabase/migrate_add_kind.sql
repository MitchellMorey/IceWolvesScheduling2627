-- Migration: split "allocation" (who owns a time slot) from "game"
-- (the actual game/practice filled into a slot). Run this once in
-- Supabase's SQL Editor. Safe to run more than once.

alter table events
  add column if not exists kind text not null default 'game';

-- (Re)apply the constraint separately so re-running this file doesn't error
-- if the constraint already exists.
alter table events drop constraint if exists events_kind_check;
alter table events
  add constraint events_kind_check check (kind in ('allocation', 'game'));

-- Any standing holds already seeded by supabase/seed_weekend_holds.sql were
-- inserted as plain 'Practice' entries before this migration existed -
-- retag them as allocations now. New rows from that file already save
-- correctly since it was updated to set kind = 'allocation' directly.
update events
set kind = 'allocation'
where event_type = 'Practice'
  and notes like 'Standing hold %'
  and kind = 'game';
