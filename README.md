# 🍹 Barra de Bebidas

Aplicación web para la gestión diaria de una barra de bebidas.

La aplicación permite centralizar en un único sistema la gestión de ventas, pérdidas, inventario, caja, notas de turno, organización del personal y comidas del Rancho, así como consultar informes y un dashboard con los principales indicadores.

La aplicación está diseñada para utilizarse tanto desde ordenador como desde dispositivos móviles.

---

## 📋 Índice

- [Descripción](#-descripción)
- [Características](#-características)
- [Módulos](#-módulos)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Base de datos](#-base-de-datos)
- [Autenticación y roles](#-autenticación-y-roles)
- [Día operativo](#-día-operativo)
- [Inventario y ventas](#-inventario-y-ventas)
- [Caja](#-caja)
- [Rancho](#-rancho)
- [Notas](#-notas)
- [Dashboard e informes](#-dashboard-e-informes)
- [Diseño responsive](#-diseño-responsive)
- [Configuración](#-configuración)
- [Desarrollo local](#-desarrollo-local)
- [Despliegue](#-despliegue)
- [Seguridad](#-seguridad)
- [Estado del proyecto](#-estado-del-proyecto)
- [Mejoras futuras](#-mejoras-futuras)
- [Licencia](#-licencia)

---

# 📖 Descripción

**Barra de Bebidas** es una aplicación web desarrollada para facilitar la gestión de una barra durante eventos o periodos de actividad organizados por días operativos.

El sistema sustituye la gestión manual mediante hojas de cálculo o anotaciones dispersas por una aplicación centralizada con persistencia en Supabase.

La aplicación está construida con JavaScript modular y utiliza Supabase como backend para:

- autenticación de usuarios;
- almacenamiento de información;
- gestión de ventas;
- gestión de pérdidas;
- inventario;
- caja;
- notas;
- organización del Rancho;
- productos específicos de barra;
- generación de información para dashboard e informes.

---

# ✨ Características

## 🔐 Autenticación

- Inicio de sesión mediante Supabase Auth.
- Restauración automática de la sesión.
- Cierre de sesión.
- Gestión del perfil del usuario.
- Control de roles.
- Diferenciación entre usuarios administradores y usuarios normales.

---

## 📦 Inventario

El módulo de inventario permite:

- consultar productos;
- consultar stock actual;
- modificar cantidades;
- incrementar unidades mediante `+`;
- decrementar unidades mediante `−`;
- modificar precios;
- guardar los cambios;
- crear nuevos productos;
- eliminar productos.

Los cambios de stock mediante `+` y `−` se realizan inicialmente sobre la interfaz y se guardan al pulsar el botón **Guardar**.

Esto permite modificar varias unidades rápidamente sin realizar una petición a Supabase por cada pulsación.

---

## 🍺 Ventas

Las ventas de barra se gestionan de forma independiente del inventario general.

Esto permite representar correctamente situaciones como:

> El inventario puede contener barriles de cerveza mientras que las ventas se realizan por minis, copas u otras unidades de venta.

Por este motivo existen productos específicos de barra separados de los productos de inventario.

El módulo permite:

- consultar productos de barra;
- seleccionar cantidades;
- registrar ventas;
- guardar cada venta como una transacción;
- consultar las ventas del día;
- calcular totales;
- obtener información para el dashboard;
- trabajar con el día operativo.

---

## 🗑️ Pérdidas

El módulo de pérdidas permite registrar productos que se han perdido durante el día.

Cada pérdida almacena información como:

- usuario que registra la pérdida;
- producto;
- cantidad;
- fecha operativa.

Las pérdidas quedan almacenadas en Supabase y posteriormente pueden utilizarse para estadísticas e informes.

---

## 💰 Caja

La aplicación incluye un sistema completo de control de caja.

Permite gestionar diferentes momentos del conteo:

1. Entrada de turno.
2. Inicio de barra.
3. Final de barra.

El sistema permite introducir billetes y monedas por denominación y calcula automáticamente los totales.

### Denominaciones

- 50 €
- 20 €
- 10 €
- 5 €
- 2 €
- 1 €
- 50 céntimos
- 20 céntimos
- 10 céntimos
- 5 céntimos
- 2 céntimos
- 1 céntimo

También se calculan diferencias entre los diferentes momentos de la caja.

La información se almacena asociada al día operativo.

---

## 📝 Notas

El módulo de notas permite dejar información para otros turnos.

Una nota puede incluir:

- concepto;
- proveedor;
- importe;
- estado de lectura;
- usuario que registra la nota;
- fecha/hora de registro.

Las notas pueden quedar pendientes para que el siguiente turno pueda marcarlas como leídas.

---

## 🏕️ Rancho

El módulo Rancho permite organizar al personal y las comidas durante la semana.

Incluye:

### Personas

- alta de personas;
- consulta de personas activas;
- gestión de participantes.

### Turnos

Permite asignar personas a diferentes puestos:

- Jefe de barra;
- Caja;
- Barra.

Los puestos tienen diferentes límites de personas.

### Comidas

Permite gestionar:

- comida;
- cena.

Las personas pueden marcarse para cada comida y se mantiene la información asociada al día correspondiente.

El cuadrante utiliza una organización semanal de sábado a viernes.

---

## 📊 Dashboard

El dashboard muestra indicadores resumidos de la actividad.

Entre otros datos permite consultar:

- unidades vendidas;
- unidades perdidas;
- valor vendido;
- stock actual;
- ventas correspondientes al periodo seleccionado.

Los datos se calculan directamente a partir de la información almacenada en Supabase.

---

## 📈 Informes

El módulo de informes permite consultar información agregada de la actividad.

Los informes están preparados para trabajar con el concepto de día operativo y consultar información histórica.

El objetivo es proporcionar una visión global de:

- ventas;
- pérdidas;
- caja;
- inventario;
- actividad de barra.

---

# 🧩 Módulos

La aplicación está organizada en módulos independientes.

Actualmente incluye:

| Módulo | Función |
|---|---|
| 🔐 Auth | Autenticación y gestión de sesión |
| 📊 Dashboard | Indicadores generales |
| 🍺 Ventas | Registro de ventas de barra |
| 📦 Inventario | Gestión del stock general |
| 🗑️ Pérdidas | Registro de pérdidas |
| 💰 Caja | Control y conteo de caja |
| 📝 Notas | Gestión de notas de turno |
| 🏕️ Rancho | Personas, turnos y comidas |
| 📈 Informes | Consulta de información histórica |

Los módulos principales se encuentran en:

```text
js/modules/