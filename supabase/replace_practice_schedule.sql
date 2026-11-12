-- Run in the Supabase SQL Editor (choose "Run and enable RLS" if prompted -
-- it's a harmless false alarm).
--
-- Replaces the team practice schedule:
--   6U ................ Tue 6:00-7:15 PM
--   8U ................ Tue, Thu 6:00-7:15 PM
--   Squirt & She Wolves  Mon, Wed 6:00-7:15 PM
--   Peewee (12U) ...... Tue, Thu 7:30-8:45 PM
--   Bantam (14U) ...... Mon, Wed 7:30-8:45 PM
--
-- Clears every existing practice for those teams (plus Open Hockey, which
-- collided with the new 14U times). Goalie Practice, Power Skating and
-- Learn to Play are left alone. New practices cover Nov 1, 2026 through
-- Feb 28, 2027.

-- STEP 1 (optional): preview what will be deleted. Run just this first.
select title, team, teams, count(*) as practices, min(date) as first_day, max(date) as last_day
from events
where kind = 'practice'
  and (
    title = 'Open Hockey'
    or team in ('Bantam', 'Peewee', 'Squirt', 'She Wolves', '8U', '6U')
    or teams && array['Bantam', 'Peewee', 'Squirt', 'She Wolves', '8U', '6U']
  )
group by title, team, teams
order by title;

-- STEP 2: if the preview looks right, run everything below.

delete from events
where kind = 'practice'
  and (
    title = 'Open Hockey'
    or team in ('Bantam', 'Peewee', 'Squirt', 'She Wolves', '8U', '6U')
    or teams && array['Bantam', 'Peewee', 'Squirt', 'She Wolves', '8U', '6U']
  );

with weekly (dow, title, teams, start_time, end_time) as (
  values
    -- Monday
    (1, 'Squirt & She Wolves', array['Squirt','She Wolves'], time '18:00', time '19:15'),
    (1, 'Bantam',              array['Bantam'],              time '19:30', time '20:45'),
    -- Tuesday
    (2, '6U',                  array['6U'],                  time '18:00', time '19:15'),
    (2, '8U',                  array['8U'],                  time '18:00', time '19:15'),
    (2, 'Peewee',              array['Peewee'],              time '19:30', time '20:45'),
    -- Wednesday
    (3, 'Squirt & She Wolves', array['Squirt','She Wolves'], time '18:00', time '19:15'),
    (3, 'Bantam',              array['Bantam'],              time '19:30', time '20:45'),
    -- Thursday
    (4, '8U',                  array['8U'],                  time '18:00', time '19:15'),
    (4, 'Peewee',              array['Peewee'],              time '19:30', time '20:45')
),
days as (
  select d::date as day
  from generate_series(date '2026-11-01', date '2027-02-28', interval '1 day') as d
)
insert into events (kind, team, teams, title, date, time, end_time, event_type, location, opponent, notes)
select
  'practice',
  case when cardinality(w.teams) = 1 then w.teams[1] else null end,
  w.teams,
  w.title,
  days.day,
  w.start_time,
  w.end_time,
  'Practice',
  'home',
  '',
  ''
from days
join weekly w on w.dow = extract(dow from days.day);
