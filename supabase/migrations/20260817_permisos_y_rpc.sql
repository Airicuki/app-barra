-- Seguridad y coherencia de datos.
-- No modifica get_login_email ni el flujo de inicio de sesión.

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path to 'public'
as $function$
  select lower(regexp_replace(coalesce(rol, ''), '[[:space:]_-]', '', 'g'))
  from public.usuarios
  where id = auth.uid()
  limit 1;
$function$;

revoke all on function public.app_role() from public;
grant execute on function public.app_role() to authenticated;

-- INVENTARIO: barra tiene el mismo permiso de edición que la interfaz.
alter table public.productos enable row level security;
drop policy if exists "admin y jefe pueden actualizar productos" on public.productos;
drop policy if exists "admin y jefe pueden crear productos" on public.productos;
drop policy if exists "admin y jefe pueden eliminar productos" on public.productos;
drop policy if exists "usuarios autenticados pueden ver productos" on public.productos;

create policy "productos lectura autenticada"
on public.productos for select to authenticated
using (true);

create policy "productos gestionados por barra autorizada"
on public.productos for all to authenticated
using (public.app_role() in ('admin', 'jefebarra', 'barra'))
with check (public.app_role() in ('admin', 'jefebarra', 'barra'));

-- PRODUCTOS DE VENTA: catálogo separado del inventario físico.
alter table public.productos_barra enable row level security;
drop policy if exists "authenticated puede actualizar productos barra" on public.productos_barra;
drop policy if exists "authenticated puede consultar productos barra" on public.productos_barra;
drop policy if exists "authenticated puede crear productos barra" on public.productos_barra;

create policy "productos barra lectura autenticada"
on public.productos_barra for select to authenticated
using (true);

create policy "productos barra gestionados por responsables"
on public.productos_barra for all to authenticated
using (public.app_role() in ('admin', 'jefebarra'))
with check (public.app_role() in ('admin', 'jefebarra'));

-- NOTAS: todos crean y consultan; solo responsables actualizan o eliminan.
alter table public.notas enable row level security;

drop policy if exists "authenticated puede actualizar notas" on public.notas;
drop policy if exists "authenticated puede consultar notas" on public.notas;
drop policy if exists "authenticated puede crear notas" on public.notas;

create policy "notas lectura autenticada"
on public.notas for select to authenticated
using (true);

create policy "notas creación autenticada"
on public.notas for insert to authenticated
with check (true);

create policy "notas gestión por responsables"
on public.notas for update to authenticated
using (public.app_role() in ('admin', 'jefebarra'))
with check (public.app_role() in ('admin', 'jefebarra'));

create policy "notas eliminación por responsables"
on public.notas for delete to authenticated
using (public.app_role() in ('admin', 'jefebarra'));

-- RANCHO: todos ven; barra crea personas, pero no edita turnos ni pagos.
alter table public.rancho_personas enable row level security;
alter table public.rancho_turnos enable row level security;
alter table public.rancho_comidas enable row level security;
drop policy if exists "Usuarios autenticados pueden consultar personas" on public.rancho_personas;
drop policy if exists "Usuarios autenticados pueden crear personas" on public.rancho_personas;
drop policy if exists "Usuarios autenticados pueden modificar personas" on public.rancho_personas;

create policy "rancho personas lectura autenticada"
on public.rancho_personas for select to authenticated
using (true);

create policy "rancho personas creación autorizada"
on public.rancho_personas for insert to authenticated
with check (public.app_role() in ('admin', 'jefebarra', 'barra'));

create policy "rancho personas gestión por responsables"
on public.rancho_personas for update to authenticated
using (public.app_role() in ('admin', 'jefebarra'))
with check (public.app_role() in ('admin', 'jefebarra'));

drop policy if exists "Usuarios autenticados pueden consultar turnos" on public.rancho_turnos;
drop policy if exists "Usuarios autenticados pueden crear turnos" on public.rancho_turnos;
drop policy if exists "Usuarios autenticados pueden eliminar turnos" on public.rancho_turnos;
drop policy if exists "Usuarios autenticados pueden modificar turnos" on public.rancho_turnos;

create policy "rancho turnos lectura autenticada"
on public.rancho_turnos for select to authenticated
using (true);

create policy "rancho turnos gestión por responsables"
on public.rancho_turnos for all to authenticated
using (public.app_role() in ('admin', 'jefebarra'))
with check (public.app_role() in ('admin', 'jefebarra'));

drop policy if exists "Usuarios autenticados pueden consultar comidas" on public.rancho_comidas;
drop policy if exists "Usuarios autenticados pueden crear comidas" on public.rancho_comidas;
drop policy if exists "Usuarios autenticados pueden eliminar comidas" on public.rancho_comidas;
drop policy if exists "Usuarios autenticados pueden modificar comidas" on public.rancho_comidas;

create policy "rancho comidas lectura autenticada"
on public.rancho_comidas for select to authenticated
using (true);

create policy "rancho comidas creación sin pago para barra"
on public.rancho_comidas for insert to authenticated
with check (
  public.app_role() in ('admin', 'jefebarra', 'barra')
  and (
    public.app_role() in ('admin', 'jefebarra')
    or coalesce(pagado, false) = false
  )
);

create policy "rancho comidas actualización autenticada"
on public.rancho_comidas for update to authenticated
using (public.app_role() in ('admin', 'jefebarra', 'barra'))
with check (public.app_role() in ('admin', 'jefebarra', 'barra'));

create policy "rancho comidas eliminación por responsables"
on public.rancho_comidas for delete to authenticated
using (public.app_role() in ('admin', 'jefebarra'));

create or replace function public.enforce_rancho_comida_permissions()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(public.app_role(), '') not in ('admin', 'jefebarra')
     and new.pagado is distinct from old.pagado then
    raise exception 'Solo administración y jefe de barra pueden modificar el pago';
  end if;

  return new;
end;
$function$;

drop trigger if exists enforce_rancho_comida_permissions on public.rancho_comidas;
create trigger enforce_rancho_comida_permissions
before update on public.rancho_comidas
for each row execute function public.enforce_rancho_comida_permissions();

-- VENTAS: siempre quedan asociadas a la caja del día operativo.
insert into public.caja (fecha, tipo, datos, usuario, actualizado_en)
select distinct v.fecha, 'diaria', '{}'::jsonb, v.usuario, now()
from public.ventas v
where v.caja_id is null
on conflict (fecha) do nothing;

update public.ventas v
set caja_id = c.id
from public.caja c
where v.caja_id is null
  and c.fecha = v.fecha;

create or replace function public.registrar_venta_barra(
  p_fecha date,
  p_usuario text,
  p_total numeric,
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
begin
  select username into v_usuario
  from public.usuarios
  where id = auth.uid();

  if v_usuario is null then
    raise exception 'Usuario autenticado no válido';
  end if;

  if p_total < 0
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta debe tener un total válido y al menos un producto';
  end if;

  select coalesce(sum(
    (item.value->>'cantidad')::integer * (item.value->>'precio')::numeric
  ), 0)
  into v_total_calculado
  from jsonb_array_elements(p_items) as item(value);

  if p_total <> v_total_calculado then
    raise exception 'El total de la venta no coincide con el detalle';
  end if;

  insert into public.caja (fecha, tipo, datos, usuario, actualizado_en)
  values (p_fecha, 'diaria', '{}'::jsonb, v_usuario, now())
  on conflict (fecha) do nothing;

  select id into v_caja_id
  from public.caja
  where fecha = p_fecha;

  insert into public.ventas (fecha, usuario, total, caja_id)
  values (p_fecha, v_usuario, p_total, v_caja_id)
  returning id into v_venta_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_producto_id := (v_item->>'producto_id')::uuid;
    v_cantidad := (v_item->>'cantidad')::integer;
    v_precio := (v_item->>'precio')::numeric;

    if v_cantidad <= 0 or v_precio < 0 or not exists (
      select 1 from public.productos_barra
      where id = v_producto_id and activo = true
    ) then
      raise exception 'Producto de barra o cantidad no válidos';
    end if;

    insert into public.detalle_ventas_barra (
      venta_id, producto_barra_id, cantidad, precio
    ) values (
      v_venta_id, v_producto_id, v_cantidad, v_precio
    );
  end loop;

  return v_venta_id;
end;
$function$;

revoke all on function public.registrar_venta_barra(date, text, numeric, jsonb) from public, anon;
grant execute on function public.registrar_venta_barra(date, text, numeric, jsonb) to authenticated;

drop policy if exists "authenticated puede crear detalle ventas barra" on public.detalle_ventas_barra;

-- PÉRDIDAS permanece oculta. Se limita su RPC a usuarios autenticados;
-- no se realiza ningún cambio visual en la aplicación.
revoke all on function public.registrar_perdida(date, text, uuid, integer, numeric) from public, anon;
grant execute on function public.registrar_perdida(date, text, uuid, integer, numeric) to authenticated;
