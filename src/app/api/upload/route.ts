import { cookies } from "next/headers";
import { access, mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import {
  getLocalUploadDir,
  getLocalUploadPublicUrl,
  isVercelRuntime,
  shouldUseVercelBlob,
} from "@/lib/upload-config";

const ADMIN_COOKIE = "yogaops_admin";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function resolveMimeType(file: File): string | null {
  if (file.type && ALLOWED_TYPES.includes(file.type)) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get(ADMIN_COOKIE)?.value !== "1") {
      return NextResponse.json({ error: "Non autorise. Reconnectez-vous au backoffice." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    const mimeType = resolveMimeType(file);
    if (!mimeType) {
      return NextResponse.json(
        {
          error:
            "Format non autorise. Utilisez JPEG, PNG, WebP ou GIF. Les photos iPhone (HEIC) doivent etre exportees en JPG.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Fichier trop lourd (max 5 Mo)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? mimeType.split("/")[1] ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    if (shouldUseVercelBlob()) {
      try {
        const blobKey = `yogaops/${filename}`;
        const blob = await put(blobKey, file, {
          access: "public",
          contentType: mimeType,
        });
        return NextResponse.json({ url: blob.url });
      } catch (blobError) {
        console.error("[upload] Vercel Blob error:", blobError);
        return NextResponse.json(
          { error: "Stockage cloud indisponible. Sur un VPS, retirez BLOB_READ_WRITE_TOKEN du .env." },
          { status: 500 },
        );
      }
    }

    if (isVercelRuntime()) {
      return NextResponse.json(
        {
          error:
            "Configurez un store Blob Vercel (BLOB_READ_WRITE_TOKEN) ou deployez sur un VPS avec stockage local.",
        },
        { status: 503 },
      );
    }

    const uploadDir = getLocalUploadDir();
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);
    await access(filePath);

    return NextResponse.json({ url: getLocalUploadPublicUrl(filename) });
  } catch (error) {
    console.error("[upload] Unexpected error:", error);
    const err = error as NodeJS.ErrnoException;
    if (err.code === "EACCES" || err.code === "EPERM") {
      return NextResponse.json(
        {
          error:
            "Le serveur ne peut pas ecrire les fichiers. Verifiez les droits sur public/uploads (chmod 755).",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload. Reessayez avec un JPG de moins de 5 Mo." },
      { status: 500 },
    );
  }
}
