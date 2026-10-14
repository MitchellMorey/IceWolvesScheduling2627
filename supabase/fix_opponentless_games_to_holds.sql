-- Run in the Supabase SQL Editor (choose "Run and enable RLS" if prompted -
-- it's a harmless false alarm).
--
-- Turns every home "Game" that has no opponent back into a plain ice-slot
-- hold (the gray chip). The app now does this automatically whenever you
-- save a game with the opponent cleared; this cleans up the ones that were
-- already saved that way before.
--
-- STEP 1 (optional): preview what will change. Run just this first.
select id, team, date, time, event_type, location, opponent
from events
where kind = 'game'
  and team <> 'Open'
  and event_type = 'Game'
  and (location is null or location = 'home')
  and coalesce(trim(opponent), '') = ''
order by date, time;

-- STEP 2: if the preview looks right, run everything below.

-- Games whose own hold is still on the calendar: just drop the game.
delete from events g
where g.kind = 'game'
  and g.team <> 'Open'
  and g.event_type = 'Game'
  and (g.location is null or g.location = 'home')
  and coalesce(trim(g.opponent), '') = ''
  and exists (
    select 1 from events a
    where a.kind = 'allocation'
      and a.team = g.team
      and a.date = g.date
      and a.time = g.time
  );

-- Everything else: convert the game row itself into a hold.
update events
set kind = 'allocation',
    event_type = 'Practice',
    location = 'home',
    opponent = '',
    original_team = team,
    duration_minutes = null
where kind = 'game'
  and team <> 'Open'
  and event_type = 'Game'
  and (location is null or location = 'home')
  and coalesce(trim(opponent), '') = '';
