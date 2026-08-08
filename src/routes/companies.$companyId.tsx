import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, StatCard, StatusPill } from "@/components/AppShell";
import { fetchCompany, fetchDrives } from "@/lib/placement";

export const Route = createFileRoute("/companies/$companyId")({
  head: () => ({
    meta: [
      { title: "Company Profile — Placematrix" },
      {
        name: "description",
        content:
          "Company profile with industry, location and the full placement drive history across academic years.",
      },
      { property: "og:title", content: "Company Profile — Placematrix" },
      {
        property: "og:description",
        content: "Drive history for a recruiting company, grouped by academic year.",
      },
    ],
  }),
  component: CompanyProfile,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-destructive">{error.message}</div>
  ),
  notFoundComponent: () => <div className="p-8 text-sm">Company not found.</div>,
});

function CompanyProfile() {
  const { companyId } = Route.useParams();
  const company = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => fetchCompany(companyId),
  });
  const drives = useQuery({
    queryKey: ["drives", companyId],
    queryFn: () => fetchDrives(companyId),
  });

  const list = drives.data ?? [];
  const years = Array.from(new Set(list.map((d) => d.academic_years?.label ?? "—")));
  const avgPackage = list.filter((d) => d.package_lpa).length
    ? (
        list.reduce((s, d) => s + Number(d.package_lpa ?? 0), 0) /
        list.filter((d) => d.package_lpa).length
      ).toFixed(1)
    : "—";

  return (
    <AppShell
      title={company.data?.name ?? "Company Profile"}
      actions={
        <Link to="/companies" className="text-sm font-medium text-primary hover:underline">
          ← Back to directory
        </Link>
      }
    >
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{company.data?.name ?? "…"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {company.data?.industry} • {company.data?.city}
              {company.data?.state ? `, ${company.data.state}` : ""}
              {company.data?.established_year ? ` • Est. ${company.data.established_year}` : ""}
            </p>
          </div>
          <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            {company.data?.tier ?? ""} Partner
          </span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard label="Total Drives" value={list.length} footnote="Across all academic years" />
        <StatCard
          label="Academic Years"
          value={years.length}
          footnote={years.join(" • ")}
          tone={years.length > 1 ? "success" : "muted"}
        />
        <StatCard label="Avg Package" value={`${avgPackage} LPA`} footnote="Offered across drives" tone="mono" />
      </div>

      <div>
        <h3 className="mb-4 text-xl font-bold">Placement Drive History</h3>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Academic Year</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Eligibility</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-background/60">
                  <td className="px-6 py-4">
                    <Link to="/drives" className="font-semibold hover:text-primary">{d.role_title}</Link>
                    {d.package_lpa && (
                      <div className="text-[10px] text-muted-foreground">{d.package_lpa} LPA</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{d.academic_years?.label}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{d.drive_date ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {d.eligibility_criteria ?? "—"}
                    {d.min_cgpa ? ` (min ${d.min_cgpa} CGPA)` : ""}
                  </td>
                  <td className="px-6 py-4 text-right"><StatusPill status={d.status} /></td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    {drives.isLoading ? "Loading drives..." : "No drives recorded for this company yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
