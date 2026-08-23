-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Pre-populates each team's Opponent Contacts list with the standard
-- roster of league clubs (Contact/Email left blank, Scheduled defaults
-- to "No" - fill those in through the app). Only adds a club to a team
-- if that team doesn't already have a row for it, so this is safe to
-- re-run and won't touch or duplicate contacts you've already added
-- (e.g. Bantam's existing RWD and West Salem entries are left as-is).

insert into opponent_contacts (team, club)
select t.team, c.club
from (values ('Bantam'), ('Peewee'), ('Squirt'), ('She Wolves')) as t(team)
cross join (
  values
    ('Monroe'),
    ('Stoughton'),
    ('Viroqua'),
    ('West Salem'),
    ('Baraboo'),
    ('RWD'),
    ('Sauk Prairie'),
    ('Beloit'),
    ('Dubuque'),
    ('Janesville'),
    ('McFarland'),
    ('Oregon'),
    ('Madison Patriots'),
    ('Madison Polar Caps'),
    ('Middleton'),
    ('Sun Prairie'),
    ('Verona'),
    ('Waunakee')
) as c(club)
where not exists (
  select 1 from opponent_contacts existing
  where existing.team = t.team and existing.club = c.club
);
