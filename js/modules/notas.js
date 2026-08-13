import {
    state,
    session,
    saveState
  } from "../state/state.js";
  
  import {
    els
  } from "../utils/dom.js";
  
  import {
    formatMoney
  } from "../utils/format.js";
  
  import {
    getNotas,
    createNota,
    updateNotaLeida,
    deleteNota as deleteNotaService
  } from "../services/notas.service.js";
  
  import {
    uploadNoteImage
  } from "../services/storage.service.js";
  
  
  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  
  export function initNotas() {

    if (els.noteForm) {
      els.noteForm.addEventListener(
        "submit",
        saveNote
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
  
    }
  
    if (els.entryDate) {
  
      els.entryDate.addEventListener(
        "change",
        async () => {
  
          await loadNotas();
  
          renderNotas();
  
        }
      );
  
    }
  
  }
  
  
  // ============================================================
  // CARGAR NOTAS
  // ============================================================
  
  export async function loadNotas(
    date = els.entryDate.value
  ) {
  
    if (!date) {
      return false;
    }
  
  
    try {
  
      const {
        data,
        error
      } =
        await getNotas(date);
  
  
      if (error) {
  
        console.error(
          "❌ Error cargando notas:",
          error
        );
  
        return false;
      }
  
  
      const rows =
        data || [];
  
  
      state.notes[date] =
        rows.map(
          (note) => ({
            id: note.id,
            concept:
              note.concepto,
            provider:
              note.proveedor,
            amount:
              Number(
                note.importe || 0
              ),
            read:
              Boolean(
                note.leido
              ),
            savedBy:
              note.usuario,
            time:
              note.hora,
            imageUrl:
              note.imagen_url || null
          })
        );
  
  
      console.log(
        "✅ Notas cargadas desde Supabase:",
        state.notes[date]
      );
  
  
      return true;
  
    } catch (error) {
  
      console.error(
        "❌ Error inesperado cargando notas:",
        error
      );
  
      return false;
    }
  
  }
  
  
  // ============================================================
  // RENDER NOTAS
  // ============================================================
  
  export function renderNotas() {
  
    const date =
      els.entryDate.value;
  
  
    const rows =
      state.notes[date] || [];
  
  
    els.noteRows.replaceChildren();
  
  
    if (!rows.length) {
  
      const empty =
        document.createElement(
          "article"
        );
  
      empty.className =
        "row-card";
  
      empty.textContent =
        "Todavía no hay notas guardadas hoy.";
  
      els.noteRows.append(
        empty
      );
  
      return;
    }
  
  
    // Solo admin y jefe de barra
    // pueden marcar o eliminar.
    const canManageNotes =
      session?.role === "admin" ||
      session?.role === "jefeBarra";
  
  
    rows
      .slice()
      .reverse()
      .forEach(
        (note) => {
  
          const card =
            document.createElement(
              "article"
            );
  
          card.className =
            "row-card note-row";
  
  
          // ====================================================
          // CONCEPTO
          // ====================================================
  
          const concept =
            document.createElement(
              "div"
            );
  
          const conceptStrong =
            document.createElement(
              "strong"
            );
  
          conceptStrong.textContent =
            note.concept;
  
          concept.append(
            conceptStrong
          );
  
  
          // ====================================================
          // PROVEEDOR
          // ====================================================
  
          const provider =
            document.createElement(
              "div"
            );
  
          provider.textContent =
            note.provider;
  
  
          // ====================================================
          // IMPORTE
          // ====================================================
  
          const amount =
            document.createElement(
              "div"
            );
  
          const amountStrong =
            document.createElement(
              "strong"
            );
  
          amountStrong.textContent =
            formatMoney(
              note.amount
            );
  
          amount.append(
            amountStrong
          );
  
  
          // ====================================================
          // CHECK LEÍDO / PENDIENTE
          // ====================================================
  
          const read =
            document.createElement(
              "label"
            );
  
          read.className =
            `checkbox-field ${
              note.read
                ? "note-read"
                : "note-pending"
            }`;
  
  
          const checkbox =
            document.createElement(
              "input"
            );
  
          checkbox.type =
            "checkbox";
  
          checkbox.dataset.noteRead =
            note.id;
  
          checkbox.checked =
            Boolean(note.read);
  
          checkbox.disabled =
            !canManageNotes;
  
  
          const readText =
            document.createElement(
              "span"
            );
  
          readText.textContent =
            note.read
              ? "Leído"
              : "Pendiente";
  
  
          read.append(
            checkbox,
            readText
          );
  
  
          // ====================================================
          // INFORMACIÓN
          // ====================================================
  
          const meta =
            document.createElement(
              "small"
            );
  
          meta.className =
            "note-meta";
  
          meta.textContent =
            `Guardada a las ${
              note.time || "—"
            } por ${
              note.savedBy || "—"
            }`;
  
  
          // ====================================================
          // IMAGEN
          // ====================================================
  
          let image = null;
  
  
          if (note.imageUrl) {
  
            image =
              document.createElement(
                "div"
              );
  
            image.className =
              "note-image";
  
  
            const link =
              document.createElement(
                "a"
              );
  
            link.href =
              note.imageUrl;
  
            link.target =
              "_blank";
  
            link.rel =
              "noopener noreferrer";
  
  
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
  
  
            link.append(
              img
            );
  
            image.append(
              link
            );
  
          }
  
  
          // ====================================================
          // BOTÓN ELIMINAR
          // ====================================================
  
          let actions = null;
  
  
          if (canManageNotes) {
  
            actions =
              document.createElement(
                "div"
              );
  
            actions.className =
              "note-actions";
  
  
            const deleteButton =
              document.createElement(
                "button"
              );
  
            deleteButton.type =
              "button";
  
            deleteButton.className =
              "danger note-delete-btn";
  
            deleteButton.dataset.noteDelete =
              note.id;
  
            deleteButton.textContent =
              "🗑️ Eliminar";
  
  
            actions.append(
              deleteButton
            );
  
          }
  
  
          // ====================================================
          // CONSTRUIR TARJETA
          // ====================================================
  
          card.append(
            concept,
            provider,
            amount,
            read,
            meta
          );
  
  
          if (image) {
            card.append(
              image
            );
          }
  
  
          if (actions) {
            card.append(
              actions
            );
          }
  
  
          els.noteRows.append(
            card
          );
  
        }
      );
  
  }
  
  
  // ============================================================
  // GUARDAR NOTA
  // ============================================================
  
  async function saveNote(
    event
  ) {
  
    event.preventDefault();
  
  
    const savedBy =
      window.prompt(
        "Nombre de la persona que guarda la nota"
      );
  
  
    if (
      !savedBy ||
      !savedBy.trim()
    ) {
      return;
    }
  
  
    const date =
      els.entryDate.value;
  
  
    const concept =
      els.noteConcept.value.trim();
  
  
    const provider =
      els.noteProvider.value.trim();
  
  
    const amount =
      Math.max(
        0,
        Number(
          els.noteAmount.value || 0
        )
      );
  
  
    if (
      !concept ||
      !provider
    ) {
  
      alert(
        "Completa el concepto y el proveedor."
      );
  
      return;
    }
  
  
    // ==========================================================
    // IMAGEN
    // ==========================================================
  
    const imageInput =
      document.getElementById(
        "noteImage"
      );
  
  
    const imageFile =
      imageInput?.files?.[0] ||
      null;
  
  
    if (imageFile) {
  
      if (
        !imageFile.type.startsWith(
          "image/"
        )
      ) {
  
        alert(
          "El archivo seleccionado no es una imagen."
        );
  
        return;
      }
  
  
      if (
        imageFile.size >
        5 * 1024 * 1024
      ) {
  
        alert(
          "La imagen no puede superar los 5 MB."
        );
  
        return;
      }
  
    }
  
  
    const now =
      new Date();
  
  
    const time =
      now.toLocaleTimeString(
        "es-ES",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );
  
  
    const submitButton =
      els.noteForm.querySelector(
        'button[type="submit"]'
      );
  
  
    if (submitButton) {
      submitButton.disabled =
        true;
    }
  
  
    try {
  
      // ========================================================
      // SUBIR IMAGEN
      // ========================================================
  
      let imageUrl =
        null;
  
  
      if (imageFile) {
  
        const {
          data: imageData,
          error: imageError
        } =
          await uploadNoteImage(
            imageFile,
            date
          );
  
  
        if (imageError) {
  
          alert(
            "No se ha podido subir la imagen."
          );
  
          return;
        }
  
  
        imageUrl =
          imageData?.publicUrl ||
          null;
  
  
        console.log(
          "✅ Imagen subida:",
          imageUrl
        );
  
      }
  
  
      // ========================================================
      // GUARDAR NOTA EN SUPABASE
      // ========================================================
  
      const {
        data,
        error
      } =
        await createNota({
  
          fecha:
            date,
  
          hora:
            time,
  
          usuario:
            savedBy.trim(),
  
          concepto:
            concept,
  
          proveedor:
            provider,
  
          importe:
            amount,
  
          leido:
            false,
  
          imagen_url:
            imageUrl
  
        });
  
  
      if (error) {
  
        console.error(
          "❌ Error guardando nota en Supabase:",
          error
        );
  
        alert(
          "No se ha podido guardar la nota."
        );
  
        return;
      }
  
  
      console.log(
        "✅ Nota guardada en Supabase:",
        data
      );
  
  
      // ========================================================
      // ACTUALIZAR ESTADO LOCAL
      // ========================================================
  
      const note = {
  
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
  
        read:
          Boolean(
            data.leido
          ),
  
        savedBy:
          data.usuario,
  
        time:
          data.hora,
  
        imageUrl:
          data.imagen_url ||
          null
  
      };
  
  
      state.notes[date] =
        state.notes[date] ||
        [];
  
  
      state.notes[date].push(
        note
      );
  
  
      saveState();
  
  
      els.noteForm.reset();
  
  
      renderNotas();
  
  
      console.log(
        "✅ Nota añadida correctamente:",
        note
      );
  
  
    } catch (error) {
  
      console.error(
        "❌ Error inesperado guardando nota:",
        error
      );
  
      alert(
        "Ha ocurrido un error al guardar la nota."
      );
  
    } finally {
  
      if (submitButton) {
        submitButton.disabled =
          false;
      }
  
    }
  
  }
  
  
  // ============================================================
  // MARCAR LEÍDO / PENDIENTE
  // ============================================================
  
  async function updateNoteRead(
    event
  ) {
  
    const input =
      event.target.closest(
        "[data-note-read]"
      );
  
  
    if (!input) {
      return;
    }
  
  
    if (
      ![
        "admin",
        "jefeBarra"
      ].includes(
        session?.role
      )
    ) {
  
      return;
    }
  
  
    const noteId =
      input.dataset.noteRead;
  
  
    const read =
      input.checked;
  
  
    const date =
      els.entryDate.value;
  
  
    const rows =
      state.notes[date] || [];
  
  
    const note =
      rows.find(
        (item) =>
          item.id === noteId
      );
  
  
    if (!note) {
      return;
    }
  
  
    input.disabled =
      true;
  
  
    try {
  
      const {
        data,
        error
      } =
        await updateNotaLeida(
          noteId,
          read
        );
  
  
      if (error) {
  
        console.error(
          "❌ Error actualizando estado de nota:",
          error
        );
  
        input.checked =
          note.read;
  
        alert(
          "No se ha podido actualizar el estado de la nota."
        );
  
        return;
      }
  
  
      note.read =
        Boolean(
          data.leido
        );
  
  
      saveState();
  
  
      renderNotas();
  
  
      console.log(
        "✅ Estado de nota actualizado en Supabase:",
        data
      );
  
  
    } catch (error) {
  
      console.error(
        "❌ Error inesperado actualizando nota:",
        error
      );
  
      input.checked =
        note.read;
  
    } finally {
  
      input.disabled =
        false;
  
    }
  
  }
  
  
  // ============================================================
  // ELIMINAR NOTA
  // ============================================================
  
  async function deleteNote(
    event
  ) {
  
    const button =
      event.target.closest(
        "[data-note-delete]"
      );
  
  
    if (!button) {
      return;
    }
  
  
    if (
      ![
        "admin",
        "jefeBarra"
      ].includes(
        session?.role
      )
    ) {
  
      return;
    }
  
  
    const noteId =
      button.dataset.noteDelete;
  
  
    const date =
      els.entryDate.value;
  
  
    const rows =
      state.notes[date] || [];
  
  
    const note =
      rows.find(
        (item) =>
          item.id === noteId
      );
  
  
    if (!note) {
      return;
    }
  
  
    const confirmed =
      window.confirm(
        `¿Quieres eliminar la nota "${note.concept}"?`
      );
  
  
    if (!confirmed) {
      return;
    }
  
  
    button.disabled =
      true;
  
  
    try {
  
      const {
        error
      } =
        await deleteNotaService(
          noteId
        );
  
  
      if (error) {
  
        console.error(
          "❌ Error eliminando nota de Supabase:",
          error
        );
  
        alert(
          "No se ha podido eliminar la nota."
        );
  
        return;
      }
  
  
      state.notes[date] =
        rows.filter(
          (item) =>
            item.id !== noteId
        );
  
  
      saveState();
  
  
      renderNotas();
  
  
      console.log(
        "🗑️ Nota eliminada correctamente:",
        noteId
      );
  
  
    } catch (error) {
  
      console.error(
        "❌ Error inesperado eliminando nota:",
        error
      );
  
      alert(
        "Ha ocurrido un error al eliminar la nota."
      );
  
    } finally {
  
      button.disabled =
        false;
  
    }
  
  }