-- Fejladministration, del 2 (Bjørn, 16. okt. 2026; plan godkendt i tråden):
-- 1) "Markér som løst" kræver en beskrivelse af rettelsen (resolution_note) og kan angive den verificerede build (verified_build). Håndhæves her,
--    så det gælder uanset klient. Begge vises i Historik via adminloggen. En fejl er ikke teknisk verificeret, bare fordi status er ændret.
-- 2) Privat bøtte til source maps (sourcemaps): kun service-nøglen (edge-funktionerne sourcemap-upload og symbolicate-error) kan læse og skrive;
--    ingen politik for brugere eller admins. Kortene slettes efter 90 dage (samme frist som fejlene) af cleanup-orphan-images.
-- Ingen personoplysninger i nogen af delene. Eksisterende rækker, status og historik er uændrede.

alter table public.client_errors add column if not exists resolution_note text;
alter table public.client_errors add column if not exists verified_build text;

create or replace function public.trg_client_errors_status_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'ignored' and btrim(coalesce(new.status_reason, '')) = '' then
      raise exception 'En begrundelse er påkrævet, når en fejl ignoreres' using errcode = '22023';
    end if;
    if new.status = 'resolved' and btrim(coalesce(new.resolution_note, '')) = '' then
      raise exception 'En beskrivelse af rettelsen er påkrævet, når en fejl markeres som løst' using errcode = '22023';
    end if;
    if new.status <> 'ignored' then new.status_reason := null; end if;
    if new.status = 'ignored' then new.status_reason := left(btrim(new.status_reason), 500); end if;
    if new.status = 'resolved' then
      new.resolution_note := left(btrim(new.resolution_note), 1000);
      new.verified_build := nullif(lower(btrim(coalesce(new.verified_build, ''))), '');
      if new.verified_build is not null and new.verified_build !~ '^[0-9a-f]{7,40}$' then
        raise exception 'Build-id skal være 7 til 40 hexadecimale tegn' using errcode = '22023';
      end if;
    else
      new.resolution_note := null;
      new.verified_build := null;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.trg_client_errors_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_auto boolean := coalesce(current_setting('app.client_error_auto', true), '') = '1';
begin
  if new.status is distinct from old.status then
    if v_auto then
      insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
        values (null, 'fejl_genaabnet', 'client_errors', new.id::text, jsonb_build_object('fra', old.status, 'til', new.status, 'automatisk', true));
    elsif v_uid is not null and public.is_admin(v_uid) then
      insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
        values (v_uid, 'fejlstatus_aendret', 'client_errors', new.id::text,
                jsonb_strip_nulls(jsonb_build_object('fra', old.status, 'til', new.status, 'begrundelse', new.status_reason,
                                                     'rettelse', new.resolution_note, 'verificeret_build', new.verified_build)));
    end if;
  end if;
  if new.severity is distinct from old.severity and not v_auto and v_uid is not null and public.is_admin(v_uid) then
    insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
      values (v_uid, 'fejlalvor_aendret', 'client_errors', new.id::text,
              jsonb_build_object('fra', coalesce(old.severity, 'ingen'), 'til', coalesce(new.severity, 'ingen')));
  end if;
  return new;
end;
$$;
revoke all on function public.trg_client_errors_audit() from public, anon, authenticated;

-- Source maps: privat bøtte, ingen politikker (service_role omgår RLS).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sourcemaps', 'sourcemaps', false, 10485760, array['application/json'])
on conflict (id) do nothing;

create or replace function public.old_sourcemaps()
returns table (name text)
language sql
stable
security definer
set search_path = public
as $$
  select o.name from storage.objects o
  where o.bucket_id = 'sourcemaps' and o.created_at < now() - interval '90 days';
$$;
revoke all on function public.old_sourcemaps() from public, anon, authenticated;
grant execute on function public.old_sourcemaps() to service_role;
