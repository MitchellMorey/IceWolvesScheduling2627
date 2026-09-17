-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds a new 'travel_block' event kind: a date range that's off the table
-- for travel, either for one specific team (set `team`) or for every team
-- at once (leave `team` null). Unlike a tournament, a travel block has NO
-- effect on the calendar or anyone's home ice slots - it only removes
-- dates from the Available to Travel list.
--
-- Safe to re-run.

alter table events drop constraint if exists events_kind_check;
alter table events add constraint events_kind_check
  check (kind in ('allocation', 'game', 'tournament', 'on_ice_event', 'travel_block'));

-- Block the weekend of Feb 6-7, 2027 from Available to Travel for every
-- team (team left null = applies to all).
insert into events (team, date, end_date, kind, notes)
select null, '2027-02-06'::date, '2027-02-07'::date, 'travel_block', 'Weekend blocked off for all teams'
where not exists (
  select 1 from events
  where kind = 'travel_block' and date = '2027-02-06'::date and end_date = '2027-02-07'::date
);
