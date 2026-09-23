# Tanta Swimming Academy — Management System

#### Description:

**Tanta Swimming Academy** is a full-stack web application that digitizes the day-to-day management of a real swimming academy. Before this system, the academy relied on paper records, WhatsApp messages, and phone calls to handle registrations, monthly payments, and swimmer assignments. This application replaces all of that with a structured, role-based platform — built entirely in Arabic (RTL) because the academy's staff and parents are Arabic speakers.

The system serves three roles: **Admin**, **Coach**, and **Parent**. Each role has its own dashboard, its own set of pages, and its own API routes — and every request is checked against the logged-in user's role before any data is returned or modified.

---

## The Problem It Solves

A swimming academy needs to track dozens of children across multiple coaches and training groups, collect monthly fees, and review enrollment paperwork. Doing this over WhatsApp and paper is slow, error-prone, and offers no audit trail. This system gives the academy a single platform where parents can register their children and pay online, coaches can see exactly who they're responsible for, and the admin has full visibility and control over everything.

---

## Features

### Authentication & Security
- Email and password login with **bcrypt** password hashing (cost factor 12)
- **Rate limiting** — a maximum of 5 failed login attempts per IP address per 15 minutes. On lockout, the user sees a friendly Arabic message with the remaining wait time
- **Self-service Forgot Password** — the user enters their email address and receives a one-time reset link valid for exactly one hour, delivered via Resend. The link contains a secure random 64-character hex token stored in the `password_reset_tokens` table and deleted immediately after use
- JWT sessions via NextAuth v4 — the user's role is embedded in the token, so no database query is needed on every request to determine access level
- The forgot-password endpoint always returns the same response regardless of whether the email exists in the database, which prevents email enumeration attacks

### Admin Dashboard
The admin has access to nine sections:

| Section | Purpose |
|---------|---------|
| Overview | Live counts of pending requests, pending payments, active swimmers, and total coaches |
| Enrollment Requests | Review receipts submitted by parents when registering a child; approve or reject with a written note |
| Monthly Payments | Review monthly fee receipts per swimmer; approve or reject with a reason |
| Swimmers | Full list of all swimmers with their status, assigned coach, group, and payment state; edit swimmer data |
| Coaches | Add, edit, or delete coaches; the system auto-generates a temporary password shown once to the admin |
| Training Groups | Create groups with a day pattern (Sat/Mon/Wed or Sun/Tue/Thu) and a time slot, assigned to a coach |
| Parents | View all parent accounts with their children listed; delete a parent account (which cascades to their swimmers) |
| Reports | Summary reports for swimmers and coaches |
| Settings | Admin can update their own email and password |

The sidebar shows **live notification badges** on the Requests and Payments links, so the admin always knows when something needs attention.

### Parent Dashboard
- New parents see an **onboarding guide** — a three-step card explaining the full process (add swimmer → wait for approval → pay monthly)
- Parents can add multiple swimmers with name, age, and level
- After adding a swimmer, they upload an enrollment receipt which triggers an admin review
- Once approved, the swimmer becomes active and the parent can upload monthly payment receipts
- The payment history page shows the status of every receipt and, if rejected, the reason written by the admin

### Coach Dashboard
- Coaches see only their assigned swimmers with current payment status
- Coaches can update their own email and password from the settings page

---

## File Structure

### Pages (`src/app/`)

- `login/` — Login page. Handles the rate-limit UI (shows orange warning with countdown on lockout) and includes a "Forgot Password?" link
- `register/` — Parent self-registration page
- `forgot-password/` — Accepts an email address and triggers the reset email
- `reset-password/` — Reads the token from the URL query string, validates it, and lets the user set a new password
- `admin/layout.tsx` — Fetches pending request and payment counts in parallel using `Promise.all`, then passes them to the Sidebar as badge data
- `admin/page.tsx` — Overview stats, rendered as a Server Component
- `admin/coaches/` — Coaches management (add, edit, delete); includes success modal that shows the temporary password once
- `admin/groups/` — Training groups management
- `admin/parents/` — Parents list with delete functionality
- `admin/payments/` — Monthly payment review with approve/reject and rejection note
- `admin/requests/` — Enrollment request review with approve/reject and rejection note
- `admin/swimmers/` — Full swimmers list with edit capability
- `admin/reports/` — Swimmer and coach summary reports
- `admin/settings/` — Admin account settings
- `parent/page.tsx` — Parent home with onboarding guide (disappears once a swimmer is added)
- `parent/swimmers/` — Add and view swimmers
- `parent/payments/` — Upload and view monthly payment receipts
- `coach/page.tsx` — Coach home
- `coach/swimmers/` — Assigned swimmers list
- `coach/settings/` — Coach profile settings

### API Routes (`src/app/api/`)

- `auth/[...nextauth]/` — NextAuth handler (credentials provider, JWT callbacks, role injection)
- `auth/register/` — Creates a new parent account with a hashed password
- `auth/forgot-password/` — Looks up the user by email, generates a token, saves it to the database, and sends the reset email via Resend
- `auth/reset-password/` — Validates the token, checks expiry, updates the `password_hash`, and deletes the token immediately
- `admin/coaches/` — POST to add a coach with auto-generated password; PATCH and DELETE for edit and removal
- `admin/groups/` — POST, PATCH, DELETE for training groups
- `admin/parents/[id]/` — DELETE a parent (cascades to swimmers)
- `admin/payments/[id]/approve/` and `reject/` — Update payment status
- `admin/requests/[id]/approve/` and `reject/` — Update enrollment request status
- `admin/swimmers/[id]/` — PATCH to edit swimmer data
- `admin/reports/` — Returns swimmer and coach report data as JSON
- `admin/settings/email/` and `password/` — Admin account updates
- `coach/settings/` — Coach profile update
- `parent/swimmers/` — Add a swimmer
- `parent/payments/` — Upload a monthly payment receipt
- `upload/` — Handles file uploads to Supabase Storage and returns the signed URL

### Library (`src/lib/`)

- `auth.ts` — NextAuth configuration including the credentials provider, bcrypt password comparison, JWT callbacks that inject the user's role and ID, and the in-memory rate limiter implemented as a `Map<ip, { count, firstAttempt }>`
- `supabase.ts` — Exports both the anonymous Supabase client and the `supabaseAdmin` service-role client used in all server-side API routes
- `resend.ts` — Exports a `getResendClient()` function that initializes the Resend instance lazily (only on first use at runtime, not at module load time)

### Components (`src/components/`)

- `layout/Sidebar.tsx` — Role-aware navigation sidebar that accepts a `pendingCounts` prop and renders cyan notification badges on relevant links
- `shared/ImageUploader.tsx` — Reusable image uploader component used for both enrollment receipts and monthly payment receipts

---

## Database Schema

```
users                (id, email, password_hash, name, phone, role)
coaches              (id, user_id → users CASCADE, name, phone, active)
parents              (id, user_id → users CASCADE, name, phone)
swimmers             (id, parent_id → parents CASCADE,
                      coach_id → coaches SET NULL,
                      group_id → training_groups SET NULL,
                      name, age, level, status, payment_status)
training_groups      (id, coach_id → coaches CASCADE, day_pattern, time_slot, label)
enrollment_requests  (id, swimmer_id → swimmers CASCADE, receipt_image_url, status, notes)
payments             (id, swimmer_id → swimmers CASCADE,
                      month, year, receipt_image_url, status, rejection_note,
                      UNIQUE(swimmer_id, month, year))
password_reset_tokens (id, user_id → users CASCADE, token UNIQUE, expires_at)
```

---

## Design Decisions

### Server Components + Client Components
Next.js App Router makes it possible to mix Server Components (which fetch data on the server before the page is sent to the browser) with Client Components (which handle interactivity). Admin pages arrive fully populated — no loading spinners, no extra API calls from the browser. Interactive elements like modals and forms are Client Components that update local state optimistically after a successful API call, giving an instant response without a full page reload.

### Why Supabase?
Supabase provides a hosted PostgreSQL database, a file storage service for receipt images, and a typed JavaScript client — all in one platform. All API routes use the `supabaseAdmin` client with the service role key, which bypasses Row Level Security for trusted server code. RLS is still enabled on every table as a safety layer against any direct database access that bypasses the application.

### JWT Sessions — No Sessions Table
The user's role (`admin`, `coach`, or `parent`) is embedded directly in the JWT token at login time. Every protected page and every API route reads the role from the token without touching the database. This avoids a database query on every single request and eliminates the need for a sessions table entirely.

### In-Memory Rate Limiter
The rate limiter is a `Map<ip, { count, firstAttempt }>` stored in memory in `auth.ts`. It resets on server restart, which is acceptable for a small academy. Choosing an in-memory approach instead of a Redis-based one keeps the infrastructure simple and cost-free while still blocking the automated brute-force attacks this feature is designed to stop.

### Lazy Resend Initialization
Next.js evaluates module-level code at server startup. Creating a Resend instance at the top of a file with `new Resend(process.env.RESEND_API_KEY)` can fail if the environment variable is not yet available at that moment. The solution is `getResendClient()` — a function that creates the Resend instance only on the first actual call at runtime, never at module load time.

### Password Privacy
The admin never sets or sees any user's password. When a coach is created, the system generates a temporary password automatically and displays it to the admin exactly once. Both coaches and parents reset their own passwords through the self-service forgot-password flow — the admin is not involved at any point.

### Cascade vs SET NULL
When a coach is deleted, their swimmers are not deleted — `coach_id` is set to NULL. A coach leaving the academy should not erase the children's records. When a parent is deleted, their swimmers are deleted via CASCADE, because a swimmer record without a parent has no responsible guardian and no meaningful place in the system.

---

## How to Run Locally

**Requirements:** Node.js 18+, a Supabase project (free tier works), a Resend account (free tier: 100 emails/day)

```bash
git clone https://github.com/sayedibrahim6867-svg/Tanta-swimming-academy.git
cd Tanta-swimming-academy
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_random_32_char_string
RESEND_API_KEY=your_resend_api_key
```

Run `supabase/schema.sql` in your Supabase SQL Editor, then:

```bash
npm run dev
```

Open `http://localhost:3000` and log in with the admin credentials defined in `supabase/schema.sql`.

---

*CS50x Final Project — 2026 | Tanta, Egypt*
*GitHub: sayedibrahim6867-svg | edX: SI_2504_5958*
