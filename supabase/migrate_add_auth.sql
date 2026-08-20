-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds a login/approval layer on top of the existing public-read schedule:
--   - Anyone can still VIEW the schedule with no login (unchanged).
--   - Only signed-in users whose email is in approved_editors can add,
--     edit, or delete anything.
-- Safe to run more than once.

-- ---------- Approved editors ----------

create table if not exists approved_editors (
  email text primary key
);

alter table approved_editors enable row level security;

-- A signed-in user may check ONLY their own row - this lets the app ask
-- "am I an approved editor?" without exposing the full list to anyone.
drop policy if exists "Users can check their own approval" on approved_editors;
create policy "Users can check their own approval"
  on approved_editors for select
  using (auth.jwt() ->> 'email' = email);

-- Deliberately no insert/update/delete policy here - the approved list is
-- managed by hand in the Supabase SQL Editor (see the INSERT template at
-- the bottom of this file), never from the app itself.

-- ---------- Lock down writes on events ----------
-- Reads stay public (the "Public can read events" policy from schema.sql
-- is untouched). Writes now require the signed-in user's email to be in
-- approved_editors.

drop policy if exists "Public can insert events" on events;
drop policy if exists "Public can update events" on events;
drop policy if exists "Public can delete events" on events;

create policy "Approved editors can insert events"
  on events for insert
  with check (
    exists (
      select 1 from approved_editors
      where approved_editors.email = auth.jwt() ->> 'email'
    )
  );

create policy "Approved editors can update events"
  on events for update
  using (
    exists (
      select 1 from approved_editors
      where approved_editors.email = auth.jwt() ->> 'email'
    )
  );

create policy "Approved editors can delete events"
  on events for delete
  using (
    exists (
      select 1 from approved_editors
      where approved_editors.email = auth.jwt() ->> 'email'
    )
  );

-- ---------- Add your approved editors ----------
-- Edit the emails below, then run just this INSERT (safe to re-run - it
-- skips any email that's already in the table). Add more people later by
-- running this same statement again with their emails.

insert into approved_editors (email) values
  ('coach1@example.com'),
  ('coach2@example.com')
on conflict (email) do nothing;
