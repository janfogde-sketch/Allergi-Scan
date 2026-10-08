-- 8. okt. 2026 (to do 8c0d88eb): små rettighedshuller fra kodegennemgang fase 1.
-- Ingen data ændres. Triggerfunktioner kaldes af databasen selv og skal ikke kunne kaldes udefra.
revoke execute on function public.trg_notify_submission_reviewed() from public, anon, authenticated;
revoke execute on function public.trg_notify_invite_accepted() from public, anon, authenticated;
revoke execute on function public.trg_notify_ticket_update() from public, anon, authenticated;
revoke execute on function public.trg_notify_list_item_added() from public, anon, authenticated;
revoke execute on function public.trg_notify_link_declined() from public, anon, authenticated;

-- Fast søgesti, så funktionerne ikke kan snydes af en anden søgesti.
alter function public.ticket_todo_status(text) set search_path = public;
alter function public.todo_ticket_status(text) set search_path = public;
