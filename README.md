# Barra de Bebidas

Aplicacion web responsive para registrar ventas y perdidas diarias de una barra de bebidas durante una semana.

## Abrir la app

Abre `index.html` en un navegador moderno.

Para usarla desde un movil, sirve esta carpeta desde el ordenador en la misma red local y abre la direccion del ordenador desde el movil.

## Usuarios

- Administrador: `admin` / `admin123`
- Usuario normal: `barra` / `barra123`

## Funciones

- Registro diario de unidades vendidas y perdidas.
- Venta por transaccion con botones `+` y `-`.
- Guardado de cada venta como una transaccion independiente.
- Conteo de caja del dia: entrada de turno, inicio de barra a las 19:00 y final de barra.
- Calculadora de caja por numero de billetes y monedas en euros.
- Diferencias automaticas entre los tres conteos de caja.
- Notas de turno con concepto, proveedor, importe y estado de lectura del siguiente turno.
- Al guardar una nota se pide el nombre de la persona que la registra y se guarda la hora.
- Inventario con stock y precio por producto.
- Usuario normal con acceso a registro e inventario de consulta.
- Administrador con edicion de inventario y exportacion para Excel.
- Datos guardados en el navegador mediante `localStorage`.
- Selector de dia operativo comun para la app: cada dia va de 10:00 a 10:00 del dia siguiente.
- Informes y resumen calculados sobre 7 dias desde el dia operativo seleccionado.
- Pestana El Rancho con cuadrante de sabado a viernes y tabla de comidas/cenas.
- Personas del cuadrante anadidas automaticamente a comida y cena con `Se apunta` marcado.
- Notas guardadas como pendientes y marcables despues como leidas por el siguiente turno.

## Exportacion

El boton `Exportar Excel` descarga un archivo `.csv` con separador `;`, compatible con Excel en configuracion regional espanola. Incluye resumen por producto, transacciones, caja semanal y notas.
