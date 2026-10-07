-- Fjerner to ubrugte skriveveje (to do 339ac35b, rapport F8).
-- Ingen data berøres: families, family_memberships og recipes/-filer er tomme.

-- 1) Opskrifter er på pause: ingen skal kunne uploade til recipes/ i product-images.
drop policy if exists "Brugere kan uploade opskriftsbilleder" on storage.objects;

-- 2) Gamle familietabeller bruges ikke af appen (familie = family_invites).
-- Kun læseadgang bevares; service-nøglen (delete-user, admin) er upåvirket af RLS.
drop policy if exists "Brugere kan oprette familier" on public.families;
drop policy if exists "Ejere kan opdatere familier" on public.families;
drop policy if exists "Ejere kan slette familier" on public.families;
drop policy if exists "Ejere kan oprette medlemskaber" on public.family_memberships;
drop policy if exists "Ejere kan opdatere medlemskaber" on public.family_memberships;
drop policy if exists "Ejere kan slette medlemskaber" on public.family_memberships;
