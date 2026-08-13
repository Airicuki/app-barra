import { db } from "../config/supabase.js";

export async function registrarVenta(
  fecha,
  usuario,
  total,
  items
) {
  return await db.rpc(
    "registrar_venta",
    {
      p_fecha: fecha,
      p_usuario: usuario,
      p_total: total,
      p_items: items
    }
  );
}