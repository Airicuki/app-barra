import { db } from "../config/supabase.js";


// ============================================================
// OBTENER NOTAS DE UNA FECHA
// ============================================================

export async function getNotas(fecha) {
  return await db
    .from("notas")
    .select(`
      id,
      fecha,
      hora,
      usuario,
      concepto,
      proveedor,
      importe,
      leido,
      imagen_url
    `)
    .eq("fecha", fecha)
    .order("hora", {
      ascending: false
    });
}


// ============================================================
// CREAR NOTA
// ============================================================

export async function createNota({
  fecha,
  hora,
  usuario,
  concepto,
  proveedor,
  importe,
  leido = false,
  imagen_url = null
}) {
  return await db
    .from("notas")
    .insert({
      fecha,
      hora,
      usuario,
      concepto,
      proveedor,
      importe,
      leido,
      imagen_url
    })
    .select()
    .single();
}


// ============================================================
// ACTUALIZAR ESTADO LEÍDO/PENDIENTE
// ============================================================

export async function updateNotaLeida(
  noteId,
  leido
) {
  return await db
    .from("notas")
    .update({
      leido
    })
    .eq("id", noteId)
    .select()
    .single();
}


// ============================================================
// ELIMINAR NOTA
// ============================================================

export async function deleteNota(
  noteId
) {
  return await db
    .from("notas")
    .delete()
    .eq("id", noteId);
}