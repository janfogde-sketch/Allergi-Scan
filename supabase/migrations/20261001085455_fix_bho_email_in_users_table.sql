-- Bjørns login-adresse er bho@eatsafe.dk (auth.users); brugertabellen stod som bho@sfds.dk (1. okt. 2026).
update public.users set email = 'bho@eatsafe.dk'
where id = 'd8ff299b-449e-4c88-98fd-58f397199f1c' and email = 'bho@sfds.dk';
