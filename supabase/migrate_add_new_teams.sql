-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds standing weekly ice holds for three new teams:
--   - High School: Fridays 8:30 PM and Saturdays 3:00 PM (2-hour slots)
--   - 8U: Sundays 3:15 PM (1-hour slot)
--   - 6U: Sundays 2:00 PM (1-hour slot)
--
-- Fridays are seeded across the normal season window (Nov 2026 - Feb
-- 2027, since that's all that's ever visible on the calendar - the app
-- doesn't show any early-March weekdays). Saturdays/Sundays are seeded
-- across the same extended range the existing teams already use (Sat
-- 10/31/26 through Sun 3/7/27), so High School/8U/6U line up with the
-- extra edge weekend days already on the calendar.
--
-- Safe to re-run - skips any (team, date, time) that already exists.

-- High School - Fridays, 8:30 PM (2 hours)
insert into events (team, date, time, event_type, location, notes, kind, original_team)
select 'High School', d::date, '20:30'::time, 'Practice', 'home',
       'Standing hold 8:30 PM-10:30 PM', 'allocation', 'High School'
from generate_series('2026-11-01'::date, '2027-02-28'::date, interval '1 day') as d
where extract(dow from d) = 5 -- Friday
  and not exists (
    select 1 from events e
    where e.team = 'High School' and e.date = d::date and e.time = '20:30'::time and e.kind = 'allocation'
  );

-- High School - Saturdays, 3:00 PM (2 hours)
insert into events (team, date, time, event_type, location, notes, kind, original_team)
select 'High School', d::date, '15:00'::time, 'Practice', 'home',
       'Standing hold 3:00 PM-5:00 PM', 'allocation', 'High School'
from generate_series('2026-10-31'::date, '2027-03-06'::date, interval '1 day') as d
where extract(dow from d) = 6 -- Saturday
  and not exists (
    select 1 from events e
    where e.team = 'High School' and e.date = d::date and e.time = '15:00'::time and e.kind = 'allocation'
  );

-- 8U - Sundays, 3:15 PM (1 hour)
insert into events (team, date, time, event_type, location, notes, kind, original_team)
select '8U', d::date, '15:15'::time, 'Practice', 'home',
       'Standing hold 3:15 PM-4:15 PM', 'allocation', '8U'
from generate_series('2026-11-01'::date, '2027-03-07'::date, interval '1 day') as d
where extract(dow from d) = 0 -- Sunday
  and not exists (
    select 1 from events e
    where e.team = '8U' and e.date = d::date and e.time = '15:15'::time and e.kind = 'allocation'
  );

-- 6U - Sundays, 2:00 PM (1 hour)
insert into events (team, date, time, event_type, location, notes, kind, original_team)
select '6U', d::date, '14:00'::time, 'Practice', 'home',
       'Standing hold 2:00 PM-3:00 PM', 'allocation', '6U'
from generate_series('2026-11-01'::date, '2027-03-07'::date, interval '1 day') as d
where extract(dow from d) = 0 -- Sunday
  and not exists (
    select 1 from events e
    where e.team = '6U' and e.date = d::date and e.time = '14:00'::time and e.kind = 'allocation'
  );
