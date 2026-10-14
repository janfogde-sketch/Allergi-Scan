-- F1-17 (14. okt. 2026): besked, når en tilbagekaldelse annulleres eller ændres.
-- recalls-sync læser nu en annulleringsside ("ANNULLERET: ...") som ophævelse af den oprindelige
-- tilbagekaldelse og genlæser de seneste 14 dages sider for ændringer. Kolonnerne gemmer, hvornår og hvilken
-- side der annullerede, hvor mange gange teksten er ændret og et fingeraftryk af den tekst, brugerne ser.
-- Ingen personoplysninger: kun oplysninger fra Fødevarestyrelsens offentlige sider (tabellen er stadig kun læsbar for admin).
alter table public.recalls
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by_url text,
  add column if not exists revision integer not null default 0,
  add column if not exists content_hash text;

comment on column public.recalls.cancelled_at is 'Hvornår recalls-sync fandt en annulleringsside, der ophæver denne tilbagekaldelse.';
comment on column public.recalls.cancelled_by_url is 'Fødevarestyrelsens annulleringsside (source_url på den annullerende række).';
comment on column public.recalls.revision is 'Antal gange recalls-sync har fundet ændret tekst efter første læsning (indgår i event_key p6u:<id>:<revision>).';
comment on column public.recalls.content_hash is 'SHA-256 af årsag, berørte varer og anvisning ved sidste læsning. Tom = endnu ikke genlæst.';

-- Opslaget på resultatsiden viser aldrig annullerede tilbagekaldelser (status 'cancelled' sættes nu også på den oprindelige).
-- Funktionen active_recalls_for_ean filtrerer allerede på status in ('ready','archived'), så ingen ændring er nødvendig.
