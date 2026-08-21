-- Correctivo para bases donde ya se ejecutó el desglose TPV inicial.
-- Cada jornada descuenta el tramo nocturno ya incluido en la lectura diurna.

create or replace function public.calcular_total_tpv_caja()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
declare
  v_tpv_noche_anterior numeric := 0;
begin
  select coalesce(tpv_0000_1000, 0)
  into v_tpv_noche_anterior
  from public.caja
  where fecha < new.fecha
  order by fecha desc
  limit 1;

  new.total_tpv :=
    coalesce(new.tpv_1000_0000, 0) -
    coalesce(v_tpv_noche_anterior, 0) +
    coalesce(new.tpv_0000_1000, 0);

  return new;
end;
$function$;

update public.caja as actual
set total_tpv = actual.tpv_1000_0000 - coalesce((
  select anterior.tpv_0000_1000
  from public.caja as anterior
  where anterior.fecha < actual.fecha
  order by anterior.fecha desc
  limit 1
), 0) + actual.tpv_0000_1000;
