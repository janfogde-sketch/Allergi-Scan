-- Forbrug på betalte Claude Haiku-kald, samlet pr. dag, funktion og model (til admin-panelets "AI-forbrug").
-- Kun summer (kald, tokens): ingen bruger-id, ingen tekst, ingen personoplysninger. Derfor ingen sletning ved kontosletning
-- og ingen kort opbevaringsfrist; rækkerne er få (højst en pr. dag pr. funktion) og må gerne ligge, så forbruget kan følges over tid.

create table if not exists public.ai_usage_daily (
  day date not null,
  function_name text not null,
  model text not null,
  calls integer not null default 0,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  primary key (day, function_name, model)
);

alter table public.ai_usage_daily enable row level security;
revoke all on public.ai_usage_daily from public, anon, authenticated;
grant select on public.ai_usage_daily to authenticated;

create policy ai_usage_daily_select_admin on public.ai_usage_daily as permissive for select to authenticated
  using (is_admin((select auth.uid() as uid)));

create or replace function public.log_ai_usage(p_function text, p_model text, p_input bigint, p_output bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.ai_usage_daily as d (day, function_name, model, calls, input_tokens, output_tokens)
  values ((now() at time zone 'Europe/Copenhagen')::date, p_function, p_model, 1, greatest(coalesce(p_input, 0), 0), greatest(coalesce(p_output, 0), 0))
  on conflict (day, function_name, model) do update
    set calls = d.calls + 1,
        input_tokens = d.input_tokens + excluded.input_tokens,
        output_tokens = d.output_tokens + excluded.output_tokens;
end;
$function$;

revoke execute on function public.log_ai_usage(text, text, bigint, bigint) from public, anon, authenticated;
grant execute on function public.log_ai_usage(text, text, bigint, bigint) to service_role;
