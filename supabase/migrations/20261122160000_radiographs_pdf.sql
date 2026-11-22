-- The clinic's X-ray software exports JPEG and PDF: radiographs may also be PDF files.
alter table public.sheet_radiographs drop constraint sheet_radiographs_content_type_check;
alter table public.sheet_radiographs
  add constraint sheet_radiographs_content_type_check
  check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf'));
