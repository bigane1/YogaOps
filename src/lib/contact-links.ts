/** Extrait un numéro FR depuis un libellé type "Téléphone: +33 6 00 00 00 00". */
export function extractPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("33") && digits.length >= 11) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `33${digits.slice(1)}`;
  return digits;
}

export function formatPhoneDisplay(raw: string): string {
  const cleaned = raw.replace(/^T[ée]l[ée]phone\s*:\s*/i, "").trim();
  return cleaned || raw.trim();
}

export function buildWhatsAppUrl(rawPhone: string, message?: string): string {
  const digits = extractPhoneDigits(rawPhone);
  if (!digits) return "#";
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function buildTelUrl(rawPhone: string): string {
  const digits = extractPhoneDigits(rawPhone);
  if (!digits) return "#";
  if (digits.startsWith("33")) return `tel:+${digits}`;
  return `tel:${digits}`;
}
