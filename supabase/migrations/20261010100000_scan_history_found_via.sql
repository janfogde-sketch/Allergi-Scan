-- Historik: hvordan et produkt blev fundet (10. okt. 2026). 'scan' = kamera/indtastet kode, 'search' = åbnet via søgning, favoritter,
-- alternativer eller beskeder. Eksisterende rækker er 'scan' (der er ingen data om det modsatte). Ingen søgeord gemmes her.
alter table public.scan_history
  add column if not exists found_via text not null default 'scan';
alter table public.scan_history
  drop constraint if exists scan_history_found_via_check;
alter table public.scan_history
  add constraint scan_history_found_via_check check (found_via in ('scan', 'search'));
