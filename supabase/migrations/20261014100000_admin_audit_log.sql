-- Adminlog (Bjørn, 14. okt. 2026, admin-adgangskontrol): hvem gjorde hvad og hvornår, når en administrator ændrer noget følsomt.
-- Kun administratorer kan læse loggen; ingen kan skrive, ændre eller slette via API'et (rækker oprettes af triggere og af
-- delete-user med service-nøglen). Indhold: handling, måltabel, mål-id og skift i status/rolle. Aldrig e-mail, navn eller helbredsdata.
-- Opbevaring 12 måneder (cleanup_notifications). admin_id sættes til null, når adminkontoen slettes.

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text,
  details jsonb
);
create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_admin_id_idx on public.admin_audit_log (admin_id);

alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;
grant all on public.admin_audit_log to service_role;

drop policy if exists "Admin kan læse adminlog" on public.admin_audit_log;
create policy "Admin kan læse adminlog" on public.admin_audit_log for select to authenticated
  using (public.is_admin((select auth.uid())));

-- Trigger: logger kun, når den handlende bruger er administrator (almindelige brugeres egne ændringer logges ikke).
-- Argumenter: handling, kolonne der skiftes (valgfri).
create or replace function public.trg_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := (select auth.uid());
  v_col text := tg_argv[1];
  v_old text; v_new text; v_row jsonb;
begin
  if v_admin is null or not public.is_admin(v_admin) then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
    insert into public.admin_audit_log (admin_id, action, target_table, target_id)
      values (v_admin, tg_argv[0], tg_table_name, v_row ->> 'id');
    return old;
  end if;
  v_row := to_jsonb(new);
  v_old := to_jsonb(old) ->> v_col;
  v_new := v_row ->> v_col;
  if v_old is distinct from v_new then
    insert into public.admin_audit_log (admin_id, action, target_table, target_id, details)
      values (v_admin, tg_argv[0], tg_table_name, v_row ->> 'id', jsonb_build_object('felt', v_col, 'fra', v_old, 'til', v_new));
  end if;
  return new;
end;
$$;
revoke all on function public.trg_admin_audit() from public, anon, authenticated;

drop trigger if exists audit_users_role on public.users;
create trigger audit_users_role after update of role on public.users
  for each row execute function public.trg_admin_audit('rolle_aendret', 'role');
drop trigger if exists audit_tickets_status on public.feedback_tickets;
create trigger audit_tickets_status after update of status on public.feedback_tickets
  for each row execute function public.trg_admin_audit('ticketstatus_aendret', 'status');
drop trigger if exists audit_submissions_status on public.submissions;
create trigger audit_submissions_status after update of status on public.submissions
  for each row execute function public.trg_admin_audit('indsendelse_behandlet', 'status');
drop trigger if exists audit_products_delete on public.products;
create trigger audit_products_delete after delete on public.products
  for each row execute function public.trg_admin_audit('produkt_slettet');
drop trigger if exists audit_knowledge_delete on public.knowledge_base;
create trigger audit_knowledge_delete after delete on public.knowledge_base
  for each row execute function public.trg_admin_audit('vidensindgang_slettet');

-- Opbevaring: 12 måneder (samme funktion som øvrige frister; resten uændret).
create or replace function public.cleanup_notifications()
returns void
language sql
security definer
set search_path to 'public'
as $function$
  delete from public.notifications where created_at < now() - interval '12 months';
  delete from public.notification_events where created_at < now() - interval '90 days' and status <> 'pending';
  delete from public.client_errors where last_seen < now() - interval '90 days';
  delete from public.security_reports where created_at < now() - interval '12 months';
  delete from public.api_usage where day < current_date - 30;
  delete from public.api_usage_global where day < current_date - 30;
  delete from public.scan_history where scanned_at < now() - interval '24 months';
  delete from public.search_selections where created_at < now() - interval '12 months';
  delete from public.feedback_tickets where submitted_by is null and created_at < now() - interval '12 months';
  delete from public.admin_audit_log where created_at < now() - interval '12 months';
$function$;
