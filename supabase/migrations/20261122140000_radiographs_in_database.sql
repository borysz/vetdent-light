-- Radiograph images are stored in the database itself (owner's decision), not in Storage:
-- the bytes go into sheet_radiographs.image. Access stays the same: only members of the sheet's clinic (RLS).
-- The feature was not released yet, so there are no real images to move.

delete from public.sheet_radiographs;

drop policy if exists radiographs_select on storage.objects;
drop policy if exists radiographs_insert on storage.objects;
drop policy if exists radiographs_delete on storage.objects;
drop function if exists public.storage_clinic_id(text);

alter table public.sheet_radiographs
  drop column storage_path,
  add column image bytea not null,
  add constraint sheet_radiographs_image_size check (octet_length(image) = size_bytes and size_bytes <= 15728640);

-- Add an image (sent as base64: about a third larger than the file, half the size of bytea's hex form).
-- SECURITY INVOKER: the insert policy checks the clinic membership of the caller.
create function public.add_sheet_radiograph(
  p_id uuid,
  p_clinic_id uuid,
  p_sheet_id uuid,
  p_file_name text,
  p_content_type text,
  p_image_base64 text
)
returns table (id uuid, sheet_id uuid, file_name text, content_type text, size_bytes integer, created_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  insert into public.sheet_radiographs as r (id, clinic_id, sheet_id, file_name, content_type, size_bytes, image)
  select p_id, p_clinic_id, p_sheet_id, p_file_name, p_content_type, octet_length(bytes), bytes
  from (select decode(p_image_base64, 'base64') as bytes) as f
  returning r.id, r.sheet_id, r.file_name, r.content_type, r.size_bytes, r.created_at
$$;

-- The image as base64 (without line breaks), or no row when the caller may not see it.
create function public.sheet_radiograph_image(p_id uuid)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select translate(encode(r.image, 'base64'), E'\n', '') from public.sheet_radiographs r where r.id = p_id
$$;

revoke all on function public.add_sheet_radiograph(uuid, uuid, uuid, text, text, text) from public, anon;
revoke all on function public.sheet_radiograph_image(uuid) from public, anon;
grant execute on function public.add_sheet_radiograph(uuid, uuid, uuid, text, text, text) to authenticated;
grant execute on function public.sheet_radiograph_image(uuid) to authenticated;
