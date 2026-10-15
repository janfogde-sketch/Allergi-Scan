-- AI-forbrug: oprindelse (Bjørn, 16. okt. 2026; plan godkendt i tråden). ai_usage_daily får kolonnen origin, så forbrug fra brugerfunktioner kan
-- adskilles fra interne processer: user = kaldt med en almindelig brugers login, internal = kaldt med service-nøglen (baggrundsjob, godkendelse af
-- indsendelser), unknown = kan ikke fastslås (alle ældre rækker og kald fra en administrator, hvor det ikke kan ses, om det er panelet eller eget brug).
-- Eksisterende rækker bevares uændret (origin = unknown). Kun summer; ingen bruger-id eller tekst, så ingen ny opbevaring eller sletning.
-- log_ai_usage får en valgfri femte parameter; gamle kald med fire parametre virker uændret (edge-funktionerne kan deployes før eller efter).

alter table public.ai_usage_daily add column if not exists origin text not null default 'unknown';
alter table public.ai_usage_daily drop constraint if exists ai_usage_daily_origin_check;
alter table public.ai_usage_daily add constraint ai_usage_daily_origin_check check (origin in ('user', 'internal', 'unknown'));
alter table public.ai_usage_daily drop constraint if exists ai_usage_daily_pkey;
alter table public.ai_usage_daily add constraint ai_usage_daily_pkey primary key (day, function_name, model, origin);

drop function if exists public.log_ai_usage(text, text, bigint, bigint);
create or replace function public.log_ai_usage(p_function text, p_model text, p_input bigint, p_output bigint, p_origin text default 'unknown')
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_origin text := case when p_origin in ('user', 'internal') then p_origin else 'unknown' end;
begin
  insert into public.ai_usage_daily as d (day, function_name, model, origin, calls, input_tokens, output_tokens)
  values ((now() at time zone 'Europe/Copenhagen')::date, p_function, p_model, v_origin, 1, greatest(coalesce(p_input, 0), 0), greatest(coalesce(p_output, 0), 0))
  on conflict (day, function_name, model, origin) do update
    set calls = d.calls + 1,
        input_tokens = d.input_tokens + excluded.input_tokens,
        output_tokens = d.output_tokens + excluded.output_tokens;
end;
$function$;

revoke all on function public.log_ai_usage(text, text, bigint, bigint, text) from public, anon, authenticated;
grant execute on function public.log_ai_usage(text, text, bigint, bigint, text) to service_role;
