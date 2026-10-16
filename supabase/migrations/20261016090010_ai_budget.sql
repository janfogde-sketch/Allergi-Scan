-- Månedligt AI-budget (Bjørn, 15. okt. 2026; Jan ja til migrationen via planen i tråden). Budgettet gemmes i app_flags under nøglen ai_budget
-- som {"monthly_dkk": 500, "warn_1": 80, "warn_2": 100}. app_flags har ingen politikker for loggede brugere (driftsflag), så admin-panelet læser
-- og skriver kun via de to funktioner her, og kun som administrator. Advarsler vises i admin; de stopper aldrig AI-funktionerne.
-- Ændring af budgettet logges i adminloggen (handling ai_budget_aendret, fra/til i kroner).

create or replace function public.get_ai_budget()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin((select auth.uid())) then
    raise exception 'Kun administratorer' using errcode = '42501';
  end if;
  return (select value from public.app_flags where key = 'ai_budget');
end;
$$;

create or replace function public.set_ai_budget(p_budget numeric, p_warn_1 integer default 80, p_warn_2 integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := (select auth.uid());
  v_old jsonb;
  v_new jsonb;
begin
  if not public.is_admin(v_admin) then
    raise exception 'Kun administratorer' using errcode = '42501';
  end if;
  select value into v_old from public.app_flags where key = 'ai_budget';
  if p_budget is null then
    -- Intet budget: fjerner indstillingen
    delete from public.app_flags where key = 'ai_budget';
    v_new := null;
  else
    if p_budget <= 0 or p_budget > 1000000 then
      raise exception 'Budgettet skal være mellem 0 og 1.000.000 kr.' using errcode = '22023';
    end if;
    if p_warn_1 is null or p_warn_2 is null or p_warn_1 < 1 or p_warn_2 > 500 or p_warn_1 > p_warn_2 then
      raise exception 'Advarselsgrænserne skal være mellem 1 og 500 procent, og den første må ikke være størst' using errcode = '22023';
    end if;
    v_new := jsonb_build_object('monthly_dkk', round(p_budget, 2), 'warn_1', p_warn_1, 'warn_2', p_warn_2);
    insert into public.app_flags (key, value, updated_at) values ('ai_budget', v_new, now())
      on conflict (key) do update set value = excluded.value, updated_at = now();
  end if;
  insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
    values (v_admin, 'ai_budget_aendret', 'app_flags', 'ai_budget',
            jsonb_build_object('fra', coalesce(v_old ->> 'monthly_dkk', 'intet') || ' kr.', 'til', coalesce(v_new ->> 'monthly_dkk', 'intet') || ' kr.'));
  return v_new;
end;
$$;

revoke all on function public.get_ai_budget() from public, anon;
revoke all on function public.set_ai_budget(numeric, integer, integer) from public, anon;
grant execute on function public.get_ai_budget() to authenticated;
grant execute on function public.set_ai_budget(numeric, integer, integer) to authenticated;
