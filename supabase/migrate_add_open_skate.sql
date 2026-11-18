-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
-- Choose "Run and enable RLS" if Supabase shows its warning - it's a
-- harmless false alarm.
--
-- 1. Adds a new 'open_skate' entry kind: a public open-skate session
--    (date + start/end time + optional notes), not tied to any team.
-- 2. Loads the Nov 6, 2026 - Feb 28, 2027 open skate schedule (30 sessions).
--
-- Safe to re-run: sessions already on the calendar for the same date and
-- start time are skipped.

alter table events drop constraint if exists events_kind_check;
alter table events add constraint events_kind_check
  check (kind in ('allocation', 'game', 'tournament', 'on_ice_event', 'travel_block', 'practice', 'ice_rental', 'open_skate'));

insert into events (kind, team, date, end_date, time, end_time, all_day, event_type, location, opponent, notes)
select 'open_skate', null, s.day, s.day, s.start_time, s.end_time, false, 'Open Skate', 'home', '', ''
from (values
  (date '2026-11-06', time '18:00', time '20:00'),
  (date '2026-11-08', time '16:30', time '18:30'),
  (date '2026-11-13', time '18:00', time '20:00'),
  (date '2026-11-15', time '16:30', time '18:30'),
  (date '2026-11-20', time '18:00', time '20:00'),
  (date '2026-11-22', time '16:30', time '18:30'),
  (date '2026-11-27', time '18:00', time '20:00'),
  (date '2026-11-29', time '16:30', time '18:30'),
  (date '2026-12-04', time '18:00', time '20:00'),
  (date '2026-12-06', time '16:30', time '18:30'),
  (date '2026-12-13', time '16:30', time '18:30'),
  (date '2026-12-18', time '18:00', time '20:00'),
  (date '2026-12-20', time '16:30', time '18:30'),
  (date '2026-12-27', time '16:30', time '18:30'),
  (date '2027-01-01', time '18:00', time '20:00'),
  (date '2027-01-03', time '16:30', time '18:30'),
  (date '2027-01-10', time '17:30', time '19:30'),
  (date '2027-01-15', time '18:00', time '20:00'),
  (date '2027-01-17', time '16:30', time '18:30'),
  (date '2027-01-22', time '18:00', time '20:00'),
  (date '2027-01-24', time '16:30', time '18:30'),
  (date '2027-01-29', time '18:00', time '20:00'),
  (date '2027-01-31', time '16:30', time '18:30'),
  (date '2027-02-05', time '18:00', time '20:00'),
  (date '2027-02-07', time '16:30', time '18:30'),
  (date '2027-02-14', time '16:30', time '18:30'),
  (date '2027-02-19', time '18:00', time '20:00'),
  (date '2027-02-21', time '16:30', time '18:30'),
  (date '2027-02-26', time '18:00', time '20:00'),
  (date '2027-02-28', time '16:30', time '18:30')
) as s (day, start_time, end_time)
where not exists (
  select 1 from events e
  where e.kind = 'open_skate' and e.date = s.day and e.time = s.start_time
);
