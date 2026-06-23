"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateLandingBlock } from "@/app/actions";
import { AdminDialog } from "@/components/admin-dialog";
import { ImageUploadGuardContext } from "@/components/image-upload-context";

type DialogMode =
  | { type: "confirm" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

type LandingBlockFormProps = {
  blockId: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function LandingBlockForm({ blockId, title, children, className }: LandingBlockFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const uploadCountRef = useRef(0);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [loading, setLoading] = useState(false);
  const [uploadsPending, setUploadsPending] = useState(false);

  const notifyUploading = useCallback((uploading: boolean) => {
    if (uploading) {
      uploadCountRef.current += 1;
      setUploadsPending(true);
      return;
    }
    uploadCountRef.current = Math.max(0, uploadCountRef.current - 1);
    setUploadsPending(uploadCountRef.current > 0);
  }, []);

  function requestSave() {
    if (uploadsPending) {
      setDialog({
        type: "error",
        message:
          "L envoi de la photo est encore en cours. Attendez que le bouton affiche « Choisir depuis l ordi » et le message « Photo prete », puis enregistrez le bloc.",
      });
      return;
    }
    setDialog({ type: "confirm" });
  }

  async function confirmSave() {
    if (!formRef.current || uploadsPending) return;
    setLoading(true);

    const formData = new FormData(formRef.current);
    formData.set("blockId", blockId);

    for (const input of formRef.current.querySelectorAll<HTMLInputElement>(
      "input[type='hidden'][name]",
    )) {
      formData.set(input.name, input.value);
    }

    try {
      const result = await updateLandingBlock(formData);
      if (result.ok) {
        router.refresh();
        setDialog({
          type: "success",
          message: `Le bloc « ${title} » a été enregistré. La page d'accueil est mise à jour.`,
        });
      } else {
        setDialog({ type: "error", message: result.error });
      }
    } catch {
      setDialog({
        type: "error",
        message: "Une erreur inattendue s'est produite. Réessayez dans un instant.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageUploadGuardContext.Provider value={notifyUploading}>
      <form
        ref={formRef}
        className={className ?? "mt-4 grid gap-3"}
        onSubmit={(e) => e.preventDefault()}
      >
        {children}
        <button
          type="button"
          disabled={loading || uploadsPending}
          onClick={requestSave}
          className="brand-btn brand-btn-sm mt-2 w-fit rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {uploadsPending ? "Envoi photo en cours…" : "Enregistrer ce bloc"}
        </button>
      </form>

      {dialog?.type === "confirm" && (
        <AdminDialog
          title="Confirmer l'enregistrement"
          confirmLabel="Enregistrer"
          onConfirm={confirmSave}
          onClose={() => setDialog(null)}
          loading={loading}
        >
          <p>
            Voulez-vous enregistrer les modifications du bloc <strong>{title}</strong> ?
          </p>
        </AdminDialog>
      )}

      {dialog?.type === "success" && (
        <AdminDialog title="Enregistrement réussi" variant="success" onClose={() => setDialog(null)}>
          <p>{dialog.message}</p>
        </AdminDialog>
      )}

      {dialog?.type === "error" && (
        <AdminDialog title="Erreur" variant="error" onClose={() => setDialog(null)}>
          <p>{dialog.message}</p>
        </AdminDialog>
      )}
    </ImageUploadGuardContext.Provider>
  );
}
