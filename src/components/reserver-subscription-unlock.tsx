"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  dateIso: string;
  slotId: string;
  subscriptionId?: string;
  defaultEmail?: string;
};

export function ReserverSubscriptionUnlock({
  dateIso,
  slotId,
  subscriptionId,
  defaultEmail = "",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);

  const apply = () => {
    const q = new URLSearchParams();
    q.set("date", dateIso);
    q.set("slotId", slotId);
    const e = email.trim();
    if (e) q.set("email", e);
    if (subscriptionId) q.set("subscriptionId", subscriptionId);
    router.push(`/reserver?${q.toString()}`);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-md">
      <button
        type="button"
        className="brand-btn-secondary brand-btn-sm shrink-0 self-start rounded-lg px-3 py-2 text-sm font-medium"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Fermer" : "J'ai un abonnement"}
      </button>
      {open ? (
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--border-soft)] bg-[#fcfafe] p-3 sm:flex-row sm:items-stretch">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={"Meme e-mail que pour l'achat"}
            className="brand-field min-w-0 flex-1 px-3 py-2 text-sm"
            autoComplete="email"
          />
          <button
            type="button"
            className="brand-btn brand-btn-sm shrink-0 rounded-lg px-4 py-2 text-sm"
            onClick={apply}
          >
            Valider
          </button>
        </div>
      ) : null}
    </div>
  );
}
