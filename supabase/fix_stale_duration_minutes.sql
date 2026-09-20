-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Fixes a bug where reassigning a standing Open ice slot to a real team
-- (or filling it in) left that row's borrowed duration_minutes in place
-- (e.g. a slot that used to be a 90-minute standing Open hold, now
-- claimed by Peewee, was still measuring 90 minutes of ice instead of
-- Peewee's real 75). That stale duration could then falsely block a
-- later slot from being scheduled nearby, because the conflict check
-- thought the team's ice ran longer than it actually does.
--
-- duration_minutes should only ever be set on a slot that's still
-- "Open" (a standing hold with no real team of its own) - once a real
-- team owns the slot, its duration always comes from that team's own
-- fixed game length. This clears any leftover value from every
-- non-Open row. Safe to re-run.

update events
set duration_minutes = null
where team is distinct from 'Open'
  and duration_minutes is not null;
