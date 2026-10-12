-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Prerequisite: migrate_add_practices.sql (adds the 'practice' kind).
--
-- 1. Adds a `title` (e.g. "Power Skating") and a `teams` list (which teams
--    the practice is for; empty = open to everyone / rink-wide) to events.
-- 2. Seeds the weekly practice schedule from Practice_Schedule.csv for
--    every matching weekday from Nov 1, 2026 through Feb 28, 2027.
--
-- Safe to re-run: practices already present (same date, start time and
-- title) are skipped. Holidays/blackout dates were not provided, so
-- delete any individual practice that isn't happening from the calendar.

alter table events add column if not exists title text;
alter table events add column if not exists teams text[];

with weekly (dow, title, teams, start_time, end_time) as (
  values
    -- Monday
    (1, 'Goalie Practice',     '{}'::text[],               time '17:00', time '18:00'),
    (1, 'Squirt & She Wolves', array['Squirt','She Wolves'], time '18:00', time '19:15'),
    (1, 'Open Hockey',         '{}'::text[],               time '19:30', time '20:45'),
    -- Tuesday
    (2, 'She Wolves',          array['She Wolves'],        time '17:00', time '18:00'),
    (2, 'Peewee',              array['Peewee'],            time '18:15', time '19:30'),
    (2, 'Bantam',              array['Bantam'],            time '19:45', time '21:00'),
    -- Wednesday
    (3, 'Power Skating',       '{}'::text[],               time '17:00', time '18:00'),
    (3, 'Squirt',              array['Squirt'],            time '18:00', time '19:15'),
    (3, 'Open Hockey',         '{}'::text[],               time '19:30', time '20:45'),
    -- Thursday
    (4, '6U & 8U',             array['6U','8U'],           time '17:15', time '18:15'),
    (4, 'Peewee',              array['Peewee'],            time '18:15', time '19:30'),
    (4, 'Bantam',              array['Bantam'],            time '19:45', time '21:00'),
    -- Saturday
    (6, 'Learn to Play',       '{}'::text[],               time '08:15', time '09:00'),
    (6, '8U',                  array['8U'],                time '09:00', time '10:00')
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
join weekly w on w.dow = extract(dow from days.day)
where not exists (
  select 1 from events e
  where e.kind = 'practice'
    and e.date = days.day
    and e.time = w.start_time
    and e.title = w.title
);
