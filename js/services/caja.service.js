import { db } from "../config/supabase.js";


// ============================================================
// GUARDAR CAJA
// ============================================================

export async function saveCaja(
  fecha,
  usuario,
  datos
) {
  return await db
    .from("caja")
    .upsert(
      {
        fecha,
        tipo: "diaria",
        datos,
        usuario,
        actualizado_en:
          new Date().toISOString()
      },
      {
        onConflict: "fecha"
      }
    )
    .select()
    .single();
}


// ============================================================
// CARGAR CAJA
// ============================================================

export async function getCaja(
  fecha
) {
  return await db
    .from("caja")
    .select(
      "id, fecha, tipo, datos, usuario, actualizado_en"
    )
    .eq(
      "fecha",
      fecha
    )
    .maybeSingle();
}