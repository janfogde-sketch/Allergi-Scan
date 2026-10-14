-- To do-listen: de tre "falsk grønt"-opgaver (G1+G2, G3, G4) lukkes efter PR 765. Kun skrivning til to do-listen. Idempotent.
update public.admin_todos
   set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
 where title in (
   '[Før beta] Kode: Falsk grønt når profilen ikke er hentet eller ingen profil er valgt',
   '[Før beta] Kode: Rediger præferencer må først gælde efter Gem',
   '[Før beta] Data: Genanalyse og godkendelse må kun ændre allergener opad'
 ) and status <> 'done';

insert into public.admin_todo_comments (todo_id, body)
select t.id, v.body
from (values
 ('[Før beta] Kode: Falsk grønt når profilen ikke er hentet eller ingen profil er valgt',
  'Lukket 14. okt. 2026 (Claude, PR 765): resultatsiden viser kun en vurdering, når profilen er hentet. Et ukendt profilvalg (fx slettet barn) giver Kan ikke vurderes og beder om at vælge profil, i stedet for at falde tilbage til forælderens profil. Ingen profiler at vurdere imod giver unknown i evaluateProductForProfiles. Historikken ændrer ikke længere Tjekker for. Tests tilføjet.'),
 ('[Før beta] Kode: Rediger præferencer må først gælde efter Gem',
  'Lukket 14. okt. 2026 (Claude, PR 765): Rediger præferencer redigerer en kladde, som først skrives til appens tilstand efter vellykket save_my_allergens. Profilen hentes ikke længere forfra ved fornyet login (useLoadUserData afhænger kun af, om der er et login). Test tilføjet.'),
 ('[Før beta] Data: Genanalyse og godkendelse må kun ændre allergener opad',
  'Lukket 14. okt. 2026 (Claude, PR 765): auto-reparse og godkendelse af indsendelser (enkelt og bulk) bruger mergeFlagsUpward, så flag kun kan hæves (nej, spor, ja). Håndrettede produkter i admin får allergen_quality=verified og springes over. Edge-funktionen auto-reparse rulles ud af workflowet Deploy edge functions ved merge; en kørsel af Kør nu efter udrulning er ikke prøvet.')
) as v(title, body)
join public.admin_todos t on t.title = v.title
where not exists (select 1 from public.admin_todo_comments c where c.todo_id = t.id and c.body like 'Lukket 14. okt. 2026 (Claude, PR 765)%');
