import { db } from "../config/supabase.js";

export async function getProducts() {
  return await db
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("nombre");
}

export async function updateProduct(
  productId,
  data
) {
  return await db
    .from("productos")
    .update({
      nombre: data.nombre,
      stock: data.stock,
      precio: data.precio
    })
    .eq("id", productId)
    .select()
    .single();
}