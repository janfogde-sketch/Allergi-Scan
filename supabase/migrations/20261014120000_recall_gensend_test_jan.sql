-- Engangstest (Jan, 14. okt. 2026): sæt tilbagekaldelsen om Amanda Makrelkræs i kø igen. Eneste bruger med produktet er Jan (favorit),
-- så kun Jans konto får besked. Gentager ikke senere: hændelsen sættes kun tilbage, hvis den endnu ikke har givet nogen besked.
update public.notification_events e
   set status = 'pending', attempts = 0, last_error = null, processed_at = null, available_at = now()
 where e.event_key = 'p6:f5bfee43-c677-42e0-98de-159ba057ab85'
   and e.kind = 'recall_published'
   and not exists (select 1 from public.notifications n where n.event_key = e.event_key);
