-- Besked, når en rettelse SÆNKER risikoen for et allergen (Jan 16. okt. 2026, "Ja, advar", to do df119eaf).
-- Før gav kun stigende risiko en hændelse (P1). Nu lægges også en hændelse, når et allergen, der stod som "ja" eller
-- "spor", får lavere risiko (fx ja -> nej, ja -> spor, spor -> nej/uoplyst). notify sender den KUN som besked i appen
-- (ingen push, ingen mail) til brugere, hvor allergenet står i egen eller administrerede profiler. Ingen nye personoplysninger.
-- Bagudkompatibel: den stigende del er uændret; en ældre notify uden den nye type genforsøger og opgiver stille.

create or replace function public.trg_notify_allergen_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_changes jsonb;
  v_lowered jsonb;
begin
  -- Ny/tom første analyse er ikke en ændring
  if OLD.allergen_flags is null or OLD.allergen_flags = '{}'::jsonb or NEW.allergen_flags is null then
    return NEW;
  end if;
  select coalesce(jsonb_object_agg(e.key, jsonb_build_object('old', OLD.allergen_flags ->> e.key, 'new', e.value #>> '{}')), '{}'::jsonb)
    into v_changes
  from jsonb_each(NEW.allergen_flags) e
  where public.allergen_risk_rank(e.value #>> '{}') > public.allergen_risk_rank(OLD.allergen_flags ->> e.key);

  -- Lavere risiko: kun allergener, der før stod som "ja" eller "spor" (det, brugeren kan have set som en advarsel)
  select coalesce(jsonb_object_agg(o.key, jsonb_build_object('old', o.value #>> '{}', 'new', NEW.allergen_flags ->> o.key)), '{}'::jsonb)
    into v_lowered
  from jsonb_each(OLD.allergen_flags) o
  where public.allergen_risk_rank(o.value #>> '{}') >= 2
    and NEW.allergen_flags ? o.key
    and public.allergen_risk_rank(NEW.allergen_flags ->> o.key) < public.allergen_risk_rank(o.value #>> '{}');

  if v_changes <> '{}'::jsonb then
    perform public.enqueue_notification_event(
      'p1:' || NEW.id || ':' || md5(v_changes::text),
      'product_allergen_changed',
      jsonb_build_object('product_id', NEW.id, 'ean', NEW.ean, 'changes', v_changes),
      now() + interval '10 minutes');
  end if;
  if v_lowered <> '{}'::jsonb then
    perform public.enqueue_notification_event(
      'p1l:' || NEW.id || ':' || md5(v_lowered::text),
      'product_allergen_lowered',
      jsonb_build_object('product_id', NEW.id, 'ean', NEW.ean, 'changes', v_lowered),
      now() + interval '10 minutes');
  end if;
  return NEW;
exception when others then
  -- Må aldrig blokere en produktopdatering (fx en massegenanalyse)
  return NEW;
end;
$$;

revoke all on function public.trg_notify_allergen_change() from public, anon, authenticated;
