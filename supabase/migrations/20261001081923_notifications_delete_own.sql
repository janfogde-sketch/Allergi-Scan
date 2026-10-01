-- Slet egen besked (1. okt. 2026). Tabellen er kun læsbar for brugeren (RLS), så sletning sker via en
-- RPC, der kun rører modtagerens egne rækker — samme mønster som mark_notification_read().
-- Afsendelsesregistret (notification_deliveries) slettes med via cascade.
create or replace function public.delete_notification(p_id uuid)
 returns boolean
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_deleted integer;
begin
  delete from public.notifications
   where id = p_id
     and user_id = (select auth.uid());
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$function$;
revoke execute on function public.delete_notification(uuid) from public, anon;
grant execute on function public.delete_notification(uuid) to authenticated, service_role;
