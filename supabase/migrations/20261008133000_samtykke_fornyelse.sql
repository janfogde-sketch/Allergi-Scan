-- Samtykke forældet-kontrol (8. okt. 2026): give_health_consent logger nu et nyt samtykke, når det senest givne er på en ANDEN
-- version end den, appen sender. Før returnerede funktionen blot det gamle tidspunkt, så en fornyelse aldrig blev logget.
-- Dataene bevares; samtykket er stadig "givet" (has_health_consent) til brugeren har fornyet eller trukket det tilbage.
create or replace function public.give_health_consent(p_version text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_at timestamptz; v_last_version text;
begin
  if v_uid is null then raise exception 'Ikke logget ind' using errcode = '42501'; end if;
  if p_version is null or char_length(p_version) not between 1 and 40 then raise exception 'Ugyldig version'; end if;
  if public.has_health_consent(v_uid) then
    select created_at, version into v_at, v_last_version from public.consent_log
      where user_id = v_uid and kind = 'health' and action = 'given' order by created_at desc, id desc limit 1;
    if v_last_version = p_version then return v_at; end if;
  end if;
  insert into public.consent_log (user_id, kind, action, version) values (v_uid, 'health', 'given', p_version)
    returning created_at into v_at;
  return v_at;
end $$;
revoke execute on function public.give_health_consent(text) from public, anon;
grant execute on function public.give_health_consent(text) to authenticated;
