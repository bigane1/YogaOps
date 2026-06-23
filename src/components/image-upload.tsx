"use client";

import { useRef, useState } from "react";

interface Props {
  name: string;
  label: string;
  currentUrl?: string;
  shape?: "circle" | "rect";
  className?: string;
}

export function ImageUpload({ name, label, currentUrl = "", shape = "rect", className }: Props) {
  const [overrideUrl, setOverrideUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = overrideUrl ?? currentUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploaded(false);
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = (await res.json()) as { url?: string; error?: string };

    setUploading(false);

    if (!res.ok || !json.url) {
      setError(json.error ?? "Erreur lors de l'upload");
      return;
    }

    setOverrideUrl(json.url);
    setUploaded(true);
  }

  const isCircle = shape === "circle";

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium opacity-70">{label}</p>

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
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="brand-btn brand-btn-sm w-fit rounded-lg px-3 py-1.5 text-sm"
          >
            {uploading ? "Envoi…" : "Choisir depuis l'ordi"}
          </button>
          <p className="text-xs opacity-50">JPEG, PNG, WebP — max 5 Mo</p>
          {uploaded && (
            <p className="text-xs font-medium text-[var(--brand)]">
              Photo prete — cliquez « Enregistrer le contenu » en bas du formulaire.
            </p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          {preview && (
            <button
              type="button"
              onClick={() => {
                setOverrideUrl("");
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
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      <input type="hidden" name={name} value={preview} />
    </div>
  );
}
