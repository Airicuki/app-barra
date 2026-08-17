import { db } from "../config/supabase.js";
import { state } from "../state/state.js";
import { els } from "../utils/dom.js";
import { formatMoney } from "../utils/format.js";


// ============================================================
// INICIALIZAR DASHBOARD
// ============================================================

export async function initDashboard() {

  console.log(
    "📊 Inicializando resumen del dashboard..."
  );

  await renderDashboard();

  els.entryDate?.addEventListener(
    "change",
    renderDashboard
  );

  window.addEventListener(
    "app:sale-saved",
    renderDashboard
  );

}
// ============================================================
// RENDER DASHBOARD
// ============================================================

export async function renderDashboard() {

  const date =
    els.entryDate?.value;


  if (!date) {

    console.warn(
      "⚠️ No hay día operativo para calcular el dashboard."
    );

    return;

  }


  console.log(
    "📊 Calculando dashboard para el día operativo:",
    date
  );


  // ==========================================================
  // 1. VENTAS DE BARRA
  // ==========================================================

  const {
    data: ventas,
    error: ventasError
  } = await db
    .from("ventas")
    .select(
      "id, fecha, total"
    )
    .eq(
      "fecha",
      date
    );


  if (ventasError) {

    console.error(
      "❌ Error cargando ventas para dashboard:",
      ventasError
    );

    return;

  }


  const ventasRows =
    ventas || [];


  console.log(
    "📊 Ventas encontradas:",
    ventasRows
  );


  // ==========================================================
  // 2. SOLO VENTAS QUE SON DE BARRA
  // ==========================================================
  //
  // Esto es importante porque podemos tener ventas antiguas
  // asociadas a detalle_ventas.
  //
  // Para el nuevo dashboard queremos exclusivamente:
  //
  // ventas
  //    ↓
  // detalle_ventas_barra
  //
  // ==========================================================

  let ventasBarra = [];


  if (ventasRows.length) {

    const ventaIds =
      ventasRows.map(
        venta =>
          venta.id
      );


    const {
      data: detalles,
      error: detallesError
    } = await db
      .from("detalle_ventas_barra")
      .select(
        "venta_id, cantidad"
      )
      .in(
        "venta_id",
        ventaIds
      );


    if (detallesError) {

      console.error(
        "❌ Error cargando detalles de ventas de barra:",
        detallesError
      );

      return;

    }


    const detallesRows =
      detalles || [];


    // IDs que realmente tienen líneas de barra

    const idsBarra =
      new Set(
        detallesRows.map(
          detalle =>
            detalle.venta_id
        )
      );


    ventasBarra =
      ventasRows.filter(
        venta =>
          idsBarra.has(
            venta.id
          )
      );


    // ========================================================
    // UNIDADES VENDIDAS
    // ========================================================

    const unidadesVendidas =
      detallesRows.reduce(
        (sum, detalle) =>
          sum +
          Number(
            detalle.cantidad || 0
          ),
        0
      );


    // Guardamos temporalmente para usarlo después
    window.__dashboardUnidades =
      unidadesVendidas;


  } else {

    window.__dashboardUnidades =
      0;

  }


  // ==========================================================
  // 3. VALOR VENDIDO
  // ==========================================================

  const valorVendido =
    ventasBarra.reduce(
      (sum, venta) =>
        sum +
        Number(
          venta.total || 0
        ),
      0
    );


  // ==========================================================
  // 4. VALOR VENDIDO TOTAL
  // ==========================================================

  const {
    data: ventasTotales,
    error: ventasTotalesError
  } = await db
    .from("ventas")
    .select("id, total");


  if (ventasTotalesError) {

    console.error(
      "❌ Error cargando el total de ventas:",
      ventasTotalesError
    );

    return;

  }


  const ventasTotalesRows =
    ventasTotales || [];

  let valorVendidoTotal =
    0;


  if (ventasTotalesRows.length) {

    const ventaIdsTotales =
      ventasTotalesRows.map(
        venta => venta.id
      );

    const {
      data: detallesTotales,
      error: detallesTotalesError
    } = await db
      .from("detalle_ventas_barra")
      .select("venta_id")
      .in(
        "venta_id",
        ventaIdsTotales
      );


    if (detallesTotalesError) {

      console.error(
        "❌ Error cargando el detalle del total de ventas:",
        detallesTotalesError
      );

      return;

    }


    const ventaIdsBarraTotales =
      new Set(
        (detallesTotales || []).map(
          detalle => detalle.venta_id
        )
      );

    valorVendidoTotal =
      ventasTotalesRows.reduce(
        (sum, venta) =>
          ventaIdsBarraTotales.has(
            venta.id
          )
            ? sum + Number(venta.total || 0)
            : sum,
        0
      );

  }


  // ==========================================================
  // 5. PÉRDIDAS
  // ==========================================================

  const {
    data: perdidas,
    error: perdidasError
  } = await db
    .from("perdidas")
    .select(
      "id, fecha, cantidad"
    )
    .eq(
      "fecha",
      date
    );


  if (perdidasError) {

    console.error(
      "❌ Error cargando pérdidas para dashboard:",
      perdidasError
    );

    return;

  }


  const perdidasRows =
    perdidas || [];


  const unidadesPerdidas =
    perdidasRows.reduce(
      (sum, perdida) =>
        sum +
        Number(
          perdida.cantidad || 0
        ),
      0
    );


  // ==========================================================
  // 6. STOCK ACTUAL
  // ==========================================================

  const stockActual =
    (
      state.products || []
    ).reduce(
      (sum, product) =>
        sum +
        Number(
          product.stock || 0
        ),
      0
    );


  // ==========================================================
  // 7. ACTUALIZAR INTERFAZ
  // ==========================================================

  if (els.weekSold) {

    els.weekSold.textContent =
      window.__dashboardUnidades || 0;

  }


  if (els.weekLost) {

    els.weekLost.textContent =
      unidadesPerdidas;

  }


  if (els.weekRevenue) {

    els.weekRevenue.textContent =
      formatMoney(
        valorVendido
      );

  }


  if (els.totalRevenue) {

    els.totalRevenue.textContent =
      formatMoney(
        valorVendidoTotal
      );

  }


  if (els.weekStock) {

    els.weekStock.textContent =
      stockActual;

  }


  console.log(
    "✅ Dashboard actualizado:",
    {
      unidadesVendidas:
        window.__dashboardUnidades,

      unidadesPerdidas,

      valorVendido,

      valorVendidoTotal,

      stockActual
    }
  );
}
