import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { fetchCompanies, fetchDrives, createCompany } from "@/lib/placement";

export const Route = createFileRoute("/companies/")({
  head: () => ({
    meta: [
      { title: "Company Directory — Placematrix" },
      {
        name: "description",
        content:
          "Searchable master directory of recruiting companies with industry, location and drive history.",
      },
      { property: "og:title", content: "Company Directory — Placematrix" },
      {
        property: "og:description",
        content:
          "Every recruiting company is stored once and reused across placement drives.",
      },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const qc = useQueryClient();
  const companies = useQuery({ queryKey: ["companies"], queryFn: () => fetchCompanies() });
  const drives = useQuery({ queryKey: ["drives"], queryFn: () => fetchDrives() });

  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", industry: "", city: "", state: "", tier: "Tier 2" });

  const industries = Array.from(new Set((companies.data ?? []).map((c) => c.industry))).sort();
  const cities = Array.from(new Set((companies.data ?? []).map((c) => c.city))).sort();

  const driveCount = (id: string) => (drives.data ?? []).filter((d) => d.company_id === id).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (companies.data ?? []).filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q)) &&
        (!industry || c.industry === industry) &&
        (!city || c.city === city),
    );
  }, [companies.data, search, industry, city]);

  const add = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      toast.success("Company added to the master registry.");
      qc.invalidateQueries({ queryKey: ["companies"] });
      setOpen(false);
      setDraft({ name: "", industry: "", city: "", state: "", tier: "Tier 2" });
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate")
          ? "That company already exists — use the existing record instead."
          : e.message,
      ),
  });

  return (
    <AppShell
      title="Master Companies"
      actions={
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
        >
          {open ? "Close" : "+ New Company"}
        </button>
      }
    >
      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name || !draft.industry || !draft.city) {
              toast.error("Name, industry and city are required.");
              return;
            }
            add.mutate({ ...draft, state: draft.state || null });
          }}
          className="grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm md:grid-cols-5"
        >
          {(
            [
              ["name", "Company Name"],
              ["industry", "Industry"],
              ["city", "City"],
              ["state", "State"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
              <input
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={add.isPending}
              className="w-full rounded-lg bg-foreground py-2.5 text-xs font-bold uppercase tracking-widest text-background disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="w-64 rounded-md border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-1.5 text-sm"
        >
          <option value="">All industries</option>
          {industries.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-1.5 text-sm"
        >
          <option value="">All locations</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{rows.length} companies</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Company Name</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Industry</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Drives</th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr key={c.id} className="group transition-colors hover:bg-background/60">
                <td className="px-6 py-4">
                  <div className="font-semibold transition-colors group-hover:text-primary">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {c.established_year ? `EST. ${c.established_year} • ` : ""}{c.tier} Partner
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{c.industry}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {c.city}{c.state ? `, ${c.state}` : ""}
                </td>
                <td className="px-6 py-4 font-mono text-sm">
                  {driveCount(c.id)}
                  {driveCount(c.id) > 1 && (
                    <span className="ml-2 rounded bg-success/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-success">Repeat</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    to="/companies/$companyId"
                    params={{ companyId: c.id }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View profile →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {companies.isLoading ? "Loading registry..." : "No companies match those filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
