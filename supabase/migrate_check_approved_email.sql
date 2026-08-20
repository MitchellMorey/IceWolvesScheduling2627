-- Run this once in your Supabase project's SQL Editor
-- (Project dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds a way for the app to check "is this email approved?" BEFORE sending
-- a magic link, without exposing the full approved_editors list to anyone
-- and without requiring the person to already be signed in (the existing
-- "Users can check their own approval" policy only works after sign-in).
--
-- security definer lets this function read approved_editors on the caller's
-- behalf while only ever returning a true/false answer - never the list
-- itself. Safe to run more than once.

create or replace function public.is_approved_editor(check_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from approved_editors where email = check_email
  );
$$;

-- Anyone (including anonymous, not-yet-signed-in visitors) may call this
-- function - it only ever leaks whether one specific email is approved.
grant execute on function public.is_approved_editor(text) to anon, authenticated;
