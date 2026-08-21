-- Desglose del cierre TPV por los dos tramos de la jornada.

alter table public.caja
add column if not exists tpv_1000_0000 numeric(12, 2) not null default 0;

alter table public.caja
add column if not exists tpv_0000_1000 numeric(12, 2) not null default 0;

-- Los cierres previos tenían un único total; se conservan en el primer tramo.
update public.caja
set tpv_1000_0000 = total_tpv
where tpv_1000_0000 = 0
  and tpv_0000_1000 = 0
  and total_tpv > 0;

alter table public.caja
drop constraint if exists caja_tpv_tramos_no_negativos;

alter table public.caja
add constraint caja_tpv_tramos_no_negativos
check (
  tpv_1000_0000 >= 0
  and tpv_0000_1000 >= 0
);

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
    coalesce(new.tpv_1000_0000, 0) +
    coalesce(new.tpv_0000_1000, 0) -
    coalesce(v_tpv_noche_anterior, 0);

  return new;
end;
$function$;

drop trigger if exists calcular_total_tpv_caja on public.caja;

create trigger calcular_total_tpv_caja
before insert or update on public.caja
for each row execute function public.calcular_total_tpv_caja();
