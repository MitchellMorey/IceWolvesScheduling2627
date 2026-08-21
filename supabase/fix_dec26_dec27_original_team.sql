-- One-time fix: recovers the original team for the Bantam and Peewee
-- slots on 12/26 and 12/27 that were marked "Open" before original_team
-- tracking existed. Run this once in the Supabase SQL Editor, AFTER
-- running migrate_add_original_team.sql. Safe to re-run.

update events set original_team = 'Bantam'
where date = '2026-12-26' and time = '13:15' and team = 'Open';

update events set original_team = 'Peewee'
where date = '2026-12-26' and time = '10:30' and team = 'Open';

update events set original_team = 'Bantam'
where date = '2026-12-27' and time = '12:00' and team = 'Open';

update events set original_team = 'Peewee'
where date = '2026-12-27' and time = '09:15' and team = 'Open';

-- Double-check it worked:
select date, time, team, original_team
from events
where date in ('2026-12-26', '2026-12-27') and kind = 'allocation'
order by date, time;
