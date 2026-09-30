-- P1: allergenoplysninger er ændret for et produkt, brugeren bruger (30. sept. 2026).
-- Trigger på products.allergen_flags: når mindst ét allergen får HØJERE risiko
-- (nej -> uoplyst/spor/ja, uoplyst -> spor/ja, spor -> ja), lægges en hændelse i outboxen.
-- Faldende risiko giver bevidst ingen besked (Jans beslutning: en genanalyse kan tage fejl begge veje).
-- Hændelsen udskydes 10 min, så flere genanalyser i træk samles; notify genvurderer mod produktets
-- aktuelle tilstand og finder selv modtagerne (favoritter, lister, scanninger de sidste 90 dage,
-- hvor egen eller administrerede profilers allergener berøres).

create or replace function public.allergen_risk_rank(v text)
returns int language sql immutable set search_path = public as $$
  select case v when 'yes' then 3 when 'traces' then 2 when 'unknown' then 1 else 0 end;
$$;

create or replace function public.trg_notify_allergen_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_changes jsonb;
begin
  -- Ny/tom første analyse er ikke en ændring
  if OLD.allergen_flags is null or OLD.allergen_flags = '{}'::jsonb or NEW.allergen_flags is null then
    return NEW;
  end if;
  select coalesce(jsonb_object_agg(e.key, jsonb_build_object('old', OLD.allergen_flags ->> e.key, 'new', e.value #>> '{}')), '{}'::jsonb)
    into v_changes
  from jsonb_each(NEW.allergen_flags) e
  where public.allergen_risk_rank(e.value #>> '{}') > public.allergen_risk_rank(OLD.allergen_flags ->> e.key);
  if v_changes = '{}'::jsonb then return NEW; end if;

  perform public.enqueue_notification_event(
    'p1:' || NEW.id || ':' || md5(v_changes::text),
    'product_allergen_changed',
    jsonb_build_object('product_id', NEW.id, 'ean', NEW.ean, 'changes', v_changes),
    now() + interval '10 minutes');
  return NEW;
exception when others then
  -- Må aldrig blokere en produktopdatering (fx en massegenanalyse)
  return NEW;
end;
$$;

revoke all on function public.trg_notify_allergen_change() from public, anon, authenticated;

drop trigger if exists on_products_allergen_change on public.products;
create trigger on_products_allergen_change
  after update of allergen_flags on public.products
  for each row
  when (OLD.allergen_flags is distinct from NEW.allergen_flags)
  execute function public.trg_notify_allergen_change();
