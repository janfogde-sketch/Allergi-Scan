-- Allergileksikonet: redaktionel status, seneste gennemgang og udgivelse (16. okt. 2026, Bjørn og Jan).
-- Før var alle opslag offentlige med det samme, uden status for gennemgang. Nu er godkendelse (editorial_status) adskilt fra udgivelse (published):
--   editorial_status: tom = ikke registreret/ikke gennemgået (alle 758 eksisterende opslag), draft, pending_review, approved, needs_update. Intet står som godkendt af sig selv.
--   reviewed_at/reviewed_by: stemples af databasen, når et opslag sættes til "approved" (administratoren, der gør det). reviewed_by nulstilles ved kontosletning.
--   published: standard sand, så alle eksisterende opslag forbliver synlige; falsk skjuler opslaget for brugerne (admin ser det stadig).
-- Regler i databasen: "approved" kræver resumé og mindst én kilde; ændres fagligt indhold i et godkendt opslag, falder det tilbage til "pending_review", så ændringer gennemgås igen.
-- Rollback: drop trigger trg_knowledge_editorial on public.knowledge_base; gendan politikken "Alle kan læse viden" (for public using (true)); drop de fire kolonner.

alter table public.knowledge_base
  add column if not exists editorial_status text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.users(id) on delete set null,
  add column if not exists published boolean not null default true;

alter table public.knowledge_base drop constraint if exists knowledge_base_editorial_status_check;
alter table public.knowledge_base add constraint knowledge_base_editorial_status_check
  check (editorial_status is null or editorial_status in ('draft', 'pending_review', 'approved', 'needs_update'));
create index if not exists idx_knowledge_base_reviewed_by on public.knowledge_base (reviewed_by);

-- Brugerne ser kun udgivne opslag; loggede administratorer ser alle (is_admin må ikke kaldes af anon, jf. S8)
alter policy "Alle kan læse viden" on public.knowledge_base to anon using (published);
drop policy if exists "Loggede kan læse udgivet viden" on public.knowledge_base;
create policy "Loggede kan læse udgivet viden" on public.knowledge_base as permissive for select to authenticated
  using (published or public.is_admin((select auth.uid())));

create or replace function public.knowledge_editorial_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  content_changed boolean;
begin
  if new.editorial_status = 'approved' and (tg_op = 'INSERT' or old.editorial_status is distinct from 'approved') then
    if coalesce(btrim(new.summary), '') = '' or coalesce(cardinality(new.sources), 0) = 0 then
      raise exception 'Et opslag kan kun godkendes med resumé og mindst én kilde' using errcode = '22023';
    end if;
    new.reviewed_at := now();
    new.reviewed_by := (select auth.uid());
  end if;
  if tg_op = 'UPDATE' and old.editorial_status = 'approved' and new.editorial_status = 'approved' then
    content_changed := (new.category, new.title, new.summary, new.description, new.health_notes, new.status_label, new.found_in, new.alternatives,
                        new.allergen_ids, new.diet_tags, new.aliases, new.tags, new.sources, new.tips)
                       is distinct from
                       (old.category, old.title, old.summary, old.description, old.health_notes, old.status_label, old.found_in, old.alternatives,
                        old.allergen_ids, old.diet_tags, old.aliases, old.tags, old.sources, old.tips);
    if content_changed then
      new.editorial_status := 'pending_review';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.knowledge_editorial_guard() from public, anon, authenticated;

drop trigger if exists trg_knowledge_editorial on public.knowledge_base;
create trigger trg_knowledge_editorial
  before insert or update on public.knowledge_base
  for each row execute function public.knowledge_editorial_guard();
