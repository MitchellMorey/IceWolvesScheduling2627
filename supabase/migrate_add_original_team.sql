-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Lets the app remember which team an ice-slot allocation originally
-- belonged to, even after it's been reassigned to "Open" - so that
-- marking a team's own slot Open (a deliberate day off) can be excluded
-- from that team's "Available to Travel" list, instead of looking like
-- a free weekend to travel. Safe to run more than once.

alter table events add column if not exists original_team text;

-- Backfill: for every existing allocation that hasn't been reassigned
-- away from its current team yet, its current team IS its original team.
-- (Slots already reassigned to "Open" before this migration can't be
-- backfilled automatically - see note below.)
update events
set original_team = team
where kind = 'allocation' and original_team is null;

-- NOTE: any slot you've ALREADY marked "Open" before running this
-- migration won't have the correct original team recorded (it'll show
-- as "Open" -> "Open", which doesn't exclude anything). To fix an
-- already-blocked date like this, easiest is: in the app, reassign that
-- slot back to the correct team, then mark it "Open" again - the new
-- code will remember the team correctly from then on.
