import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, StatCard } from "@/components/AppShell";
import {
  fetchCompanies,
  fetchDrives,
  fetchAcademicYears,
  createDrive,
  STATUSES,
} from "@/lib/placement";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Placematrix — Employer & Placement Drive Records" },
      {
        name: "description",
        content:
          "Placement cell dashboard for managing recruiting companies, placement drives, student participation and recruitment analytics.",
      },
      {
        property: "og:title",
        content: "Placematrix — Employer & Placement Drive Records",
      },
      {
        property: "og:description",
        content:
          "Track companies once, run unlimited placement drives against them, and report on repeat recruiters by academic year.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const companies = useQuery({ queryKey: ["companies"], queryFn: () => fetchCompanies() });
  const drives = useQuery({ queryKey: ["drives"], queryFn: () => fetchDrives() });
  const years = useQuery({ queryKey: ["years"], queryFn: fetchAcademicYears });

  const [industryFilter, setIndustryFilter] = useState("");
  const [form, setForm] = useState({
    company_id: "",
    academic_year_id: "",
    role_title: "",
    drive_date: "",
    eligibility_criteria: "",
    min_cgpa: "",
    package_lpa: "",
    status: "Planned",
  });

  const mutation = useMutation({
    mutationFn: createDrive,
    onSuccess: () => {
      toast.success("Placement drive created against the existing company record.");
      qc.invalidateQueries({ queryKey: ["drives"] });
      setForm((f) => ({ ...f, role_title: "", drive_date: "", eligibility_criteria: "", min_cgpa: "", package_lpa: "" }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const list = companies.data ?? [];
    const q = industryFilter.trim().toLowerCase();
    const filtered = q
      ? list.filter((c) => c.industry.toLowerCase().includes(q))
      : list;
    return filtered.slice(0, 6);
  }, [companies.data, industryFilter]);

  const lastDriveFor = (companyId: string) => {
    const d = (drives.data ?? [])
      .filter((x) => x.company_id === companyId && x.drive_date)
      .sort((a, b) => (a.drive_date! < b.drive_date! ? 1 : -1))[0];
    if (!d?.drive_date) return "—";
    return new Date(d.drive_date)
      .toLocaleDateString("en-GB", { month: "short", year: "numeric" })
      .toUpperCase();
  };

  const allDrives = drives.data ?? [];
  const activeDrives = allDrives.filter((d) => d.status !== "Completed" && d.status !== "Cancelled").length;
  const counts = allDrives.reduce<Record<string, number>>((acc, d) => {
    acc[d.company_id] = (acc[d.company_id] ?? 0) + 1;
    return acc;
  }, {});
  const repeat = Object.values(counts).filter((n) => n > 1).length;
  const totalCompanies = companies.data?.length ?? 0;
  const repeatPct = totalCompanies ? Math.round((repeat / totalCompanies) * 100) : 0;
  const industries = Array.from(new Set((companies.data ?? []).map((c) => c.industry)));

  const byYear = (years.data ?? [])
    .slice()
    .sort((a, b) => a.start_year - b.start_year)
    .map((y) => ({
      label: y.label.slice(2, 4) + "–" + y.label.slice(-2),
      count: allDrives.filter((d) => d.academic_year_id === y.id).length,
    }));
  const maxYear = Math.max(1, ...byYear.map((y) => y.count));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_id || !form.academic_year_id || !form.role_title) {
      toast.error("Pick a company, an academic year and a role title.");
      return;
    }
    mutation.mutate({
      company_id: form.company_id,
      academic_year_id: form.academic_year_id,
      role_title: form.role_title,
      drive_date: form.drive_date || null,
      eligibility_criteria: form.eligibility_criteria || null,
      min_cgpa: form.min_cgpa ? Number(form.min_cgpa) : null,
      package_lpa: form.package_lpa ? Number(form.package_lpa) : null,
      status: form.status,
    });
  };

  return (
    <AppShell
      title="Employer & Placement Drive Records"
      actions={
        <Link
          to="/drives"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
        >
          + New Placement Drive
        </Link>
      }
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Companies" value={totalCompanies} footnote="Reusable master records" tone="success" />
        <StatCard label="Active Drives" value={activeDrives} footnote="Planned or scheduled" tone="primary" />
        <StatCard label="Repeat Recruiters" value={`${repeatPct}%`} footnote={`${repeat} companies with more than one drive`} />
        <StatCard
          label="Industry Sectors"
          value={String(industries.length).padStart(2, "0")}
          footnote={industries.slice(0, 3).join(" • ").toUpperCase()}
          tone="mono"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold">Master Company Directory</h2>
            <input
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              placeholder="Filter by industry..."
              className="w-48 rounded-md border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left">
              <thead className="border-b border-border bg-background">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Company Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Industry</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Headquarters</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Drive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => (
                  <tr key={c.id} className="group transition-colors hover:bg-background/60">
                    <td className="px-6 py-4">
                      <Link to="/companies/$companyId" params={{ companyId: c.id }} className="font-semibold transition-colors group-hover:text-primary">
                        {c.name}
                      </Link>
                      <div className="text-[10px] text-muted-foreground">
                        {c.established_year ? `EST. ${c.established_year} • ` : ""}
                        {c.tier} Partner
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{c.industry}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {c.city}
                      {c.state ? `, ${c.state}` : ""}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm">{lastDriveFor(c.id)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      {companies.isLoading ? "Loading registry..." : "No companies match that industry."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Link to="/companies" className="inline-block text-xs font-medium text-primary hover:underline">
            View the full directory →
          </Link>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Quick Schedule</h2>
          <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Select Master Company</label>
              <select
                value={form.company_id}
                onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                className="w-full cursor-pointer appearance-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Choose existing company...</option>
                {(companies.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Company details are auto-referenced to prevent data duplication.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Academic Year</label>
              <select
                value={form.academic_year_id}
                onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Choose academic year...</option>
                {(years.data ?? []).map((y) => (
                  <option key={y.id} value={y.id}>{y.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Role Title</label>
              <input
                value={form.role_title}
                onChange={(e) => setForm({ ...form, role_title: e.target.value })}
                placeholder="e.g. Software Engineer"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Drive Date</label>
                <input
                  type="date"
                  value={form.drive_date}
                  onChange={(e) => setForm({ ...form, drive_date: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Min CGPA</label>
                <input
                  type="number" step="0.1"
                  value={form.min_cgpa}
                  onChange={(e) => setForm({ ...form, min_cgpa: e.target.value })}
                  placeholder="7.5"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Package (LPA)</label>
                <input
                  type="number" step="0.1"
                  value={form.package_lpa}
                  onChange={(e) => setForm({ ...form, package_lpa: e.target.value })}
                  placeholder="12"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Eligibility Criteria</label>
              <textarea
                rows={3}
                value={form.eligibility_criteria}
                onChange={(e) => setForm({ ...form, eligibility_criteria: e.target.value })}
                placeholder="e.g. 7.5 CGPA, No Backlogs..."
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-lg bg-foreground py-3 text-sm font-bold uppercase tracking-widest text-background transition-all hover:opacity-90 disabled:opacity-50"
            >
              {mutation.isPending ? "Saving..." : "Create Drive Instance"}
            </button>
          </form>

          <div className="rounded-xl border border-primary/20 bg-foreground/5 p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Drives per Academic Year</h3>
            <div className="mb-2 flex h-24 items-end gap-2">
              {byYear.map((y) => (
                <div
                  key={y.label}
                  className="flex-1 rounded-t-sm bg-primary/70"
                  style={{ height: `${Math.max(8, (y.count / maxYear) * 100)}%` }}
                  title={`${y.count} drives`}
                />
              ))}
            </div>
            <div className="flex justify-between font-mono text-[9px] text-muted-foreground">
              {byYear.map((y) => (
                <span key={y.label}>{y.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
