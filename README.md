# Star Generation | Group Class Enrollment & Billing

Group classes where one tutor teaches several students. Students pay before they get access, and tutors earn according to the duration of lessons an admin has approved. Every flow persists in Supabase (Auth and PostgreSQL), and the database is the source of truth for roles, prices, capacity, payment, approval and earnings.

## Stack

TypeScript (strict), Next.js App Router (Node runtime), React, Tailwind CSS 4, Supabase Auth + PostgreSQL + `@supabase/ssr`, Zod, Radix Dialog, Lucide, Motion, Vitest, Playwright.

## Prerequisites

Node 20.12+, pnpm, and a Supabase project (a fresh, empty one).

## Setup from a fresh clone

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm db:migrate              # applies supabase/migrations/*.sql
pnpm db:seed                 # creates demo users and data through the real RPCs
# or, without Node: run supabase/seed.sql in the Supabase SQL editor (same data), or `pnpm db:seed:sql`
pnpm dev                     # http://localhost:3000
```

| Variable | Where to find it | Used by |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project Settings, API | app, tests |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings, API Keys | app, tests |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings, API Keys (secret) | `db:seed` only |
| `SUPABASE_DB_URL` | Connect, Session pooler | `db:migrate` only |

The secret key and database URL are used by local scripts only. The app itself runs entirely as the signed-in user, so RLS applies to every request.

`pnpm db:migrate` runs `drop schema public cascade` before applying the migrations. Only point it at a project you are happy to reset.

Production build: `pnpm build && pnpm start`.

## Seeded logins

All demo accounts use the password `StarGen!2026`. These are local demo credentials. For a deployment, run the seed against that project and change the passwords, or create real users and insert their `profiles` rows with a role.

| Role | Email |
| --- | --- |
| Admin | admin@stargeneration.demo |
| Tutor (has a class) | rina@stargeneration.demo |
| Tutor (no classes, for access tests) | dimas@stargeneration.demo |
| Student (paid) | nadia@stargeneration.demo |
| Student (free to take the last seat) | bagas@stargeneration.demo |
| Student (sees "Class full" after Bagas enrolls) | citra@stargeneration.demo |

Seed times are relative to when you run it: one upcoming lesson, one past lesson with a Pending report, and one past 90 minute lesson with an Approved report (Rp150.000 at Rp100.000/hour).

## Demo walkthrough

1. Sign in as **Bagas**, open Browse Classes, enroll. An invoice appears as Awaiting Payment and the class stays locked.
2. Sign in as **Citra**: the class now shows Class full.
3. Sign in as **Admin**, Invoices, Mark as Paid for Bagas. Bagas now sees the schedule.
4. Sign in as **Rina**, Reports: submit the report for the past lesson.
5. As **Admin**, Reports, Review: see the Rp-formula preview, then approve. The lesson and report become read-only.
6. As **Bagas**, open the class to read approved reports. As **Rina**, Earnings shows the calculation.
7. Sign in as **Dimas** to see the empty states. Try opening `/admin` to see the 403 page.

## Tests

```bash
pnpm test        # 21 business-rule tests against the real database, one authenticated client per role
pnpm test:e2e    # Playwright: the full enrollment to earnings flow, starts its own dev server on :3100
```

Both need the seeded database. Unit tests create their own classes and use random time slots, so they can be rerun without reseeding. Nothing here has been run against a deployed environment.

## Business assumptions

Student price is a one-time fee for access to a class, and the tutor rate is paid per lesson hour. An unpaid enrollment still holds a seat so an issued invoice can always be settled, and these reservations do not expire automatically in this MVP. Payment is simulated: only an admin can mark an invoice Paid. The student price is copied to the invoice at enrollment and the tutor rate is copied to each lesson at creation, so later price changes never alter past transactions. Earnings are recorded once, when a report is approved, as `round(rate × minutes / 60)` (half away from zero); the admin preview is not a balance.

## Additional improvements

- **Action center per role.** Admins see unpaid invoices and reports waiting, tutors see finished lessons missing a report, students see unpaid invoices and upcoming lessons. This answers "what do I do next" without hunting through pages.
- **Earnings breakdown.** Every entry shows minutes × hourly rate so the amount can be audited by eye.
- **Audit trail.** Payment confirmation and report approval write an `audit_events` row in the same transaction, readable by admins only.
- **Shareable filters.** Status, class, month and search live in query parameters.
- **Helpful empty states.** Each empty state says what the role should do next.

## Known limitations

- Pending seat reservations never expire.
- Forms use native form actions with Zod validation on the server instead of React Hook Form, and dates use `Intl` with a fixed +07:00 offset (Jakarta has no DST) rather than date-fns.
- PostgREST joins are untyped; generating database types would need the Supabase CLI.
- The unsaved-changes prompt on dialogs uses the browser's `confirm`.
- Browser QA covered overflow at 360, 390, 768, 1024 and 1440 px and screenshots at desktop and mobile; there is no automated visual regression, and no formal WCAG audit was run.
- There is no sign-up, password reset, or email flow by design.
