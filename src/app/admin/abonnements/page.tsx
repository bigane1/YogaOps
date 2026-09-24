import { redirect } from "next/navigation";

/** Ancienne page admin abonnements → cartes de crédits. */
export default function AdminAbonnementsRedirectPage() {
  redirect("/admin/cartes");
}
