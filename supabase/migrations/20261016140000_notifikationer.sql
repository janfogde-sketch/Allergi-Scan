-- Notifikationsadministration (16. okt. 2026): gem og gendan pushtekst med konfliktkontrol på serveren. To administratorer kan ikke længere overskrive hinandens
-- ændringer uden at vide det: kalderen sender den version (updated_at), vedkommende så, og er teksten ændret siden, afvises gemningen (40001). Tabellens
-- audit-udløser logger ændringen som hidtil. Bagudkompatibel: panelet falder tilbage til direkte skrivning, til funktionen er udgivet.

create or replace function public.admin_save_push_override(p_key text, p_title text, p_body text, p_expected timestamptz default null)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid := (select auth.uid());
  v_cur timestamptz;
  v_title text := nullif(trim(coalesce(p_title, '')), '');
  v_body text := nullif(trim(coalesce(p_body, '')), '');
  v_now timestamptz := now();
begin
  if not public.is_admin(v_admin) then
    raise exception 'Kun for administratorer' using errcode = '42501';
  end if;
  if p_key is null or p_key !~ '^[A-Za-z0-9]+:[a-z_]+$' then
    raise exception 'Ugyldig notifikation' using errcode = '22023';
  end if;
  if length(coalesce(v_title, '')) > 60 or length(coalesce(v_body, '')) > 180 then
    raise exception 'Teksten er for lang' using errcode = '22023';
  end if;
  select updated_at into v_cur from public.notification_push_overrides where key = p_key for update;
  -- Konflikt: teksten findes og er ændret siden den version, kalderen så (eller kalderen så ingen)
  if found and p_expected is distinct from v_cur then
    raise exception 'Teksten er ændret af en anden' using errcode = '40001';
  end if;
  if not found and p_expected is not null then
    raise exception 'Teksten er ændret af en anden' using errcode = '40001';
  end if;
  if v_title is null and v_body is null then
    delete from public.notification_push_overrides where key = p_key;
    return null;
  end if;
  insert into public.notification_push_overrides (key, title, body, updated_by, updated_at)
    values (p_key, v_title, v_body, v_admin, v_now)
    on conflict (key) do update set title = excluded.title, body = excluded.body, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  return v_now;
end;
$$;

revoke all on function public.admin_save_push_override(text, text, text, timestamptz) from public, anon;
grant execute on function public.admin_save_push_override(text, text, text, timestamptz) to authenticated;
