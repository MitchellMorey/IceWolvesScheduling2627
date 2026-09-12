-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Fixes a bug in the standing Open Saturday ice slots (3:00 PM and
-- 4:45 PM): they were given original_team = 'Bantam' just to borrow
-- Bantam's 90-minute duration for the override/conflict math, but the
-- app's "Available to Travel" list reused that same field to mean
-- "Bantam deliberately took this day off" - so every single Saturday
-- was wrongly disappearing from Bantam's travel list, even Saturdays
-- Bantam has nothing scheduled on.
--
-- This adds a proper duration_minutes column so a slot's duration no
-- longer has to borrow a team's identity, then fixes the two existing
-- Open Saturday slots to use it instead of original_team. Safe to
-- re-run.

alter table events add column if not exists duration_minutes integer;

update events
set duration_minutes = 90, original_team = null
where kind = 'allocation'
  and team = 'Open'
  and original_team = 'Bantam'
  and time in ('15:00', '16:45');
