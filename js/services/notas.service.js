import { db } from "../config/supabase.js";

export async function createNote(note) {
  return await db
    .from("notas")
    .insert(note)
    .select()
    .single();
}

export async function updateNoteRead(
  noteId,
  read
) {
  return await db
    .from("notas")
    .update({
      leido: read
    })
    .eq("id", noteId)
    .select()
    .single();
}

export async function deleteNote(
  noteId
) {
  return await db
    .from("notas")
    .delete()
    .eq("id", noteId);
}