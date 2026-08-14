import { db } from "../config/supabase.js";


// ============================================================
// OBTENER NOTAS
// ============================================================

export async function getNotas(
  date
) {

  if (!date) {

    return {
      data: [],
      error: null
    };

  }


  const {
    data,
    error
  } =
    await db
      .from("notas")
      .select(
        `
        id,
        fecha,
        hora,
        usuario,
        concepto,
        proveedor,
        importe,
        leido,
        imagen_url
        `
      )
      .eq(
        "fecha",
        date
      )
      .order(
        "hora",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "❌ Error obteniendo notas:",
      error
    );

  }


  return {
    data,
    error
  };

}


// ============================================================
// CREAR NOTA
// ============================================================

export async function createNota(
  note
) {

  const {
    data,
    error
  } =
    await db
      .from("notas")
      .insert({

        fecha:
          note.fecha,

        hora:
          note.hora,

        usuario:
          note.usuario,

        concepto:
          note.concepto,

        proveedor:
          note.proveedor,

        importe:
          Number(
            note.importe || 0
          ),

        leido:
          Boolean(
            note.leido
          ),

        imagen_url:
          note.imagen_url ||
          null

      })
      .select(
        `
        id,
        fecha,
        hora,
        usuario,
        concepto,
        proveedor,
        importe,
        leido,
        imagen_url
        `
      )
      .single();


  if (error) {

    console.error(
      "❌ Error creando nota:",
      error
    );

  }


  return {
    data,
    error
  };

}


// ============================================================
// ACTUALIZAR ESTADO LEÍDO
// ============================================================

export async function updateNotaLeida(
  noteId,
  leido
) {

  const {
    data,
    error
  } =
    await db
      .from("notas")
      .update({

        leido:
          Boolean(
            leido
          )

      })
      .eq(
        "id",
        noteId
      )
      .select(
        `
        id,
        fecha,
        hora,
        usuario,
        concepto,
        proveedor,
        importe,
        leido,
        imagen_url
        `
      )
      .single();


  if (error) {

    console.error(
      "❌ Error actualizando nota:",
      error
    );

  }


  return {
    data,
    error
  };

}


// ============================================================
// ELIMINAR NOTA
// ============================================================

export async function deleteNota(
  noteId
) {

  const {
    error
  } =
    await db
      .from("notas")
      .delete()
      .eq(
        "id",
        noteId
      );


  if (error) {

    console.error(
      "❌ Error eliminando nota:",
      error
    );

  }


  return {
    data: null,
    error
  };

}