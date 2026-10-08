-- Driftsoprydning (to do ce1e028c, 8. okt. 2026).
-- 1) Historikken over planlagte job (cron.job_run_details) vokser med ca. 1.440 rækker i døgnet (notify-dispatch kører hvert minut):
--    ryd det der er ældre end 7 dage nu, og dagligt kl. 03:20 UTC derefter. Ingen personoplysninger i tabellen.
delete from cron.job_run_details where end_time < now() - interval '7 days';

select cron.schedule(
  'cron-history-cleanup',
  '20 3 * * *',
  $cron$ delete from cron.job_run_details where end_time < now() - interval '7 days' $cron$
);

-- 2) To tilladende DELETE-politikker på family_invites samles i én (samme adgang: admin eller afsenderen af en ventende invitation).
drop policy if exists admin_can_delete_family_invites on public.family_invites;
drop policy if exists family_invites_delete_own_pending on public.family_invites;
create policy family_invites_delete on public.family_invites as permissive for delete to authenticated
  using (
    public.is_admin((select auth.uid()))
    or ((select auth.uid()) = invited_by and status = 'pending')
  );

-- 3) Indeks på fremmednøgler uden indeks (alle ON DELETE SET NULL mod users: gør kontosletning billigere).
create index if not exists idx_custom_allergens_created_by on public.custom_allergens (created_by);
create index if not exists idx_family_invites_requested_by on public.family_invites (requested_by);
create index if not exists idx_admin_todos_created_by on public.admin_todos (created_by);
create index if not exists idx_admin_todos_completed_by on public.admin_todos (completed_by);
create index if not exists idx_admin_todo_comments_author_id on public.admin_todo_comments (author_id);
create index if not exists idx_notification_push_overrides_updated_by on public.notification_push_overrides (updated_by);
