-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Open ice that was added manually through "+ Add" got saved as a game
-- (showing "Open - tap to assign" with game details) instead of a plain
-- "TIME Open" slot like every other open slot. The app now saves new ones
-- correctly; this converts any that already exist. Safe to re-run.

update events
set kind = 'allocation',
    event_type = 'Practice',
    location = 'home',
    opponent = null
where kind = 'game'
  and team = 'Open';
