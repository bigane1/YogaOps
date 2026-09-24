import { redirect } from "next/navigation";

/** Ancienne page abonnement → cartes de crédits. */
export default function AbonnementRedirectPage() {
  redirect("/compte/cartes");
}
