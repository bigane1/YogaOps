"use client";

import { useEffect, useRef, useState } from "react";
import { useImageUploadGuard } from "@/components/image-upload-context";

interface Props {
  name: string;
  label: string;
  currentUrl?: string;
  shape?: "circle" | "rect";
  className?: string;
  homepageHint?: string;
}

export function ImageUpload({
  name,
  label,
  currentUrl = "",
  shape = "rect",
  className,
  homepageHint,
}: Props) {
  const notifyGuard = useImageUploadGuard();
  const [overrideUrl, setOverrideUrl] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const localPreviewRef = useRef<string | null>(null);
  const preview = overrideUrl ?? localPreview ?? currentUrl;

  useEffect(() => {
    notifyGuard(uploading);
    return () => notifyGuard(false);
  }, [uploading, notifyGuard]);

  function clearLocalPreview() {
    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
      localPreviewRef.current = null;
    }
    setLocalPreview(null);
  }

  function syncHiddenValue(url: string) {
    if (hiddenRef.current) {
      hiddenRef.current.value = url;
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    clearLocalPreview();
    const blobUrl = URL.createObjectURL(file);
    localPreviewRef.current = blobUrl;
    setLocalPreview(blobUrl);

    setError(null);
    setUploaded(false);
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });

      const raw = await res.text();
      let json: { url?: string; error?: string } = {};
      try {
        json = raw ? (JSON.parse(raw) as { url?: string; error?: string }) : {};
      } catch {
        setError(
          res.status === 503
            ? "Upload non configure sur le serveur. Sur OVH : stockage local (public/uploads), pas Vercel Blob."
            : `Erreur serveur (${res.status}). Reessayez ou utilisez un JPG de moins de 5 Mo.`,
        );
        clearLocalPreview();
        return;
      }

      if (!res.ok || !json.url) {
        setError(json.error ?? `Erreur lors de l upload (${res.status})`);
        clearLocalPreview();
        return;
      }

      clearLocalPreview();
      setOverrideUrl(json.url);
      syncHiddenValue(json.url);
      setUploaded(true);
    } catch {
      setError("Connexion interrompue pendant l upload. Verifiez le reseau et reessayez.");
      clearLocalPreview();
    } finally {
      setUploading(false);
    }
  }

  const isCircle = shape === "circle";

  return (
    <div className={className}>
      <p className="mb-1 text-xs font-medium opacity-70">{label}</p>
      {homepageHint ? (
        <p className="mb-2 text-xs text-[var(--terracotta)]">{homepageHint}</p>
      ) : null}

      <div className="flex items-start gap-4">
        {preview ? (
          <div
            className={`relative shrink-0 overflow-hidden border-2 border-[var(--brand)] bg-black/10 ${
              isCircle ? "h-24 w-24 rounded-full" : "h-20 w-32 rounded-lg"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-cover"
            />
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                Envoi…
              </div>
            ) : null}
          </div>
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center border-2 border-dashed border-[var(--brand)] bg-black/10 text-xs opacity-50 ${
              isCircle ? "h-24 w-24 rounded-full" : "h-20 w-32 rounded-lg"
            }`}
          >
            Aucune image
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="brand-btn brand-btn-sm w-fit rounded-lg px-3 py-1.5 text-sm"
          >
            {uploading ? "Envoi en cours…" : "Choisir depuis l'ordi"}
          </button>
          <p className="text-xs opacity-50">JPEG, PNG, WebP — max 5 Mo</p>
          {uploading && (
            <p className="text-xs font-medium text-amber-800">
              Attendez la fin de l envoi avant « Enregistrer ce bloc ».
            </p>
          )}
          {uploaded && !uploading && (
            <p className="text-xs font-medium text-[var(--brand)]">
              Photo prete — cliquez « Enregistrer ce bloc » pour sauvegarder.
            </p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          {preview && !uploading && (
            <button
              type="button"
              onClick={() => {
                clearLocalPreview();
                setOverrideUrl("");
                syncHiddenValue("");
                setUploaded(false);
              }}
              className="text-left text-xs opacity-40 hover:opacity-70"
            >
              Supprimer l&apos;image
            </button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      <input ref={hiddenRef} type="hidden" name={name} defaultValue={currentUrl} />
    </div>
  );
}
