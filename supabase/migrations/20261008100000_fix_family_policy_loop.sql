-- Retter uendelig politikløkke mellem families og family_memberships (fundet af adgangstesten, PR #595).
-- Før: hver tabels læseregel slog op i den anden tabel, så enhver direkte læsning blev afvist.
-- Nu slår reglerne op via to hjælpefunktioner, der ikke selv udløser regler (samme mønster som family_group).
-- Hvem der må se hvad er uændret: egne medlemskaber, familier man har oprettet eller er aktivt medlem af, og admin.
-- Ingen data ændres. Appen læser ikke tabellerne direkte (kun edge-funktioner med servicenøgle).

create or replace function public.is_family_creator(p_family uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.families where id = p_family and created_by = p_uid)
$$;

create or replace function public.is_family_active_member(p_family uuid, p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_memberships
                 where family_id = p_family and user_id = p_uid and status = 'active')
$$;

revoke execute on function public.is_family_creator(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.is_family_active_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.is_family_creator(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_family_active_member(uuid, uuid) to authenticated, service_role;

drop policy "Brugere kan læse egne familier" on public.families;
create policy "Brugere kan læse egne familier" on public.families for select to authenticated
using (
  created_by = (select auth.uid())
  or public.is_family_active_member(id, (select auth.uid()))
  or exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'admin')
);

drop policy "Brugere kan læse egne medlemskaber" on public.family_memberships;
create policy "Brugere kan læse egne medlemskaber" on public.family_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_family_creator(family_id, (select auth.uid()))
  or exists (select 1 from public.users u where u.id = (select auth.uid()) and u.role = 'admin')
);
