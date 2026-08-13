import { db } from "../config/supabase.js";


// ============================================================
// SUBIR IMAGEN DE UNA NOTA
// ============================================================

export async function uploadNoteImage(
  file,
  date
) {

  if (!file) {
    return {
      data: null,
      error: null
    };
  }


  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() || "jpg";


  const fileName =
    `${crypto.randomUUID()}.${extension}`;


  const filePath =
    `${date}/${fileName}`;


  const result =
    await db
      .storage
      .from("notas")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false
        }
      );


  if (result.error) {

    console.error(
      "❌ Error subiendo imagen:",
      result.error
    );

    return result;
  }


  const {
    data: publicUrlData
  } =
    db
      .storage
      .from("notas")
      .getPublicUrl(
        filePath
      );


  return {
    data: {
      path: filePath,
      publicUrl:
        publicUrlData.publicUrl
    },
    error: null
  };
}