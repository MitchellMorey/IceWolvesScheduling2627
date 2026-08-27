-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds two standing "Open" ice holds every Saturday: 3:00 PM-4:30 PM and
-- 4:45 PM-6:15 PM (each using a Bantam-length 90-minute window, with the
-- usual 15-minute buffer between them). They're marked Open from the
-- start - original_team is set to 'Bantam' purely so the app knows how
-- much ice time each one occupies; it does NOT mean Bantam owns them.
--
-- A home game scheduled at a time that overlaps one of these slots will
-- silently override/hide it on the calendar - it does not need to match
-- the slot's time exactly, and does not throw a conflict error the way
-- overlapping an actual team's assigned slot would.
--
-- Seeded across the same Saturday range the existing teams use (Sat
-- 10/31/26 through Sat 3/6/27). Safe to re-run - skips any (date, time)
-- that already exists.

insert into events (team, date, time, event_type, location, notes, kind, original_team)
select 'Open', d::date, '15:00'::time, 'Practice', 'home',
       'Standing open ice hold 3:00 PM-4:30 PM', 'allocation', 'Bantam'
from generate_series('2026-10-31'::date, '2027-03-06'::date, interval '1 day') as d
where extract(dow from d) = 6 -- Saturday
  and not exists (
    select 1 from events e
    where e.team = 'Open' and e.date = d::date and e.time = '15:00'::time and e.kind = 'allocation'
  );

insert into events (team, date, time, event_type, location, notes, kind, original_team)
select 'Open', d::date, '16:45'::time, 'Practice', 'home',
       'Standing open ice hold 4:45 PM-6:15 PM', 'allocation', 'Bantam'
from generate_series('2026-10-31'::date, '2027-03-06'::date, interval '1 day') as d
where extract(dow from d) = 6 -- Saturday
  and not exists (
    select 1 from events e
    where e.team = 'Open' and e.date = d::date and e.time = '16:45'::time and e.kind = 'allocation'
  );
