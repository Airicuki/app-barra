# Prueba de concurrencia de ventas

Esta prueba comprueba que dos sesiones abiertas con el mismo usuario pueden
registrar ventas a la vez sin duplicar la caja del día ni descuadrar los totales.

## Preparación

1. Ejecuta la migración `../migrations/20260817_permisos_y_rpc.sql` en el SQL
   Editor de Supabase.
2. Elige una fecha exclusiva de prueba que no se use para la operativa real.
3. Abre la aplicación en dos navegadores o en una ventana normal y otra de
   incógnito. Inicia sesión en ambos con el mismo usuario, por ejemplo `barra`.
4. En ambas sesiones selecciona la misma fecha de prueba.

## Ejecución

1. En la primera sesión prepara una venta; anota su total esperado.
2. En la segunda sesión prepara otra venta distinta; anota también su total.
3. Pulsa **Guardar venta** en las dos sesiones a la vez, o con una diferencia
   de menos de un segundo.
4. Repite la acción varias veces con carritos distintos. No uses Pérdidas ni
   datos reales durante esta prueba.

## Comprobación

1. Abre `prueba_concurrencia_ventas.sql` en el SQL Editor.
2. Sustituye todas las apariciones de `<FECHA_PRUEBA>` por la fecha usada.
3. Ejecuta el archivo.

El primer resultado debe mostrar una única `caja_id`, el número de ventas
realizadas, y `resultado = CORRECTO`. `total_ventas` debe ser la suma de todos
los importes anotados y coincidir con `total_detalle`. La segunda consulta no
debe devolver filas.

Si se obtiene más de una caja, una venta falta o aparece `REVISAR`, conserva
los resultados y no borres los datos: con ellos se podrá localizar el fallo.
