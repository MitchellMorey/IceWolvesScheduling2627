-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds two standing "Open" ice holds every Saturday: 3:00 PM-4:30 PM and
-- 4:45 PM-6:15 PM (each a 90-minute window, with the usual 15-minute
-- buffer between them). They're marked Open from the start and use
-- duration_minutes (not original_team - these were never any one
-- team's slot, so leaving original_team null keeps the app's "is this
-- team's own slot marked Open" checks, like Available to Travel, from
-- mistaking these for a real team's day off). Requires
-- fix_open_saturday_slots_duration.sql to have added the
-- duration_minutes column first if running against an existing database.
--
-- A home game scheduled at a time that overlaps one of these slots will
-- silently override/hide it on the calendar - it does not need to match
-- the slot's time exactly, and does not throw a conflict error the way
-- overlapping an actual team's assigned slot would.
--
-- Seeded across the same Saturday range the existing teams use (Sat
-- 10/31/26 through Sat 3/6/27). Safe to re-run - skips any (date, time)
-- that already exists.

insert into events (team, date, time, event_type, location, notes, kind, duration_minutes)
select 'Open', d::date, '15:00'::time, 'Practice', 'home',
       'Standing open ice hold 3:00 PM-4:30 PM', 'allocation', 90
from generate_series('2026-10-31'::date, '2027-03-06'::date, interval '1 day') as d
where extract(dow from d) = 6 -- Saturday
  and not exists (
    select 1 from events e
    where e.team = 'Open' and e.date = d::date and e.time = '15:00'::time and e.kind = 'allocation'
  );

insert into events (team, date, time, event_type, location, notes, kind, duration_minutes)
select 'Open', d::date, '16:45'::time, 'Practice', 'home',
       'Standing open ice hold 4:45 PM-6:15 PM', 'allocation', 90
from generate_series('2026-10-31'::date, '2027-03-06'::date, interval '1 day') as d
where extract(dow from d) = 6 -- Saturday
  and not exists (
    select 1 from events e
    where e.team = 'Open' and e.date = d::date and e.time = '16:45'::time and e.kind = 'allocation'
  );
