-- F1-1 (6. okt. 2026): resultatsiden viser en advarsel, når den scannede vare er kaldt tilbage.
-- recalls er lukket for brugere (kun admin-policy), så opslaget sker via en security definer-
-- funktion, der kun returnerer offentlige felter fra Fødevarestyrelsens side for ét EAN.
-- Kun tilbagekaldelser fra de sidste 60 dage (ældre partier er ude af handlen), aldrig
-- annullerede eller uafgjorte (needs_review har ingen EAN).
create or replace function public.active_recalls_for_ean(p_ean text)
returns table (title text, published_at timestamptz, affected text, reason text, action text, source_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select r.title, r.published_at, r.affected, r.reason, r.action, r.source_url
    from public.recalls r
   where p_ean ~ '^[0-9]{8,14}$'
     and p_ean = any(r.eans)
     and r.status in ('ready', 'archived')
     and r.published_at >= now() - interval '60 days'
   order by r.published_at desc
   limit 3
$$;

revoke execute on function public.active_recalls_for_ean(text) from public;
grant execute on function public.active_recalls_for_ean(text) to anon, authenticated;
