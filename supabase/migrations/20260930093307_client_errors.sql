-- Egen fejlregistrering (arkitektur-audit A3, Jans valg 30. sept. 2026:
-- egen tabel i Supabase, ingen tredjepart).
--
-- Appen (og edge functions) kalder log_client_error(). Samme fejl
-- (fingerprint = besked + første stack-linje + kilde) inden for en time
-- lægges sammen i én række med en tæller, så en fejl i en løkke ikke
-- fylder tabellen. Et globalt loft på 300 nye rækker pr. 10 minutter
-- beskytter mod misbrug, da funktionen kan kaldes uden login.

create table public.client_errors (
  id uuid default gen_random_uuid() not null primary key,
  fingerprint text not null,
  source text default 'app'::text not null,
  message text not null,
  stack text,
  screen text,
  url text,
  user_agent text,
  app_version text,
  context jsonb,
  user_id uuid references public.users(id) on delete set null,
  occurrences integer default 1 not null,
  first_seen timestamp with time zone default now() not null,
  last_seen timestamp with time zone default now() not null,
  status text default 'open'::text not null,
  constraint client_errors_status_check check (status = any (array['open'::text, 'resolved'::text, 'ignored'::text]))
);

create index client_errors_last_seen_idx on public.client_errors using btree (last_seen desc);
create index client_errors_fingerprint_idx on public.client_errors using btree (fingerprint, last_seen desc);
create index client_errors_user_id_idx on public.client_errors using btree (user_id);

alter table public.client_errors enable row level security;

create policy client_errors_select_admin on public.client_errors as permissive for select to authenticated
  using (is_admin(( select auth.uid() as uid)));
create policy client_errors_update_admin on public.client_errors as permissive for update to authenticated
  using (is_admin(( select auth.uid() as uid)))
  with check (is_admin(( select auth.uid() as uid)));
create policy client_errors_delete_admin on public.client_errors as permissive for delete to authenticated
  using (is_admin(( select auth.uid() as uid)));

-- Kun admin (via RLS) og service_role rører tabellen direkte. Indsættelse
-- sker udelukkende gennem funktionen herunder.
revoke all on public.client_errors from anon, authenticated;
grant select, update, delete on public.client_errors to authenticated;
grant all on public.client_errors to service_role;

create or replace function public.log_client_error(
  p_message text,
  p_stack text default null,
  p_source text default 'app',
  p_screen text default null,
  p_url text default null,
  p_user_agent text default null,
  p_app_version text default null,
  p_context jsonb default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_message text := left(btrim(coalesce(p_message, '')), 1000);
  v_stack text := left(p_stack, 4000);
  v_source text := left(coalesce(nullif(btrim(p_source), ''), 'app'), 40);
  v_uid uuid := (select auth.uid());
  v_fp text;
  v_id uuid;
begin
  if v_message = '' then
    return;
  end if;

  v_fp := md5(v_source || '|' || v_message || '|' || coalesce(split_part(v_stack, E'\n', 2), ''));

  update client_errors
     set occurrences = occurrences + 1,
         last_seen = now(),
         user_id = coalesce(user_id, v_uid),
         status = case when status = 'resolved' then 'open' else status end
   where id = (
     select id from client_errors
      where fingerprint = v_fp and last_seen > now() - interval '1 hour'
      order by last_seen desc
      limit 1
   )
  returning id into v_id;

  if v_id is not null then
    return;
  end if;

  if (select count(*) from client_errors where first_seen > now() - interval '10 minutes') >= 300 then
    return;
  end if;

  insert into client_errors (fingerprint, source, message, stack, screen, url, user_agent, app_version, context, user_id)
  values (
    v_fp, v_source, v_message, v_stack,
    left(p_screen, 80), left(p_url, 500), left(p_user_agent, 300), left(p_app_version, 80),
    case when p_context is null or pg_column_size(p_context) > 4000 then null else p_context end,
    v_uid
  );
end;
$function$;

revoke execute on function public.log_client_error(text, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.log_client_error(text, text, text, text, text, text, text, jsonb) to anon, authenticated, service_role;

comment on table public.client_errors is 'Fejl fra appen og edge functions (A3, 30. sept. 2026). Skrives kun via log_client_error(); læses i admin-panelet under "Fejl".';
