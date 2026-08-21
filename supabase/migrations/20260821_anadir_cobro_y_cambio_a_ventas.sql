alter table public.ventas
add column if not exists metodo_pago text not null default 'efectivo';

alter table public.ventas
add column if not exists importe_entregado numeric(12, 2);

alter table public.ventas
add column if not exists cambio numeric(12, 2) not null default 0;

alter table public.ventas
drop constraint if exists ventas_metodo_pago_valido;

alter table public.ventas
add constraint ventas_metodo_pago_valido
check (metodo_pago in ('efectivo', 'tarjeta'));

alter table public.ventas
drop constraint if exists ventas_cambio_no_negativo;

alter table public.ventas
add constraint ventas_cambio_no_negativo
check (cambio >= 0);

drop function if exists public.registrar_venta_barra(date, text, numeric, jsonb);

create function public.registrar_venta_barra(
  p_fecha date,
  p_usuario text,
  p_total numeric,
  p_metodo_pago text,
  p_importe_entregado numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_venta_id uuid;
  v_caja_id uuid;
  v_usuario text;
  v_item jsonb;
  v_producto_id uuid;
  v_cantidad integer;
  v_precio numeric;
  v_total_calculado numeric;
  v_metodo_pago text;
  v_cambio numeric := 0;
begin
  select username into v_usuario from public.usuarios where id = auth.uid();
  v_metodo_pago := lower(trim(p_metodo_pago));

  if v_usuario is null or v_metodo_pago not in ('efectivo', 'tarjeta') then
    raise exception 'Usuario o método de pago no válido';
  end if;

  if p_total < 0 or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe tener un total válido y al menos un producto';
  end if;

  select coalesce(sum((item.value->>'cantidad')::integer * (item.value->>'precio')::numeric), 0)
  into v_total_calculado from jsonb_array_elements(p_items) as item(value);

  if p_total <> v_total_calculado then
    raise exception 'El total de la venta no coincide con el detalle';
  end if;

  if v_metodo_pago = 'efectivo' then
    if p_importe_entregado is not null then
      v_cambio := greatest(p_importe_entregado - p_total, 0);
    end if;
  else
    p_importe_entregado := null;
  end if;

  insert into public.caja (fecha, tipo, datos, usuario, actualizado_en)
  values (p_fecha, 'diaria', '{}'::jsonb, v_usuario, now())
  on conflict (fecha) do nothing;

  select id into v_caja_id from public.caja where fecha = p_fecha;

  insert into public.ventas (
    fecha, usuario, total, caja_id, metodo_pago, importe_entregado, cambio
  ) values (
    p_fecha, v_usuario, p_total, v_caja_id, v_metodo_pago, p_importe_entregado, v_cambio
  ) returning id into v_venta_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::integer;
    v_precio := (v_item->>'precio')::numeric;

    if v_cantidad <= 0 or v_precio < 0 or not exists (
      select 1 from public.productos_barra where id = v_producto_id and activo = true
    ) then
      raise exception 'Producto de barra o cantidad no válidos';
    end if;

    insert into public.detalle_ventas_barra (venta_id, producto_barra_id, cantidad, precio)
    values (v_venta_id, v_producto_id, v_cantidad, v_precio);
  end loop;

  return v_venta_id;
end;
$function$;

revoke all on function public.registrar_venta_barra(date, text, numeric, text, numeric, jsonb) from public, anon;
grant execute on function public.registrar_venta_barra(date, text, numeric, text, numeric, jsonb) to authenticated;
