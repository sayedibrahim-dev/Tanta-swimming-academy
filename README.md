# Tanta Swimming Academy — Management System

**CS50x Final Project**
**Author:** Sayed Ibrahim

---

## Video Demo

> _Add your YouTube / CS50 submit video URL here_

---

## Description

**Tanta Swimming Academy** is a full-stack web application that digitizes the day-to-day management of a real swimming academy. Before this system, the academy relied on paper records, WhatsApp messages, and phone calls to handle registrations, monthly payments, and swimmer assignments. This application replaces all of that with a structured, role-based platform — built in Arabic (RTL) because the academy's staff and parents are Arabic speakers.

The system serves **three roles**:

| Role | What they do |
|------|-------------|
| **Admin** | Full control — coaches, groups, swimmers, enrollment requests, payments |
| **Coach** | Views their assigned swimmers and payment status |
| **Parent** | Registers their children, submits receipts, pays monthly fees |

---

## Features

### Authentication & Security
- Email + password login — **bcrypt** hashing (cost factor 12)
- **Rate limiting** — 5 failed attempts per IP per 15 minutes; friendly Arabic lockout message with remaining time
- **Self-service Forgot Password** — user enters email → receives a one-time reset link valid for 1 hour (sent via Resend)
- JWT sessions via NextAuth v4 — role embedded in token, no DB lookup per request
- Forgot-password always returns the same response whether the email exists or not (prevents email enumeration)

### Admin Dashboard
| Section | What it does |
|---------|-------------|
| Overview | Live stats — pending requests, pending payments, active swimmers, coaches |
| Enrollment Requests | Approve / reject swimmer registrations; add rejection note |
| Monthly Payments | Review receipt per swimmer per month; approve or reject with reason |
| Swimmers | Full list — status, coach, group, payment state; edit swimmer data |
| Coaches | Add / edit / delete coaches; system auto-generates a temp password shown once |
| Training Groups | Create groups (day pattern + time slot) assigned to a coach |
| Parents | View all parents with their children; delete parent (cascades to swimmers) |
| Reports | Swimmer and coach summary reports |
| Settings | Admin updates own email and password |
| Notification badges | Sidebar shows live badge count for pending requests and payments |

### Parent Dashboard
- Onboarding guide shown to new parents with no swimmers — 3-step card explains the process
- Add multiple swimmers (name, age, level)
- Upload enrollment receipt per swimmer → triggers admin review
- Upload monthly payment receipts for active swimmers
- View payment history per swimmer — see status, rejection reason if applicable

### Coach Dashboard
- View all assigned swimmers with info and current payment status
- Update personal email and password

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.4 — App Router, TypeScript |
| Database | Supabase (PostgreSQL + Storage) |
| Auth | NextAuth v4 — JWT strategy |
| Email | Resend |
| Styling | Tailwind CSS v4 + CSS variables (dark navy + gold theme) |
| UI Components | shadcn/ui + lucide-react icons |
| Validation | Zod v4 |
| Password Hashing | bcryptjs (cost 12) |
| Deployment | Local (localhost:3000) |

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          ← Fetches pending counts (Promise.all) → Sidebar badges
│   │   ├── page.tsx            ← Overview stats (Server Component)
│   │   ├── coaches/            ← Add / edit / delete coaches
│   │   ├── groups/             ← Training groups management
│   │   ├── parents/            ← Parents list + delete
│   │   ├── payments/           ← Monthly payment review
│   │   ├── reports/            ← Summary reports
│   │   ├── requests/           ← Enrollment requests review
│   │   ├── settings/           ← Admin account settings
│   │   └── swimmers/           ← Full swimmers list
│   ├── coach/
│   │   ├── page.tsx            ← Coach home
│   │   ├── swimmers/           ← Assigned swimmers
│   │   └── settings/           ← Coach profile
│   ├── parent/
│   │   ├── page.tsx            ← Home + onboarding guide
│   │   ├── swimmers/           ← Add / view swimmers
│   │   └── payments/           ← Upload + view payment receipts
│   ├── login/                  ← Login (rate limit UI + forgot-password link)
│   ├── register/               ← Parent self-registration
│   ├── forgot-password/        ← Email input → sends reset link
│   ├── reset-password/         ← Token from URL → set new password
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/  ← NextAuth handler
│       │   ├── register/       ← Parent registration
│       │   ├── forgot-password/ ← Generate token + send email via Resend
│       │   └── reset-password/  ← Validate token + update bcrypt hash
│       ├── admin/
│       │   ├── coaches/        ← POST / PATCH / DELETE
│       │   ├── groups/         ← POST / PATCH / DELETE
│       │   ├── parents/[id]/   ← DELETE
│       │   ├── payments/[id]/  ← approve / reject
│       │   ├── requests/[id]/  ← approve / reject
│       │   ├── reports/        ← swimmers + coaches JSON
│       │   ├── settings/       ← email / password update
│       │   └── swimmers/[id]/  ← PATCH (edit swimmer)
│       ├── coach/settings/     ← Coach profile update
│       ├── parent/
│       │   ├── swimmers/       ← Add swimmer
│       │   └── payments/       ← Upload payment receipt
│       └── upload/             ← Supabase Storage signed upload
├── components/
│   ├── layout/Sidebar.tsx      ← Role-aware sidebar with notification badges
│   └── shared/ImageUploader.tsx ← Reusable receipt image uploader
└── lib/
    ├── auth.ts                 ← NextAuth config + in-memory rate limiter
    ├── supabase.ts             ← Supabase anon + admin (service role) clients
    └── resend.ts               ← Lazy Resend client initialization
```

---

## Database Schema

```
users         (id, email, password_hash, name, phone, role)
coaches       (id, user_id → users CASCADE, name, phone, active)
parents       (id, user_id → users CASCADE, name, phone)
swimmers      (id, parent_id → parents CASCADE,
               coach_id → coaches SET NULL,
               group_id → training_groups SET NULL,
               name, age, level, status, payment_status)
training_groups (id, coach_id → coaches CASCADE, day_pattern, time_slot, label)
enrollment_requests (id, swimmer_id → swimmers CASCADE,
                     receipt_image_url, status, notes)
payments      (id, swimmer_id → swimmers CASCADE,
               month, year, receipt_image_url, status, rejection_note,
               UNIQUE(swimmer_id, month, year))
password_reset_tokens (id, user_id → users CASCADE, token UNIQUE, expires_at)
```

**Key cascade rules:**
- Delete `user` → deletes their `coach` or `parent` record automatically
- Delete `parent` → deletes all their `swimmers` (and swimmers' payments/requests)
- Delete `coach` → sets swimmers' `coach_id` to NULL — swimmers stay, just unassigned

---

## Design Decisions

### Server Components + Client Components
Next.js App Router lets pages fetch their data server-side (no loading spinners, no extra API call from the browser) while keeping interactive pieces (modals, forms, optimistic updates) as Client Components. For example, the admin coaches page arrives with the full coach list already rendered — clicking "Add Coach" opens a local modal without any navigation.

### Why Supabase?
One platform gives a hosted PostgreSQL database, file storage (for receipt images), and a JavaScript client. Using the `service_role` key on the server bypasses Row Level Security for trusted server code, while RLS still protects against any accidental direct access.

### JWT Sessions (no sessions table)
The user's role is embedded in the JWT token. Every protected page and API route reads the role from the token without touching the database — important at the admin layout level where several pages need to know the role.

### In-Memory Rate Limiter
A `Map<ip, { count, firstAttempt }>` in `auth.ts` handles brute-force protection. It resets on server restart — acceptable for a small academy where the server rarely restarts. The threshold (5 attempts / 15 min) was chosen to block automated attacks while not frustrating real users who mistype once or twice.

### Lazy Resend Client
Next.js evaluates module-level code at startup. Calling `new Resend(process.env.RESEND_API_KEY)` at the top of a file can fail if the environment isn't fully initialized yet. The fix: a `getResendClient()` function that creates the instance only on the first actual HTTP request at runtime.

### Password Privacy
The admin never sets or sees any password. Coaches receive a system-generated temporary password shown to the admin exactly once on creation. Both coaches and parents use the self-service "Forgot Password" flow when they need to reset — the admin is never involved.

### Cascade vs SET NULL
When a coach is deleted, their swimmers aren't deleted — only `coach_id` becomes NULL. A coach leaving the academy shouldn't erase the children's records. When a parent is deleted, their swimmers are deleted (CASCADE) because a swimmer without a parent has no guardian and no purpose in the system.

### Optimistic UI
After any successful CRUD operation the local React state is updated immediately without a page reload. If the API call fails, the error is shown and the state stays unchanged.

---

## How to Run Locally

### Requirements
- Node.js 18+
- Supabase project (free tier)
- Resend account (free tier: 100 emails/day)

### Steps

```bash
git clone https://github.com/sayedibrahim6867-svg/Tanta-swimming-academy.git
cd Tanta-swimming-academy
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_random_32_char_string
RESEND_API_KEY=your_resend_api_key
```

Run the SQL schema in your Supabase project's SQL Editor:

```
Copy the full contents of supabase/schema.sql and execute it.
```

Start the dev server:

```bash
npm run dev
# open http://localhost:3000
```

**Default admin login** (seeded by schema.sql):
- Email: `admin@tanta-swimming.com`
- Password: `Admin@1234`

---

## What I Learned

This project required solving problems CS50 problem sets don't cover:

- **Role-based access control** — every API route and page checks who is asking before returning or modifying data
- **Cascade vs SET NULL** — designing schema relationships so deleting one entity doesn't accidentally destroy unrelated data
- **Initialization order** — code that runs at module load time can't safely access environment variables before they're loaded, requiring lazy initialization patterns
- **Email security** — returning a consistent response for password reset requests to prevent leaking which emails are registered
- **Real Arabic UX** — RTL layout, Arabic validation messages, making technical states ("pending review", "rejected: receipt unclear") readable by non-technical parents and staff

---

*CS50x Final Project — 2026 | Tanta, Egypt*
