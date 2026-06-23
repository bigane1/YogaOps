"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { updateLandingBlock } from "@/app/actions";
import { AdminDialog } from "@/components/admin-dialog";

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
  const formRef = useRef<HTMLFormElement>(null);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [loading, setLoading] = useState(false);

  async function confirmSave() {
    if (!formRef.current) return;
    setLoading(true);
    const formData = new FormData(formRef.current);
    formData.set("blockId", blockId);

    try {
      const result = await updateLandingBlock(formData);
      if (result.ok) {
        setDialog({
          type: "success",
          message: `Le bloc « ${title} » a été enregistré avec succès.`,
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
    <>
      <form ref={formRef} className={className ?? "mt-4 grid gap-3"} onSubmit={(e) => e.preventDefault()}>
        {children}
        <button
          type="button"
          disabled={loading}
          onClick={() => setDialog({ type: "confirm" })}
          className="brand-btn brand-btn-sm mt-2 w-fit rounded-lg px-4 py-2"
        >
          Enregistrer ce bloc
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
    </>
  );
}
