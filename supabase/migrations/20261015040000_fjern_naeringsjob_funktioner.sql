-- Fjerner de to gamle næringsjob-funktioner. Serverfunktionerne nutrition-backfill og nutrition-backfill-nemlig er slettet,
-- og cron-jobbene er allerede stoppet. Ingen tabeller eller data røres (sikkerhedskopierne beholdes).
do $$
begin
  perform cron.unschedule(jobname) from cron.job where jobname in ('nutrition-backfill', 'nutrition-backfill-nemlig');
end $$;

drop function if exists public.run_nutrition_backfill();
drop function if exists public.run_nutrition_nemlig();
