-- =====================================================================
-- EatSafe — skema-baseline (øjebliksbillede af produktion 30. sept. 2026)
-- =====================================================================
--
-- Genereret fra Postgres-kataloget i projekt jegrpcflyguadyxialkm
-- (pg_get_*def, pg_policies, aclexplode), fordi skemaet indtil nu kun
-- fandtes i den live database.
--
-- KØR IKKE DENNE FIL MOD PRODUKTION. Den beskriver hvad produktion
-- allerede har. Den er til:
--   * at genskabe skemaet i et tomt projekt (staging, lokal `supabase start`)
--   * at kunne se og diffe skemaet i repoet
--
-- Alle ændringer efter denne dato lægges som nye filer i
-- supabase/migrations/ (samme navn som apply_migration bruger) — se
-- CLAUDE.md, "Ny stående regel". Filerne i supabase/sql/ er ældre, løse
-- ændringer, som allerede er indeholdt i denne baseline.
--
-- Udeladt med vilje:
--   * backup-tabeller (products_kj_backup_* m.fl.) og skemaet qa_backup
--   * data (også plans/knowledge_base/recipes)
--   * vault-hemmeligheder: opret SUPABASE_ANON_KEY og
--     SUPABASE_SERVICE_ROLE_KEY i Vault FØR cron-jobs og e-mail-triggere
--     kan virke (RESEND_API_KEY ligger kun som edge-secret, ikke i Vault)
--   * Auth-indstillinger (SMTP, Confirm email, adgangskodekrav) — de
--     ligger i Dashboard, se CLAUDE.md afsnit 0
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists pg_stat_statements with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ---------------------------------------------------------------------
-- Tabeller
-- ---------------------------------------------------------------------
create table public.allergen_flags (
  id uuid default gen_random_uuid() not null,
  product_id uuid,
  gluten text default 'unknown'::text,
  laktose text default 'unknown'::text,
  aeg text default 'unknown'::text,
  noedder text default 'unknown'::text,
  jordnoedder text default 'unknown'::text,
  soja text default 'unknown'::text,
  fisk text default 'unknown'::text,
  skaldyr text default 'unknown'::text,
  selleri text default 'unknown'::text,
  sennep text default 'unknown'::text,
  sesam text default 'unknown'::text,
  svovl text default 'unknown'::text,
  lupin text default 'unknown'::text,
  bloeddyr text default 'unknown'::text,
  custom_flags jsonb,
  parsed_by_ai boolean default false,
  created_at timestamp with time zone default now()
);

create table public.custom_allergens (
  id uuid default gen_random_uuid() not null,
  name text not null,
  created_by uuid,
  approved boolean default false,
  created_at timestamp with time zone default now()
);

create table public.families (
  id uuid default gen_random_uuid() not null,
  name text not null,
  created_by uuid,
  created_at timestamp with time zone default now()
);

create table public.family_invites (
  id uuid default gen_random_uuid() not null,
  token text default encode(gen_random_bytes(24), 'hex'::text) not null,
  invited_by uuid not null,
  accepted_by uuid,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone default (now() + '24:00:00'::interval) not null,
  accepted_at timestamp with time zone
);

create table public.family_members (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  name text not null,
  color text,
  created_at timestamp with time zone default now(),
  gender text,
  birth_year integer,
  allergens jsonb default '[]'::jsonb,
  custom_allergens jsonb default '[]'::jsonb,
  diets jsonb default '[]'::jsonb,
  e_numbers jsonb default '[]'::jsonb,
  family_owner_id uuid
);

create table public.family_memberships (
  id uuid default gen_random_uuid() not null,
  family_id uuid,
  user_id uuid,
  managed_member_id uuid,
  role text default 'member'::text,
  status text default 'invited'::text,
  joined_at timestamp with time zone
);

create table public.favorites (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  ean text not null,
  product_snapshot jsonb not null,
  added_at timestamp with time zone default now() not null,
  category text
);

create table public.feedback_tickets (
  id uuid default gen_random_uuid() not null,
  created_at timestamp with time zone default now(),
  type text not null,
  description text not null,
  context jsonb,
  image_base64 text,
  status text default 'open'::text,
  submitted_by uuid,
  admin_note text
);

create table public.ingredients (
  id uuid default gen_random_uuid() not null,
  product_id uuid,
  raw_text text,
  parsed_ingredients jsonb,
  language text default 'da'::text,
  source text,
  created_at timestamp with time zone default now()
);

create table public.knowledge_base (
  id uuid default gen_random_uuid() not null,
  category text not null,
  title text not null,
  slug text not null,
  emoji text,
  summary text,
  description text,
  found_in text[],
  alternatives text[],
  health_notes text,
  allergen_ids text[],
  diet_tags text[],
  risk_level text,
  aliases text[],
  tags text[],
  sources text[],
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.missing_ean_log (
  ean text not null,
  count integer default 1,
  first_seen timestamp with time zone default now(),
  last_seen timestamp with time zone default now()
);

create table public.notification_preferences (
  user_id uuid not null,
  category text not null,
  channel text not null,
  enabled boolean default true not null,
  updated_at timestamp with time zone default now() not null
);

create table public.plans (
  id uuid default gen_random_uuid() not null,
  name text not null,
  max_family_members integer,
  max_lists integer,
  max_custom_allergens integer,
  created_at timestamp with time zone default now()
);

create table public.products (
  id uuid default gen_random_uuid() not null,
  ean text not null,
  name text not null,
  brand text,
  category text,
  country text default 'DK'::text,
  image_url text,
  label_image_url text,
  source text,
  verified_status text default 'unverified'::text,
  verified_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  nutrition jsonb,
  tags text[] default '{}'::text[],
  ingredients_text text,
  allergen_flags jsonb default '{}'::jsonb,
  verified boolean default false,
  category_original text,
  canonical_ean text,
  variant_label text,
  allergen_quality text default 'pending'::text,
  reparsed_at timestamp with time zone,
  subcategory text,
  subcategory_classified_at timestamp with time zone,
  allergen_source_method text
);

create table public.push_tokens (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  token text not null,
  created_at timestamp with time zone default now()
);

create table public.recipe_ingredients (
  id uuid default gen_random_uuid() not null,
  recipe_id uuid,
  name text not null,
  amount text,
  unit text,
  allergen_ids text[] default '{}'::text[],
  sort_order integer default 0
);

create table public.recipes (
  id uuid default gen_random_uuid() not null,
  title text not null,
  description text,
  image_url text,
  prep_time_minutes integer,
  cook_time_minutes integer,
  servings integer default 4,
  category text,
  tags text[] default '{}'::text[],
  allergen_flags jsonb default '{}'::jsonb,
  ingredients_raw text,
  instructions text,
  source text default 'user'::text,
  source_id text,
  language text default 'da'::text,
  status text default 'pending'::text,
  submitted_by uuid,
  reviewed_by uuid,
  disclaimer text default 'Allergener er vejledende. Tjek altid ingrediensernes emballage ved alvorlige allergier.'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  cook_time integer,
  prep_time integer,
  difficulty text default 'mellem'::text,
  metadata jsonb default '{}'::jsonb
);

create table public.revision_log (
  id uuid default gen_random_uuid() not null,
  product_id uuid,
  changed_by uuid,
  change_type text not null,
  field_changed text,
  old_value text,
  new_value text,
  created_at timestamp with time zone default now()
);

create table public.scan_history (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  product_id uuid,
  ean_scanned text not null,
  active_profiles jsonb,
  result text not null,
  flags_triggered jsonb,
  scanned_at timestamp with time zone default now()
);

create table public.search_query_popularity (
  query_norm text not null,
  ean text not null,
  select_count integer default 0 not null,
  updated_at timestamp with time zone default now() not null
);

create table public.search_selections (
  id bigint generated always as identity not null,
  user_id uuid not null,
  query_norm text not null,
  ean text not null,
  product_id uuid,
  created_at timestamp with time zone default now() not null
);

create table public.shopping_list_access (
  id uuid default gen_random_uuid() not null,
  list_id uuid,
  user_id uuid,
  permission text default 'read'::text,
  granted_at timestamp with time zone default now()
);

create table public.shopping_list_items (
  id uuid default gen_random_uuid() not null,
  list_id uuid,
  product_id uuid,
  name text,
  quantity integer default 1,
  checked boolean default false,
  added_by uuid,
  store text,
  added_at timestamp with time zone default now(),
  ean text,
  image_url text
);

create table public.shopping_lists (
  id uuid default gen_random_uuid() not null,
  family_id uuid,
  owner_id uuid,
  name text not null,
  type text default 'personal'::text,
  share_link text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.submissions (
  id uuid default gen_random_uuid() not null,
  ean text not null,
  submitted_by uuid,
  raw_label_image text,
  ocr_raw_text text,
  ai_parsed_data jsonb,
  user_confirmed boolean default false,
  status text default 'pending'::text,
  reviewed_by uuid,
  review_note text,
  created_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  type text default 'new_product'::text not null,
  product_id uuid,
  notes text
);

create table public.user_allergens (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  family_member_id uuid,
  allergen text not null,
  type text default 'allergen'::text,
  custom_allergen_id uuid
);

create table public.users (
  id uuid not null,
  name text,
  email text,
  phone text,
  preferred_stores jsonb,
  role text default 'user'::text,
  plan_id uuid,
  plan_expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  onboarding_completed boolean default false,
  birth_year integer,
  gender text,
  diets jsonb default '[]'::jsonb,
  e_numbers jsonb default '[]'::jsonb not null,
  onboarding_step integer default 1 not null
);

-- ---------------------------------------------------------------------
-- Primærnøgler, unikke nøgler, checks
-- ---------------------------------------------------------------------
alter table public.allergen_flags add constraint allergen_flags_pkey PRIMARY KEY (id);
alter table public.custom_allergens add constraint custom_allergens_pkey PRIMARY KEY (id);
alter table public.families add constraint families_pkey PRIMARY KEY (id);
alter table public.family_invites add constraint family_invites_pkey PRIMARY KEY (id);
alter table public.family_members add constraint family_members_pkey PRIMARY KEY (id);
alter table public.family_memberships add constraint family_memberships_pkey PRIMARY KEY (id);
alter table public.favorites add constraint favorites_pkey PRIMARY KEY (id);
alter table public.feedback_tickets add constraint feedback_tickets_pkey PRIMARY KEY (id);
alter table public.ingredients add constraint ingredients_pkey PRIMARY KEY (id);
alter table public.knowledge_base add constraint knowledge_base_pkey PRIMARY KEY (id);
alter table public.missing_ean_log add constraint missing_ean_log_pkey PRIMARY KEY (ean);
alter table public.notification_preferences add constraint notification_preferences_pkey PRIMARY KEY (user_id, category, channel);
alter table public.plans add constraint plans_pkey PRIMARY KEY (id);
alter table public.products add constraint products_pkey PRIMARY KEY (id);
alter table public.push_tokens add constraint push_tokens_pkey PRIMARY KEY (id);
alter table public.recipe_ingredients add constraint recipe_ingredients_pkey PRIMARY KEY (id);
alter table public.recipes add constraint recipes_pkey PRIMARY KEY (id);
alter table public.revision_log add constraint revision_log_pkey PRIMARY KEY (id);
alter table public.scan_history add constraint scan_history_pkey PRIMARY KEY (id);
alter table public.search_query_popularity add constraint search_query_popularity_pkey PRIMARY KEY (query_norm, ean);
alter table public.search_selections add constraint search_selections_pkey PRIMARY KEY (id);
alter table public.shopping_list_access add constraint shopping_list_access_pkey PRIMARY KEY (id);
alter table public.shopping_list_items add constraint shopping_list_items_pkey PRIMARY KEY (id);
alter table public.shopping_lists add constraint shopping_lists_pkey PRIMARY KEY (id);
alter table public.submissions add constraint submissions_pkey PRIMARY KEY (id);
alter table public.user_allergens add constraint user_allergens_pkey PRIMARY KEY (id);
alter table public.users add constraint users_pkey PRIMARY KEY (id);

alter table public.family_invites add constraint family_invites_token_key UNIQUE (token);
alter table public.favorites add constraint favorites_user_id_ean_key UNIQUE (user_id, ean);
alter table public.knowledge_base add constraint knowledge_base_slug_key UNIQUE (slug);
alter table public.products add constraint products_ean_key UNIQUE (ean);
alter table public.push_tokens add constraint push_tokens_user_id_token_key UNIQUE (user_id, token);
alter table public.shopping_list_access add constraint shopping_list_access_list_user_key UNIQUE (list_id, user_id);
alter table public.shopping_lists add constraint shopping_lists_share_link_key UNIQUE (share_link);
alter table public.users add constraint users_email_key UNIQUE (email);

alter table public.family_invites add constraint family_invites_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'revoked'::text])));
alter table public.family_members add constraint family_members_gender_check CHECK ((gender = ANY (ARRAY['Mand'::text, 'Kvinde'::text, 'Andet'::text, 'Vil ikke oplyse'::text])));
alter table public.knowledge_base add constraint knowledge_base_category_check CHECK ((category = ANY (ARRAY['allergen'::text, 'e_number'::text, 'ingredient'::text, 'diet'::text, 'cross_reaction'::text, 'faq'::text, 'fun_fact'::text])));
alter table public.knowledge_base add constraint knowledge_base_risk_level_check CHECK ((risk_level = ANY (ARRAY['none'::text, 'low'::text, 'medium'::text, 'high'::text])));
alter table public.notification_preferences add constraint notification_preferences_category_check CHECK ((category = ANY (ARRAY['submission_status'::text, 'missing_product_found'::text, 'family'::text, 'feedback'::text, 'weekly_digest'::text])));
alter table public.notification_preferences add constraint notification_preferences_channel_check CHECK ((channel = ANY (ARRAY['push'::text, 'email'::text])));
alter table public.products add constraint products_allergen_quality_check CHECK ((allergen_quality = ANY (ARRAY['pending'::text, 'low'::text, 'medium'::text, 'high'::text, 'verified'::text])));
alter table public.submissions add constraint submissions_type_check CHECK ((type = ANY (ARRAY['new_product'::text, 'edit'::text])));
alter table public.users add constraint users_gender_check CHECK ((gender = ANY (ARRAY['Mand'::text, 'Kvinde'::text, 'Andet'::text, 'Vil ikke oplyse'::text])));
alter table public.users add constraint users_onboarding_step_check CHECK (((onboarding_step >= 1) AND (onboarding_step <= 5)));

-- ---------------------------------------------------------------------
-- Fremmednøgler
-- ---------------------------------------------------------------------
alter table public.allergen_flags add constraint allergen_flags_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public.families add constraint families_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
alter table public.family_invites add constraint family_invites_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL;
alter table public.family_invites add constraint family_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE;
alter table public.family_members add constraint family_members_family_owner_id_fkey FOREIGN KEY (family_owner_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.family_members add constraint family_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.family_memberships add constraint family_memberships_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
alter table public.family_memberships add constraint family_memberships_managed_member_id_fkey FOREIGN KEY (managed_member_id) REFERENCES family_members(id);
alter table public.family_memberships add constraint family_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
alter table public.favorites add constraint favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.feedback_tickets add constraint feedback_tickets_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.ingredients add constraint ingredients_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public.notification_preferences add constraint notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.products add constraint products_canonical_ean_fkey FOREIGN KEY (canonical_ean) REFERENCES products(ean);
alter table public.push_tokens add constraint push_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.recipe_ingredients add constraint recipe_ingredients_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE;
alter table public.recipes add constraint recipes_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.recipes add constraint recipes_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.revision_log add constraint revision_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.revision_log add constraint revision_log_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
alter table public.scan_history add constraint scan_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
alter table public.scan_history add constraint scan_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.search_selections add constraint search_selections_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
alter table public.search_selections add constraint search_selections_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.shopping_list_access add constraint shopping_list_access_list_id_fkey FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE;
alter table public.shopping_list_access add constraint shopping_list_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
alter table public.shopping_list_items add constraint shopping_list_items_added_by_fkey FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL;
alter table public.shopping_list_items add constraint shopping_list_items_list_id_fkey FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE;
alter table public.shopping_list_items add constraint shopping_list_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
alter table public.shopping_lists add constraint shopping_lists_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id);
alter table public.shopping_lists add constraint shopping_lists_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.submissions add constraint submissions_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
alter table public.submissions add constraint submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
alter table public.submissions add constraint submissions_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.user_allergens add constraint fk_family_member FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE;
alter table public.user_allergens add constraint user_allergens_custom_allergen_id_fkey FOREIGN KEY (custom_allergen_id) REFERENCES custom_allergens(id);
alter table public.user_allergens add constraint user_allergens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
alter table public.users add constraint users_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);

-- ---------------------------------------------------------------------
-- Indeks (ud over dem, nøglerne ovenfor opretter)
-- ---------------------------------------------------------------------
CREATE INDEX idx_allergen_flags_product_id ON public.allergen_flags USING btree (product_id);
CREATE INDEX idx_families_created_by ON public.families USING btree (created_by);
CREATE INDEX family_invites_invited_by_idx ON public.family_invites USING btree (invited_by);
CREATE INDEX family_invites_token_idx ON public.family_invites USING btree (token) WHERE (status = 'pending'::text);
CREATE INDEX idx_family_invites_accepted_by ON public.family_invites USING btree (accepted_by);
CREATE INDEX family_members_owner_idx ON public.family_members USING btree (family_owner_id);
CREATE INDEX idx_family_members_user_id ON public.family_members USING btree (user_id);
CREATE INDEX idx_family_memberships_family_id ON public.family_memberships USING btree (family_id);
CREATE INDEX idx_family_memberships_managed_member_id ON public.family_memberships USING btree (managed_member_id);
CREATE INDEX idx_family_memberships_user_id ON public.family_memberships USING btree (user_id);
CREATE INDEX idx_favorites_user ON public.favorites USING btree (user_id);
CREATE INDEX idx_feedback_tickets_submitted_by ON public.feedback_tickets USING btree (submitted_by);
CREATE INDEX idx_ingredients_product_id ON public.ingredients USING btree (product_id);
CREATE INDEX idx_kb_category ON public.knowledge_base USING btree (category);
CREATE INDEX idx_kb_search ON public.knowledge_base USING gin (to_tsvector('danish'::regconfig, ((((COALESCE(title, ''::text) || ' '::text) || COALESCE(summary, ''::text)) || ' '::text) || COALESCE(description, ''::text))));
CREATE INDEX idx_kb_slug ON public.knowledge_base USING btree (slug);
CREATE INDEX idx_kb_tags ON public.knowledge_base USING gin (tags);
CREATE INDEX idx_products_allergen_quality ON public.products USING btree (allergen_quality) WHERE (allergen_quality = 'pending'::text);
CREATE INDEX idx_products_canonical_ean ON public.products USING btree (canonical_ean) WHERE (canonical_ean IS NOT NULL);
CREATE INDEX idx_products_category_subcategory ON public.products USING btree (category, subcategory);
CREATE INDEX idx_products_subcategory_pending ON public.products USING btree (id) WHERE (subcategory IS NULL);
CREATE INDEX products_brand_trgm_idx ON public.products USING gin (brand extensions.gin_trgm_ops);
CREATE INDEX products_ean_idx ON public.products USING btree (ean);
CREATE UNIQUE INDEX products_ean_unique ON public.products USING btree (ean) WHERE (ean IS NOT NULL);
CREATE INDEX products_name_trgm_idx ON public.products USING gin (name extensions.gin_trgm_ops);
CREATE INDEX idx_recipe_ingredients_recipe ON public.recipe_ingredients USING btree (recipe_id);
CREATE INDEX idx_recipes_category ON public.recipes USING btree (category);
CREATE INDEX idx_recipes_reviewed_by ON public.recipes USING btree (reviewed_by);
CREATE INDEX idx_recipes_status ON public.recipes USING btree (status);
CREATE INDEX idx_recipes_submitted_by ON public.recipes USING btree (submitted_by);
CREATE INDEX idx_revision_log_changed_by ON public.revision_log USING btree (changed_by);
CREATE INDEX idx_revision_log_product_id ON public.revision_log USING btree (product_id);
CREATE INDEX idx_scan_history_product_id ON public.scan_history USING btree (product_id);
CREATE INDEX idx_scan_history_user_id ON public.scan_history USING btree (user_id);
CREATE INDEX search_selections_created_idx ON public.search_selections USING btree (created_at);
CREATE INDEX search_selections_ean_idx ON public.search_selections USING btree (ean);
CREATE INDEX search_selections_product_id_idx ON public.search_selections USING btree (product_id);
CREATE INDEX search_selections_query_idx ON public.search_selections USING btree (query_norm);
CREATE INDEX search_selections_user_query_idx ON public.search_selections USING btree (user_id, query_norm);
CREATE INDEX idx_shopping_list_access_user_id ON public.shopping_list_access USING btree (user_id);
CREATE INDEX idx_shopping_list_items_added_by ON public.shopping_list_items USING btree (added_by);
CREATE INDEX idx_shopping_list_items_list_id ON public.shopping_list_items USING btree (list_id);
CREATE INDEX idx_shopping_list_items_product_id ON public.shopping_list_items USING btree (product_id);
CREATE INDEX idx_shopping_lists_family_id ON public.shopping_lists USING btree (family_id);
CREATE INDEX idx_shopping_lists_owner_id ON public.shopping_lists USING btree (owner_id);
CREATE INDEX idx_submissions_product_id ON public.submissions USING btree (product_id);
CREATE INDEX idx_submissions_reviewed_by ON public.submissions USING btree (reviewed_by);
CREATE INDEX idx_submissions_submitted_by ON public.submissions USING btree (submitted_by);
CREATE INDEX idx_user_allergens_custom_allergen_id ON public.user_allergens USING btree (custom_allergen_id);
CREATE INDEX idx_user_allergens_family_member_id ON public.user_allergens USING btree (family_member_id);
CREATE INDEX idx_user_allergens_user_id ON public.user_allergens USING btree (user_id);
CREATE INDEX idx_users_plan_id ON public.users USING btree (plan_id);

-- ---------------------------------------------------------------------
-- Kommentarer
-- ---------------------------------------------------------------------
comment on table public.recipes is 'Kategorier: morgenmad, frokost, aftensmad, dessert, snack, tilbehør';
comment on table public.notification_preferences is 'Kun rækker for eksplicit ændrede værdier gemmes (sparse) — mangler en række for en given (user_id, category, channel), er den default true. Se notification_enabled() for opslagslogikken.';
comment on column public.products.allergen_source_method is 'Hvordan de NUVÆRENDE allergen_flags blev beregnet: ''keyword'' (kun nøgleords-motoren), ''keyword+claude'' (keyword + Claude-fallback/force_ai), ''off_tags'' (kun Open Food Facts'' egne allergens_tags/traces_tags, ingen ingredients_text at køre keyword-motoren på), ''off_tags+keyword'' (OFF-tags flettet med vores keyword-motor mod ingredients_text). NULL = ukendt/uverificeret herkomst — typisk den oprindelige bilka/nemlig-import-pipeline (ikke i dette repo) eller data der aldrig er rørt af vores egne funktioner siden. Sat 25. sept. 2026 (forslag F fra allergen-detektions-gennemgangen) for at gøre allergen_quality''s herkomst sporbar, adskilt fra selve kvalitets-/tillids-niveauet.';

-- ---------------------------------------------------------------------
-- Funktioner
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select user_id = (select auth.uid())
     and exists (
       select 1 from users
       where id = user_id
       and role = 'admin'
     )
$function$;

CREATE OR REPLACE FUNCTION public.family_group(p_uid uuid)
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with grp as (
    select p_uid as uid
    union
    select accepted_by from family_invites
      where invited_by = p_uid and status = 'accepted' and accepted_by is not null
    union
    select invited_by from family_invites
      where accepted_by = p_uid and status = 'accepted'
  )
  select uid from grp
  where auth.role() = 'service_role'
     or (select auth.uid()) = p_uid
     or (select auth.uid()) in (select uid from grp)
$function$;

CREATE OR REPLACE FUNCTION public.accept_family_invite(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invite  public.family_invites%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  -- Find invitation
  SELECT * INTO v_invite
  FROM public.family_invites
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitationen er ugyldig eller udløbet');
  END IF;

  IF v_invite.invited_by = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Du kan ikke acceptere din egen invitation');
  END IF;

  -- Accepter
  UPDATE public.family_invites
  SET status = 'accepted', accepted_by = v_user_id, accepted_at = now()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'invited_by', v_invite.invited_by
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_invite_preview(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invite public.family_invites%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM public.family_invites WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;
  RETURN jsonb_build_object(
    'found', true,
    'status', v_invite.status,
    'expires_at', v_invite.expires_at,
    'invited_by', v_invite.invited_by
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text := nullif(left(btrim(coalesce(meta->>'name', meta->>'full_name', '')), 100), '');
  v_phone text := nullif(left(btrim(coalesce(meta->>'phone', '')), 20), '');
  v_birth_year int;
  v_gender text := meta->>'gender';
  v_step int := 1;
begin
  if (meta->>'birth_year') ~ '^\d{4}$' then
    v_birth_year := (meta->>'birth_year')::int;
    if v_birth_year < extract(year from now())::int - 120 or v_birth_year > extract(year from now())::int then
      v_birth_year := null;
    end if;
  end if;
  if v_gender is not null and v_gender not in ('Mand','Kvinde','Andet','Vil ikke oplyse') then
    v_gender := null;
  end if;
  if meta->>'signup_profile' = 'true' and v_name is not null and v_birth_year is not null and v_gender is not null then
    v_step := 2;
  end if;

  insert into public.users (id, email, name, phone, birth_year, gender, onboarding_step, onboarding_completed, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(v_name, split_part(new.email, '@', 1)),
    v_phone,
    v_birth_year,
    v_gender,
    v_step,
    false,
    now(),
    now()
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.increment_search_popularity(p_query_norm text, p_ean text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into public.search_query_popularity (query_norm, ean, select_count, updated_at)
  values (p_query_norm, p_ean, 1, now())
  on conflict (query_norm, ean)
  do update set select_count = search_query_popularity.select_count + 1, updated_at = now();
$function$;

CREATE OR REPLACE FUNCTION public.log_missing_ean(p_ean text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO missing_ean_log (ean, count, first_seen, last_seen)
  VALUES (p_ean, 1, now(), now())
  ON CONFLICT (ean) DO UPDATE
  SET count = missing_ean_log.count + 1,
      last_seen = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.notification_enabled(p_user_id uuid, p_category text, p_channel text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT enabled FROM notification_preferences
     WHERE user_id = p_user_id AND category = p_category AND channel = p_channel),
    true
  )
$function$;

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT is_admin((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'Kun administratorer kan ændre rolle';
  END IF;
  RETURN NEW;
END;
$function$;

-- OBS: refererer NEW.name og NEW.rejection_reason, som submissions ikke
-- har. Fejlen fanges af EXCEPTION-blokken, så mailen sendes aldrig.
-- Rettes i en efterfølgende migration.
CREATE OR REPLACE FUNCTION public.send_submission_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_name  text;
  v_type  text;
  v_service_key text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('approved', 'rejected') THEN RETURN NEW; END IF;
  IF NOT public.notification_enabled(NEW.submitted_by, 'submission_status', 'email') THEN RETURN NEW; END IF;
  SELECT u.email, u.name INTO v_email, v_name
  FROM public.users u WHERE u.id = NEW.submitted_by;
  IF v_email IS NULL THEN RETURN NEW; END IF;
  v_type := CASE NEW.status WHEN 'approved' THEN 'submission_approved' ELSE 'submission_rejected' END;
  SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  BEGIN
    PERFORM net.http_post(
      url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'type', v_type,
        'to', v_email,
        'data', jsonb_build_object(
          'name', COALESCE(v_name, 'der'),
          'productName', COALESCE(NEW.name, 'Ukendt produkt'),
          'ean', COALESCE(NEW.ean, ''),
          'reason', COALESCE(NEW.rejection_reason, '')
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'send_submission_email fejlede: %', SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_ticket_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_name  text;
  v_service_key text;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.submitted_by IS NULL THEN RETURN NEW; END IF;
  IF NOT public.notification_enabled(NEW.submitted_by, 'feedback', 'email') THEN RETURN NEW; END IF;
  SELECT u.email, u.name INTO v_email, v_name
  FROM public.users u WHERE u.id = NEW.submitted_by;
  IF v_email IS NULL THEN RETURN NEW; END IF;
  SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
  BEGIN
    PERFORM net.http_post(
      url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'type', 'ticket_update',
        'to', v_email,
        'data', jsonb_build_object(
          'name', COALESCE(v_name, 'der'),
          'status', NEW.status,
          'message', COALESCE(NEW.admin_note, 'Din feedback er blevet opdateret.')
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'send_ticket_email fejlede: %', SQLERRM;
  END;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_welcome_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_service_key text;
  v_email text;
  v_name text;
begin
  begin
    if TG_TABLE_SCHEMA = 'auth' then
      -- on_auth_email_confirmed: e-mailen er netop blevet bekræftet
      v_email := NEW.email;
      select name into v_name from public.users where id = NEW.id;
    else
      -- on_user_created (public.users INSERT): kun hvis auth-brugeren
      -- allerede er bekræftet (fx Google) — ellers venter vi på bekræftelsen
      if not exists (select 1 from auth.users where id = NEW.id and email_confirmed_at is not null) then
        return NEW;
      end if;
      v_email := NEW.email;
      v_name := NEW.name;
    end if;
    if v_email is null then
      return NEW;
    end if;
    select decrypted_secret into v_service_key from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY';
    perform net.http_post(
      url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_service_key),
      body := jsonb_build_object('type', 'welcome', 'to', v_email, 'data', jsonb_build_object('name', coalesce(v_name, 'der'))),
      timeout_milliseconds := 15000
    );
  exception when others then
    -- Må aldrig blokere oprettelse/bekræftelse af en konto
    raise warning 'send_welcome_email fejlede: %', sqlerrm;
  end;
  return NEW;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_user_role_to_jwt()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.translate_measure(input text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result text := input;
BEGIN
  IF result IS NULL OR result = '' THEN RETURN result; END IF;
  result := regexp_replace(result, '\ytablespoons?\y', 'spsk', 'gi');
  result := regexp_replace(result, '\ytblsp\y', 'spsk', 'gi');
  result := regexp_replace(result, '\ytbsp\y', 'spsk', 'gi');
  result := regexp_replace(result, '\ytbs\y', 'spsk', 'gi');
  result := regexp_replace(result, '\yteaspoons?\y', 'tsk', 'gi');
  result := regexp_replace(result, '\ytsp\y', 'tsk', 'gi');
  result := regexp_replace(result, '\ycups?\y', 'kop', 'gi');
  result := regexp_replace(result, '\ylbs?\y', 'pund', 'gi');
  result := regexp_replace(result, '\ypinch\y', 'knivspids', 'gi');
  result := regexp_replace(result, '\ydash\y', 'drys', 'gi');
  result := regexp_replace(result, '\yhandful\y', 'håndfuld', 'gi');
  result := regexp_replace(result, '\ybunch\y', 'bundt', 'gi');
  result := regexp_replace(result, '\ycloves?\y', 'fed', 'gi');
  result := regexp_replace(result, '\ysprigs?\y', 'kviste', 'gi');
  result := regexp_replace(result, '\yslices?\y', 'skiver', 'gi');
  result := regexp_replace(result, '\ypieces?\y', 'stk', 'gi');
  result := regexp_replace(result, '\ycans?\y', 'dåse', 'gi');
  result := regexp_replace(result, '\yleaves\y', 'blade', 'gi');
  result := regexp_replace(result, '\yleaf\y', 'blad', 'gi');
  result := regexp_replace(result, '\yfinely chopped\y', 'finthakket', 'gi');
  result := regexp_replace(result, '\ychopped\y', 'hakket', 'gi');
  result := regexp_replace(result, '\ysliced\y', 'i skiver', 'gi');
  result := regexp_replace(result, '\yminced\y', 'finthakket', 'gi');
  result := regexp_replace(result, '\ydiced\y', 'i tern', 'gi');
  result := regexp_replace(result, '\ycrushed\y', 'knust', 'gi');
  result := regexp_replace(result, '\ygrated\y', 'revet', 'gi');
  result := regexp_replace(result, '\ypeeled\y', 'skrællet', 'gi');
  result := regexp_replace(result, '\yground\y', 'malet', 'gi');
  result := regexp_replace(result, '\ydried\y', 'tørret', 'gi');
  result := regexp_replace(result, '\yfresh\y', 'frisk', 'gi');
  result := regexp_replace(result, '\ylarge\y', 'stor', 'gi');
  result := regexp_replace(result, '\ysmall\y', 'lille', 'gi');
  result := regexp_replace(result, '\ymedium\y', 'medium', 'gi');
  result := regexp_replace(result, '\yTo taste\y', 'efter smag', 'gi');
  result := regexp_replace(result, '\yTo serve\y', 'til servering', 'gi');
  RETURN trim(result);
END;
$function$;

-- Funktionsrettigheder (Postgres giver PUBLIC EXECUTE som standard —
-- tilbagekald derfor fra PUBLIC, ikke kun fra anon, se CLAUDE.md afsnit 4)
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.accept_family_invite(text) to authenticated, service_role;
grant execute on function public.family_group(uuid) to authenticated, service_role;
grant execute on function public.get_invite_preview(text) to anon, authenticated;
grant execute on function public.increment_search_popularity(text, text) to service_role;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.log_missing_ean(text) to authenticated, service_role;
grant execute on function public.translate_measure(text) to public;

-- ---------------------------------------------------------------------
-- Triggere
-- ---------------------------------------------------------------------
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
CREATE TRIGGER on_auth_email_confirmed AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW WHEN (((old.email_confirmed_at IS NULL) AND (new.email_confirmed_at IS NOT NULL))) EXECUTE FUNCTION send_welcome_email();
CREATE TRIGGER on_ticket_status_changed AFTER UPDATE ON public.feedback_tickets FOR EACH ROW EXECUTE FUNCTION send_ticket_email();
CREATE TRIGGER on_submission_status_changed AFTER UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION send_submission_email();
CREATE TRIGGER on_user_created AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION send_welcome_email();
CREATE TRIGGER on_user_role_change AFTER INSERT OR UPDATE OF role ON public.users FOR EACH ROW EXECUTE FUNCTION sync_user_role_to_jwt();
CREATE TRIGGER prevent_role_self_escalation_trigger BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION prevent_role_self_escalation();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.allergen_flags enable row level security;
alter table public.custom_allergens enable row level security;
alter table public.families enable row level security;
alter table public.family_invites enable row level security;
alter table public.family_members enable row level security;
alter table public.family_memberships enable row level security;
alter table public.favorites enable row level security;
alter table public.feedback_tickets enable row level security;
alter table public.ingredients enable row level security;
alter table public.knowledge_base enable row level security;
alter table public.missing_ean_log enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.plans enable row level security;
alter table public.products enable row level security;
alter table public.push_tokens enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.revision_log enable row level security;
alter table public.scan_history enable row level security;
alter table public.search_query_popularity enable row level security;
alter table public.search_selections enable row level security;
alter table public.shopping_list_access enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.submissions enable row level security;
alter table public.submissions force row level security;
alter table public.user_allergens enable row level security;
alter table public.users enable row level security;

create policy "Alle kan læse allergenflag" on public.allergen_flags as permissive for select to public
  using (true);
create policy "Editor og admin kan opdatere allergenflag" on public.allergen_flags as permissive for update to authenticated
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = ANY (ARRAY['editor'::text, 'admin'::text]))))));
create policy "Editor og admin kan oprette allergenflag" on public.allergen_flags as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = ANY (ARRAY['editor'::text, 'admin'::text]))))));
create policy "Admin kan opdatere allergener" on public.custom_allergens as permissive for update to authenticated
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text)))));
create policy "Admin kan slette allergener" on public.custom_allergens as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text)))));
create policy "Alle kan læse godkendte allergener" on public.custom_allergens as permissive for select to public
  using (((approved = true) OR (created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text))))));
create policy "Brugere kan foreslå allergener" on public.custom_allergens as permissive for insert to authenticated
  with check ((created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy "Brugere kan læse egne familier" on public.families as permissive for select to authenticated
  using (((created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (EXISTS ( SELECT 1
   FROM family_memberships
  WHERE ((family_memberships.family_id = families.id) AND (family_memberships.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (family_memberships.status = 'active'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text))))));
create policy "Brugere kan oprette familier" on public.families as permissive for insert to authenticated
  with check ((created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy "Ejere kan opdatere familier" on public.families as permissive for update to authenticated
  using ((created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy "Ejere kan slette familier" on public.families as permissive for delete to authenticated
  using ((created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy admin_can_delete_family_invites on public.family_invites as permissive for delete to authenticated
  using (is_admin(( SELECT auth.uid() AS uid)));
create policy family_invites_delete_own_pending on public.family_invites as permissive for delete to public
  using (((( SELECT auth.uid() AS uid) = invited_by) AND (status = 'pending'::text)));
create policy family_invites_insert_own on public.family_invites as permissive for insert to authenticated
  with check ((( SELECT auth.uid() AS uid) = invited_by));
create policy family_invites_select_own on public.family_invites as permissive for select to public
  using (((( SELECT auth.uid() AS uid) = invited_by) OR (( SELECT auth.uid() AS uid) = accepted_by) OR is_admin(( SELECT auth.uid() AS uid))));
create policy family_members_delete_combined on public.family_members as permissive for delete to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT auth.uid() AS uid) IN ( SELECT family_group(family_members.family_owner_id) AS family_group)) OR is_admin(( SELECT auth.uid() AS uid))));
create policy family_members_insert_combined on public.family_members as permissive for insert to authenticated
  with check (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT auth.uid() AS uid) IN ( SELECT family_group(family_members.family_owner_id) AS family_group))));
create policy family_members_select_combined on public.family_members as permissive for select to public
  using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))) OR (( SELECT auth.uid() AS uid) IN ( SELECT family_group(family_members.family_owner_id) AS family_group)) OR (family_owner_id IN ( SELECT family_invites.invited_by
   FROM family_invites
  WHERE ((family_invites.accepted_by = ( SELECT auth.uid() AS uid)) AND (family_invites.status = 'accepted'::text)))) OR (family_owner_id IN ( SELECT family_invites.accepted_by
   FROM family_invites
  WHERE ((family_invites.invited_by = ( SELECT auth.uid() AS uid)) AND (family_invites.status = 'accepted'::text) AND (family_invites.accepted_by IS NOT NULL)))) OR (family_owner_id = ( SELECT auth.uid() AS uid))));
create policy family_members_update_combined on public.family_members as permissive for update to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT auth.uid() AS uid) IN ( SELECT family_group(family_members.family_owner_id) AS family_group))))
  with check (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT auth.uid() AS uid) IN ( SELECT family_group(family_members.family_owner_id) AS family_group))));
create policy "Brugere kan læse egne medlemskaber" on public.family_memberships as permissive for select to authenticated
  using (((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (EXISTS ( SELECT 1
   FROM families
  WHERE ((families.id = family_memberships.family_id) AND (families.created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text))))));
create policy "Ejere kan opdatere medlemskaber" on public.family_memberships as permissive for update to authenticated
  using (((EXISTS ( SELECT 1
   FROM families
  WHERE ((families.id = family_memberships.family_id) AND (families.created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))) OR (user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))));
create policy "Ejere kan oprette medlemskaber" on public.family_memberships as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM families
  WHERE ((families.id = family_memberships.family_id) AND (families.created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))));
create policy "Ejere kan slette medlemskaber" on public.family_memberships as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM families
  WHERE ((families.id = family_memberships.family_id) AND (families.created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))));
create policy "Bruger kan slette egne favoritter" on public.favorites as permissive for delete to public
  using ((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy "Bruger kan tilføje egne favoritter" on public.favorites as permissive for insert to public
  with check ((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy favorites_select_combined on public.favorites as permissive for select to public
  using (((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT auth.uid() AS uid) IN ( SELECT family_group(favorites.user_id) AS family_group))));
create policy "Alle kan oprette tickets" on public.feedback_tickets as permissive for insert to anon, authenticated
  with check (true);
create policy feedback_tickets_select_combined on public.feedback_tickets as permissive for select to authenticated
  using (((( SELECT auth.uid() AS uid) = submitted_by) OR is_admin(( SELECT auth.uid() AS uid))));
create policy feedback_tickets_update_admin on public.feedback_tickets as permissive for update to authenticated
  using (is_admin(( SELECT auth.uid() AS uid)))
  with check (is_admin(( SELECT auth.uid() AS uid)));
create policy "Alle kan læse ingredienser" on public.ingredients as permissive for select to public
  using (true);
create policy "Editor og admin kan opdatere ingredienser" on public.ingredients as permissive for update to authenticated
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = ANY (ARRAY['editor'::text, 'admin'::text]))))));
create policy "Editor og admin kan oprette ingredienser" on public.ingredients as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = ANY (ARRAY['editor'::text, 'admin'::text]))))));
create policy "Alle kan læse viden" on public.knowledge_base as permissive for select to public
  using (true);
create policy knowledge_base_delete_admin on public.knowledge_base as permissive for delete to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));
create policy knowledge_base_insert_admin on public.knowledge_base as permissive for insert to public
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));
create policy knowledge_base_update_admin on public.knowledge_base as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))))
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));
create policy "Kun service role" on public.missing_ean_log as permissive for all to public
  using (false);
create policy notification_preferences_delete_own on public.notification_preferences as permissive for delete to public
  using ((( SELECT auth.uid() AS uid) = user_id));
create policy notification_preferences_insert_own on public.notification_preferences as permissive for insert to public
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy notification_preferences_select_own on public.notification_preferences as permissive for select to public
  using ((( SELECT auth.uid() AS uid) = user_id));
create policy notification_preferences_update_own on public.notification_preferences as permissive for update to public
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy "Alle kan læse planer" on public.plans as permissive for select to public
  using (true);
create policy "Kun admin kan opdatere planer" on public.plans as permissive for update to authenticated
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text)))));
create policy "Kun admin kan oprette planer" on public.plans as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text)))));
create policy "Editor og admin kan opdatere produkter" on public.products as permissive for update to authenticated
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = ANY (ARRAY['editor'::text, 'admin'::text]))))));
create policy "Editor og admin kan oprette produkter" on public.products as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = ANY (ARRAY['editor'::text, 'admin'::text]))))));
create policy "Kun admin kan slette produkter" on public.products as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text)))));
create policy products_select_all on public.products as permissive for select to public
  using (true);
create policy push_tokens_own on public.push_tokens as permissive for all to public
  using ((( SELECT auth.uid() AS uid) = user_id))
  with check ((( SELECT auth.uid() AS uid) = user_id));
create policy recipe_ingredients_delete_admin on public.recipe_ingredients as permissive for delete to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));
create policy recipe_ingredients_insert_admin on public.recipe_ingredients as permissive for insert to public
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));
create policy recipe_ingredients_select_combined on public.recipe_ingredients as permissive for select to public
  using (((EXISTS ( SELECT 1
   FROM recipes
  WHERE ((recipes.id = recipe_ingredients.recipe_id) AND (recipes.status = 'approved'::text)))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text))))));
create policy recipe_ingredients_update_admin on public.recipe_ingredients as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))))
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));
create policy recipes_delete_admin on public.recipes as permissive for delete to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));
create policy recipes_insert_combined on public.recipes as permissive for insert to public
  with check (((( SELECT auth.uid() AS uid) = submitted_by) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text))))));
create policy recipes_select_combined on public.recipes as permissive for select to public
  using (((status = 'approved'::text) OR (( SELECT auth.uid() AS uid) = submitted_by) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text))))));
create policy recipes_update_admin on public.recipes as permissive for update to public
  using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))))
  with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))));
create policy "Admin kan læse revisionslog" on public.revision_log as permissive for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text)))) OR (changed_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid))));
create policy scan_history_delete_own on public.scan_history as permissive for delete to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)));
create policy scan_history_insert_own on public.scan_history as permissive for insert to authenticated
  with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy scan_history_select_combined on public.scan_history as permissive for select to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text))))));
create policy scan_history_update_own on public.scan_history as permissive for update to authenticated
  using ((user_id = ( SELECT auth.uid() AS uid)))
  with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "Brugere kan se egen adgang" on public.shopping_list_access as permissive for select to public
  using ((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy "Ejere kan oprette listeadgang" on public.shopping_list_access as permissive for insert to authenticated
  with check ((EXISTS ( SELECT 1
   FROM shopping_lists
  WHERE ((shopping_lists.id = shopping_list_access.list_id) AND (shopping_lists.owner_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))));
create policy "Ejere kan slette listeadgang" on public.shopping_list_access as permissive for delete to authenticated
  using ((EXISTS ( SELECT 1
   FROM shopping_lists
  WHERE ((shopping_lists.id = shopping_list_access.list_id) AND (shopping_lists.owner_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))));
create policy shopping_list_items_delete_combined on public.shopping_list_items as permissive for delete to public
  using (((EXISTS ( SELECT 1
   FROM shopping_lists
  WHERE ((shopping_lists.id = shopping_list_items.list_id) AND ((shopping_lists.owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM shopping_list_access
          WHERE ((shopping_list_access.list_id = shopping_lists.id) AND (shopping_list_access.user_id = ( SELECT auth.uid() AS uid)) AND (shopping_list_access.permission = 'edit'::text)))))))) OR (EXISTS ( SELECT 1
   FROM shopping_lists sl
  WHERE ((sl.id = shopping_list_items.list_id) AND (sl.type = 'family'::text) AND (( SELECT auth.uid() AS uid) IN ( SELECT family_group(sl.owner_id) AS family_group)))))));
create policy shopping_list_items_insert_combined on public.shopping_list_items as permissive for insert to public
  with check (((EXISTS ( SELECT 1
   FROM shopping_lists
  WHERE ((shopping_lists.id = shopping_list_items.list_id) AND ((shopping_lists.owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM shopping_list_access
          WHERE ((shopping_list_access.list_id = shopping_lists.id) AND (shopping_list_access.user_id = ( SELECT auth.uid() AS uid)) AND (shopping_list_access.permission = 'edit'::text)))))))) OR (EXISTS ( SELECT 1
   FROM shopping_lists sl
  WHERE ((sl.id = shopping_list_items.list_id) AND (sl.type = 'family'::text) AND (( SELECT auth.uid() AS uid) IN ( SELECT family_group(sl.owner_id) AS family_group)))))));
create policy shopping_list_items_select_combined on public.shopping_list_items as permissive for select to public
  using (((EXISTS ( SELECT 1
   FROM shopping_lists
  WHERE ((shopping_lists.id = shopping_list_items.list_id) AND ((shopping_lists.owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM shopping_list_access
          WHERE ((shopping_list_access.list_id = shopping_lists.id) AND (shopping_list_access.user_id = ( SELECT auth.uid() AS uid))))))))) OR (EXISTS ( SELECT 1
   FROM shopping_lists sl
  WHERE ((sl.id = shopping_list_items.list_id) AND (sl.type = 'family'::text) AND (( SELECT auth.uid() AS uid) IN ( SELECT family_group(sl.owner_id) AS family_group)))))));
create policy shopping_list_items_update_combined on public.shopping_list_items as permissive for update to public
  using (((EXISTS ( SELECT 1
   FROM shopping_lists
  WHERE ((shopping_lists.id = shopping_list_items.list_id) AND ((shopping_lists.owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
           FROM shopping_list_access
          WHERE ((shopping_list_access.list_id = shopping_lists.id) AND (shopping_list_access.user_id = ( SELECT auth.uid() AS uid)) AND (shopping_list_access.permission = 'edit'::text)))))))) OR (EXISTS ( SELECT 1
   FROM shopping_lists sl
  WHERE ((sl.id = shopping_list_items.list_id) AND (sl.type = 'family'::text) AND (( SELECT auth.uid() AS uid) IN ( SELECT family_group(sl.owner_id) AS family_group)))))));
create policy "Brugere kan oprette lister" on public.shopping_lists as permissive for insert to authenticated
  with check ((owner_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy "Ejere kan slette lister" on public.shopping_lists as permissive for delete to authenticated
  using ((owner_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy shopping_lists_select_combined on public.shopping_lists as permissive for select to public
  using (((owner_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM shopping_list_access
  WHERE ((shopping_list_access.list_id = shopping_lists.id) AND (shopping_list_access.user_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT auth.uid() AS uid)) AND (users.role = 'admin'::text)))) OR ((type = 'family'::text) AND (( SELECT auth.uid() AS uid) IN ( SELECT family_group(shopping_lists.owner_id) AS family_group)))));
create policy shopping_lists_update_combined on public.shopping_lists as permissive for update to public
  using (((owner_id = ( SELECT auth.uid() AS uid)) OR ((type = 'family'::text) AND (( SELECT auth.uid() AS uid) IN ( SELECT family_group(shopping_lists.owner_id) AS family_group)))));
create policy "Admin kan opdatere indsendelser" on public.submissions as permissive for update to authenticated
  using (is_admin(( SELECT ( SELECT auth.uid() AS uid) AS uid)))
  with check (is_admin(( SELECT ( SELECT auth.uid() AS uid) AS uid)));
create policy "Service role kan alt på submissions" on public.submissions as permissive for all to service_role
  using (true)
  with check (true);
create policy submissions_select_combined on public.submissions as permissive for select to authenticated
  using (((submitted_by = ( SELECT auth.uid() AS uid)) OR is_admin(( SELECT auth.uid() AS uid))));
create policy "Brugere kan læse egne allergener" on public.user_allergens as permissive for select to authenticated
  using (((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (EXISTS ( SELECT 1
   FROM family_members
  WHERE ((family_members.id = user_allergens.family_member_id) AND (family_members.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))))) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (users.role = 'admin'::text))))));
create policy "Brugere kan opdatere egne allergener" on public.user_allergens as permissive for update to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM family_members
  WHERE ((family_members.id = user_allergens.family_member_id) AND (family_members.user_id = ( SELECT auth.uid() AS uid))))) OR is_admin(( SELECT auth.uid() AS uid))));
create policy "Brugere kan oprette egne allergener" on public.user_allergens as permissive for insert to authenticated
  with check (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM family_members
  WHERE ((family_members.id = user_allergens.family_member_id) AND (family_members.user_id = ( SELECT auth.uid() AS uid))))) OR is_admin(( SELECT auth.uid() AS uid))));
create policy "Brugere kan slette egne allergener" on public.user_allergens as permissive for delete to authenticated
  using (((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM family_members
  WHERE ((family_members.id = user_allergens.family_member_id) AND (family_members.user_id = ( SELECT auth.uid() AS uid))))) OR is_admin(( SELECT auth.uid() AS uid))));
create policy users_select_own_or_admin on public.users as permissive for select to authenticated
  using (((id = ( SELECT auth.uid() AS uid)) OR is_admin(( SELECT auth.uid() AS uid))));
create policy users_update_own_or_admin on public.users as permissive for update to authenticated
  using (((id = ( SELECT auth.uid() AS uid)) OR is_admin(( SELECT auth.uid() AS uid))))
  with check (((id = ( SELECT auth.uid() AS uid)) OR is_admin(( SELECT auth.uid() AS uid))));

-- ---------------------------------------------------------------------
-- Tabelrettigheder (som i produktion 30. sept. 2026 — A5 strammer dem)
-- ---------------------------------------------------------------------
-- Supabase-standard: alle tre API-roller har alle rettigheder, RLS styrer
-- adgangen. Undtagelserne herunder er strammet med vilje.
grant all on all tables in schema public to anon, authenticated, service_role;
grant usage on all sequences in schema public to service_role;

revoke insert, update, delete on public.knowledge_base from anon, authenticated;
revoke select, insert, update, delete on public.missing_ean_log from anon;
revoke insert, update, delete on public.missing_ean_log from authenticated;
revoke select, insert, update, delete on public.notification_preferences from anon, service_role;
revoke select, insert, update, delete on public.search_query_popularity from anon, authenticated;
revoke select, insert, update, delete on public.search_selections from anon, authenticated;

-- ---------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp']),
       ('Media', 'Media', false, null, null)
on conflict (id) do nothing;

create policy "Alle kan se billeder" on storage.objects as permissive for select to public
  using ((bucket_id = 'product-images'::text));
create policy "Service role kan uploade" on storage.objects as permissive for insert to public
  with check ((bucket_id = 'product-images'::text));

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.shopping_list_items;

-- ---------------------------------------------------------------------
-- Cron-jobs (kræver Vault-hemmeligheden SUPABASE_SERVICE_ROLE_KEY)
-- ---------------------------------------------------------------------
select cron.schedule('eatsafe-auto-import-off', '0 2 * * *', $cron$
  select net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/auto-import-off',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$cron$);

select cron.schedule('auto-reparse', '0 3 * * *', $cron$
  select net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/auto-reparse',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{"manual":false,"limit":50}'::jsonb,
    timeout_milliseconds := 110000
  );
$cron$);

select cron.schedule('admin-digest', '0 8 * * 1', $cron$
  select net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/admin-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$cron$);

select cron.schedule('weekly-digest', '0 9 * * 1', $cron$
  select net.http_post(
    url := 'https://jegrpcflyguadyxialkm.supabase.co/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$cron$);
