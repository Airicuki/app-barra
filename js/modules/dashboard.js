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

  let unidadesVendidas =
    0;


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

    unidadesVendidas =
      detallesRows.reduce(
        (sum, detalle) =>
          sum +
          Number(
            detalle.cantidad || 0
          ),
        0
      );


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

  let valorVendidoTotal;

  try {

    valorVendidoTotal =
      await loadTotalBarRevenue();

  } catch (error) {

    console.error(
      "❌ Error cargando el total de ventas:",
      error
    );

    return;

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
      unidadesVendidas;

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
        unidadesVendidas,

      unidadesPerdidas,

      valorVendido,

      valorVendidoTotal,

      stockActual
    }
  );
}

async function loadTotalBarRevenue() {

  const pageSize = 1000;
  const saleIds = new Set();
  let from = 0;

  while (true) {

    const {
      data,
      error
    } = await db
      .from("detalle_ventas_barra")
      .select("venta_id")
      .order("venta_id")
      .range(
        from,
        from + pageSize - 1
      );

    if (error) {
      throw error;
    }

    (data || []).forEach(
      detail => saleIds.add(detail.venta_id)
    );

    if ((data || []).length < pageSize) {
      break;
    }

    from += pageSize;

  }

  const ids = Array.from(saleIds);
  let total = 0;

  for (let index = 0; index < ids.length; index += 200) {

    const {
      data,
      error
    } = await db
      .from("ventas")
      .select("total")
      .in(
        "id",
        ids.slice(index, index + 200)
      );

    if (error) {
      throw error;
    }

    total += (data || []).reduce(
      (sum, sale) =>
        sum + Number(sale.total || 0),
      0
    );

  }

  return total;

}
