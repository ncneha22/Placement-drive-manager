# Technology & Design Decisions — V05 Employer & Placement Drive Records

## 1. Problem framing

Institutions must document the companies that visit for recruitment and the placement drives
conducted. The core risk called out in the brief is **duplication**: if company details are
re-entered inside every drive record, "repeat recruiter" and "industry-wise participation"
reports become unreliable.

## 2. Data model (duplication prevention)

`companies` is a **master entity**, not an attribute of a drive.

- `companies.name` carries a `UNIQUE` constraint — the database itself refuses a second row
  for the same employer.
- `placement_drives.company_id` is a foreign key to `companies.id`. A drive **references** a
  company; it never copies its industry, city, or tier.
- `academic_years` is a separate lookup table, so "drives by year" and "companies by year" are
  simple joins instead of string parsing.
- `drive_participation` is a junction table between `placement_drives` and `students`, with a
  `UNIQUE (drive_id, student_id)` constraint so a student cannot be double-registered.

Because company identity lives in exactly one row, a repeat recruiter is just
`COUNT(drives) > 1 GROUP BY company_id` — no fuzzy matching or de-duplication pass required.

Referential integrity: deleting a company cascades to its drives; academic years are
`ON DELETE RESTRICT` so a year in use cannot be removed.

## 3. Technology choices

| Layer | Choice | Why |
| --- | --- | --- |
| Database | Postgres (Supabase) | Relational integrity is the whole point of this problem — FKs, unique constraints and joins are first-class. |
| API | PostgREST data API over Postgres | Zero boilerplate CRUD; the schema *is* the API, so the ER design stays the single source of truth. |
| Frontend | React + TanStack Start/Router | File-based routing, SSR-ready, typed route params for `/companies/$companyId`. |
| Data fetching | TanStack Query | Cache invalidation after mutations keeps the directory, drives and reports in sync automatically. |
| Styling | Tailwind CSS v4 with semantic design tokens | One token layer in `src/styles.css`; components never hardcode colours. |

## 4. Access model

This MVP is an open reviewer-facing prototype: row-level security is enabled on every table
with an explicit demo policy that allows read and write without sign-in, so a reviewer can
exercise the full Create → View → Search/Filter → Update → Report flow immediately. Hardening
to authenticated placement-officer accounts is a policy change per table, not a schema change.

## 5. Required UI flow

`Companies → Company Profile → Placement Drives → Participation`

- **Companies** (`/companies`) — searchable, filterable by industry and location, with drive
  counts and a repeat-recruiter badge.
- **Company Profile** (`/companies/:id`) — company facts plus the full drive history grouped by
  academic year.
- **Placement Drives** (`/drives`) — filter by academic year and status; inline status update.
- **Participation** — the side panel on the drives page lists and adds students per drive.
- **Analytics** (`/reports`) — companies by year, drives by year, industry-wise participation,
  repeat recruiters.

The dashboard's "Quick Schedule" form creates a drive by **picking an existing company** from a
selector — the acceptance test — so no company detail is ever re-typed.

## 6. Seed dataset

12 companies across 9 industries, 3 academic years, 18 placement drives (several companies
appear in more than one year), 12 students and their participation records.
