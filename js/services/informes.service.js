import { db } from "../config/supabase.js";


// ============================================================
// OBTENER CAJA DE UNA FECHA
// ============================================================

export async function getCajaInforme(date) {
  return await db
    .from("caja")
    .select(
      "id, fecha, datos, usuario, actualizado_en"
    )
    .eq("fecha", date)
    .maybeSingle();
}


// ============================================================
// OBTENER VENTAS DE UNA CAJA
// ============================================================

export async function getVentasCaja(cajaId) {
  return await db
    .from("ventas")
    .select(
      "id, fecha, usuario, total"
    )
    .eq("caja_id", cajaId)
    .order("fecha", {
      ascending: true
    });
}


// ============================================================
// OBTENER DETALLES DE LAS VENTAS
// ============================================================

export async function getDetallesVentas(
  ventaIds
) {
  return await db
    .from("detalle_ventas")
    .select(
      "id, venta_id, producto_id, cantidad, precio"
    )
    .in(
      "venta_id",
      ventaIds
    );
}


// ============================================================
// OBTENER PRODUCTOS DE LAS VENTAS
// ============================================================

export async function getProductosVentas(
  productoIds
) {
  return await db
    .from("productos")
    .select(
      "id, nombre"
    )
    .in(
      "id",
      productoIds
    );
}


// ============================================================
// OBTENER PÉRDIDAS DE UNA CAJA
// ============================================================

export async function getPerdidasCaja(
  cajaId
) {
  return await db
    .from("perdidas")
    .select(`
      id,
      fecha,
      usuario,
      cantidad,
      precio,
      producto_id
    `)
    .eq(
      "caja_id",
      cajaId
    )
    .order("fecha", {
      ascending: true
    });
}


// ============================================================
// OBTENER PRODUCTOS DE LAS PÉRDIDAS
// ============================================================

export async function getProductosPerdidas(
  productoIds
) {
  return await db
    .from("productos")
    .select(
      "id, nombre"
    )
    .in(
      "id",
      productoIds
    );
}