-- To do'en blev omdøbt ("Få Claude til at læse de lange ingredienslister"), så jobbets selv-lukning ikke længere fandt den på titlen.
-- Funktionen finder den nu på id. Intet andet ændres.
create or replace function public.run_allergen_claude_long()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_key text; v_cap int; v_done int; v_today int; v_global int; v_n int;
  v_todo uuid; v_total int; v_changed int; v_traces int; v_yes int;
begin
  select coalesce((value->>'total')::int, 0) into v_cap from public.app_flags where key = 'allergen_claude_long_cap';
  select count(*) into v_done from public.allergen_claude_long_20261008;

  if not exists (select 1 from public.allergen_claude_long_candidates(1)) then
    -- Færdig: luk to do'en én gang, og slå jobbet fra.
    select id into v_todo from public.admin_todos
     where id = 'b172ab7b-11b3-42c5-b9e0-93e206ce8984' and status <> 'done';
    if v_todo is not null then
      select count(*), count(*) filter (where changed) into v_total, v_changed from public.allergen_claude_long_20261008;
      select count(*) into v_traces from public.allergen_claude_long_20261008 d, jsonb_each_text(d.new_flags) e where d.changed and e.value = 'traces';
      select count(*) into v_yes from public.allergen_claude_long_20261008 d, jsonb_each_text(d.new_flags) e where d.changed and e.value = 'yes';
      update public.admin_todos set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now() where id = v_todo;
      insert into public.admin_todo_comments (todo_id, body) values (v_todo,
        format('Lukket automatisk af jobbet allergen-claude-long. Claude har læst %s lange ingredienslister, hvor nøgleordene intet fandt. %s fik et højere flag (i alt %s "spor" og %s "ja"-flag på tværs af allergener); resten blev bekræftet som "ingen fund". Kun opadgående, intet sænket. Sikkerhedskopi: allergen_claude_long_20261008 (gamle flag pr. produkt).', v_total, v_changed, v_traces, v_yes));
    end if;
    perform cron.unschedule('allergen-claude-long');
    return;
  end if;

  if v_done >= v_cap then return; end if;

  select count(*) into v_today from public.allergen_claude_long_20261008
   where (processed_at at time zone 'Europe/Copenhagen')::date = (now() at time zone 'Europe/Copenhagen')::date;
  if v_today >= 200 then return; end if;

  -- Hold afstand til døgnloftet på 300 for interne Claude-kald.
  select coalesce(sum(n), 0) into v_global from public.api_usage_global
   where kind = 'claude_internal' and day = (now() at time zone 'Europe/Copenhagen')::date;
  if v_global >= 270 then return; end if;

  v_n := least(10, v_cap - v_done, 200 - v_today);
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
  perform net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/allergen-reanalyze',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object('mode', 'claude_long', 'limit', v_n),
    timeout_milliseconds := 120000
  );
end;
$$;
