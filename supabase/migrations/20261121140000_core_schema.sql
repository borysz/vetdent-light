-- VetDent Light: core schema (clinics, members, patients, treatment sheets), RLS, atomic functions.
-- Every table is protected by RLS: only members of a clinic can read or write its data.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  postal_code text,
  city text,
  street text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clinic_members (
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) > 0),
  title text,
  created_at timestamptz not null default now(),
  primary key (clinic_id, user_id)
);
create index clinic_members_user_id_idx on public.clinic_members (user_id);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  species text not null check (species in ('dog', 'cat')),
  name text not null check (length(btrim(name)) > 0),
  breed text,
  sex text check (sex in ('male', 'female', 'neutered_male', 'spayed_female')),
  -- First day of the estimated birth month, computed from the age given at a visit,
  -- so that the age grows by itself on the next sheet.
  estimated_birth_month date check (estimated_birth_month is null or estimated_birth_month = date_trunc('month', estimated_birth_month)::date),
  last_weight_kg numeric(5, 2) check (last_weight_kg is null or last_weight_kg > 0),
  owner_name text not null check (length(btrim(owner_name)) > 0),
  owner_email text,
  owner_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  unique (id, clinic_id)
);
create index patients_clinic_name_idx on public.patients (clinic_id, lower(name));
create index patients_clinic_owner_idx on public.patients (clinic_id, lower(owner_name));

create table public.treatment_sheets (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  patient_id uuid not null,
  treatment_date date not null,
  treating_vet text,
  -- Snapshot at the time of the visit
  age_years smallint check (age_years is null or age_years between 0 and 40),
  age_months smallint check (age_months is null or age_months between 0 and 11),
  weight_kg numeric(5, 2) check (weight_kg is null or weight_kg > 0),
  asa text check (asa in ('I', 'II', 'III', 'IV', 'V')),
  -- The rest of the sheet: one document, validated by zod (src/contracts), versioned by schema_version.
  content jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  -- Optimistic locking: every save must present the version it was based on.
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  -- A sheet always belongs to a patient of the same clinic.
  foreign key (patient_id, clinic_id) references public.patients (id, clinic_id) on delete cascade
);
create index treatment_sheets_patient_idx
  on public.treatment_sheets (patient_id, treatment_date desc, created_at desc);
create index treatment_sheets_clinic_idx
  on public.treatment_sheets (clinic_id, treatment_date desc, created_at desc);

-- ---------------------------------------------------------------------------
-- Helper functions and triggers
-- ---------------------------------------------------------------------------

-- Membership check used by every policy. SECURITY DEFINER so that it can read
-- clinic_members without recursing into that table's own policy.
create function public.is_clinic_member(p_clinic_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clinic_members m
    where m.clinic_id = p_clinic_id
      and m.user_id = (select auth.uid())
  );
$$;

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.set_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

create function public.patients_guard_species()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.species is distinct from old.species
     and exists (select 1 from public.treatment_sheets s where s.patient_id = old.id) then
    raise exception 'species_locked';
  end if;
  return new;
end;
$$;

create trigger clinics_touch before update on public.clinics
  for each row execute function public.touch_updated_at();
create trigger patients_audit before update on public.patients
  for each row execute function public.set_audit_fields();
create trigger patients_species_guard before update on public.patients
  for each row execute function public.patients_guard_species();
create trigger treatment_sheets_audit before update on public.treatment_sheets
  for each row execute function public.set_audit_fields();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.clinics enable row level security;
alter table public.clinic_members enable row level security;
alter table public.patients enable row level security;
alter table public.treatment_sheets enable row level security;

-- clinics: members read and update; creating a clinic is done by the user:create script (service role).
create policy clinics_select on public.clinics for select to authenticated
  using (public.is_clinic_member(id));
create policy clinics_update on public.clinics for update to authenticated
  using (public.is_clinic_member(id))
  with check (public.is_clinic_member(id));

-- clinic_members: members see their colleagues; membership is managed by the service role only.
create policy clinic_members_select on public.clinic_members for select to authenticated
  using (public.is_clinic_member(clinic_id));

-- patients and sheets: members read, insert and update. No delete policy (deleting is not needed yet).
create policy patients_select on public.patients for select to authenticated
  using (public.is_clinic_member(clinic_id));
create policy patients_insert on public.patients for insert to authenticated
  with check (public.is_clinic_member(clinic_id));
create policy patients_update on public.patients for update to authenticated
  using (public.is_clinic_member(clinic_id))
  with check (public.is_clinic_member(clinic_id));

create policy treatment_sheets_select on public.treatment_sheets for select to authenticated
  using (public.is_clinic_member(clinic_id));
create policy treatment_sheets_insert on public.treatment_sheets for insert to authenticated
  with check (public.is_clinic_member(clinic_id));
create policy treatment_sheets_update on public.treatment_sheets for update to authenticated
  using (public.is_clinic_member(clinic_id))
  with check (public.is_clinic_member(clinic_id));

-- ---------------------------------------------------------------------------
-- Privileges: nothing for anon, minimal for authenticated
-- ---------------------------------------------------------------------------

revoke all on public.clinics, public.clinic_members, public.patients, public.treatment_sheets from anon, authenticated;
grant select, update on public.clinics to authenticated;
grant select on public.clinic_members to authenticated;
grant select, insert, update on public.patients to authenticated;
grant select, insert, update on public.treatment_sheets to authenticated;

revoke all on function public.is_clinic_member(uuid) from public, anon;
grant execute on function public.is_clinic_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic operations (SECURITY INVOKER: RLS applies to the caller)
-- ---------------------------------------------------------------------------

-- New patient and first sheet in one transaction.
create function public.create_patient_with_sheet(p_clinic_id uuid, p_patient jsonb, p_sheet jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_patient_id uuid;
  v_sheet_id uuid;
begin
  insert into public.patients (
    clinic_id, species, name, breed, sex, estimated_birth_month,
    last_weight_kg, owner_name, owner_email, owner_phone
  ) values (
    p_clinic_id,
    p_patient ->> 'species',
    p_patient ->> 'name',
    p_patient ->> 'breed',
    p_patient ->> 'sex',
    (p_patient ->> 'estimatedBirthMonth')::date,
    coalesce((p_patient ->> 'lastWeightKg')::numeric, (p_sheet ->> 'weightKg')::numeric),
    p_patient ->> 'ownerName',
    p_patient ->> 'ownerEmail',
    p_patient ->> 'ownerPhone'
  )
  returning id into v_patient_id;

  insert into public.treatment_sheets (
    clinic_id, patient_id, treatment_date, treating_vet,
    age_years, age_months, weight_kg, asa, content, schema_version
  ) values (
    p_clinic_id,
    v_patient_id,
    (p_sheet ->> 'treatmentDate')::date,
    p_sheet ->> 'treatingVet',
    (p_sheet ->> 'ageYears')::smallint,
    (p_sheet ->> 'ageMonths')::smallint,
    (p_sheet ->> 'weightKg')::numeric,
    p_sheet ->> 'asa',
    coalesce(p_sheet -> 'content', '{}'::jsonb),
    coalesce((p_sheet ->> 'schemaVersion')::integer, 1)
  )
  returning id into v_sheet_id;

  return jsonb_build_object('patientId', v_patient_id, 'sheetId', v_sheet_id);
end;
$$;

-- Save a sheet (and optionally the patient card) if the stored version still matches.
-- Raises 'version_conflict' when someone saved in between and 'not_found' when the sheet is not visible.
create function public.save_sheet(p_sheet_id uuid, p_expected_version integer, p_sheet jsonb, p_patient jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_sheet public.treatment_sheets;
begin
  update public.treatment_sheets s
  set treatment_date = (p_sheet ->> 'treatmentDate')::date,
      treating_vet = p_sheet ->> 'treatingVet',
      age_years = (p_sheet ->> 'ageYears')::smallint,
      age_months = (p_sheet ->> 'ageMonths')::smallint,
      weight_kg = (p_sheet ->> 'weightKg')::numeric,
      asa = p_sheet ->> 'asa',
      content = coalesce(p_sheet -> 'content', '{}'::jsonb),
      schema_version = coalesce((p_sheet ->> 'schemaVersion')::integer, s.schema_version),
      version = s.version + 1
  where s.id = p_sheet_id
    and s.version = p_expected_version
  returning s.* into v_sheet;

  if not found then
    if exists (select 1 from public.treatment_sheets where id = p_sheet_id) then
      raise exception 'version_conflict';
    end if;
    raise exception 'not_found';
  end if;

  if p_patient is not null and jsonb_typeof(p_patient) = 'object' then
    update public.patients p
    set species = coalesce(p_patient ->> 'species', p.species),
        name = coalesce(p_patient ->> 'name', p.name),
        breed = p_patient ->> 'breed',
        sex = p_patient ->> 'sex',
        estimated_birth_month = (p_patient ->> 'estimatedBirthMonth')::date,
        owner_name = coalesce(p_patient ->> 'ownerName', p.owner_name),
        owner_email = p_patient ->> 'ownerEmail',
        owner_phone = p_patient ->> 'ownerPhone'
    where p.id = v_sheet.patient_id;
  end if;

  -- The patient's last weight follows the most recently saved sheet.
  update public.patients p
  set last_weight_kg = coalesce(v_sheet.weight_kg, p.last_weight_kg)
  where p.id = v_sheet.patient_id;

  return jsonb_build_object('version', v_sheet.version, 'updatedAt', v_sheet.updated_at);
end;
$$;

revoke all on function public.create_patient_with_sheet(uuid, jsonb, jsonb) from public, anon;
revoke all on function public.save_sheet(uuid, integer, jsonb, jsonb) from public, anon;
grant execute on function public.create_patient_with_sheet(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.save_sheet(uuid, integer, jsonb, jsonb) to authenticated;
