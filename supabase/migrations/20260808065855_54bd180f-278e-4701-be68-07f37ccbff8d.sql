CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  industry text NOT NULL,
  city text NOT NULL,
  state text,
  website text,
  tier text NOT NULL DEFAULT 'Tier 2',
  established_year int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  start_year int NOT NULL
);

CREATE TABLE public.placement_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  role_title text NOT NULL,
  drive_date date,
  eligibility_criteria text,
  min_cgpa numeric(3,2),
  package_lpa numeric(6,2),
  status text NOT NULL DEFAULT 'Planned',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  roll_no text NOT NULL UNIQUE,
  department text NOT NULL,
  cgpa numeric(3,2) NOT NULL DEFAULT 0
);

CREATE TABLE public.drive_participation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id uuid NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  outcome text NOT NULL DEFAULT 'Applied',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (drive_id, student_id)
);

CREATE INDEX idx_drives_company ON public.placement_drives(company_id);
CREATE INDEX idx_drives_year ON public.placement_drives(academic_year_id);
CREATE INDEX idx_part_drive ON public.drive_participation(drive_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_years TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placement_drives TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drive_participation TO anon, authenticated;
GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.academic_years TO service_role;
GRANT ALL ON public.placement_drives TO service_role;
GRANT ALL ON public.students TO service_role;
GRANT ALL ON public.drive_participation TO service_role;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_participation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public demo access" ON public.companies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public demo access" ON public.academic_years FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public demo access" ON public.placement_drives FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public demo access" ON public.students FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public demo access" ON public.drive_participation FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.academic_years (label, start_year) VALUES
  ('2023-2024', 2023), ('2024-2025', 2024), ('2025-2026', 2025);

INSERT INTO public.companies (name, industry, city, state, website, tier, established_year) VALUES
  ('Lumina Dynamics', 'Autonomous Systems', 'Bangalore', 'KA', 'https://lumina.example.com', 'Tier 1', 2018),
  ('Vertex Financials', 'Banking & FinTech', 'Mumbai', 'MH', 'https://vertexfin.example.com', 'Tier 1', 2005),
  ('GreenCore Energy', 'Renewables', 'Hyderabad', 'TS', 'https://greencore.example.com', 'Tier 2', 2021),
  ('Apex Cybersec', 'Cybersecurity', 'Pune', 'MH', 'https://apexsec.example.com', 'Tier 2', 2015),
  ('Northwind Analytics', 'Data & Analytics', 'Chennai', 'TN', 'https://northwind.example.com', 'Tier 1', 2012),
  ('Orbit Semiconductors', 'Electronics', 'Hyderabad', 'TS', 'https://orbitsemi.example.com', 'Tier 1', 2009),
  ('Kestrel Logistics', 'Supply Chain', 'Delhi', 'DL', 'https://kestrel.example.com', 'Tier 3', 2016),
  ('Solace Health Systems', 'Healthcare IT', 'Kochi', 'KL', 'https://solacehs.example.com', 'Tier 2', 2014),
  ('Meridian Consulting', 'Consulting', 'Gurugram', 'HR', 'https://meridian.example.com', 'Tier 1', 2001),
  ('Fable Interactive', 'Gaming & Media', 'Bangalore', 'KA', 'https://fable.example.com', 'Tier 3', 2019),
  ('Ironclad Manufacturing', 'Manufacturing', 'Coimbatore', 'TN', 'https://ironclad.example.com', 'Tier 3', 1998),
  ('Cobalt Cloud Labs', 'Enterprise SaaS', 'Pune', 'MH', 'https://cobaltcloud.example.com', 'Tier 1', 2017);

INSERT INTO public.placement_drives (company_id, academic_year_id, role_title, drive_date, eligibility_criteria, min_cgpa, package_lpa, status)
SELECT c.id, y.id, d.role_title, d.drive_date::date, d.elig, d.min_cgpa::numeric, d.pkg::numeric, d.status
FROM (VALUES
  ('Lumina Dynamics','2023-2024','Software Engineer','2023-09-14','CSE/ECE, no active backlogs',7.50,18.00,'Completed'),
  ('Lumina Dynamics','2024-2025','Robotics Engineer','2024-09-10','CSE/ECE/MECH, no active backlogs',8.00,22.00,'Completed'),
  ('Vertex Financials','2023-2024','Risk Analyst','2023-10-04','All branches, 60% throughout',7.00,12.50,'Completed'),
  ('Vertex Financials','2024-2025','Quant Developer','2024-11-02','CSE/IT/MATH',8.50,26.00,'Completed'),
  ('Vertex Financials','2025-2026','Backend Engineer','2026-01-20','CSE/IT',7.50,20.00,'Scheduled'),
  ('GreenCore Energy','2024-2025','Grid Systems Trainee','2025-01-18','EEE/MECH',6.50,7.50,'Completed'),
  ('Apex Cybersec','2023-2024','Security Analyst','2023-08-22','CSE/IT, no backlogs',7.00,9.00,'Completed'),
  ('Apex Cybersec','2025-2026','SOC Engineer','2025-12-05','CSE/IT',7.00,11.00,'Scheduled'),
  ('Northwind Analytics','2023-2024','Data Analyst','2024-02-11','All branches',7.20,10.00,'Completed'),
  ('Northwind Analytics','2024-2025','ML Engineer','2024-12-09','CSE/IT/MATH',8.00,19.00,'Completed'),
  ('Orbit Semiconductors','2024-2025','VLSI Design Engineer','2024-10-15','ECE/EEE',7.50,16.00,'Completed'),
  ('Kestrel Logistics','2023-2024','Operations Trainee','2023-11-28','All branches',6.00,5.50,'Completed'),
  ('Solace Health Systems','2024-2025','Product Engineer','2025-02-06','CSE/IT/BIOTECH',7.00,10.50,'Completed'),
  ('Meridian Consulting','2023-2024','Business Analyst','2024-01-16','All branches, 65% throughout',7.50,13.00,'Completed'),
  ('Meridian Consulting','2025-2026','Technology Consultant','2025-11-19','All branches',7.50,14.50,'Planned'),
  ('Fable Interactive','2024-2025','Gameplay Programmer','2025-03-03','CSE/IT',6.80,8.50,'Completed'),
  ('Ironclad Manufacturing','2024-2025','Graduate Engineer Trainee','2024-08-30','MECH/CIVIL/EEE',6.00,4.80,'Completed'),
  ('Cobalt Cloud Labs','2025-2026','Platform Engineer','2025-10-08','CSE/IT, no active backlogs',7.80,21.00,'Scheduled')
) AS d(company, year, role_title, drive_date, elig, min_cgpa, pkg, status)
JOIN public.companies c ON c.name = d.company
JOIN public.academic_years y ON y.label = d.year;

INSERT INTO public.students (name, roll_no, department, cgpa) VALUES
  ('Aarav Menon','21CS001','CSE',8.60),
  ('Diya Sharma','21CS014','CSE',9.10),
  ('Rohan Iyer','21EC022','ECE',7.80),
  ('Sneha Patil','21IT007','IT',8.20),
  ('Karthik Rao','21ME045','MECH',6.90),
  ('Fatima Khan','21EE011','EEE',7.40),
  ('Aditya Nair','21CS033','CSE',7.10),
  ('Meera Joshi','21IT019','IT',8.90),
  ('Vikram Singh','21ME002','MECH',6.40),
  ('Ananya Das','21EC008','ECE',8.05),
  ('Rahul Verma','21CS050','CSE',7.60),
  ('Ishita Bose','21BT004','BIOTECH',7.95);

INSERT INTO public.drive_participation (drive_id, student_id, outcome)
SELECT pd.id, s.id,
  CASE WHEN (row_number() OVER (PARTITION BY pd.id ORDER BY s.roll_no)) = 1 THEN 'Selected'
       WHEN (row_number() OVER (PARTITION BY pd.id ORDER BY s.roll_no)) = 2 THEN 'Shortlisted'
       ELSE 'Applied' END
FROM public.placement_drives pd
JOIN public.students s ON s.cgpa >= COALESCE(pd.min_cgpa, 0);