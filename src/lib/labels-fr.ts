/** Libellés FR pour enums affichés aux humains (admin, confirmation, etc.). */

export function paymentMethodLabelFr(value: string): string {
  switch (value) {
    case "stripe":
      return "Carte en ligne (Stripe)";
    case "on_site":
      return "Sur place";
    case "subscription":
      return "Abonnement";
    default:
      return value;
  }
}

export function bookingStatusLabelFr(value: string): string {
  switch (value) {
    case "pending":
      return "En attente";
    case "confirmed":
      return "Confirmée";
    case "cancelled":
      return "Annulée";
    default:
      return value;
  }
}

export function subscriptionStatusLabelFr(value: string): string {
  switch (value) {
    case "pending":
      return "En attente";
    case "active":
      return "Actif";
    case "cancelled":
      return "Annulé";
    default:
      return value;
  }
}
