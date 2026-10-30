export const dynamic = "force-dynamic";

import { AdminPageFrame, isAdminLoggedIn } from "@/components/admin-page-frame";
import { LandingContentEditor } from "@/components/landing-content-editor";
import { ensureSeedData } from "@/lib/db";
import { getLandingContent } from "@/lib/landing-content";

export default async function AdminAteliersPage() {
  await ensureSeedData();
  const isLogged = await isAdminLoggedIn();
  const landing = isLogged ? await getLandingContent() : null;

  return (
    <AdminPageFrame title="Ateliers" intro="Contenu de la page Ateliers.">
      {landing ? (
        <section className="brand-card mt-8 rounded-xl p-6">
          <LandingContentEditor landing={landing} page="ateliers" />
        </section>
      ) : null}
    </AdminPageFrame>
  );
}
