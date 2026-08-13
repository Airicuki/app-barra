import { db } from "../config/supabase.js";

// ============================================================
// PERSONAS
// ============================================================

export async function getRanchoPersonas() {
  return await db
    .from("rancho_personas")
    .select("id, nombre, activo")
    .eq("activo", true)
    .order("nombre", { ascending: true });
}


export async function createRanchoPersona(nombre) {
  return await db
    .from("rancho_personas")
    .insert({
      nombre: nombre.trim(),
      activo: true
    })
    .select("id, nombre, activo")
    .single();
}


// ============================================================
// TURNOS
// ============================================================

export async function getRanchoTurnos(
  startDate,
  endDate
) {
  return await db
    .from("rancho_turnos")
    .select(`
      id,
      fecha,
      rol,
      posicion,
      persona_id,
      rancho_personas (
        id,
        nombre
      )
    `)
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .order("fecha", { ascending: true })
    .order("rol", { ascending: true })
    .order("posicion", { ascending: true });
}


export async function saveRanchoTurno({
  fecha,
  rol,
  posicion,
  personaId
}) {
  return await db
    .from("rancho_turnos")
    .upsert(
      {
        fecha,
        rol,
        posicion,
        persona_id: personaId || null
      },
      {
        onConflict: "fecha,rol,posicion"
      }
    )
    .select(`
      id,
      fecha,
      rol,
      posicion,
      persona_id,
      rancho_personas (
        id,
        nombre
      )
    `)
    .single();
}


// ============================================================
// COMIDAS / CENAS
// ============================================================

export async function getRanchoComidas(
  startDate,
  endDate
) {
  return await db
    .from("rancho_comidas")
    .select(`
      id,
      fecha,
      tipo,
      persona_id,
      apuntado,
      pagado,
      rancho_personas (
        id,
        nombre
      )
    `)
    .gte("fecha", startDate)
    .lte("fecha", endDate)
    .order("fecha", { ascending: true })
    .order("tipo", { ascending: true });
}


export async function saveRanchoComida({
  fecha,
  tipo,
  personaId,
  apuntado,
  pagado
}) {
  return await db
    .from("rancho_comidas")
    .upsert(
      {
        fecha,
        tipo,
        persona_id: personaId,
        apuntado,
        pagado
      },
      {
        onConflict: "fecha,tipo,persona_id"
      }
    )
    .select(`
      id,
      fecha,
      tipo,
      persona_id,
      apuntado,
      pagado,
      rancho_personas (
        id,
        nombre
      )
    `)
    .single();
}


export async function deleteRanchoComida(
  fecha,
  tipo,
  personaId
) {
  return await db
    .from("rancho_comidas")
    .delete()
    .eq("fecha", fecha)
    .eq("tipo", tipo)
    .eq("persona_id", personaId);
}