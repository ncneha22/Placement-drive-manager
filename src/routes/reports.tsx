import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { fetchCompanies, fetchDrives, fetchAcademicYears } from "@/lib/placement";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Recruitment Analytics — Placematrix" },
      {
        name: "description",
        content:
          "Companies by year, drives by year, industry-wise participation and the repeat-recruiter report.",
      },
      { property: "og:title", content: "Recruitment Analytics — Placematrix" },
      {
        property: "og:description",
        content: "Insight reports for the placement cell across academic years and industries.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const companies = useQuery({ queryKey: ["companies"], queryFn: () => fetchCompanies() });
  const drives = useQuery({ queryKey: ["drives"], queryFn: () => fetchDrives() });
  const years = useQuery({ queryKey: ["years"], queryFn: fetchAcademicYears });

  const allDrives = drives.data ?? [];
  const allYears = (years.data ?? []).slice().sort((a, b) => a.start_year - b.start_year);

  const perYear = allYears.map((y) => {
    const ds = allDrives.filter((d) => d.academic_year_id === y.id);
    return {
      label: y.label,
      drives: ds.length,
      companies: new Set(ds.map((d) => d.company_id)).size,
    };
  });
  const maxDrives = Math.max(1, ...perYear.map((p) => p.drives));

  const byIndustry = Object.entries(
    allDrives.reduce<Record<string, number>>((acc, d) => {
      const key = d.companies?.industry ?? "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxIndustry = Math.max(1, ...byIndustry.map(([, n]) => n));

  const repeat = (companies.data ?? [])
    .map((c) => {
      const ds = allDrives.filter((d) => d.company_id === c.id);
      return {
        company: c,
        drives: ds.length,
        years: Array.from(new Set(ds.map((d) => d.academic_years?.label ?? "—"))).sort(),
      };
    })
    .filter((r) => r.drives > 1)
    .sort((a, b) => b.drives - a.drives);

  return (
    <AppShell title="Recruitment Analytics">
      <section className="grid gap-8 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Companies &amp; Drives by Academic Year
          </h2>
          <div className="space-y-4">
            {perYear.map((p) => (
              <div key={p.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium">{p.label}</span>
                  <span className="font-mono text-muted-foreground">
                    {p.drives} drives • {p.companies} companies
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(p.drives / maxDrives) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Industry-wise Participation
          </h2>
          <div className="space-y-3">
            {byIndustry.map(([industry, count]) => (
              <div key={industry}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{industry}</span>
                  <span className="font-mono text-muted-foreground">{count}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-success"
                    style={{ width: `${(count / maxIndustry) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Repeat Recruiters</h2>
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
          Companies that conducted more than one placement drive. Because each company is a single
          master record referenced by its drives, repeat visits are counted exactly — no duplicate
          company rows to reconcile.
        </p>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Company</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Industry</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Drives</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Academic Years</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {repeat.map((r) => (
                <tr key={r.company.id} className="transition-colors hover:bg-background/60">
                  <td className="px-6 py-4 font-semibold">{r.company.name}</td>
                  <td className="px-6 py-4 text-sm">{r.company.industry}</td>
                  <td className="px-6 py-4 font-mono text-sm">{r.drives}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{r.years.join(", ")}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to="/companies/$companyId"
                      params={{ companyId: r.company.id }}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View profile →
                    </Link>
                  </td>
                </tr>
              ))}
              {repeat.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    {drives.isLoading ? "Loading..." : "No repeat recruiters yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
