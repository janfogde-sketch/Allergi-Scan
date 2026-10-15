-- S8 trin 2 del B (15. okt. 2026, to do 70a1f079): fjern den gamle familiemodel.
-- families og family_memberships havde 0 rækker, og shopping_lists.family_id var tom i alle rækker (målt 15. okt.),
-- så ingen data går tabt, og der laves ingen backup. Ingen kode i appen, edge-funktionerne eller api bruger dem;
-- kontosletningen holdt op med at røre dem i del A (PR 844), som er udgivet på main før denne (PR 847).
-- Den nuværende familiemodel (family_members, family_invites) berøres ikke.

alter table public.shopping_lists drop column if exists family_id;

drop table if exists public.family_memberships;
drop table if exists public.families;

drop function if exists public.is_family_active_member(uuid, uuid);
drop function if exists public.is_family_creator(uuid, uuid);
