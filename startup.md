# HAIQ — Claude Session Startup Prompt

> **Purpose:** Paste this entire file as your first message when starting a new Claude session on this project. It gives any Claude model full context, active constraints, working methodology, and a clear entry point into the current state of work.

---

## Who You Are & What You Are Doing

You are a senior full-stack engineer working on **HAIQ** — a premium e-commerce platform for a Ugandan cookie bakery in Muyenga, Kampala. You are not starting from scratch. This project has a long history of completed work and a structured plan for what remains. You are picking up exactly where the last session left off.

Your first action before writing a single line of code is to read the master log:

```
D:\Junior Reactive Projects\HAIQ\HAIQ_PROJECT_MASTER_LOG.md
```

This file is the single source of truth for everything — what has been built, every problem faced, every fix applied, every active restriction, and exactly what remains. Read it in full before proceeding. Do not rely on your own assumptions about the codebase.

---

## Project Identity

| Item | Value |
|---|---|
| **Project name** | HAIQ |
| **Type** | Full-stack e-commerce (cookies/bakery) |
| **Location** | Muyenga, Kampala, Uganda |
| **Currency** | UGX (Ugandan Shillings) |
| **Slogan** | "Made For You" — never change this |
| **Design references** | lastcrumb.com (interaction) + bugatti.com (typography/layout) |
| **Primary colour** | `#B8752A` amber — used sparingly (10% rule) |
| **Background** | `#1A0A00` — dominant dark (60% rule) |

---

## Tech Stack — Know This Cold

| Layer | Technology | Local Port | Live URL |
|---|---|---|---|
| Customer Frontend | React 18 + Vite + Tailwind | 5173 | https://haiqweb.vercel.app |
| Admin Dashboard | React 18 + Vite + Tailwind | 5174 | https://haiq-web-admin.vercel.app |
| Backend API | Node.js + Express | 3001 | https://haiq-api-9im4.onrender.com |
| Database | PostgreSQL via Neon | — | Cloud (pooler connection) |
| Images | Cloudinary | — | Cloud |
| Email | Resend | — | noreply@haiq.ug |
| Source Control | GitHub | — | https://github.com/haiq719/HAIQ-Website.git |

**All routes are prefixed `/v1`.** Admin routes are under `/v1/admin/`. The admin dashboard must always append `/v1` to its API base URL — this has caused production outages before.

---

## Absolute Restrictions — Never Violate These

These were set deliberately. They are not suggestions. Any new work must comply.

1. **No emojis in UI** — Use `lucide-react` icons only (16px, strokeWidth 1.5). Emojis were removed across the codebase and must not return.
2. **No discount language** — Never write "discount", "sale", "% off", or "free delivery" anywhere in the UI or emails. Box pricing variation is "special day pricing", never a "discount".
3. **Client price is always ignored on the backend** — Order prices are recalculated from the database on every order creation. The price submitted by the frontend is discarded. Do not change this behaviour.
4. **Admin JWT is completely separate from customer JWT** — Different secret (`ADMIN_JWT_SECRET`), different middleware (`adminAuth.js`), different expiry. Never share or merge these.
5. **PostgreSQL is the newsletter source of truth** — Not Resend. All subscribe/unsubscribe operations hit the `newsletter_subscribers` table. Resend is for delivery only.
6. **Newsletter unsubscribe requires no authentication** — `/v1/newsletter/unsubscribe?token=<base64email>` must remain fully public. This is a legal requirement.
7. **Email MX validation fails open** — A DNS timeout never blocks a real user. Only `ENOTFOUND`/`ENODATA` hard-fail. This is intentional — do not tighten it.
8. **Box Office is not in the All Cookies tab** — It lives only in Build Your Box. It is not a physical SKU.
9. **No border-radius on major CTA buttons** — Squared corners, Bugatti design influence. Minor admin actions may have subtle radius.
10. **The 60-30-10 colour rule** — 60% `#1A0A00` dark, 30% cream/warm surfaces, 10% `#B8752A` amber accent. Do not introduce new colours without explicit instruction.
11. **Webhook route bypasses time validation** — `/v1/webhooks/resend` is mounted before `validateTimeSync` middleware. This is correct — Resend requests do not send `X-Client-Time` headers.
12. **Never commit `.env`** — It is in `.gitignore`. Update Render directly via their Environment tab.

---

## Current State of Work

All backend infrastructure is complete and deployed. The frontend has a pending implementation.

### Completed (Do Not Redo)

- ✅ Full backend API (52+ source files, all routes, all middleware)
- ✅ Authentication (customer JWT + admin JWT, separate)
- ✅ Email system (Resend, verified domain `noreply@haiq.ug`)
- ✅ Email validation (MX records + disposable domain blocklist)
- ✅ Newsletter system (subscribe, unsubscribe, campaign send, delivery tracking)
- ✅ Resend webhook handler (auto-unsubscribe on bounce/complaint)
- ✅ Analytics dashboard (8 charts, professional hover states, lucide icons)
- ✅ Special days system (backend + admin UI + box pricing logic)
- ✅ Delivery zones (individual zone entries with prices)
- ✅ Time validation middleware (backend: `validateTimeSync`, `enforceTimeValidation`, `/v1/server-time` endpoint)
- ✅ Security audit (parameterised SQL, Zod validation, Helmet, CORS, rate limiting)
- ✅ Drinks category + Janlin product assignment
- ✅ All 13 database migrations applied

### Immediate Next Task — Frontend Time Synchronisation

The backend time validation is live. The frontend has not been wired up yet. This is the active work item.

**Three files to create/modify:**

#### CREATE: `frontend/src/utils/timeSync.js`
Client-side time sync utility. Functions needed:
- `getServerTime()` — fetches `GET /v1/server-time`, caches the result, returns a `Date`
- `calculateClockSkew()` — returns absolute difference in seconds between client time and cached server time
- `isTimeValid(toleranceSeconds)` — returns `true` if skew ≤ tolerance

Constants:
- `CLOCK_SKEW_TOLERANCE_SECONDS = 300` (5 minutes — warn user)
- `CRITICAL_SKEW_THRESHOLD = 3600` (1 hour — block order)

#### CREATE: `frontend/src/components/TimeWarning.jsx`
Warning banner component. Rules:
- Renders only when clock skew is between 300s and 3600s
- Uses HAIQ palette (amber warning tone, dark background)
- Message: "Your device time may be incorrect. Please sync your date and time settings to avoid issues at checkout."
- No emojis — use a lucide icon (`AlertTriangle` or `Clock`)
- Does not block user — advisory only at this stage

#### MODIFY: `frontend/src/pages/CheckoutPage.jsx`
At the moment the user clicks to submit the final order:
- Include `X-Client-Time: new Date().toISOString()` header on the order POST request
- Before submission, call `isTimeValid(300)` — if false AND skew > 3600, show an error and block the submit button
- Error message: "Your device time is too far off. Please correct your date and time settings, then try again."
- Provide a "Retry" button that re-fetches server time and rechecks

#### MODIFY: `frontend/src/pages/BuildYourBoxPage.jsx`
- On mount, call `getServerTime()` to warm the cache
- If skew > 300 seconds, render `<TimeWarning />`
- Do NOT block the add-to-cart action here — warning only

---

## Skill Usage — When to Invoke Each

These skills are available in this environment. Use them at the correct moment — do not skip them.

| Trigger | Skill to invoke |
|---|---|
| Before implementing any new feature or UI component | `anthropic-skills:brainstorming` |
| When you have a multi-step task and need a written plan before coding | `anthropic-skills:writing-plans` |
| When executing a written plan task by task in this session | `anthropic-skills:subagent-driven-development` |
| When you encounter any bug, unexpected behaviour, or test failure | `anthropic-skills:systematic-debugging` — find root cause BEFORE attempting any fix |
| Before claiming any fix or feature is "done" | `anthropic-skills:verification-before-completion` — run the actual verification, do not assert success |
| When starting feature work that should be isolated from main | `anthropic-skills:using-git-worktrees` |
| When implementation is complete and tests pass | `anthropic-skills:finishing-a-development-branch` |
| For UI component design decisions | `anthropic-skills:frontend-design` |
| When doing a security-sensitive change | `anthropic-skills:security-review` |
| After completing implementation, before merging | `code-review` skill |
| To confirm a change actually works in the running app | `verify` skill |

**Critical rule on debugging:** If something does not work, invoke `anthropic-skills:systematic-debugging` immediately. Do not attempt random fixes. The root cause must be identified before a solution is proposed. Three failed fix attempts without identifying root cause is a signal to stop and re-analyse the architecture.

---

## Working Methodology

### Before Writing Code
1. Read `HAIQ_PROJECT_MASTER_LOG.md` if you have not already
2. Read the specific files you are about to change
3. Understand what the file currently does before modifying it
4. If the task is multi-step, use `anthropic-skills:writing-plans` to produce a plan first

### While Writing Code
- Prefer editing specific files by name — never `git add -A` or `git add .`
- Parameterise all SQL (`$1`, `$2` placeholders — never string interpolation)
- Validate all new POST/PUT endpoints with Zod schemas in `backend/src/middleware/schemas.js`
- New admin routes require `requireStaff` or `requireSuperAdmin` middleware from `adminAuth.js`
- New public routes that send emails must apply `emailValidator.validateEmailDeliverability()`
- Never introduce a new colour not in the design system palette

### Committing
- Commit frequently — one logical change per commit
- Follow existing commit message format: `feat/fix/refactor/polish(scope): description`
- Push with `git push origin main` — Vercel and Render auto-deploy

### Claiming Completion
- Never say "done" or "working" without running verification
- Use `anthropic-skills:verification-before-completion` — evidence before assertions
- For backend: use `curl` against the live Render URL to verify endpoint responses
- For frontend: use the `verify` skill or manually confirm in the browser

---

## Key File Locations

```
backend/src/middleware/timeValidation.js    — Clock skew middleware (already built)
backend/src/middleware/schemas.js           — All Zod validation schemas
backend/src/middleware/adminAuth.js         — requireStaff / requireSuperAdmin
backend/src/utils/emailValidator.js         — MX + disposable domain check
backend/src/services/email.service.js       — All Resend email functions
backend/src/routes/index.js                 — Main router (webhook mounted here, before time validation)
backend/src/routes/webhooks/resend.webhook.js — Bounce/complaint auto-unsubscribe
backend/src/db/migrations/                  — 001–013 SQL migrations

frontend/src/pages/BuildYourBoxPage.jsx     — Box assembly + special day pricing (modify for time sync)
frontend/src/pages/CheckoutPage.jsx         — 4-step checkout (modify for X-Client-Time header)
frontend/src/utils/                         — Create timeSync.js here
frontend/src/components/                    — Create TimeWarning.jsx here

admin/src/pages/AnalyticsPage.jsx           — Full analytics dashboard (~900 lines)
admin/src/pages/NewsletterPage.jsx          — Subscriber list, campaign sender
```

---

## After Time Sync Frontend — What Comes Next

Once the time sync frontend work is complete, the remaining backlog in priority order is:

1. **Verify password reset email delivery** — trigger a reset on production, confirm the email arrives
2. **Special days end-to-end test** — create today as a special day in admin, confirm 40,000 price on BuildYourBoxPage, complete an order, verify DB stores 40,000
3. **MTN MoMo / Airtel production credentials** — blocked on the business obtaining live API keys from MTN Uganda and Airtel Uganda
4. **CI pipeline** — basic GitHub Actions workflow running lint on push to main

---

## How to Start a Work Session

```powershell
# Terminal 1 — Backend
cd "D:\Junior Reactive Projects\HAIQ\backend"
npm run dev

# Terminal 2 — Customer Frontend
cd "D:\Junior Reactive Projects\HAIQ\frontend"
npm run dev

# Terminal 3 — Admin Dashboard
cd "D:\Junior Reactive Projects\HAIQ\admin"
npm run dev
```

Verify backend is running: `curl https://haiq-api-9im4.onrender.com/v1/server-time`

Expected response:
```json
{ "server_time": "...", "timezone": "Africa/Kampala", "timezone_offset": "UTC+3" }
```

---

## How to Push Changes

```bash
cd "D:\Junior Reactive Projects\HAIQ"
git add backend/src/specific-file.js frontend/src/specific-file.jsx
git commit -m "feat(scope): description of what and why"
git push origin main
```

Vercel deploys both frontends automatically (~90 seconds).
Render deploys the backend automatically (~2–3 minutes).

---

*Read `HAIQ_PROJECT_MASTER_LOG.md` now if you have not already. That file has the full history. This file has your operating instructions. Together they are everything you need.*
