-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Fully removes the "High School" team's data: its standing ice holds,
-- any games/tournaments ever entered for it, and any opponent contacts
-- saved under it. Every other team's data is untouched. Safe to re-run
-- (a second run just deletes nothing further).

delete from events where team = 'High School';
delete from opponent_contacts where team = 'High School';
