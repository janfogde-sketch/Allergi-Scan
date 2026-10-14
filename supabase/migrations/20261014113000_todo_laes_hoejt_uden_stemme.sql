-- To do-listen: "Læs højt" i Madpas uden stemme / ved skærmskift (14. okt. 2026). Kun skrivning til to do-listen.
-- Opgaven findes allerede (oprettet af Bjørn); den lukkes kun, hvis præcis én åben opgave passer på titlen.
do $$
declare v_id uuid; v_n int;
begin
  select count(*), min(id::text)::uuid into v_n, v_id
    from public.admin_todos
   where title ilike '%læs højt%' and status <> 'done';
  if v_n = 1 then
    update public.admin_todos
       set status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
     where id = v_id;
    insert into public.admin_todo_comments (todo_id, body)
    select v_id, 'Lukket 14. okt. 2026. Madpas-oplæsningen fejler ikke længere i det stille: mangler telefonen en stemme til sproget (eller starter talen ikke inden for 3 sekunder), vises en rød besked med den eksisterende toast ("Din telefon har ingen stemme til <sprog>. Du kan i stedet vise skærmen til tjeneren."), og andre fejl giver en kort fejlbesked. Oplæsningen stopper, når man forlader Madpas eller lukker appen. Ingen nyt design; teksten genbruger den eksisterende besked-stil. iPhone-test ligger hos Bjørn.'
    where not exists (select 1 from public.admin_todo_comments where todo_id = v_id and body like 'Lukket 14. okt. 2026. Madpas-oplæsningen%');
  end if;
end $$;

insert into public.admin_todos (title, description, status, priority, track, assignee_id)
select
  'iPhone-test: Læs højt i Madpas uden stemme og ved skærmskift',
  E'Test på iPhone (Bjørn): (1) Madpas > vælg et sprog uden installeret stemme (fx Thai eller Hindi) > tryk Læs højt: der skal komme en rød besked "Din telefon har ingen stemme til ...". (2) Vælg dansk > tryk Læs højt og skift straks til en anden skærm: oplæsningen skal stoppe. (3) Tryk Læs højt og luk appen: den skal stoppe. Forslag til Bjørn: er teksten i beskeden god nok, eller skal den have et andet design?',
  'todo', 'normal', 'test', public._admin_id('bho')
 where not exists (select 1 from public.admin_todos where title = 'iPhone-test: Læs højt i Madpas uden stemme og ved skærmskift');
