import { db } from "../config/supabase.js";

export async function uploadNoteImage(
  date,
  imageFile
) {
  const extension =
    imageFile.name
      .split(".")
      .pop()
      ?.toLowerCase() || "jpg";

  const fileName =
    `${crypto.randomUUID()}.${extension}`;

  const filePath =
    `${date}/${fileName}`;

  const { error } =
    await db.storage
      .from("notas")
      .upload(
        filePath,
        imageFile,
        {
          cacheControl: "3600",
          upsert: false
        }
      );

  if (error) {
    return {
      data: null,
      error
    };
  }

  const {
    data: publicUrlData
  } =
    db.storage
      .from("notas")
      .getPublicUrl(filePath);

  return {
    data: publicUrlData.publicUrl,
    error: null
  };
}