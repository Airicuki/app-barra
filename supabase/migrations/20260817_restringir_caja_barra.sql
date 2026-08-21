-- Caja: todos los usuarios de la aplicación pueden consultarla,
-- pero solo administración y jefe de barra pueden modificarla.
-- Requiere la función public.app_role() de la migración anterior.

alter table public.caja enable row level security;

do $block$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'caja'
      and cmd in ('INSERT', 'UPDATE', 'ALL')
  loop
    execute format(
      'drop policy if exists %I on public.caja',
      policy_row.policyname
    );
  end loop;
end;
$block$;

drop policy if exists "caja lectura autenticada" on public.caja;
drop policy if exists "caja gestión por responsables" on public.caja;

create policy "caja lectura autenticada"
on public.caja for select to authenticated
using (true);

create policy "caja gestión por responsables"
on public.caja for all to authenticated
using (public.app_role() in ('admin', 'jefebarra'))
with check (public.app_role() in ('admin', 'jefebarra'));
