import { db } from "../config/supabase.js";


// ============================================================
// RESUMEN SEMANAL DEL DASHBOARD
// ============================================================

export async function loadDashboardSummary(
  startDate,
  endDate
) {

  // ==========================================================
  // 1. OBTENER VENTAS DE LA SEMANA
  // ==========================================================

  const {
    data: ventas,
    error: ventasError
  } = await db
    .from("ventas")
    .select("id, fecha, total")
    .gte("fecha", startDate)
    .lte("fecha", endDate);


  if (ventasError) {

    console.error(
      "❌ Error cargando ventas para el resumen:",
      ventasError
    );

    return null;
  }


  const ventasRows =
    ventas || [];


  // ==========================================================
  // 2. VALOR TOTAL VENDIDO
  // ==========================================================

  const valorVendido =
    ventasRows.reduce(
      (sum, venta) =>
        sum +
        Number(venta.total || 0),
      0
    );


  // ==========================================================
  // 3. UNIDADES VENDIDAS
  // ==========================================================

  let ventasSemana = 0;


  if (ventasRows.length) {

    const ventaIds =
      ventasRows.map(
        (venta) =>
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

      return null;
    }


    ventasSemana =
      (
        detalles || []
      ).reduce(
        (sum, detalle) =>
          sum +
          Number(
            detalle.cantidad || 0
          ),
        0
      );

  }


  // ==========================================================
  // 4. PÉRDIDAS
  // ==========================================================

  const {
    data: perdidas,
    error: perdidasError
  } = await db
    .from("perdidas")
    .select(
      "id, fecha, cantidad"
    )
    .gte(
      "fecha",
      startDate
    )
    .lte(
      "fecha",
      endDate
    );


  if (perdidasError) {

    console.error(
      "❌ Error cargando pérdidas para el resumen:",
      perdidasError
    );

    return null;
  }


  const perdidasSemana =
    (
      perdidas || []
    ).reduce(
      (sum, perdida) =>
        sum +
        Number(
          perdida.cantidad || 0
        ),
      0
    );


  // ==========================================================
  // 5. RESULTADO
  // ==========================================================

  return {

    ventas:
      ventasSemana,

    perdidas:
      perdidasSemana,

    valorVendido

  };

}