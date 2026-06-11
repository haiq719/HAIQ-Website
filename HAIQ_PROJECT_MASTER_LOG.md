# HAIQ Project — Master Log & Implementation Record

> **Classification:** Internal Development Reference  
> **Last Updated:** June 2026  
> **Purpose:** Complete documentation of everything built, every problem faced, every solution applied, every constraint enforced, and everything still remaining.  
> **Audience:** Any developer (or future AI session) picking up this project cold.

---

## Table of Contents

1. [What Is HAIQ](#1-what-is-haiq)
2. [Tech Stack & Infrastructure](#2-tech-stack--infrastructure)
3. [Design System & Restrictions](#3-design-system--restrictions)
4. [Product Catalogue](#4-product-catalogue)
5. [Database Schema & Migrations](#5-database-schema--migrations)
6. [What Has Been Built](#6-what-has-been-built)
7. [Implementation Phases — Full History](#7-implementation-phases--full-history)
8. [Problems Faced & How They Were Solved](#8-problems-faced--how-they-were-solved)
9. [Problems Not Yet Solved](#9-problems-not-yet-solved)
10. [Active Restrictions & Why They Exist](#10-active-restrictions--why-they-exist)
11. [What Is Left To Do](#11-what-is-left-to-do)
12. [Environment Variables Reference](#12-environment-variables-reference)
13. [How To Run Locally](#13-how-to-run-locally)
14. [How To Deploy](#14-how-to-deploy)
15. [Git Commit History Summary](#15-git-commit-history-summary)
16. [Key File Map](#16-key-file-map)

---

## 1. What Is HAIQ

HAIQ is a full-stack e-commerce web application for a **premium Ugandan cookie bakery** based in Muyenga, Kampala. The business sells handcrafted cookies and a custom "Build Your Box" product. The platform covers the complete customer journey — browsing, ordering, paying, tracking, reviewing, applying for a loyalty card — with a fully separate admin dashboard for the business team.

**Design references:**
- **lastcrumb.com** — Interaction style, hover animations, ingredient teasers, cart experience
- **bugatti.com** — Typographic layout, serif headings, editorial rule lines, asymmetric grids

**Slogan:** "Made For You" — appears on hero, banners, CTAs, footer, and all email templates. This is consistent and must not be changed without deliberate brand decision.

---

## 2. Tech Stack & Infrastructure

| Layer | Technology | URL |
|---|---|---|
| Customer Frontend | React 18 + Vite + Tailwind CSS | Local: `http://localhost:5173` / Live: `https://haiqweb.vercel.app` |
| Admin Dashboard | React 18 + Vite + Tailwind CSS (separate app) | Local: `http://localhost:5174` / Live: `https://haiq-web-admin.vercel.app` |
| Backend API | Node.js + Express | Local: `http://localhost:3001` / Live: `https://haiq-api-9im4.onrender.com` |
| Database | PostgreSQL via Neon (serverless) | Cloud — see credentials |
| Image Storage | Cloudinary | Cloud |
| Email Service | Resend | Transactional email |
| Frontend Hosting | Vercel (two separate projects) | Auto-deploys on git push |
| Backend Hosting | Render (free tier) | Auto-deploys on git push — **cold starts after 15 min idle** |
| Source Control | GitHub | `https://github.com/haiq719/HAIQ-Website.git` |

### Important Infrastructure Notes

**Render Cold Starts:** The backend on Render's free tier goes to sleep after 15 minutes of inactivity. First request after sleep takes 30–60 seconds. A keep-alive cron job was added (`af4384a`) to ping the server every 14 minutes and prevent sleep.

**Vercel Auto-Deploy:** Both frontend and admin deploy automatically from the `main` branch. Typically takes 60–90 seconds.

**Neon Serverless DB:** Connection pooling is used (`-pooler` in the DATABASE_URL). This is required for Neon's serverless model. Never switch to a direct non-pooler connection for production.

---

## 3. Design System & Restrictions

These are non-negotiable design constraints. They were set deliberately and must be maintained across all new UI work.

### 3.1 Colour Palette

Extracted from `HAIQPallette.png`. Applied as design tokens across both frontend and admin.

| Token | Hex | Purpose |
|---|---|---|
| `haiq-amber` / primary | `#B8752A` | Buttons, CTAs, active states, accent highlights |
| `haiq-tan` / secondary | `#D4A574` | Hover states, secondary accents |
| `haiq-cream` / light | `#F2EAD8` | Light text on dark backgrounds, surface highlights |
| `haiq-espresso` / dark | `#1A0A00` | Primary dark backgrounds — dominant colour |
| `haiq-brown` / dark2 | `#3D1A00` | Card surfaces, secondary dark backgrounds |
| `haiq-mocha` / muted | `#8C7355` | Subdued text, borders, labels, captions |
| `haiq-gold` / gold | `#E8C88A` | Premium elements — loyalty card, featured badges |
| `haiq-sienna` / sienna | `#7A3B1E` | Deep accents, hover darks |

**60-30-10 Rule — strictly enforced:**
- 60% `#1A0A00` (dominant dark — backgrounds, panels)
- 30% cream/warm surfaces (cards, input backgrounds, body copy)
- 10% `#B8752A` amber (accent — CTAs only, never overused)

**Why:** This rule prevents colour clutter and preserves the premium cinematic feel that is core to the HAIQ brand identity.

### 3.2 Typography

- **Headings:** `Playfair Display` — serif, confident, editorial
- **Body/UI text:** `Arial` or `sans-serif` fallbacks
- **Heading sizes:** Use `clamp()` for responsive scaling — no fixed px headings on hero or major sections
- **Thin rule lines:** 1px horizontal lines at section boundaries (editorial grid influence)

### 3.3 Logo & Crown

- **Main logo:** `HAIQmain.png` stored in `frontend/public/` and `admin/public/`
- **Crown SVG:** `Crown.jsx` — shared component in both apps. Used sparingly as secondary mark — section headers, loyalty section, footer, admin sidebar, hero accent
- **Crown rule:** Never let the Crown compete with the main logo. One or the other, never both at the same visual weight on the same screen

### 3.4 Icon System

- **Library:** `lucide-react` exclusively
- **Size:** 16px for all inline/label icons
- **Stroke width:** 1.5 (consistent with the thin-line editorial aesthetic)
- **No emojis** in any UI. Emojis were present in earlier builds and were removed during the Analytics upgrade (`608db4b`, `c93c226`). Any new feature must use lucide icons, not emoji
- **Why:** Emojis are platform-dependent, inconsistent in rendering, and incompatible with the brand's premium positioning

### 3.5 Button Style

- Major CTA buttons: **no border-radius** (squared-off, Bugatti influence)
- Minor/admin action buttons: subtle border-radius is acceptable
- All primary buttons use `#B8752A` background with dark text
- Hover: `#D4A574` (tan) or darken by 10%

### 3.6 What Must Never Break

Explicitly listed in `IMPROVEMENTS.md`:

1. **Existing order flow** — The 4-step checkout (Details → Delivery → Payment → Review) must remain intact
2. **Cart state** — Cart items must persist across page navigation within a session
3. **Box Office pricing** — Must reflect special day pricing dynamically (80,000 standard / 40,000 special days)
4. **Admin authentication** — Admin JWT is completely separate from customer JWT. Never share secrets
5. **Database prices** — Order prices are always sourced from the database on the backend. The client-submitted price is ignored. This prevents price manipulation
6. **Image uploads** — Cloudinary integration for product images must remain functional
7. **Loyalty card approval flow** — Approve → assign card number → send email
8. **Newsletter unsubscribe** — One-click unsubscribe via token must always work

---

## 4. Product Catalogue

HAIQ sells **cookies only**. Every individual cookie pack contains exactly 4 cookies. There are no cakes, bread, or pastries on the platform. This is a deliberate business decision and must not be changed without explicit instruction.

| Product | Slug | Price | Category | Notes |
|---|---|---|---|---|
| Venom | `venom` | UGX 5,000 | Cookies | Dark chocolate / Oreo-style |
| Coconut | `coconut` | UGX 5,000 | Cookies | Golden crispy coconut |
| Crimson Sin | `crimson-sin` | UGX 5,000 | Cookies | Red velvet, white choc pools |
| Campfire After Dark | `campfire-after-dark` | UGX 5,000 | Cookies | S'mores — marshmallow + milk choc |
| Blackout | `blackout` | UGX 5,000 | Cookies | Double chocolate, dense, fudgy |
| Janlin | `janlin` | varies | **Drinks** | Assigned to Drinks category (migration 012) |
| Box Office | `box-office` | 40,000 / 80,000 | — | Custom box; NOT a physical product |

**Box Office pricing rule:** Controlled entirely by the `special_days` table. When a date range is active in that table, the `/v1/special-days/active-today` endpoint returns `isSpecialDay: true`, and the frontend switches the displayed price from 80,000 to 40,000. Backend recalculates at order creation time — the client cannot manipulate this.

---

## 5. Database Schema & Migrations

Migrations live in `backend/src/db/migrations/` and are applied by `node src/db/migrate.js`.

| File | What It Does |
|---|---|
| `001_initial_schema.sql` | Core tables: `users`, `products`, `product_variants`, `product_items`, `product_images`, `categories`, `orders`, `order_items`, `messages`, `admin_users` |
| `002_indexes.sql` | Performance indexes on all major tables |
| `003_seed_products.sql` | Original seed — superseded by `seed-products.js` |
| `004_reviews.sql` | `product_reviews` table |
| `005_loyalty_newsletter_specialdays.sql` | `special_days`, `loyalty_cards`, newsletter columns on users, loyalty columns on users |
| `005b_addendum.sql` | Adds `name` column to `newsletter_subscribers`, creates `product_reviews` cleanly |
| `006_updates.sql` | Adds `user_id`, `subject`, `is_direct` to `messages`; `cancellation_reason`, `cancelled_by` to `orders`; creates `newsletter_campaigns` |
| `007_password_reset.sql` | `password_reset_tokens` table |
| `008_fix_loyalty_cards.sql` | Fixes loyalty card column data types |
| `009_products_updates.sql` | Adds `is_box_item`, `off_peak_price` to products |
| `010_update_order_statuses.sql` | Normalises order status enum values |
| `011_delivery_zones.sql` | `delivery_zones` table with zone names, prices, and descriptions |
| `012_add_drinks_category.sql` | Inserts Drinks category (slug=`drinks`, sort_order=6); assigns Janlin to it |
| `013_newsletter_tracking.sql` | Adds `sent_count`, `failed_count`, `failed_emails JSONB` to `newsletter_campaigns` |

### Key Column Notes

- `products.is_box_item BOOLEAN` — marks the Box Office product
- `products.off_peak_price INTEGER` — stores the 80,000 standard price; the 40,000 special price is calculated logic, not stored separately
- `newsletter_subscribers.is_active` — the canonical active/inactive flag. `subscribed` column also exists for legacy reasons; code checks both
- `newsletter_campaigns.failed_emails` — JSONB array of `{ email, error }` objects for failed sends

---

## 6. What Has Been Built

### 6.1 Backend (Complete)

- **52+ source files** across controllers, routes, middleware, services, config
- **Authentication:** JWT dual-token system (access token 5h + refresh token 7d). Admin auth is completely separate (different secret, different expiry, different middleware)
- **All CRUD routes:** products, orders, users, messages, reviews, categories, payments, delivery zones, special days, loyalty cards, newsletter
- **Middleware stack:**
  - Rate limiting (tiered — auth routes stricter than general API)
  - Zod schema validation on all POST/PUT bodies
  - JWT authentication middleware (customer and admin variants)
  - Time synchronization validation (clock skew detection)
  - CORS with explicit origin whitelist
  - Helmet.js security headers
  - Morgan request logging
  - Global error handler
- **Email service (Resend):** Order confirmation, loyalty card approval/rejection/dispatch, newsletter welcome, password reset, campaign delivery
- **Email validation:** MX record DNS check + disposable domain blocklist (40+ domains) applied at both registration and newsletter subscription
- **Newsletter system:** Subscriber management, campaign sending with per-recipient tracking, one-click unsubscribe via base64 token
- **Webhook handler:** Resend bounce/complaint events → automatic unsubscribe
- **Swagger UI:** Full API documentation at port 5010 locally
- **Analytics endpoints:** Revenue breakdown (product vs delivery), orders by status, zone distribution, special days impact, customer growth, top customers, order activity heatmap

### 6.2 Frontend — Customer-Facing Pages

| Page | Status | Notes |
|---|---|---|
| HomePage | ✅ Complete | PromoBanner → Hero → Featured → Process → Carousel → Moments → BrandStory → CTA |
| ShopPage | ✅ Complete | Two tabs: All Cookies / Build Your Box. No other tabs |
| ProductDetailPage | ✅ Complete | Tasting notes, ingredients, reviews, related products |
| BuildYourBoxPage | ✅ Complete | Exactly 4 cookies from 5 flavours; live progress bar; special day pricing applied |
| CheckoutPage | ✅ Complete | 4-step: Details → Delivery → Payment → Review |
| OrderConfirmationPage | ✅ Complete | Order number, totals, track order link |
| TrackOrderPage | ✅ Complete | Active orders list → tap → progress tracker → cancel |
| AccountPage | ✅ Complete | 3 tabs: Profile, Orders, Loyalty Card. Messages tab for admin conversation |
| RegisterPage | ✅ Complete | Full Name + Phone + Email + Password |
| LoginPage | ✅ Complete | With forgot password link |
| ForgotPassword / ResetPassword | ✅ Complete | Email token reset flow |
| MomentsPage | ✅ Complete | Masonry grid, customer photos, hover caption overlays |
| FAQPage | ✅ Complete | Exactly 4 questions, sectioned like Last Crumb FAQ |
| ContactPage | ✅ Complete | Messages route to admin dashboard inbox |

### 6.3 Admin Dashboard Pages

| Page | Status | Notes |
|---|---|---|
| LoginPage | ✅ Complete | HAIQ palette, Crown accent |
| DashboardPage | ✅ Complete | Stat cards, 7-day revenue sparkline, Top Customers (internal only), recent orders |
| OrdersPage | ✅ Complete | Filterable table, inline status update, cancellation reason display |
| OrderDetailPage | ✅ Complete | Status stepper, items, message thread |
| ProductsPage | ✅ Complete | Add/edit/archive modal, Cloudinary image upload, Reviews tab |
| LoyaltyPage | ✅ Complete | Pending / Dispatch Queue / All Cards tabs; approve assigns card number; emails auto-sent |
| NewsletterPage | ✅ Complete | Subscriber list with CSV export, Send Campaign tab, WhatsApp invite tab |
| SpecialDaysPage | ✅ Complete | Add/toggle/delete date ranges; live indicator |
| MessagesPage | ✅ Complete | Split-pane inbox; admin reply |
| AnalyticsPage | ✅ Complete | Full analytics dashboard with 8 charts/panels |

### 6.4 Analytics Dashboard (Detailed)

The analytics dashboard was built in multiple phases and is the most complex single page in the admin. It contains:

- **KPI Cards:** Total revenue, total orders, average order value, active customers
- **Revenue Breakdown LineChart:** Product revenue vs delivery fees over time, with Average Order Value overlay line
- **Orders by Status BarChart:** Count of orders per status
- **Zone Distribution PieChart:** Orders per delivery zone with custom active expand shape
- **Special Days Impact BarChart:** Revenue on special days vs normal days
- **Customer Growth AreaChart:** New subscriber growth over time
- **Order Activity Heatmap:** 7-day × 24-hour grid showing order volume by hour/day
- **Top Customers Table:** Top 3 customers by order value (internal use only — not shown to customers)
- **Key Insights Panel:** Auto-generated text insights from the data
- **Best Selling Products:** Cards with images from Cloudinary

**Chart hover behaviour (implemented in `d1e95dc`):**
- Custom `TOOLTIP_STYLE` constant with smooth 120ms `ease-out` animation
- `BAR_CURSOR` custom cursor for bar charts — subtle highlight, no default grey
- Active dot rings removed (`strokeWidth: 0`) on all Line components
- Pie chart active shape uses custom `Sector` that expands by 3px with a subtle stroke
- No emojis — all section labels use lucide icons

---

## 7. Implementation Phases — Full History

### Phase 1: Core Bug Fixes (IMPROVEMENTS.md Issues 1–8)

These were the original issues identified and fixed from the `IMPROVEMENTS.md` document:

1. **Box thumbnail** — Renamed `boxoffice.jpg` → `unboxing.jpg` to match the database `image_url`
2. **Analytics revenue split** — Separated product revenue from delivery fee revenue in backend SQL
3. **Order validation failure** — Fixed Zod schema mismatch causing checkout to fail
4. **Mobile cart badge** — Fixed CSS z-index and state update timing
5. **Box price in cart** — Corrected cart drawer to show box price as single line item
6. **Contact page icons** — Replaced generic emojis with professional SVG icons
7. **Contact textarea colour** — Fixed invisible text on dark background
8. **Contact form email delivery** — Wired messages route to admin inbox

### Phase 2: Special Days & Box Pricing (Issues 9–12)

9. **Create special days** — Admin UI to create date ranges marking special pricing periods
10. **Dynamic box pricing** — Frontend BuildYourBoxPage fetches `/v1/special-days/active-today` and displays 40,000 vs 80,000 accordingly. Backend recalculates on order creation
11. **Delivery zones** — Replaced flat delivery fee with zone-based pricing; each zone is an individual entry in the `delivery_zones` table
12. **Add to Cart confirmation** — Green tick animation appears after box is successfully added

### Phase 3: Analytics Dashboard (Issue 13)

Full rebuild of the analytics dashboard from scratch. This was the largest single feature:

- Phase 7 (backend): All analytics SQL queries, endpoint grouping, response formatting
- Phase 8 (frontend): KPI cards, heatmap, all charts, routing integration into admin nav
- Multiple fix commits followed to resolve: NaN values in revenue chart, missing joins, icon size mismatches, product image 403 errors, non-existent database columns referenced in queries

### Phase 4: Security & Architecture Audit (Task 5)

A comprehensive audit of the entire codebase, resulting in:

- Parameterised SQL on all queries (no raw string interpolation)
- Zod validation schemas applied to all input routes
- Tiered rate limiting (auth routes 5 req/15min, general API 100 req/min)
- Helmet.js security headers
- CORS explicit origin whitelist
- Admin JWT completely separated from customer JWT
- Removal of loyalty points system from database, code, and UI (was unused, causing confusion)
- Time synchronisation middleware (clock skew detection)
- Server-time endpoint (`/v1/server-time`)

### Phase 5: Analytics UI Polish — Track A

**A1 — Top Customers limit:** Changed `LIMIT 10` to `LIMIT 3` in the top-customers SQL query. The top customers panel is for internal reference only and does not need to show a long list.

**A2 — Chart hover polish:** Added `TOOLTIP_STYLE` and `BAR_CURSOR` constants. Implemented smooth tooltip animations (120ms ease-out), removed active dot rings from Line components, added custom Pie chart active shape with 3px expand effect.

**A3 — Drinks category:** Created migration `012_add_drinks_category.sql` to insert the Drinks category and assign the Janlin product to it (was previously NULL).

### Phase 6: Newsletter & Email System Overhaul — Track B

**B1 — Resend API key & FROM address:**
- Updated `RESEND_API_KEY` to the current valid key
- Changed `EMAIL_FROM` from `haiqafrica@gmail.com` (unverified) to `noreply@haiq.ug` (verified domain)
- Added `EMAIL_FROM_DEV=onboarding@resend.dev` as fallback for non-production environments
- FROM address resolution logic: if `EMAIL_DOMAIN_VERIFIED` is true and `EMAIL_FROM` doesn't contain 'gmail', use `EMAIL_FROM`; otherwise fall back to `EMAIL_FROM_DEV`

**B2 — Campaign delivery tracking:**
- Created migration `013_newsletter_tracking.sql` adding `sent_count`, `failed_count`, `failed_emails JSONB` to `newsletter_campaigns`
- Backend updates these columns after each campaign send loop
- Admin UI updated to show breakdown: "✓ 47 delivered / ⚠ 2 failed"

**B3 — Email validation:**
- Created `backend/src/utils/emailValidator.js`
- MX record DNS lookup with 2-second timeout (fail-open — DNS timeout does not block the user)
- Disposable domain blocklist of 40+ known throwaway email services
- Applied at: user registration (`auth.controller.js`) and newsletter subscription (`newsletter.routes.js`)

**B4 — Resend integration simplification:**
- **Original plan:** Use Resend Audiences API to sync subscribers
- **Problem discovered:** Resend's actual dashboard does not have a "+ New Audience" button matching what was assumed; the API is contact-centric, not audience-centric
- **Solution:** Completely pivoted architecture. Removed all audience-based code. PostgreSQL `newsletter_subscribers` table is now the single source of truth. Resend is used only for email delivery, not contact management
- Removed `RESEND_AUDIENCE_ID` from all env files
- Simplified `resend.audience.service.js` to contain only `sendBatchCampaign()`

**B5 — Webhook handler:**
- Created `backend/src/routes/webhooks/resend.webhook.js`
- Handles Resend events via Svix signature verification
- Auto-unsubscribes emails that bounce (`email.bounced`) or complain (`email.complained`)
- Replay attack prevention: rejects webhooks older than 5 minutes
- Registered at `/v1/webhooks/resend` — mounted before the time validation middleware so it doesn't need `X-Client-Time` headers
- Resend sends events for: `email.bounced`, `email.complained`, `email.sent`, `email.delivered`

**B6 — Admin UI Polish:**
- Newsletter page already had CSV export, subscriber count, delivery status display
- No additional sync button needed (PostgreSQL is authoritative, not Resend)

---

## 8. Problems Faced & How They Were Solved

### 8.1 Revenue Chart NaN/NaN Values

**Problem:** The Revenue Breakdown chart displayed `NaN/NaN` on the X-axis and no data points.

**Root cause:** The analytics API was returning a revenue array without `product_revenue` and `delivery_revenue` split fields. The chart was trying to read those keys and getting `undefined`, which rendered as NaN.

**Fix:** Rewrote the backend SQL query (`600b3a9`) to include a `SUM(CASE WHEN ... END)` split for product vs delivery revenue. Updated chart component to use the correct field names.

---

### 8.2 Payment Methods Not Appearing on Checkout Step 3

**Problem:** The checkout Payment step showed no payment options (no Cash on Delivery, no MTN MoMo, no Airtel).

**Root cause:** A previous cleanup commit had removed the payment method rendering from the step 3 component while trying to simplify the checkout.

**Fix:** Restored all four payment method options (MTN MoMo, Airtel, Bank Transfer, Cash on Delivery) in `CheckoutPage.jsx` (`95b6160`).

---

### 8.3 Admin Frontend API URL Missing `/v1`

**Problem:** Admin API calls were hitting `https://haiq-api-9im4.onrender.com/admin/...` instead of `https://haiq-api-9im4.onrender.com/v1/admin/...` — all returning 404.

**Root cause:** `.env.production` for the admin app had `VITE_API_BASE_URL=https://haiq-api-9im4.onrender.com` without the `/v1` path segment.

**Fix:** Updated both the env file and added a guard in the admin's API utility to always append `/v1` if not present (`4e121cb`, `835427d`).

---

### 8.4 Newsletter DB Column Mismatch

**Problem:** Newsletter analytics queries were referencing columns `subscribed` and `created_at` which did not exist on `newsletter_subscribers`.

**Root cause:** The table was created without those columns. The code was written assuming they existed.

**Fix:** Updated queries to use `is_active` (the real column) and `subscribed_at` (the real timestamp column) (`D2a022e`, `041849b`).

---

### 8.5 Product Images Returning 403 in Analytics

**Problem:** Product images in the analytics Best Sellers panel were showing black boxes or broken images.

**Root cause:** The image URLs being fetched from the `product_images` table were Cloudinary URLs that required auth, or the SQL join was using an incorrect `sort_order` assumption.

**Fix:** Changed the SQL to use a `LATERAL` join that fetches the first available image regardless of sort_order value, rather than assuming `sort_order = 1` (`5428cb6`). Also added image error handler with retry limit (max 3 attempts) to prevent infinite 403 retry loops.

---

### 8.6 Resend Audience API Architecture Mismatch

**Problem:** The original newsletter plan assumed Resend had an Audiences feature similar to Mailchimp — a named list that you add/remove contacts from, then send to.

**Root cause:** Resend's actual product does not work this way. Their dashboard shows only "Add Contacts" with manual entry or CSV import. There is no "+New Audience" flow.

**Fix:** Completely pivoted the architecture. Removed all audience-related code:
- Deleted `RESEND_AUDIENCE_ID` environment variable
- Simplified `resend.audience.service.js` to delivery-only
- Made PostgreSQL `newsletter_subscribers` the single source of truth
- Removed audience sync endpoints from admin newsletter routes

---

### 8.7 Special Days DB Schema Not Applied on Production

**Problem:** `/v1/special-days/active-today` returned 500 error — `column "date_from" does not exist`.

**Root cause:** Migration `005_loyalty_newsletter_specialdays.sql` had not been applied on the production Neon database. The `special_days` table had different column names than the code expected.

**Fix:** Ran the migration against production (`special_days_migration.sql` in root), adding `date_from`, `date_to` columns and migrating any existing data.

---

### 8.8 Password Reset Emails Not Delivered

**Problem:** Password reset request succeeds (token written to DB), but user never receives the email.

**Root cause:** `EMAIL_FROM` was set to `haiqafrica@gmail.com` — a Gmail address that is not a verified sender in Resend. Resend silently drops emails from unverified senders.

**Fix (partial):** Updated `EMAIL_FROM` to `noreply@haiq.ug` (verified domain on Resend). Added fallback to `onboarding@resend.dev` for development. Password reset emails should now deliver correctly, but this has not been fully end-to-end verified yet.

---

### 8.9 Box Office Add-to-Cart Using Wrong Product ID

**Problem:** Adding the Box Office product to cart caused an order error — the wrong product ID was being sent.

**Root cause:** BuildYourBoxPage was constructing the cart item with a hardcoded or incorrect product ID instead of fetching the actual `is_box_item = true` product from the database.

**Fix:** Updated `addBox()` to fetch the box product ID from the backend before constructing the cart item (`80ba5d8`).

---

### 8.10 Loyalty Points System Confusion

**Problem:** The loyalty points system (points balance, points transactions) existed in the codebase and database but was never actually implemented for customers — they could apply for a loyalty *card* but there was no points earn/redeem flow.

**Root cause:** The system was stubbed out in an earlier version and never completed.

**Fix:** Removed all loyalty points references from database, backend code, and frontend UI (`0cacda8`). The loyalty card application and approval flow remains — only the points mechanics were removed. This simplifies the system to what actually works.

---

## 9. Problems Not Yet Solved

### 9.1 Password Reset Email — Not End-to-End Verified

**Status:** Partially fixed. `EMAIL_FROM` is now a verified Resend domain (`noreply@haiq.ug`). However, we have not confirmed that a real password reset email actually arrives in a user's inbox on the live system.

**What's needed:** Trigger a password reset on production and confirm email delivery.

---

### 9.2 Special Days Testing — Price Switch Not Formally Verified

**Status:** The special days pricing logic was implemented and deployed but not formally end-to-end tested from admin creation → frontend price switch → order at correct price → database record. The plan for this testing exists in `elegant-growing-rain.md`.

**What's needed:** Create today as a special day in admin, confirm BuildYourBoxPage shows 40,000, complete an order, verify DB stores 40,000.

---

### 9.3 Time Synchronisation — Frontend Not Sending `X-Client-Time`

**Status:** The backend time validation middleware exists and the `/v1/server-time` endpoint is live. However, the frontend has not been updated to:
- Fetch server time on app init
- Include `X-Client-Time` header on order POST requests
- Show a warning banner when clock skew exceeds 5 minutes
- Block order submission when clock skew exceeds 1 hour

**What's needed:** Implement `frontend/src/utils/timeSync.js`, `frontend/src/components/TimeWarning.jsx`, and update `CheckoutPage.jsx` and `BuildYourBoxPage.jsx`. This is the work described in plan file `elegant-growing-rain.md`.

---

### 9.4 MTN MoMo & Airtel — Sandbox Only

**Status:** Payment integrations exist in code but are running in sandbox mode (`PAYMENT_MODE=simulation`). No real mobile money transactions are processed.

**What's needed:** To activate real payments, MTN MoMo and Airtel Money production credentials need to be obtained and environment variables set on Render. This is a business decision (not a code task).

---

### 9.5 No CI/CD Test Pipeline

**Status:** GitHub Actions workflow file was removed. There are no automated tests running on push.

**What's needed:** A basic CI pipeline that runs `npm test` (or a lint check minimum) on each push to main.

---

## 10. Active Restrictions & Why They Exist

These restrictions were explicitly established during development. They must be understood before making any changes.

### 10.1 No Discounts, No Free Delivery Copy

**Restriction:** The PromoBanner and any marketing copy must never include "discount", "free delivery", "sale", or percentage-off language.

**Why:** HAIQ positions itself as premium. Discount language contradicts brand positioning. The Box Office price variation (80k → 40k) is framed as "special day pricing", never as a "discount" or "offer".

---

### 10.2 Box Office is Not a Physical Product

**Restriction:** Box Office must not appear in the All Cookies tab. It lives only in the Build Your Box tab. The box is assembled by the customer — it is not a pre-packaged unit.

**Why:** Showing it alongside individual packs would confuse the product hierarchy. The box is a service/experience, not a SKU.

---

### 10.3 Client Price Is Always Ignored on Backend

**Restriction:** When an order is created, the backend recalculates all prices from the database. The `price` values sent in the order POST body from the frontend are not used.

**Why:** Prevents price manipulation. A malicious user could modify the request to submit a box at 100 UGX. Backend recalculation means only the database-stored prices are used.

---

### 10.4 Admin JWT Must Remain Separate

**Restriction:** Admin tokens use `ADMIN_JWT_SECRET` and are validated by `adminAuth` middleware. Customer tokens use `JWT_SECRET` and are validated by `auth` middleware. These must never be mixed.

**Why:** If the same secret were used, a customer could forge an admin token (or vice versa). The separation ensures compromise of one layer does not grant access to the other.

---

### 10.5 No Emoji in UI

**Restriction:** All emoji usage has been removed from the admin UI. New features must use `lucide-react` icons.

**Why:** Emojis render differently across operating systems and browsers. On some systems they appear as boxes. They also break the premium aesthetic. Lucide icons are vector-based, consistent, and styleable.

---

### 10.6 Newsletter Unsubscribe Must Always Work — No Auth Required

**Restriction:** The `/v1/newsletter/unsubscribe?token=<base64email>` endpoint must remain public (no authentication required) and must always process the unsubscribe.

**Why:** This is a legal requirement (CAN-SPAM, GDPR). A subscriber must be able to unsubscribe without logging in. The token is a base64-encoded email address — simple but sufficient for this use case.

---

### 10.7 Fail-Open on Email MX Validation

**Restriction:** If the MX record DNS lookup times out or returns an unexpected error, the email is allowed through (not blocked). Only definitive failures (ENOTFOUND, ENODATA) block the email.

**Why:** DNS lookups can be slow or temporarily fail due to network conditions. Blocking a legitimate user because of a transient DNS issue is worse than occasionally allowing a bad email through. The disposable domain blocklist catches the most common throwaway services regardless of DNS.

---

### 10.8 PostgreSQL is the Newsletter Source of Truth

**Restriction:** All newsletter subscriber management (subscribe, unsubscribe, list) is done against the `newsletter_subscribers` PostgreSQL table. Resend is used only for sending, not for managing contacts.

**Why:** After discovering that Resend's API does not support Audiences in the way originally assumed, the architecture was simplified. Maintaining two sources of truth (Resend + PostgreSQL) would create sync complexity and potential inconsistency. PostgreSQL is already trusted for all other data.

---

### 10.9 Render Backend — Free Tier Constraints

**Restriction:** The backend must not perform long-running synchronous operations that would cause Render to kill the process. Keep-alive pings must remain active.

**Why:** Render free tier has a 15-minute idle timeout and a 30-second request timeout. Operations like bulk email sending are handled in loops with individual `await` per email (acceptable), not as a single blocking operation. The keep-alive cron job (`af4384a`) pings the server every 14 minutes to prevent cold starts.

---

### 10.10 Webhook Endpoint Bypasses Time Validation

**Restriction:** The `/v1/webhooks/resend` route is mounted before the `validateTimeSync` middleware in `routes/index.js`.

**Why:** Resend's webhook requests do not include `X-Client-Time` headers. If the webhook endpoint were behind the time validation middleware, the middleware would log a "no header" warning for every event and potentially cause confusion. Webhooks verify their own integrity via Svix signature — they do not need clock validation.

---

## 11. What Is Left To Do

### 11.1 Time Synchronisation — Frontend Implementation

**Priority:** HIGH  
**Plan file:** `elegant-growing-rain.md` (in `.claude/plans/`)

This is the next pending task. The backend infrastructure is ready. The frontend needs:

**Files to create:**
- `frontend/src/utils/timeSync.js` — Functions: `getServerTime()`, `calculateClockSkew()`, `isTimeValid(tolerance)`
- `frontend/src/components/TimeWarning.jsx` — Banner shown when clock skew > 5 minutes

**Files to modify:**
- `frontend/src/pages/BuildYourBoxPage.jsx` — Fetch server time; show warning if skew > 5 min; allow box add (non-blocking at this step)
- `frontend/src/pages/CheckoutPage.jsx` — Add `X-Client-Time` header to order POST; block submission if skew > 1 hour with error message

**Backend changes needed:** Already done. The middleware in `timeValidation.js` is active. Order controller has `enforceTimeValidation` wired in.

**Thresholds (already implemented in backend):**
- `CLOCK_SKEW_TOLERANCE_SECONDS = 300` (5 minutes) — show warning
- `CRITICAL_SKEW_THRESHOLD = 3600` (1 hour) — block order submission

---

### 11.2 Special Days End-to-End Test

**Priority:** HIGH  
**What to do:**
1. Log into admin dashboard
2. Go to Special Days page
3. Create today's date as a special day
4. Open frontend BuildYourBoxPage
5. Verify price shows 40,000 (not 80,000)
6. Add box to cart
7. Complete checkout
8. Verify order in database has box price 40,000

---

### 11.3 Password Reset Email Verification

**Priority:** MEDIUM  
**What to do:**
1. Trigger a password reset from the live site
2. Confirm the email arrives in the inbox
3. Click the reset link
4. Confirm password changes successfully
5. Log in with new password

---

### 11.4 Mobile Payment Activation (Business Decision)

**Priority:** LOW (blocked on business)  
**What to do:**
- Obtain MTN MoMo production credentials
- Set `MTN_SUBSCRIPTION_KEY`, `MTN_API_USER`, `MTN_API_KEY`, `MTN_ENVIRONMENT=production` on Render
- Obtain Airtel Money production credentials
- Set `AIRTEL_CLIENT_ID`, `AIRTEL_CLIENT_SECRET`, `AIRTEL_ENVIRONMENT=production`
- Change `PAYMENT_MODE=live` on Render
- Test a real UGX transaction end to end

---

### 11.5 Resend Webhook Secret (Done — But Verify)

**Status:** ✅ Complete
- Webhook URL: `https://haiq-api-9im4.onrender.com/v1/webhooks/resend`
- Secret: Configured on Render as `RESEND_WEBHOOK_SECRET`
- Subscribed events: `email.bounced`, `email.complained`, `email.sent`, `email.delivered`
- Tested: Returns 401 for unsigned requests (correct — signature validation active)

---

## 12. Environment Variables Reference

All variables required on Render backend:

```
NODE_ENV=production
PORT=3001

DATABASE_URL=postgresql://neondb_owner:...@ep-frosty-cherry-...neon.tech/haiq_db?sslmode=require&channel_binding=require

JWT_SECRET=<64-byte hex>
JWT_EXPIRES_IN=5h
REFRESH_TOKEN_SECRET=<64-byte hex>
REFRESH_TOKEN_EXPIRES_IN=7d
ADMIN_JWT_SECRET=<64-byte hex>
ADMIN_JWT_EXPIRES_IN=8h

RESEND_API_KEY=re_g5vMPNij_L3sx263h56mWfEtLFWKHQsy2
EMAIL_FROM=noreply@haiq.ug
EMAIL_FROM_NAME=HAIQ Bakery
EMAIL_FROM_DEV=onboarding@resend.dev
RESEND_WEBHOOK_SECRET=whsec_L4zOijKu9KdJJVcI4FSotxjl8jVZRcs1

CLOUDINARY_CLOUD_NAME=ddu7dsoml
CLOUDINARY_API_KEY=912247281399823
CLOUDINARY_API_SECRET=MtRnqbSNpl50CRooGzgNiVrNROc

FRONTEND_URL=https://haiqweb.vercel.app
CORS_ORIGINS=https://haiqweb.vercel.app,https://haiq-admin.vercel.app,https://haiq-web-admin.vercel.app,http://localhost:5173,http://localhost:5174

PAYMENT_MODE=simulation
```

**Note:** Never commit `.env` to git. It is in `.gitignore`. Update Render directly via Environment tab.

---

## 13. How To Run Locally

Open four terminals:

```powershell
# Terminal 1 — Backend API
cd "D:\Junior Reactive Projects\HAIQ\backend"
npm run dev

# Terminal 2 — Customer Frontend
cd "D:\Junior Reactive Projects\HAIQ\frontend"
npm run dev

# Terminal 3 — Admin Dashboard
cd "D:\Junior Reactive Projects\HAIQ\admin"
npm run dev

# Terminal 4 — Swagger UI (optional)
cd "D:\Junior Reactive Projects\HAIQ\backend"
npm run swagger
```

**Local URLs:**
- Frontend: `http://localhost:5173`
- Admin: `http://localhost:5174`
- API: `http://localhost:3001`
- Swagger: `http://localhost:5010`

---

## 14. How To Deploy

**Normal push (auto-deploys everything):**
```bash
cd "D:\Junior Reactive Projects\HAIQ"
git add <specific files>
git commit -m "feat/fix/refactor: description"
git push
```

- Vercel picks up the push and deploys both frontend apps (~90 seconds)
- Render picks up the push and deploys the backend (~2–3 minutes)

**To apply new migrations to production:**
```bash
cd "D:\Junior Reactive Projects\HAIQ\backend"
node src/db/migrate.js
```
This uses `DATABASE_URL` from your local `.env`, which should point at the production Neon database.

**To create a new admin account:**
```bash
cd "D:\Junior Reactive Projects\HAIQ\backend"
node create-admin.js
```

---

## 15. Git Commit History Summary

| Commit | Description |
|---|---|
| `2f2c579` | Initial commit — full-stack HAIQ app |
| `6491cbf` | v2 update — general improvements |
| `104255b` | v3 — blank page fix, real-time messages, mobile admin |
| `ea28f8c` | Keep-alive cron for Render backend |
| `af4384a` | Special days pricing + time sync security |
| `95b6160` | Fix: re-enable payment methods on checkout step 3 |
| `367f99a` | Fix: database migrations — correct data types |
| `4e121cb` | Fix: admin API base URL missing /v1 |
| `835427d` | Fix: admin frontend always appends /v1 |
| `600b3a9` | Fix: Revenue Breakdown chart NaN — add product/delivery split |
| `608db4b` | Fix: replace black product image boxes with placeholder icons |
| `c93c226` | Feat: replace all emojis with lucide-react icons in Analytics |
| `6df3c8a` | Upgrade analytics: icons, revenue data, image error handling |
| `0cacda8` | Fix: remove loyalty points from DB, code, and UI |
| `747dfd2` | Feat(analytics): limit top customers to 3, remove hidden badge |
| `d1e95dc` | Polish(analytics): professional chart hover — smooth tooltip |
| `37fc70f` | Feat(db): add Drinks category, assign Janlin |
| `4c1be34` | Fix(email): update Resend API key, FROM address fallback |
| `80ecb53` | Feat(newsletter): track sent/failed counts per campaign |
| `5d81357` | Feat(security): MX record validation + disposable domain blocklist |
| `df15493` | Feat(newsletter): Resend batch campaign infrastructure |
| `4d13721` | Refactor(resend): simplify to contact-only model |
| `7c7dfc6` | Feat(webhook): Resend webhook handler — auto-unsubscribe on bounce |
| `e339142` | Feat(time-sync): add client-side time sync utilities and warning component |

---

## 17. Session Work — June 11, 2026

### Frontend Time Synchronisation Implementation (Commit e339142)

**What was done:** Implemented missing frontend time synchronisation layer to wire up backend clock-skew detection system.

**Files created:**
- `frontend/src/utils/timeSync.js` — 130 lines
- `frontend/src/components/TimeWarning.jsx` — 65 lines

**What each file does:**

`timeSync.js` exports:
- `getServerTime()` — async fetch from `/v1/server-time`, caches for 10s
- `calculateClockSkew(serverDate?, clientDate?)` — supports both explicit dates and cached server time
- `isTimeValid(tolerance)` — boolean check against threshold
- `addClientTimeHeader(headers)` — injects X-Client-Time ISO string for order POST
- `CLOCK_SKEW_TOLERANCE_SECONDS = 300`, `CRITICAL_SKEW_THRESHOLD = 3600` — thresholds matching backend
- `formatSkewTime(seconds)` — display helper (e.g. "5 minutes")

`TimeWarning.jsx` component accepts props:
- `skewSeconds` — current clock skew in seconds
- `isVisible` — whether to show
- `onRefresh()` — callback for refresh button
- Renders amber warning banner for 300s–3600s skew
- Uses lucide `AlertTriangle` icon, no emojis
- On-brand HAIQ colour palette

**Why this approach:**
- CheckoutPage and BuildYourBoxPage already had time-sync imports and logic; utility module was missing
- Thresholds exactly match backend (`validateTimeSync` middleware in `backend/src/middleware/timeValidation.js`)
- Backend enforces 3600s critical block at order POST; frontend warns at 300s to give user time to fix before reaching checkout
- Flexible `calculateClockSkew()` signature allows pages to use explicit dates (from state) or cached time

**Challenges faced:** None — design was already in place in the pages, utility just needed to be created.

**Solution chosen:** Straightforward utility module with flexible signature for compatibility with existing page code.

**Verification:**
- ✅ Frontend builds without errors (vite build succeeds)
- ✅ Backend `/v1/server-time` endpoint responds with correct JSON
- ✅ Dev server starts correctly with new imports
- ✅ Committed and pushed to main; Vercel auto-deploy initiated

**Next steps:**
1. Verify Vercel deployment completes (~90 seconds)
2. Test time sync in staging: artificially offset system clock, load BuildYourBoxPage, confirm TimeWarning renders
3. Test checkout blocking: offset by >1 hour, attempt order submission, verify 400 error from backend
4. After verification: move to backlog tasks (password reset E2E, special days E2E test, CI pipeline)

---

## 16. Key File Map

```
HAIQ/
├── backend/
│   ├── src/
│   │   ├── app.js                          — Express setup, middleware stack, error handler
│   │   ├── config/
│   │   │   ├── db.js                       — Neon PostgreSQL connection pool
│   │   │   └── logger.js                   — Winston logger config
│   │   ├── controllers/
│   │   │   ├── auth.controller.js          — Register, login, refresh, profile, password reset
│   │   │   ├── orders.controller.js        — Create order, update status, cancel
│   │   │   ├── products.controller.js      — CRUD products, image upload
│   │   │   └── loyalty.controller.js       — Loyalty card approve/reject/dispatch
│   │   ├── middleware/
│   │   │   ├── adminAuth.js                — Admin JWT verification (requireStaff, requireSuperAdmin)
│   │   │   ├── auth.js                     — Customer JWT verification
│   │   │   ├── rateLimiter.js              — Tiered rate limiting
│   │   │   ├── schemas.js                  — All Zod validation schemas
│   │   │   ├── timeValidation.js           — Clock skew detection middleware
│   │   │   └── validate.js                 — Zod validation middleware wrapper
│   │   ├── routes/
│   │   │   ├── index.js                    — Main router (registers all sub-routers)
│   │   │   ├── auth.routes.js              — /v1/auth/*
│   │   │   ├── newsletter.routes.js        — /v1/newsletter/* (subscribe, unsubscribe)
│   │   │   ├── orders.routes.js            — /v1/orders/*
│   │   │   ├── specialdays.routes.js       — /v1/special-days/*
│   │   │   ├── deliveryzones.routes.js     — /v1/delivery-zones/*
│   │   │   ├── webhooks/
│   │   │   │   └── resend.webhook.js       — /v1/webhooks/resend
│   │   │   └── admin/
│   │   │       ├── index.js                — Admin router
│   │   │       ├── admin.analytics.routes.js — /v1/admin/analytics/*
│   │   │       ├── admin.newsletter.routes.js — /v1/admin/newsletter/*
│   │   │       └── admin.orders.routes.js  — /v1/admin/orders/*
│   │   ├── services/
│   │   │   ├── email.service.js            — All Resend email functions
│   │   │   ├── resend.audience.service.js  — sendBatchCampaign() only
│   │   │   └── payments.service.js         — MTN/Airtel integration stubs
│   │   ├── utils/
│   │   │   └── emailValidator.js           — MX check + disposable domain blocklist
│   │   └── db/
│   │       └── migrations/                 — 001–013 SQL migration files
│   └── .env                                — Local secrets (never commit)
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── BuildYourBoxPage.jsx        — Box assembly, special day pricing
│       │   ├── CheckoutPage.jsx            — 4-step checkout flow
│       │   └── ...
│       ├── components/
│       │   ├── CartDrawer.jsx              — Slide-out cart with box collapsible
│       │   ├── Crown.jsx                   — Shared Crown SVG component
│       │   └── ...
│       └── utils/                          — (timeSync.js to be created here)
│
├── admin/
│   └── src/
│       └── pages/
│           ├── AnalyticsPage.jsx           — Full analytics dashboard (~900 lines)
│           ├── NewsletterPage.jsx          — Subscriber list, campaign sender
│           ├── SpecialDaysPage.jsx         — Date range management
│           └── ...
│
├── IMPROVEMENTS.md                         — Original improvement plan (reference)
├── HAIQ_PROJECT_MASTER_LOG.md              — This file
├── progress.md                             — Earlier progress notes (superseded by this file)
└── DATE_TIME_VALIDATION_ANALYSIS.md       — Analysis of date validation layers
```

---

*End of HAIQ Project Master Log*
