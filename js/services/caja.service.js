import { db } from "../config/supabase.js";


// ============================================================
// GUARDAR CAJA
// ============================================================

export async function saveCaja(
  fecha,
  usuario,
  datos,
  totalTpv,
  tpvDay,
  tpvNight
) {
  return await db
    .from("caja")
    .upsert(
      {
        fecha,
        tipo: "diaria",
        datos,
        total_tpv: totalTpv,
        tpv_1000_0000: tpvDay,
        tpv_0000_1000: tpvNight,
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
      "id, fecha, tipo, datos, total_tpv, tpv_1000_0000, tpv_0000_1000, usuario, actualizado_en"
    )
    .eq(
      "fecha",
      fecha
    )
    .maybeSingle();
}

// Último cierre anterior: aporta el tramo 00:00–10:00 que el TPV
// arrastra en la lectura de 10:00–00:00 de la jornada siguiente.
export async function getCajaAnterior(fecha) {
  return await db
    .from("caja")
    .select("fecha, tpv_0000_1000")
    .lt("fecha", fecha)
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();
}
