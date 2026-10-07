-- F1-10: Stop det ugentlige job "weekly-digest" (opskriftsoversigt), mens Opskrifter er på pause.
-- Kun selve jobbet fjernes; edge-funktionen weekly-digest og notifikationskategorien beholdes,
-- så jobbet kan oprettes igen (baseline-migrationen viser skemaet), når Opskrifter vender tilbage.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'weekly-digest') then
    perform cron.unschedule('weekly-digest');
  end if;
end $$;
