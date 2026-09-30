-- Appen (usePush.js) sender kun { token } ved registrering af et push-abonnement. Uden standardværdi fejlede
-- hver indsættelse med NOT NULL på user_id (fejlen blev ikke vist), så tabellen var altid tom.
-- RLS-politikken push_tokens_own kræver stadig user_id = auth.uid(), så ingen kan registrere for en anden.
alter table public.push_tokens alter column user_id set default auth.uid();
