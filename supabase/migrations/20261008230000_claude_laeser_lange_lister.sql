-- To do: Claude læser de eksisterende lange ingredienslister, hvor nøgleordene ikke fandt noget (opfølgning på #621).
-- Rører kun produkter med ingrediensliste på mindst 200 tegn, hvor ALLE flag er "no" og som Claude ikke har læst før (ca. 915).
-- Kun opadgående (no -> traces -> yes); intet sænkes. Sikkerhedskopi pr. produkt i allergen_claude_long_20261008 (gamle flag, kvalitet, metode).
-- Et planlagt job tager et lille stykke ad gangen via allergen-reanalyze (mode claude_long) og tæller med i døgnloftet for interne Claude-kald
-- (300 globalt); jobbet bruger højst 200 i døgnet og stopper selv, hvis loftet er tæt på. Først en prøve på 20 (flaget allergen_claude_long_cap).
-- Når intet mangler, lukker jobbet selv to do'en med tal og slår sig selv fra.

create table if not exists public.allergen_claude_long_20261008 (
  product_id uuid primary key references public.products(id) on delete cascade,
  old_flags jsonb,
  new_flags jsonb,
  old_quality text,
  old_method text,
  changed boolean not null default false,
  processed_at timestamptz not null default now()
);
alter table public.allergen_claude_long_20261008 enable row level security;
revoke all on public.allergen_claude_long_20261008 from public, anon, authenticated;
grant select, insert, update, delete on public.allergen_claude_long_20261008 to service_role;

-- Kandidater: lang liste, alle flag "no", ikke læst af Claude, ikke allerede behandlet.
create or replace function public.allergen_claude_long_candidates(p_limit int)
returns table (id uuid, ingredients_text text, allergen_flags jsonb, allergen_quality text, allergen_source_method text)
language sql stable security definer set search_path = public as $$
  select p.id, p.ingredients_text, p.allergen_flags, p.allergen_quality, p.allergen_source_method
    from public.products p
   where p.ingredients_text is not null
     and length(p.ingredients_text) >= 200
     and coalesce(p.allergen_source_method, '') not like '%claude%'
     and not exists (select 1 from jsonb_each_text(coalesce(p.allergen_flags, '{}'::jsonb)) e where e.value <> 'no')
     and not exists (select 1 from public.allergen_claude_long_20261008 d where d.product_id = p.id)
   order by p.id
   limit p_limit;
$$;
revoke all on function public.allergen_claude_long_candidates(int) from public, anon, authenticated;
grant execute on function public.allergen_claude_long_candidates(int) to service_role;

-- Prøve først: højst 20 produkter, indtil flaget hæves.
insert into public.app_flags (key, value) values ('allergen_claude_long_cap', '{"total": 20}'::jsonb)
on conflict (key) do nothing;

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select '[Før beta] Data: Claude læser de lange ingredienslister uden fund',
       'Opfølgning på #621: ca. 915 eksisterende produkter har en lang ingrediensliste (mindst 200 tegn), hvor nøgleordene ikke fandt noget, og som Claude aldrig har læst. Et planlagt job (allergen-claude-long) lader Claude læse dem i små portioner, højst 200 Claude-kald i døgnet (loftet er 300). Kun opadgående: nej til spor til ja, aldrig nedgang. Sikkerhedskopi: allergen_claude_long_20261008. Først en prøve på 20, som tjekkes, derefter resten. Jobbet lukker to do''en selv med tal, når det er færdigt.',
       'todo', 'normal', 'backend', public._admin_id('jafo')
where not exists (select 1 from public.admin_todos where title like '[Før beta] Data: Claude læser de lange ingredienslister uden fund%');

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
     where title like '[Før beta] Data: Claude læser de lange ingredienslister uden fund%' and status <> 'done' limit 1;
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
revoke all on function public.run_allergen_claude_long() from public, anon, authenticated;

select cron.schedule('allergen-claude-long', '*/5 * * * *', 'select public.run_allergen_claude_long();');
