-- Lukker to do'en "Mål frafald i første start" (kode i samme PR som 20261008160000_admin_onboarding_frafald.sql).
-- Kommentaren indsættes kun hvis to do'en findes (rækken findes kun i produktion).
update public.admin_todos set status = 'done' where id = '736d6ade-d01f-4b55-9b72-85f89a882c6b';
insert into public.admin_todo_comments (todo_id, body)
select t.id,
  'Bygget 8. okt. 2026. Admin har nu fanen Brugere & kommunikation → "Frafald i start": antal konti, hvor mange der er færdige med første start, og hvor mange der holdt op på hvert af de 5 trin (med andel og hvor mange af dem der er ældre end 24 timer, så konti der stadig er i gang ikke tæller som frafald). Kun samlede tal fra en funktion kun admins kan kalde (admin_onboarding_funnel). Status nu: 11 konti, 10 færdige, 1 stoppet på trin 3. Tallene er for få til at skære trin væk endnu; kig igen efter beta.'
from public.admin_todos t where t.id = '736d6ade-d01f-4b55-9b72-85f89a882c6b';
