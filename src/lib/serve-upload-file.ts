import { readFile } from "fs/promises";
import path from "path";
import { getLocalUploadDir } from "@/lib/upload-config";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function sanitizeUploadFilename(filename: string): string | null {
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return null;
  }
  return filename;
}

export async function readUploadFile(filename: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const safe = sanitizeUploadFilename(filename);
  if (!safe) return null;

  const filePath = path.join(getLocalUploadDir(), safe);
  try {
    const buffer = await readFile(filePath);
    const ext = safe.split(".").pop()?.toLowerCase() ?? "";
    return {
      buffer,
      contentType: MIME_BY_EXT[ext] ?? "application/octet-stream",
    };
  } catch {
    return null;
  }
}
