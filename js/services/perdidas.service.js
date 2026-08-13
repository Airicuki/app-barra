import { db } from "../config/supabase.js";

export async function registrarPerdida(
  fecha,
  usuario,
  productoId,
  cantidad,
  precio
) {
  return await db.rpc(
    "registrar_perdida",
    {
      p_fecha: fecha,
      p_usuario: usuario,
      p_producto_id: productoId,
      p_cantidad: cantidad,
      p_precio: precio
    }
  );
}