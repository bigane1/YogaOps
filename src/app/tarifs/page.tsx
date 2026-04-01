import { SiteNav } from "@/components/site-nav";
import { ensureSeedData } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export default async function TarifsPage() {
  await ensureSeedData();
  const [courses, packages] = await Promise.all([
    prisma.course.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.packagePlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="page-shell">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--brand)" }}>
          Tarifs
        </h1>
        <p className="mt-2 max-w-2xl opacity-90">
          Liste des prix a la seance et abonnements.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Cours a la seance
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <article key={course.id} className="brand-card rounded-xl p-5">
                <h3 className="font-medium">{course.title}</h3>
                <p className="mt-1 text-sm opacity-80">{course.description}</p>
                <p className="mt-2 text-sm opacity-80">
                  Type de cours: {course.location === "en_ligne" ? "En ligne" : "Presentiel"}
                </p>
                <p className="mt-3 text-lg font-semibold" style={{ color: "var(--brand)" }}>
                  {course.priceEur} EUR
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-medium" style={{ color: "var(--brand)" }}>
            Abonnements
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {packages.map((item) => (
              <article key={item.id} className="brand-card rounded-xl p-5">
                <h3 className="font-medium">{item.name}</h3>
                <p className="mt-1 text-sm opacity-80">{item.description}</p>
                <p className="mt-3 text-sm opacity-90">
                  {item.sessionCount} seances - validite {item.validityDays} jours
                </p>
                <p className="mt-2 text-lg font-semibold" style={{ color: "var(--brand)" }}>
                  {item.priceEur} EUR
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
