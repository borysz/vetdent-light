-- Dental radiograph images attached to a sheet (tab 2, "Digital dental radiography").
-- The image files live in the private Storage bucket "radiographs" at <clinic_id>/<sheet_id>/<radiograph_id>.<ext>;
-- this table holds their metadata. Clinic members can read, add and delete them; nobody else can see them.

create table public.sheet_radiographs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  sheet_id uuid not null references public.treatment_sheets (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (length(btrim(file_name)) > 0 and length(file_name) <= 255),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null
);

create index sheet_radiographs_sheet_idx on public.sheet_radiographs (sheet_id, created_at);

alter table public.sheet_radiographs enable row level security;

create policy sheet_radiographs_select on public.sheet_radiographs for select to authenticated
  using (public.is_clinic_member(clinic_id));
-- The sheet must belong to the same clinic.
create policy sheet_radiographs_insert on public.sheet_radiographs for insert to authenticated
  with check (
    public.is_clinic_member(clinic_id)
    and exists (select 1 from public.treatment_sheets s where s.id = sheet_id and s.clinic_id = sheet_radiographs.clinic_id)
  );
create policy sheet_radiographs_delete on public.sheet_radiographs for delete to authenticated
  using (public.is_clinic_member(clinic_id));

grant select, insert, delete on public.sheet_radiographs to authenticated;

-- Storage: a private bucket, images only, at most 15 MB each.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('radiographs', 'radiographs', false, 15728640, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- The clinic of a stored object: the first folder of its path, when that is a uuid.
create function public.storage_clinic_id(object_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(object_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(object_name, '/', 1)::uuid
  end
$$;

create policy radiographs_select on storage.objects for select to authenticated
  using (bucket_id = 'radiographs' and public.is_clinic_member(public.storage_clinic_id(name)));
create policy radiographs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'radiographs' and public.is_clinic_member(public.storage_clinic_id(name)));
create policy radiographs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'radiographs' and public.is_clinic_member(public.storage_clinic_id(name)));
