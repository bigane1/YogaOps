import nodemailer from "nodemailer";

type ConfirmationMailInput = {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  courseTitle: string;
  startsAt: Date;
  zoomLink?: string | null;
  priceEur: number;
};

type ContactMailInput = {
  fullName: string;
  email: string;
  message: string;
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendBookingConfirmationEmail(
  input: ConfirmationMailInput,
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const adminEmail = process.env.ADMIN_EMAIL;

  const dateLabel = input.startsAt.toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const text = [
    `Bonjour ${input.customerName},`,
    "",
    "Votre reservation YogaOps est confirmee.",
    `Cours: ${input.courseTitle}`,
    `Date: ${dateLabel}`,
    `Tarif: ${input.priceEur} EUR`,
    `Reference: ${input.bookingId}`,
    "",
    input.zoomLink
      ? `Lien Zoom: ${input.zoomLink}`
      : "Lien Zoom: vous le recevrez prochainement.",
    "",
    "Merci et a bientot,",
    "YogaOps",
  ].join("\n");

  await transporter.sendMail({
    from,
    to: input.customerEmail,
    cc: adminEmail || undefined,
    subject: "YogaOps - Confirmation de reservation",
    text,
  });
}

type SubscriptionActivationMailInput = {
  customerName: string;
  customerEmail: string;
  planName: string;
  courseTitle: string;
  endsAt: Date;
  bookedSlots: { startsAt: Date; zoomLink?: string | null }[];
};

export async function sendSubscriptionActivationEmail(
  input: SubscriptionActivationMailInput,
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) return;

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const adminEmail = process.env.ADMIN_EMAIL;

  const endsAtLabel = input.endsAt.toLocaleDateString("fr-FR", { dateStyle: "long" });

  const slotLines = input.bookedSlots.map((s) => {
    const dateLabel = s.startsAt.toLocaleString("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    });
    return s.zoomLink ? `  - ${dateLabel} → ${s.zoomLink}` : `  - ${dateLabel}`;
  });

  const hasZoom = input.bookedSlots.some((s) => s.zoomLink);

  const text = [
    `Bonjour ${input.customerName},`,
    "",
    `Votre abonnement "${input.planName}" est activé !`,
    `Cours : ${input.courseTitle}`,
    `Valable jusqu'au : ${endsAtLabel}`,
    "",
    `Vos ${input.bookedSlots.length} séances sont automatiquement réservées :`,
    ...slotLines,
    "",
    hasZoom
      ? "Les liens Zoom ci-dessus sont valables pour chaque séance."
      : "Les liens Zoom vous seront envoyés prochainement pour chaque séance.",
    "",
    "À bientôt sur le tapis,",
    "YogaOps",
  ].join("\n");

  await transporter.sendMail({
    from,
    to: input.customerEmail,
    cc: adminEmail || undefined,
    subject: `YogaOps - Abonnement activé : ${input.planName}`,
    text,
  });
}

export async function sendContactEmail(input: ContactMailInput): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("SMTP non configuré sur ce serveur.");
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const adminEmail = process.env.ADMIN_EMAIL ?? process.env.SMTP_USER;
  if (!adminEmail) return;

  const text = [
    "Nouveau message depuis le formulaire de contact YogaOps.",
    "",
    `Nom: ${input.fullName}`,
    `Email: ${input.email}`,
    "",
    "Message:",
    input.message,
  ].join("\n");

  await transporter.sendMail({
    from,
    to: adminEmail,
    replyTo: input.email,
    subject: `YogaOps - Nouveau contact de ${input.fullName}`,
    text,
  });
}
