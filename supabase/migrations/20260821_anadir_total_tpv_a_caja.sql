-- Importe manual cobrado con datáfono por cada día operativo.
-- Se conserva separado del efectivo contado en datos (JSONB).

alter table public.caja
add column if not exists total_tpv numeric(12, 2) not null default 0;

alter table public.caja
drop constraint if exists caja_total_tpv_no_negativo;

alter table public.caja
add constraint caja_total_tpv_no_negativo
check (total_tpv >= 0);
