import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, StatusPill } from "@/components/AppShell";
import {
  fetchDrives,
  fetchAcademicYears,
  fetchParticipation,
  fetchStudents,
  addParticipant,
  updateDriveStatus,
  STATUSES,
} from "@/lib/placement";

export const Route = createFileRoute("/drives")({
  head: () => ({
    meta: [
      { title: "Placement Drives — Placematrix" },
      {
        name: "description",
        content:
          "All placement drives by academic year, with eligibility, status and student participation records.",
      },
      { property: "og:title", content: "Placement Drives — Placematrix" },
      {
        property: "og:description",
        content: "Filter drives by academic year and status, and manage student participation.",
      },
    ],
  }),
  component: DrivesPage,
});

function DrivesPage() {
  const qc = useQueryClient();
  const drives = useQuery({ queryKey: ["drives"], queryFn: () => fetchDrives() });
  const years = useQuery({ queryKey: ["years"], queryFn: fetchAcademicYears });
  const students = useQuery({ queryKey: ["students"], queryFn: fetchStudents });

  const [yearId, setYearId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");

  const participation = useQuery({
    queryKey: ["participation", selected],
    queryFn: () => fetchParticipation(selected!),
    enabled: !!selected,
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (drives.data ?? []).filter(
      (d) =>
        (!yearId || d.academic_year_id === yearId) &&
        (!status || d.status === status) &&
        (!q ||
          d.role_title.toLowerCase().includes(q) ||
          (d.companies?.name ?? "").toLowerCase().includes(q)),
    );
  }, [drives.data, yearId, status, search]);

  const statusMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => updateDriveStatus(id, value),
    onSuccess: () => {
      toast.success("Drive status updated.");
      qc.invalidateQueries({ queryKey: ["drives"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const participantMutation = useMutation({
    mutationFn: () => addParticipant(selected!, studentId),
    onSuccess: () => {
      toast.success("Student added to the drive.");
      setStudentId("");
      qc.invalidateQueries({ queryKey: ["participation", selected] });
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("duplicate") ? "That student is already on this drive." : e.message),
  });

  const selectedDrive = rows.find((d) => d.id === selected) ?? (drives.data ?? []).find((d) => d.id === selected);

  return (
    <AppShell
      title="Placement Drives"
      actions={
        <Link to="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90">
          + New Placement Drive
        </Link>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search role or company..."
          className="w-64 rounded-md border border-input bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select value={yearId} onChange={(e) => setYearId(e.target.value)} className="rounded-md border border-input bg-card px-3 py-1.5 text-sm">
          <option value="">All academic years</option>
          {(years.data ?? []).map((y) => (
            <option key={y.id} value={y.id}>{y.label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-input bg-card px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{rows.length} drives</span>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm xl:col-span-2">
          <table className="w-full text-left">
            <thead className="border-b border-border bg-background">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Company / Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Year</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setSelected(d.id)}
                  className={`cursor-pointer transition-colors hover:bg-background/60 ${selected === d.id ? "bg-background" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold">{d.companies?.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {d.role_title}
                      {d.package_lpa ? ` • ${d.package_lpa} LPA` : ""}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">{d.academic_years?.label}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{d.drive_date ?? "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={d.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => statusMutation.mutate({ id: d.id, value: e.target.value })}
                      className="rounded-md border border-input bg-card px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    {drives.isLoading ? "Loading drives..." : "No drives match those filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Participation</h3>
          {!selectedDrive ? (
            <p className="text-sm text-muted-foreground">Select a drive to view and manage student participation.</p>
          ) : (
            <>
              <div>
                <p className="font-semibold">{selectedDrive.companies?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDrive.role_title} • {selectedDrive.academic_years?.label}
                </p>
                <div className="mt-2"><StatusPill status={selectedDrive.status} /></div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {selectedDrive.eligibility_criteria ?? "No eligibility criteria recorded."}
                </p>
              </div>

              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {(participation.data ?? []).map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span>
                      {p.students?.name}
                      <span className="ml-2 font-mono text-[10px] text-muted-foreground">{p.students?.roll_no}</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p.outcome}</span>
                  </li>
                ))}
                {participation.data?.length === 0 && (
                  <li className="text-sm text-muted-foreground">No students recorded yet.</li>
                )}
              </ul>

              <div className="flex gap-2">
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Add student...</option>
                  {(students.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.roll_no})</option>
                  ))}
                </select>
                <button
                  onClick={() => studentId && participantMutation.mutate()}
                  disabled={!studentId || participantMutation.isPending}
                  className="rounded-lg bg-foreground px-4 text-xs font-bold uppercase tracking-widest text-background disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
