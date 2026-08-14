import { db } from "../config/supabase.js";

import * as appState from "../state/state.js";

import {
  state,
  saveState
} from "../state/state.js";

import { els } from "../utils/dom.js";


// ============================================================
// INICIALIZAR
// ============================================================

export function initNotas() {

  console.log(
    "📝 Inicializando módulo de notas..."
  );


  if (els.noteForm) {

    els.noteForm.addEventListener(
      "submit",
      addNote
    );

  }


  if (els.noteDate) {

    els.noteDate.value =
      els.noteDate.value ||
      els.entryDate?.value ||
      getCurrentNoteDate();


    els.noteDate.addEventListener(
      "change",
      async () => {

        await loadNotas();
        renderNotas();

      }
    );

  }


  if (els.noteRows) {

    els.noteRows.addEventListener(
      "change",
      updateNoteRead
    );


    els.noteRows.addEventListener(
      "click",
      deleteNote
    );


    els.noteRows.addEventListener(
      "click",
      downloadNoteImage
    );

  }

}


// ============================================================
// CARGAR NOTAS DESDE SUPABASE
// ============================================================

export async function loadNotas() {

  if (!appState.session) {

    console.warn(
      "⚠️ No hay sesión para cargar notas."
    );

    return false;

  }


  const noteDate =
    els.noteDate?.value ||
    getCurrentNoteDate();


  const {
    data,
    error
  } = await db
    .from("notas")
    .select(
      `
      id,
      concepto,
      proveedor,
      importe,
      imagen_url,
      leido,
      fecha,
      hora,
      usuario
      `
    )
    .eq(
      "fecha",
      noteDate
    )
    .order(
      "fecha",
      {
        ascending: false
      }
    )
    .order(
      "hora",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "❌ Error cargando notas:",
      error
    );

    return false;

  }


  state.notes =
    (data || []).map(
      (note) => ({

        id:
          note.id,

        concept:
          note.concepto,

        provider:
          note.proveedor,

        amount:
          Number(
            note.importe || 0
          ),

        imageUrl:
          note.imagen_url,

        read:
          note.leido,

        createdAt:
          note.fecha && note.hora
            ? `${note.fecha}T${note.hora}`
            : note.fecha,

        user:
          note.usuario || "—"

      })
    );


  console.log(
    "📝 Notas cargadas:",
    state.notes
  );


  return true;

}


// ============================================================
// RENDERIZAR NOTAS
// ============================================================

export function renderNotas() {

  if (!els.noteRows) {
    return;
  }


  els.noteRows.replaceChildren();


  const notes =
    state.notes || [];


  // ----------------------------------------------------------
  // SIN NOTAS
  // ----------------------------------------------------------

  if (!notes.length) {

    const empty =
      document.createElement(
        "article"
      );


    empty.className =
      "row-card";


    empty.textContent =
      "No hay notas registradas.";


    els.noteRows.append(
      empty
    );


    return;

  }


  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  notes.forEach(
    (note) => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "row-card note-row";


      card.dataset.noteId =
        note.id;


      // ======================================================
      // CABECERA
      // ======================================================

      const header =
        document.createElement(
          "div"
        );


      header.className =
        "note-card-main";


      const title =
        document.createElement(
          "strong"
        );


      title.textContent =
        note.concept ||
        "Sin concepto";


      const amount =
        document.createElement(
          "strong"
        );


      amount.textContent =
        `${Number(
          note.amount || 0
        ).toFixed(2)} €`;


      header.append(
        title,
        amount
      );


      card.append(
        header
      );


      // ======================================================
      // PROVEEDOR
      // ======================================================

      if (note.provider) {

        const provider =
          document.createElement(
            "p"
          );


        provider.className =
          "note-card-provider";


        provider.textContent =
          `Proveedor: ${note.provider}`;


        card.append(
          provider
        );

      }


      // ======================================================
      // IMAGEN
      // ======================================================
      //
      // Ahora se muestra como una miniatura pensada para
      // móvil.
      //
      // Al pulsarla se intenta descargar directamente.
      //
      // ======================================================

      let image = null;


      if (note.imageUrl) {

        image =
          document.createElement(
            "div"
          );


        image.className =
          "note-image note-card-image";


        const downloadButton =
          document.createElement(
            "button"
          );


        downloadButton.type =
          "button";


        downloadButton.className =
          "note-image-download";


        downloadButton.title =
          "Pulsar para descargar la imagen";


        downloadButton.setAttribute(
          "aria-label",
          "Descargar imagen adjunta"
        );


        downloadButton.dataset.noteImageDownload =
          note.imageUrl;


        const img =
          document.createElement(
            "img"
          );


        img.src =
          note.imageUrl;


        img.alt =
          "Imagen adjunta a la nota";


        img.loading =
          "lazy";


        downloadButton.append(
          img
        );


        image.append(
          downloadButton
        );


        card.append(
          image
        );

      }


      // ======================================================
      // INFORMACIÓN
      // ======================================================

      const info =
        document.createElement(
          "div"
        );


      info.className =
        "note-card-meta";


      const date =
        note.createdAt
          ? new Date(
              note.createdAt
            ).toLocaleString(
              "es-ES"
            )
          : "—";


      info.textContent =
        `${date} · ${note.user || "—"}`;


      card.append(
        info
      );


      // ======================================================
      // LEÍDA
      // ======================================================

      const readLabel =
        document.createElement(
          "label"
        );


      readLabel.className =
        "note-read note-card-read";


      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "note-card-actions";


      const readCheckbox =
        document.createElement(
          "input"
        );


      readCheckbox.type =
        "checkbox";


      readCheckbox.checked =
        Boolean(
          note.read
        );


      readCheckbox.dataset.noteRead =
        note.id;


      readLabel.append(
        readCheckbox,
        document.createTextNode(
          " Leída"
        )
      );


      actions.append(
        readLabel
      );


      // ======================================================
      // BOTÓN ELIMINAR
      // ======================================================

      if (
        appState.session &&
        ["admin", "jefeBarra"].includes(
          appState.session.role
        )
      ) {

        const deleteButton =
          document.createElement(
            "button"
          );


        deleteButton.type =
          "button";


        deleteButton.className =
          "btn btn-danger";


        deleteButton.dataset.deleteNote =
          note.id;


        deleteButton.textContent =
          "Eliminar";


        actions.append(
          deleteButton
        );

      }


      card.append(
        actions
      );


      els.noteRows.append(
        card
      );

    }
  );

}


// ============================================================
// AÑADIR NOTA
// ============================================================

function getCurrentNoteDate() {

  const now =
    new Date();


  return [
    now.getFullYear(),
    String(
      now.getMonth() + 1
    ).padStart(2, "0"),
    String(
      now.getDate()
    ).padStart(2, "0")
  ].join("-");

}


function getCurrentNoteTime() {

  const now =
    new Date();


  return [
    String(
      now.getHours()
    ).padStart(2, "0"),
    String(
      now.getMinutes()
    ).padStart(2, "0")
  ].join(":");

}


async function addNote(event) {

  event.preventDefault();


  if (!appState.session) {

    alert(
      "Debes iniciar sesión."
    );

    return;

  }


  const concept =
    els.noteConcept?.value.trim();


  const provider =
    els.noteProvider?.value.trim();


  const amount =
    Number(
      els.noteAmount?.value || 0
    );


  const noteDate =
    els.noteDate?.value ||
    getCurrentNoteDate();


  if (!concept) {

    alert(
      "Introduce un concepto."
    );

    return;

  }


  let imageUrl =
    null;


  // ==========================================================
  // SUBIR IMAGEN
  // ==========================================================

  const file =
    els.noteImage?.files?.[0];


  if (file) {

    try {

      const extension =
        file.name
          .split(".")
          .pop();


      const path =
        `${appState.session.userId}/${crypto.randomUUID()}.${extension}`;


      const {
        error: uploadError
      } = await db.storage
        .from("notas")
        .upload(
          path,
          file,
          {
            upsert: false
          }
        );


      if (uploadError) {

        console.error(
          "❌ Error subiendo imagen:",
          uploadError
        );


        alert(
          "No se ha podido subir la imagen."
        );


        return;

      }


      const {
        data: publicData
      } =
        db.storage
          .from("notas")
          .getPublicUrl(
            path
          );


      imageUrl =
        publicData.publicUrl;

    } catch (error) {

      console.error(
        "❌ Error procesando imagen:",
        error
      );


      alert(
        "No se ha podido procesar la imagen."
      );


      return;

    }

  }


  // ==========================================================
  // INSERTAR NOTA
  // ==========================================================

  const {
    data,
    error
  } = await db
    .from("notas")
    .insert({

      concepto:
        concept,

      proveedor:
        provider || null,

      importe:
        amount,

      imagen_url:
        imageUrl,

      fecha:
        noteDate,

      hora:
        getCurrentNoteTime(),

      usuario:
        appState.session.username,

      leido:
        false

    })
    .select(
      `
      id,
      concepto,
      proveedor,
      importe,
      imagen_url,
      leido,
      fecha,
      hora,
      usuario
      `
    )
    .single();


  if (error) {

    console.error(
      "❌ Error creando nota:",
      error
    );


    alert(
      "No se ha podido guardar la nota."
    );


    return;

  }


  // ==========================================================
  // ACTUALIZAR ESTADO
  // ==========================================================

  state.notes.unshift({

    id:
      data.id,

    concept:
      data.concepto,

    provider:
      data.proveedor,

    amount:
      Number(
        data.importe || 0
      ),

    imageUrl:
      data.imagen_url,

    read:
      data.leido,

    createdAt:
      data.fecha && data.hora
        ? `${data.fecha}T${data.hora}`
        : data.fecha,

    user:
      appState.session.username

  });


  saveState();


  // ==========================================================
  // LIMPIAR FORMULARIO
  // ==========================================================

  if (els.noteForm) {

    els.noteForm.reset();

  }


  renderNotas();


  console.log(
    "📝 Nota creada:",
    data
  );

}


// ============================================================
// ACTUALIZAR LEÍDA
// ============================================================

async function updateNoteRead(event) {

  const checkbox =
    event.target.closest(
      "[data-note-read]"
    );


  if (!checkbox) {
    return;
  }


  const noteId =
    checkbox.dataset.noteRead;


  const read =
    checkbox.checked;


  const {
    error
  } = await db
    .from("notas")
    .update({
      leido: read
    })
    .eq(
      "id",
      noteId
    );


  if (error) {

    console.error(
      "❌ Error actualizando nota:",
      error
    );


    return;

  }


  const note =
    state.notes.find(
      (item) =>
        item.id === noteId
    );


  if (note) {

    note.read =
      read;

  }


  saveState();

}


// ============================================================
// DESCARGAR IMAGEN DE NOTA
// ============================================================

async function downloadNoteImage(
  event
) {

  const button =
    event.target.closest(
      "[data-note-image-download]"
    );


  if (!button) {
    return;
  }


  const imageUrl =
    button.dataset.noteImageDownload;


  if (!imageUrl) {
    return;
  }


  button.disabled =
    true;


  try {

    const response =
      await fetch(
        imageUrl
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const blob =
      await response.blob();


    const objectUrl =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      objectUrl;


    link.download =
      `nota-${Date.now()}.jpg`;


    document.body.append(
      link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
      objectUrl
    );


  } catch (error) {

    console.error(
      "❌ No se pudo descargar la imagen:",
      error
    );


    // Fallback si el navegador bloquea
    // la descarga directa.

    window.open(
      imageUrl,
      "_blank",
      "noopener,noreferrer"
    );

  } finally {

    button.disabled =
      false;

  }

}


// ============================================================
// ELIMINAR NOTA
// ============================================================

async function deleteNote(
  event
) {

  // Si el click ha sido sobre la miniatura,
  // NO debe intentar eliminar la nota.

  if (
    event.target.closest(
      "[data-note-image-download]"
    )
  ) {

    return;

  }


  const button =
    event.target.closest(
      "[data-delete-note]"
    );


  if (!button) {
    return;
  }


  if (
    !appState.session ||
    !["admin", "jefeBarra"].includes(
      appState.session.role
    )
  ) {

    return;

  }


  const noteId =
    button.dataset.deleteNote;


  const confirmDelete =
    confirm(
      "¿Quieres eliminar esta nota?"
    );


  if (!confirmDelete) {
    return;
  }


  const {
    error
  } = await db
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


    alert(
      "No se ha podido eliminar la nota."
    );


    return;

  }


  state.notes =
    state.notes.filter(
      (note) =>
        note.id !== noteId
    );


  saveState();


  renderNotas();


  console.log(
    "🗑️ Nota eliminada:",
    noteId
  );

}
