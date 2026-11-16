# Bioacademy — ACT2 & EST Biology with Dr. Mina Samuel

A complete, production-ready learning platform for Dr. Mina Samuel's online **ACT2 & EST Biology** courses:
public website, student dashboard, and a master/assistant admin dashboard — with manual InstaPay / Vodafone Cash
payments, one-device logins, live-session attendance, homework & quizzes with auto-grading, downloadable PDF reports
and study analytics.

> English UI · unlimited seats · every course paid separately · no discount codes.

---

## ✨ What's inside

### Public website (anyone)
- Animated **3D DNA hero** (Three.js) with Dr. Mina's photo, smooth scroll reveals, 3D tilt cards and an intro loader.
- About Dr. Mina, course catalogue + course intro pages (description, curriculum outline, intro video, price).
- How enrollment works, features, **public session schedule** (times only — never Zoom links), FAQ.
- Team contacts (WhatsApp click-to-chat), **center locations** (Google Maps), social links and the official
  ACT / EST test websites — on the homepage, the Contact page and the footer.
- Light & dark mode, mobile-first.

### Students
- Sign up with **full name, WhatsApp number, email** (+ optional parent's number and school).
- **One device at a time** — signing in on a new device signs the old one out within seconds.
- **Enroll per course**: pick InstaPay or Vodafone Cash, see the numbers (copy buttons), upload the
  **payment screenshot** → status timeline (Submitted → Under review → Approved/Rejected with reason, resubmit).
- Private course area (only after approval): chapters → lessons → PDFs (in-browser viewer that works on phones),
  recorded videos (uploaded or YouTube/Vimeo/Drive/Bunny), links, the **full course book**, WhatsApp-group button.
  A moving **name + phone watermark** discourages screen recording/sharing.
- **Homework after every lesson, a quiz after every chapter** — one-question-at-a-time player with timer,
  navigator, flags, autosave and auto-submit; instant score; answer review per the teacher's setting.
- **Live sessions**: countdown → *Join session* (that click marks them **present**, then opens Zoom).
  Can't attend? Submit an excuse **before the session ends**. Add-to-Google-Calendar button.
- Schedule calendar (sessions + deadlines), grades table, **analytics** (score trend, you vs class average,
  chapter mastery radar, attendance donut, weekly activity, smart insights), notifications, lesson Q&A.

### Dr. Mina (master admin) & assistants (co-admins)
- **Courses**: Basics / Advanced, price, batch label, cover image, intro video, highlights, dates,
  optional **prerequisite** (e.g. Advanced requires Basics), WhatsApp group link, Draft/Published/Ended.
- **Content builder**: chapters (with images) → lessons, reorder, hide/publish; upload PDFs, recorded sessions
  (direct-to-storage uploads with progress bars, large files OK), video links, files; course **book** upload.
- **Homework & quizzes builder**: write MCQs, click the correct letter, images, explanations, points, drag to
  reorder, duplicate — or **paste questions from Word** (Quick import). Deadlines, opening time, timer,
  attempts, shuffle, when to reveal answers. Editing answers **re-grades** existing submissions automatically.
- **Results**: per-student table (Done / Not done = 0), WhatsApp reminder buttons, reset attempt,
  question insights (hardest questions, wrong-answer distribution), course **gradebook** matrix.
- **Live sessions**: schedule with Zoom link, live auto-refreshing attendance, read excuses, adjust attendance
  manually, *End session now*.
- **PDF reports** — the **Generate PDF report** button appears the moment a session ends / a deadline passes:
  - Attendance: every student → Present · Absent + **“Excuse Given”** (with the excuse) · Absent + **“Excuse NOT Given”**.
  - Grades: every student → Done (score, %) · **Not done (0 / missing)**.
  - Course summary: attendance %, homework & quiz averages for everyone.
  Every report is archived forever (even after student accounts are deleted).
- **Payments desk**: screenshot lightbox, amount check, approve (unlocks instantly + notification) or reject with a reason;
  one-tap WhatsApp message to the student. Manual enrollment for cash payments at centers.
- **Students**: search/filter, copy all WhatsApp numbers (for the group), CSV export, profile with grades,
  attendance & device, reset password (temporary password), reset device, suspend, delete.
- **Team & permissions (master only)**: create assistant accounts with **username + password** and tick exactly
  what each can do (12 permissions + presets), suspend, sign out, change password, remove.
- **Analytics**: attendance per session, class averages, lesson completion, enrollment trend, top performers,
  students who need attention, weak topics.
- **Announcements** (notify students), **Website settings** (payment numbers, homepage text, team contacts,
  centers, social links, FAQ, public schedule toggle), **Activity log**.
- **End of course**: *Mark as ended* → *Archive & delete student accounts*. Final attendance/grade/summary PDFs are
  generated automatically, then students' accounts are deleted — **except** students already enrolled in another
  active course (e.g. they moved on to Advanced), who keep their account.

### Permissions you can give assistants
Courses · Content · Homework & quizzes · Grades · Live sessions · Attendance · Payments · Students · PDF reports ·
Announcements · Analytics · Revenue. Presets: *Full assistant*, *Content & assessments*, *Sessions & attendance*, *Payments desk*.

---

## 🧱 Tech stack
Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · Motion (Framer Motion) ·
Three.js / React Three Fiber · Radix UI · Recharts · PDF.js · @react-pdf/renderer · Prisma 6 + PostgreSQL ·
S3-compatible storage (Cloudflare R2 / Supabase Storage / AWS S3) or local disk.

Auth is built in (bcrypt passwords, database sessions in an httpOnly cookie) so the one-device rule is exact and
works on any host — no paid auth plan needed.

---

## 🚀 Run it locally

Requirements: Node 20.9+ and PostgreSQL 14+.

```bash
cp .env.example .env          # then edit DATABASE_URL and APP_SECRET
npm install
npx prisma migrate deploy     # creates the tables
npm run db:seed               # master account + EXAMPLE courses/students
npm run dev                   # http://localhost:3000
```

Accounts created by the seed:

| Who | Sign in with | Password |
| --- | --- | --- |
| Dr. Mina (master admin) | `drmina` | `ChangeMe-2026!` (set `SEED_MASTER_PASSWORD` before seeding, and change it after first login) |
| Example student | `sara.ahmed@example.com` | `Student123!` |

All example content is labelled **Example** and can be removed in one click:
**Admin → Website settings → Example data → Remove example data**. Set `SEED_SAMPLE_DATA=false` to skip it.

---

## ☁️ Deploy (recommended: Vercel + Neon/Supabase + Cloudflare R2)

1. **Database** — create a PostgreSQL database on [Neon](https://neon.tech) or [Supabase](https://supabase.com)
   (free tiers work to start). Copy the connection string.
2. **File storage** — create a [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket (10 GB free, no
   download fees — ideal for recorded sessions). Create an R2 API token (Object Read & Write) and add this CORS rule
   to the bucket so browsers can upload directly:
   ```json
   [{ "AllowedOrigins": ["https://YOUR-DOMAIN"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
   ```
3. **Vercel** — import this GitHub repo and add the environment variables below. Vercel runs `vercel-build`
   (`scripts/vercel-build.mjs`): generates Prisma, applies database migrations, then builds.
   - The database can come from `DATABASE_URL` **or** from the variables the Supabase / Neon Vercel integrations
     create (`POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`) — no renaming needed.
   - If no database is connected yet, the deploy still succeeds and the build log says migrations were skipped;
     connect the database and redeploy. Set `STRICT_MIGRATIONS=1` to make a failed migration fail the deploy.
4. **Create the master account** — run once from your computer with the production `DATABASE_URL`:
   `SEED_SAMPLE_DATA=false npm run db:seed` (or keep the examples to explore, then remove them in settings).
5. Add your domain (e.g. `bioacademy.com`) in Vercel → Domains.

| Variable | Example | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://…` | Postgres connection string (not needed if you connected Supabase/Neon through Vercel) |
| `APP_SECRET` | 48+ random chars | `openssl rand -base64 48` |
| `APP_URL` | `https://bioacademy.com` | Public URL |
| `STORAGE_DRIVER` | `s3` | Must be `s3` on Vercel (its disk is temporary) |
| `S3_ENDPOINT` | `https://<account>.r2.cloudflarestorage.com` | R2 / S3 endpoint |
| `S3_REGION` | `auto` | `auto` for R2 |
| `S3_BUCKET` | `bioacademy` | Bucket name (keep it **private**) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | | R2 API token |
| `SEED_MASTER_USERNAME` / `SEED_MASTER_PASSWORD` / `SEED_MASTER_NAME` | | Used only by `npm run db:seed` |

Files are never public: every PDF, video, book and payment screenshot is served through `/api/files/…`, which checks
the user's role and enrollment first, then streams the file (or hands out a 20-minute signed link).

### Alternative: your own server (VPS) with Docker
```bash
echo "APP_SECRET=$(openssl rand -base64 48)" > .env
echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)" >> .env
echo "APP_URL=https://bioacademy.com" >> .env
docker compose up -d --build
docker compose exec app npm run db:seed
```
Files are stored on a Docker volume (`uploads`) — no size limits. Put Nginx/Caddy in front for HTTPS.

---

## 🔍 How the key rules work

- **One device per account** — each sign-in revokes all other sessions of that account (reason `NEW_DEVICE`).
  The old device is rejected on its next request, and a 15-second heartbeat shows it a “Signed in on another device”
  screen. Admins can also reset a student's device.
- **Attendance** — the student never sees the Zoom link. *Join session* hits `/api/sessions/:id/join`, which records
  **present** (first join time + count) and redirects to Zoom. It opens N minutes before the start (default 15) and
  closes when the session ends (or when staff press *End session now*). Excuses are accepted only before the end.
- **Deadlines** — work submitted after the deadline isn't accepted; started-but-unsubmitted attempts are auto-finalized
  from autosaved answers; anyone who never submitted is **Not done = 0** in grades and PDFs.
  Students who enrolled after a deadline/session are shown as “Joined later / Enrolled later” instead of being penalised.
- **Times** are entered and displayed in **Cairo time** (`Africa/Cairo`, DST-aware).

---

## 📂 Project structure
```
prisma/            schema, migrations, seed (+ sample assets)
src/app/(site)     public website          src/app/dashboard   student area
src/app/admin      master/assistant area   src/app/api         files, uploads, join, PDFs, CSV
src/actions        server actions (auth, student, admin)
src/components     ui/ (design system) · site/ · student/ · admin/ · charts/
src/lib            auth, permissions, storage, grading, reports, PDF documents, settings
```

## 🧪 Checks
`npm run typecheck` · `npm run build` · GitHub Actions runs migrations, type-check, seed and a production build on every push.
