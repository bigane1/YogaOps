"use client";

import { useState } from "react";

/** Anti-spam : horodatage fixé une fois au premier rendu client (pas dans le Server Component). */
export function ContactFormStartedAt() {
  const [startedAt] = useState(() => String(Date.now()));
  return <input type="hidden" name="startedAt" value={startedAt} readOnly />;
}
