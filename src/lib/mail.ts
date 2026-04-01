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
