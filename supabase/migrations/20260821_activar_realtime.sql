-- Sincronización entre sesiones para Caja, Barra, Notas, Rancho e Inventario.
-- Debe ejecutarse en el SQL Editor con el rol postgres.

do $block$
declare
  table_name text;
begin
  foreach table_name in array array[
    'caja',
    'ventas',
    'detalle_ventas_barra',
    'productos_barra',
    'productos',
    'notas',
    'rancho_personas',
    'rancho_turnos',
    'rancho_comidas'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        table_name
      );
    end if;
  end loop;
end;
$block$;
