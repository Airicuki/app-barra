import { db } from "../config/supabase.js";
import { state } from "../state/state.js";

/**
 * Carga los productos disponibles para la venta en barra.
 *
 * IMPORTANTE:
 * Estos productos NO representan el stock del inventario.
 *
 * Además de los datos básicos, se cargan:
 * - categoria → minis, copas, varios, chupitos
 * - orden → posición dentro de la categoría
 */
export async function loadBarProductsFromSupabase() {

  const {
    data,
    error
  } = await db
    .from("productos_barra")
    .select(
      "id, nombre, precio, activo, categoria, orden"
    )
    .eq(
      "activo",
      true
    );


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    console.error(
      "❌ Error cargando productos de barra:",
      error
    );

    return false;
  }


  // ============================================================
  // GUARDAR EN ESTADO
  // ============================================================

  state.barProducts =
    (data || []).map(
      (product) => ({

        id:
          product.id,

        name:
          product.nombre,

        price:
          Number(
            product.precio || 0
          ),

        activo:
          product.activo,

        category:
          product.categoria,

        order:
          Number(
            product.orden || 0
          )

      })
    );


  // ============================================================
  // ORDEN DE LAS CATEGORÍAS
  // ============================================================

  const categoryOrder = {

    minis: 1,

    copas: 2,

    varios: 3,

    chupitos: 4

  };


  // ============================================================
  // ORDENAR PRODUCTOS
  // ============================================================

  state.barProducts.sort(
    (a, b) => {

      const categoryA =
        categoryOrder[
          a.category
        ] || 99;


      const categoryB =
        categoryOrder[
          b.category
        ] || 99;


      // Primero categoría
      if (
        categoryA !==
        categoryB
      ) {

        return (
          categoryA -
          categoryB
        );

      }


      // Después orden dentro
      // de la categoría
      return (
        a.order -
        b.order
      );

    }
  );


  console.log(
    "🍺 Productos de barra cargados desde Supabase:",
    state.barProducts
  );


  return true;
}