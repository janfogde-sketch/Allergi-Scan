-- Oprydning efter live-testen af adminadgang (to do 0d0e9d8b, 14. okt. 2026): sletter de to testkonti
-- admintest-a@example.com og admintest-b@example.com og alt, de har lavet, i samme rækkefølge som edge-funktionen delete-user.
-- Rører kun konti med de to e-mail-adresser. Fejler (og ruller tilbage), hvis der er rester bagefter.

do $$
declare
  v_ids uuid[];
  v_left int;
begin
  select coalesce(array_agg(id), '{}') into v_ids from auth.users where email ~ '^admintest-[ab]@example\.com$';

  delete from public.shopping_list_items where added_by = any(v_ids)
     or list_id in (select id from public.shopping_lists where owner_id = any(v_ids));
  delete from public.shopping_list_access where user_id = any(v_ids)
     or list_id in (select id from public.shopping_lists where owner_id = any(v_ids));
  delete from public.shopping_lists where owner_id = any(v_ids);
  delete from public.scan_history where user_id = any(v_ids);
  delete from public.user_allergens where user_id = any(v_ids);
  delete from public.family_members where user_id = any(v_ids);
  delete from public.family_memberships where user_id = any(v_ids);
  update public.families set created_by = null where created_by = any(v_ids);
  delete from public.feedback_tickets where submitted_by = any(v_ids);
  delete from public.submissions where submitted_by = any(v_ids);
  delete from public.favorites where user_id = any(v_ids);
  delete from public.search_selections where user_id = any(v_ids);
  delete from public.notifications where user_id = any(v_ids);
  delete from public.notification_preferences where user_id = any(v_ids);
  delete from public.push_tokens where user_id = any(v_ids);
  delete from public.consent_log where user_id = any(v_ids);
  delete from public.api_usage where user_id = any(v_ids);
  update public.client_errors set user_id = null where user_id = any(v_ids);
  delete from public.users where id = any(v_ids);
  delete from auth.users where id = any(v_ids);   -- fjerner også identiteter og sessioner (cascade)

  select (select count(*) from auth.users where id = any(v_ids))
       + (select count(*) from public.users where id = any(v_ids))
       + (select count(*) from public.scan_history where user_id = any(v_ids))
       + (select count(*) from public.user_allergens where user_id = any(v_ids))
       + (select count(*) from public.favorites where user_id = any(v_ids))
       + (select count(*) from public.consent_log where user_id = any(v_ids)) into v_left;
  if v_left <> 0 then raise exception 'Oprydning ufuldstændig: % rester', v_left; end if;
  raise notice 'Slettede % testkonti', coalesce(array_length(v_ids, 1), 0);
end $$;
