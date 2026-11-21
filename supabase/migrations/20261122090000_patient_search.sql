-- Patient search that ignores accents and case, and finds phone numbers typed without spaces or with 06.
-- Two stored, generated columns keep the search a plain indexed-free LIKE (fast enough for thousands of animals):
--   search_text:  lower-case, accent-free "name owner_name" (matched against the folded search text)
--   phone_digits: the owner's phone number, digits only

create extension if not exists unaccent with schema extensions;

-- unaccent() is only STABLE (it reads a dictionary); generated columns need an IMMUTABLE function.
create or replace function public.immutable_unaccent(value text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, value)
$$;

alter table public.patients
  add column search_text text generated always as (lower(public.immutable_unaccent(name || ' ' || owner_name))) stored,
  add column phone_digits text generated always as (regexp_replace(coalesce(owner_phone, ''), '[^0-9]', '', 'g')) stored;
