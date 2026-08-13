import { db } from "../config/supabase.js";

export async function saveCashToSupabase({
  date,
  cash,
  username
}) {
  return await db
    .from("caja")
    .upsert(
      {
        fecha: date,
        tipo: "diaria",
        datos: cash,
        usuario: username,
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

export async function getCashFromSupabase(
  date
) {
  return await db
    .from("caja")
    .select(
      "id, fecha, tipo, datos, usuario, actualizado_en"
    )
    .eq("fecha", date)
    .maybeSingle();
}