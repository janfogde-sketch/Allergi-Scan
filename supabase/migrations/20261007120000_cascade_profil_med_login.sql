-- En brugers profil (public.users) forsvinder nu automatisk, når loginkontoen (auth.users) slettes,
-- også ved direkte sletning i Supabase. Tjekket 7. okt. 2026: 0 profiler uden login, så intet ryddes op.
-- Ændrer kun regler for sletning, ingen data slettes eller ændres nu.

alter table public.users
  add constraint users_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- Disse tre blokerede ellers en sletning af profilen (ingen regel = afvis).
alter table public.family_memberships drop constraint family_memberships_user_id_fkey,
  add constraint family_memberships_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
alter table public.shopping_list_access drop constraint shopping_list_access_user_id_fkey,
  add constraint shopping_list_access_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
-- Familien består, hvis opretteren slettes (samme som delete-user gør).
alter table public.families drop constraint families_created_by_fkey,
  add constraint families_created_by_fkey foreign key (created_by) references public.users(id) on delete set null;
