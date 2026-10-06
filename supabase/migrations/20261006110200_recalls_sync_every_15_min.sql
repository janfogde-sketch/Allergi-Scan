-- F1-2 (6. okt. 2026, Jans ja): tilbagekaldelser hentes hvert kvarter kl. 06-21 UTC
-- (08-23 dansk sommertid) i stedet for én gang i døgnet kl. 06:07 UTC.
select cron.unschedule('notify-recalls-sync');
select cron.schedule('notify-recalls-sync', '*/15 6-21 * * *', $$select public.sync_recalls()$$);
