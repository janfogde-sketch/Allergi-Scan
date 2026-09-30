-- Feedback-grænse, del 1 (arkitektur-audit A4, 30. sept. 2026).
-- Kolonne til edge-functionen feedback, som tæller anonym feedback pr.
-- afsender uden at gemme IP-adressen. Del 2 (luk den direkte INSERT)
-- ligger i en senere migration og køres først, når appen bruger
-- edge-functionen i produktion.
alter table public.feedback_tickets add column if not exists client_hash text;
create index if not exists feedback_tickets_created_at_idx on public.feedback_tickets using btree (created_at desc);
comment on column public.feedback_tickets.client_hash is 'Saltet SHA-256 af afsenderens IP, sat af edge-functionen feedback til grænsen for anonym feedback (A4, 30. sept. 2026). Selve IP-adressen gemmes ikke.';
