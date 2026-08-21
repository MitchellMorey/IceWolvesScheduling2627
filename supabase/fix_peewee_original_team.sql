-- Fixes original_team for the Peewee slots on 12/26 and 12/27, which got
-- set wrong by the earlier backfill (it ran while those rows were still
-- marked "Open" from before, so it recorded "Open" as their own original
-- team instead of "Peewee"). This matches by date+time only - not by
-- current team - so it works no matter what the team column currently
-- says. Safe to re-run.

update events set original_team = 'Peewee'
where date = '2026-12-26' and time = '10:30:00';

update events set original_team = 'Peewee'
where date = '2026-12-27' and time = '09:15:00';

-- Double-check it worked:
select date, time, team, original_team
from events
where date in ('2026-12-26', '2026-12-27') and kind = 'allocation'
order by date, time;
