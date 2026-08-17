-- PRUEBA DE CONCURRENCIA DE VENTAS
-- Sustituye <FECHA_PRUEBA> por una fecha exclusiva de pruebas, formato YYYY-MM-DD.
-- Ejecutar DESPUÉS de supabase/migrations/20260817_permisos_y_rpc.sql.
-- Esta consulta no modifica datos.

with ventas_del_dia as (
  select
    v.id,
    v.caja_id,
    v.fecha,
    v.usuario,
    v.total
  from public.ventas v
  where v.fecha = date '<FECHA_PRUEBA>'
),
detalle_por_venta as (
  select
    d.venta_id,
    sum(d.cantidad * d.precio) as total_detalle
  from public.detalle_ventas_barra d
  inner join ventas_del_dia v on v.id = d.venta_id
  group by d.venta_id
),
resumen as (
  select
    v.caja_id,
    count(*) as numero_ventas,
    sum(v.total) as total_ventas,
    sum(coalesce(d.total_detalle, 0)) as total_detalle,
    count(*) filter (
      where coalesce(d.total_detalle, 0) <> v.total
    ) as ventas_con_total_incorrecto
  from ventas_del_dia v
  left join detalle_por_venta d on d.venta_id = v.id
  group by v.caja_id
)
select
  c.id as caja_id,
  c.fecha,
  r.numero_ventas,
  r.total_ventas,
  r.total_detalle,
  r.ventas_con_total_incorrecto,
  case
    when r.total_ventas = r.total_detalle
      and r.ventas_con_total_incorrecto = 0
    then 'CORRECTO'
    else 'REVISAR'
  end as resultado
from resumen r
inner join public.caja c on c.id = r.caja_id;

-- Debe devolver exactamente una fila por cada venta creada durante la prueba.
-- Si aparece alguna fila, hay una venta cuyo total no coincide con sus líneas.
select
  v.id as venta_id,
  v.usuario,
  v.total as total_venta,
  coalesce(sum(d.cantidad * d.precio), 0) as total_detalle
from public.ventas v
left join public.detalle_ventas_barra d on d.venta_id = v.id
where v.fecha = date '<FECHA_PRUEBA>'
group by v.id, v.usuario, v.total
having v.total <> coalesce(sum(d.cantidad * d.precio), 0);
