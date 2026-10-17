-- Test af leksikonets redaktionelle status (16. okt. 2026): intet er godkendt af sig selv, "godkendt" kræver resumé og kilde, stemplet gennemgang, ændring af godkendt
-- indhold sender opslaget tilbage til gennemgang, og kun udgivne opslag er synlige for brugere (administratorer ser alle). Alt rulles tilbage.
begin;
do $$
declare
  adm uuid := gen_random_uuid(); kid uuid; kid2 uuid; n int; st text; rb uuid; res text := '';
begin
  insert into auth.users(id,email,aud,role) values (adm,'adm-'||substr(adm::text,1,8)||'@example.invalid','authenticated','authenticated');
  alter table public.users disable trigger prevent_role_self_escalation_trigger;
  update public.users set role='admin' where id=adm;
  alter table public.users enable trigger prevent_role_self_escalation_trigger;

  -- Eksisterende og nye opslag står uden status og er udgivet som standard
  insert into public.knowledge_base(category,title,slug) values ('faq','Testopslag','leks-test-'||substr(adm::text,1,8)) returning id into kid;
  select editorial_status into st from public.knowledge_base where id=kid; if st is not null then res := res || 'AUTOGODKENDT '; end if;
  select count(*) into n from public.knowledge_base where id=kid and published; if n<>1 then res := res || 'IKKE-UDGIVET-SOM-STANDARD '; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  begin update public.knowledge_base set editorial_status='approved' where id=kid; res := res || 'GODKENDT-UDEN-RESUME '; exception when sqlstate '22023' then null; end;
  update public.knowledge_base set summary='Kort', sources=array['https://example.invalid/a'] where id=kid;
  update public.knowledge_base set editorial_status='approved' where id=kid;
  select editorial_status, reviewed_by into st, rb from public.knowledge_base where id=kid;
  if st<>'approved' then res := res || 'IKKE-GODKENDT '; end if;
  if rb is distinct from adm then res := res || 'GENNEMGANG-IKKE-STEMPLET '; end if;
  select count(*) into n from public.knowledge_base where id=kid and reviewed_at is not null; if n<>1 then res := res || 'TIDSPUNKT-MANGLER '; end if;

  -- Ændring af fagligt indhold i et godkendt opslag sender det tilbage til gennemgang; en ren sortering gør ikke
  update public.knowledge_base set sort_order = 5 where id=kid;
  select editorial_status into st from public.knowledge_base where id=kid; if st<>'approved' then res := res || 'SORTERING-AFVISTE-GODKENDELSE '; end if;
  update public.knowledge_base set description='Ny tekst' where id=kid;
  select editorial_status into st from public.knowledge_base where id=kid; if st<>'pending_review' then res := res || 'INDHOLDSAENDRING-IKKE-TILBAGE-TIL-GENNEMGANG(' || coalesce(st,'null') || ') '; end if;

  -- Ugyldig status afvises
  begin update public.knowledge_base set editorial_status='fagligt-sandt' where id=kid; res := res || 'UGYLDIG-STATUS '; exception when check_violation then null; end;

  -- Skjulte opslag ses ikke af ikke-loggede, men af administratorer
  update public.knowledge_base set published=false where id=kid;
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  execute 'set local role anon';
  select count(*) into n from public.knowledge_base where id=kid; if n<>0 then res := res || 'SKJULT-SYNLIG-FOR-ANON '; end if;
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', adm,'role','authenticated')::text, true);
  select count(*) into n from public.knowledge_base where id=kid; if n<>1 then res := res || 'ADMIN-SER-IKKE-SKJULT '; end if;
  execute 'reset role';
  if res <> '' then raise exception 'LEKSIKON-REDAKTION: %', res; end if;
end $$;
rollback;
select 'LEKSIKON-REDAKTION: ALLE TESTS BESTAAET' as resultat;
