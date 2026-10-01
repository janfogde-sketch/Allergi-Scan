-- Jans admin-konto hed jafo@eatsafe.com i login-systemet; den rigtige postkasse er jafo@eatsafe.dk (1. okt. 2026).
update auth.users set email = 'jafo@eatsafe.dk', updated_at = now()
where id = '9e92dc72-f105-454c-b793-eec22ccf8ca3' and email = 'jafo@eatsafe.com';

update auth.identities set identity_data = jsonb_set(identity_data, '{email}', '"jafo@eatsafe.dk"'), updated_at = now()
where user_id = '9e92dc72-f105-454c-b793-eec22ccf8ca3' and provider = 'email';

update public.users set email = 'jafo@eatsafe.dk'
where id = '9e92dc72-f105-454c-b793-eec22ccf8ca3' and email = 'jafo@eatsafe.com';
