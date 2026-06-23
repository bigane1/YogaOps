import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

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

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
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
    const filename = `yogaops/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(filename, file, {
          access: "public",
          contentType: mimeType,
        });
        return NextResponse.json({ url: blob.url });
      } catch (blobError) {
        console.error("[upload] Vercel Blob error:", blobError);
        return NextResponse.json(
          {
            error:
              "Stockage Blob indisponible. Verifiez BLOB_READ_WRITE_TOKEN dans Vercel (Storage → Blob).",
          },
          { status: 500 },
        );
      }
    }

    if (isVercelRuntime()) {
      return NextResponse.json(
        {
          error:
            "Upload impossible en production : ajoutez BLOB_READ_WRITE_TOKEN dans Vercel (Storage → Blob → Create Store).",
        },
        { status: 503 },
      );
    }

    const localFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, localFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${localFilename}` });
  } catch (error) {
    console.error("[upload] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload. Reessayez avec une image plus legere (JPG, max 5 Mo)." },
      { status: 500 },
    );
  }
}
