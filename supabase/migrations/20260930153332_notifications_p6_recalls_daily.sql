-- Feedet hentes kun én gang dagligt (06:07 UTC = 08:07 dansk sommertid / 07:07 vintertid).
select cron.schedule('notify-recalls-sync', '7 6 * * *', $$select public.sync_recalls()$$);
