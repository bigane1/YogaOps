import path from "path";

export function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

export function hasValidBlobToken(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token || token.length < 24) return false;
  if (!token.startsWith("vercel_blob_rw_")) return false;
  if (token.includes("xxx")) return false;
  return true;
}

/** Vercel : Blob si token valide. VPS OVH : disque local par defaut. */
export function shouldUseVercelBlob(): boolean {
  const mode = process.env.UPLOAD_STORAGE?.trim().toLowerCase();
  if (mode === "local") return false;
  if (mode === "blob") return hasValidBlobToken();
  if (isVercelRuntime()) return hasValidBlobToken();
  return false;
}

export function getLocalUploadDir(): string {
  const custom = process.env.UPLOAD_DIR?.trim();
  if (custom) return custom;
  return path.join(process.cwd(), "public", "uploads");
}

export function getLocalUploadPublicUrl(filename: string): string {
  const base = process.env.UPLOAD_PUBLIC_BASE?.trim();
  if (base) {
    return `${base.replace(/\/$/, "")}/${filename}`;
  }
  // Route App Router (/media) : fiable sur VPS OVH via Next (pas seulement public/static)
  return `/media/${filename}`;
}
