-- Tilbagekaldelser tjekkes én gang dagligt kl. 17:00 UTC (19 dansk sommertid / 18 vintertid). Jans beslutning 6. okt. 2026.
select cron.alter_job(job_id := (select jobid from cron.job where jobname = 'notify-recalls-sync'), schedule := '0 17 * * *');
