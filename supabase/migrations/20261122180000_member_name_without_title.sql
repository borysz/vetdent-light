-- The separate title ("Dr.") is phased out: it becomes part of the display name, which every user can now edit
-- in the app (Profile). The title column is emptied but kept for now, so the version still running during a
-- deploy keeps working; a later migration can drop it.

update public.clinic_members
set display_name = btrim(title) || ' ' || display_name
where title is not null
  and btrim(title) <> ''
  and display_name not ilike btrim(title) || ' %';

update public.clinic_members set title = null where title is not null;

comment on column public.clinic_members.title is 'Deprecated (2026-11-22): the title is part of display_name. Always null; to be dropped.';

-- A member may change their own display name, and nothing else (column-level grant).
create policy clinic_members_update_own on public.clinic_members for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant update (display_name) on public.clinic_members to authenticated;
