"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBlogPost, deleteBlogPost, updateBlogPost } from "@/app/actions";
import { AdminDialog } from "@/components/admin-dialog";
import { ImageUpload } from "@/components/image-upload";
import { ImageUploadGuardContext } from "@/components/image-upload-context";
import type { BlogPost } from "@/lib/blog";

type DialogMode =
  | { type: "confirm" }
  | { type: "delete" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

type BlogPostFormProps = {
  mode: "create" | "edit";
  post?: BlogPost;
};

const fieldMd = "brand-field rounded-md px-3 py-2 text-sm";
const fieldSm = "brand-field rounded px-2 py-1 text-sm";

export function BlogPostForm({ mode, post }: BlogPostFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const uploadCountRef = useRef(0);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [loading, setLoading] = useState(false);
  const [uploadsPending, setUploadsPending] = useState(false);

  const isEdit = mode === "edit" && post;

  const notifyUploading = useCallback((uploading: boolean) => {
    if (uploading) {
      uploadCountRef.current += 1;
      setUploadsPending(true);
      return;
    }
    uploadCountRef.current = Math.max(0, uploadCountRef.current - 1);
    setUploadsPending(uploadCountRef.current > 0);
  }, []);

  function appendImageToContent(url: string) {
    const el = contentRef.current;
    if (!el || !url) return;
    const trimmed = el.value.trim();
    el.value = trimmed ? `${trimmed}\n\n${url}\n\n` : `${url}\n\n`;
  }

  function syncHiddenFields(formData: FormData) {
    if (!formRef.current) return;
    for (const input of formRef.current.querySelectorAll<HTMLInputElement>(
      "input[type='hidden'][name]",
    )) {
      if (input.name.startsWith("_")) continue;
      formData.set(input.name, input.value);
    }
    for (const field of formRef.current.querySelectorAll<HTMLElement>("[data-upload-field]")) {
      const fieldName = field.getAttribute("data-upload-field");
      const hidden = field.querySelector<HTMLInputElement>("input[type='hidden'][name]");
      if (fieldName && hidden?.value) {
        formData.set(fieldName, hidden.value);
      }
    }
  }

  function requestSave() {
    if (uploadsPending) {
      setDialog({
        type: "error",
        message:
          "L envoi de la photo est encore en cours. Attendez « Photo prete », puis enregistrez.",
      });
      return;
    }
    setDialog({ type: "confirm" });
  }

  async function confirmSave() {
    if (!formRef.current || uploadsPending) return;
    setLoading(true);

    const formData = new FormData(formRef.current);
    syncHiddenFields(formData);

    try {
      const result =
        isEdit
          ? await updateBlogPost(formData)
          : await createBlogPost(formData);

      if (result.ok) {
        router.refresh();
        setDialog({
          type: "success",
          message: isEdit
            ? "L article a été mis à jour. Les images sont visibles sur le blog."
            : "L article a été créé. Les images sont visibles sur le blog.",
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

  async function confirmDelete() {
    if (!post) return;
    setLoading(true);
    try {
      const result = await deleteBlogPost(post.id);
      if (result.ok) {
        router.refresh();
        setDialog({ type: "success", message: "L article a été supprimé." });
      } else {
        setDialog({ type: "error", message: result.error });
      }
    } catch {
      setDialog({ type: "error", message: "Impossible de supprimer cet article." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageUploadGuardContext.Provider value={notifyUploading}>
      <form
        ref={formRef}
        className="grid gap-2"
        onSubmit={(e) => e.preventDefault()}
      >
        {isEdit ? <input type="hidden" name="id" value={post.id} /> : null}

        <input
          name="title"
          required
          placeholder="Titre article"
          defaultValue={isEdit ? post.title : undefined}
          className={isEdit ? fieldSm : fieldMd}
        />
        <input
          name="excerpt"
          required
          placeholder="Resume court"
          defaultValue={isEdit ? post.excerpt : undefined}
          className={isEdit ? fieldSm : fieldMd}
        />
        <textarea
          ref={contentRef}
          name="content"
          required
          rows={isEdit ? 4 : 5}
          placeholder="Contenu de l article"
          defaultValue={isEdit ? post.content : undefined}
          className={isEdit ? fieldSm : fieldMd}
        />

        <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--beige)]/40 p-3">
          <p className="mb-3 text-xs font-medium text-[var(--brand)]">Photos de l article</p>
          <div className="grid gap-4">
            <ImageUpload
              key={isEdit ? `cover-${post.id}-${post.coverImage}` : "cover-new"}
              name="coverImage"
              label="Image de couverture"
              homepageHint="Grande photo en haut de l article et sur la liste du blog"
              currentUrl={isEdit ? post.coverImage ?? "" : ""}
              className={isEdit ? fieldSm : fieldMd}
            />

            <ImageUpload
              key={isEdit ? `inline-${post.id}` : "inline-new"}
              name="_contentImageHelper"
              label="Image dans le texte (optionnel)"
              homepageHint="Apres upload, l URL est ajoutee dans le contenu — puis enregistrez l article"
              className={isEdit ? fieldSm : fieldMd}
              onUploaded={appendImageToContent}
            />
          </div>
        </div>

        <select
          name="isPublished"
          defaultValue={isEdit ? (post.isPublished ? "1" : "0") : "1"}
          className={isEdit ? fieldSm : fieldMd}
        >
          <option value="1">Publie</option>
          <option value="0">Brouillon</option>
        </select>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading || uploadsPending}
            onClick={requestSave}
            className="brand-btn brand-btn-sm w-fit rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {uploadsPending
              ? "Envoi photo en cours…"
              : isEdit
                ? "Enregistrer l article"
                : "Ajouter l article"}
          </button>
          {isEdit ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => setDialog({ type: "delete" })}
              className="rounded border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-800 hover:bg-red-100 disabled:opacity-50"
            >
              Supprimer
            </button>
          ) : null}
        </div>
      </form>

      {dialog?.type === "confirm" && (
        <AdminDialog
          title="Confirmer l'enregistrement"
          confirmLabel="Enregistrer"
          onConfirm={confirmSave}
          onClose={() => setDialog(null)}
          loading={loading}
        >
          <p>Voulez-vous enregistrer cet article et ses images ?</p>
        </AdminDialog>
      )}

      {dialog?.type === "success" && (
        <AdminDialog title="Enregistrement réussi" variant="success" onClose={() => setDialog(null)}>
          <p>{dialog.message}</p>
        </AdminDialog>
      )}

      {dialog?.type === "delete" && (
        <AdminDialog
          title="Supprimer cet article ?"
          confirmLabel="Supprimer"
          variant="error"
          onConfirm={confirmDelete}
          onClose={() => setDialog(null)}
          loading={loading}
        >
          <p>Cette action est definitive.</p>
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
