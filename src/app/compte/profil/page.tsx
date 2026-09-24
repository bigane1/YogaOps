export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { MemberSubnav } from "@/components/member-subnav";
import { completeMemberProfile, logoutMember } from "@/app/member-actions";
import { getCurrentMember } from "@/lib/member-auth";

const field = "brand-field rounded-md px-3 py-2.5 text-sm";

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function ProfilPage({ searchParams }: Props) {
  const member = await getCurrentMember();
  if (!member) redirect("/compte/connexion?next=/compte/profil");

  const params = await searchParams;
  const next = params.next || "/compte";

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-2xl px-5 py-10 md:px-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">Mon profil</h1>
        <MemberSubnav />
        <form action={logoutMember} className="mt-3">
          <button type="submit" className="brand-btn-secondary rounded-md px-3 py-1.5 text-sm">
            Se déconnecter
          </button>
        </form>

        {params.error === "profile" ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Nom, prénom et téléphone sont obligatoires.
          </p>
        ) : null}

        <form action={completeMemberProfile} className="brand-card mt-6 space-y-3 rounded-xl p-6">
          <input type="hidden" name="next" value={next} />
          <p className="text-sm text-[var(--muted)]">Email : {member.email}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Prénom
              <input
                name="firstName"
                required
                defaultValue={member.firstName}
                className={`${field} mt-1`}
              />
            </label>
            <label className="block text-sm">
              Nom
              <input
                name="lastName"
                required
                defaultValue={member.lastName}
                className={`${field} mt-1`}
              />
            </label>
          </div>
          <label className="block text-sm">
            Téléphone
            <input
              name="phone"
              type="tel"
              required
              defaultValue={member.phone}
              className={`${field} mt-1`}
            />
          </label>
          <button type="submit" className="brand-btn rounded-lg px-4 py-2.5 text-sm">
            Enregistrer
          </button>
        </form>
      </main>
    </div>
  );
}
