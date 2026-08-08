import { supabase } from "@/integrations/supabase/client";

export type Company = {
  id: string;
  name: string;
  industry: string;
  city: string;
  state: string | null;
  website: string | null;
  tier: string;
  established_year: number | null;
};

export type AcademicYear = { id: string; label: string; start_year: number };

export type Drive = {
  id: string;
  company_id: string;
  academic_year_id: string;
  role_title: string;
  drive_date: string | null;
  eligibility_criteria: string | null;
  min_cgpa: number | null;
  package_lpa: number | null;
  status: string;
  companies: { name: string; industry: string; city: string } | null;
  academic_years: { label: string } | null;
};

export type Student = {
  id: string;
  name: string;
  roll_no: string;
  department: string;
  cgpa: number;
};

export type Participation = {
  id: string;
  outcome: string;
  students: Student | null;
};

const DRIVE_SELECT =
  "id, company_id, academic_year_id, role_title, drive_date, eligibility_criteria, min_cgpa, package_lpa, status, companies(name, industry, city), academic_years(label)";

export async function fetchCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, industry, city, state, website, tier, established_year")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Company[];
}

export async function fetchCompany(id: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, industry, city, state, website, tier, established_year")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Company | null;
}

export async function fetchAcademicYears() {
  const { data, error } = await supabase
    .from("academic_years")
    .select("id, label, start_year")
    .order("start_year", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AcademicYear[];
}

export async function fetchDrives(companyId?: string) {
  let query = supabase.from("placement_drives").select(DRIVE_SELECT);
  if (companyId) query = query.eq("company_id", companyId);
  const { data, error } = await query.order("drive_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Drive[];
}

export async function fetchParticipation(driveId: string) {
  const { data, error } = await supabase
    .from("drive_participation")
    .select("id, outcome, students(id, name, roll_no, department, cgpa)")
    .eq("drive_id", driveId);
  if (error) throw error;
  return (data ?? []) as unknown as Participation[];
}

export async function fetchStudents() {
  const { data, error } = await supabase
    .from("students")
    .select("id, name, roll_no, department, cgpa")
    .order("roll_no");
  if (error) throw error;
  return (data ?? []) as Student[];
}

export type NewDrive = {
  company_id: string;
  academic_year_id: string;
  role_title: string;
  drive_date: string | null;
  eligibility_criteria: string | null;
  min_cgpa: number | null;
  package_lpa: number | null;
  status: string;
};

export async function createDrive(input: NewDrive) {
  const { error } = await supabase.from("placement_drives").insert(input);
  if (error) throw error;
}

export async function updateDriveStatus(id: string, status: string) {
  const { error } = await supabase
    .from("placement_drives")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export type NewCompany = {
  name: string;
  industry: string;
  city: string;
  state: string | null;
  tier: string;
};

export async function createCompany(input: NewCompany) {
  const { error } = await supabase.from("companies").insert(input);
  if (error) throw error;
}

export async function addParticipant(driveId: string, studentId: string) {
  const { error } = await supabase
    .from("drive_participation")
    .insert({ drive_id: driveId, student_id: studentId });
  if (error) throw error;
}

export const STATUSES = ["Planned", "Scheduled", "Completed", "Cancelled"];
