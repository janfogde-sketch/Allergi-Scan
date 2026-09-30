-- recalls-sync (service-role) skal kunne læse og skrive tabellen; anon/authenticated har fortsat kun admin-læsning via RLS.
grant select, insert, update, delete on public.recalls to service_role;
