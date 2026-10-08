import { isAdmin } from "@/lib/auth";
import { saveUpload } from "@/lib/store";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "No autorizado" }, { status: 401 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "Falta el archivo" }, { status: 400 });
  const ext = EXT[file.type];
  if (!ext) return Response.json({ error: "Subí una imagen JPG, PNG, WebP o AVIF" }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: "La imagen pesa más de 8 MB" }, { status: 400 });

  try {
    const url = await saveUpload(ext, file.type, Buffer.from(await file.arrayBuffer()));
    return Response.json({ url });
  } catch {
    return Response.json({ error: "No se pudo guardar la imagen" }, { status: 500 });
  }
}
