import { db } from "../config/supabase.js";
import { state } from "../state/state.js";


/**
 * Carga los productos disponibles para la venta en barra.
 *
 * IMPORTANTE:
 * Estos productos NO representan el stock del inventario.
 */
export async function loadBarProductsFromSupabase() {

  const {
    data,
    error
  } = await db
    .from("productos_barra")
    .select("id, nombre, precio, activo")
    .eq("activo", true)
    .order("nombre");


  if (error) {

    console.error(
      "❌ Error cargando productos de barra:",
      error
    );

    return false;
  }


  state.barProducts =
    (data || []).map(
      (product) => ({

        id: product.id,

        name: product.nombre,

        price:
          Number(product.precio || 0),

        activo:
          product.activo

      })
    );


  console.log(
    "🍺 Productos de barra cargados desde Supabase:",
    state.barProducts
  );


  return true;
}