-- To do 0255840a (14. okt. 2026): Indstillinger -> Aktuelle tilbagekaldelser viser de seneste 60 dages
-- tilbagekaldelser fra Fødevarestyrelsen, også dem uden stregkode. recalls er lukket for brugere, så
-- opslaget sker via en security definer-funktion, der kun returnerer offentlige felter.
-- Aldrig annullerede eller uafgjorte (needs_review). Kun for indloggede brugere.
create or replace function public.recent_recalls()
returns table (title text, published_at timestamptz, reason text, action text, source_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.title, r.published_at, r.reason, r.action, r.source_url
    from public.recalls r
   where r.status in ('ready', 'archived')
     and r.published_at >= now() - interval '60 days'
   order by r.published_at desc
   limit 50
$$;

revoke execute on function public.recent_recalls() from public, anon;
grant execute on function public.recent_recalls() to authenticated;
