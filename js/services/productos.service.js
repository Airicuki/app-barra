import { db } from "../config/supabase.js";

export async function getProducts() {
  return await db
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("nombre");
}

export async function updateProduct(id, changes) {

    return await db
      .from("productos")
      .update(changes)
      .eq("id", id)
      .select()
      .single();
  
  }