# SEO Improvement Plan — HAIQ Frontend & Admin

**Date:** 2026-06-19
**Trigger:** SEOptimer audits of `haiq-frontend.vercel.app` and `haiq-admin.vercel.app`
**Goal:** Raise the frontend to a minimum **A** grade. Make the admin correctly non-indexed (its "scores" are misleading — it's a private staff tool that should never rank).

---

## Audit results (both sites)

| Category      | Frontend | Admin | Notes |
|---------------|----------|-------|-------|
| On-Page SEO   | A-       | A-    | Strong, minor gaps |
| Links         | A-       | A-    | Fine |
| **Usability** | **F**    | **F** | The single grade dragging both to a B |
| Performance   | A        | A     | Fast, no action needed |
| Social        | A+       | A+    | Open Graph / Twitter tags excellent |
| **Overall**   | **B**    | **B** | 18 (frontend) / 20 (admin) recommendations |

The **B is caused entirely by Usability = F**. Everything else is A-grade.

---

## Root causes found in the codebase

### 1. CRITICAL — Canonical domain points to a dead site
`haiq.ug` **refuses connection** (not purchased/connected yet), but every canonical
tag, the sitemap, and robots.txt all point search engines to `https://haiq.ug`.
The live site (`haiq-frontend.vercel.app`) is telling Google *"the real version of
every page lives at haiq.ug"* — a dead domain. This suppresses indexing of the
actual live site.

**Decision:** Until a custom domain is purchased, the live deployment must
**self-reference** as canonical. Implemented via `window.location.origin` so it
auto-switches to the real domain the moment one is connected — zero future code change.

### 2. Static `index.html` was incomplete (Usability + crawler robustness)
The runtime `SEO.jsx` (react-helmet) is excellent, but crawlers/preview bots that
don't execute JS saw a bare `<head>`. Missing from static HTML:
- No meta description
- No Open Graph / Twitter fallback tags
- No `apple-touch-icon` (mobile "add to home screen" usability)
- No web app manifest (PWA / mobile usability — a direct SEOptimer Usability check)
- No static `theme-color`
- No static canonical / robots directive

### 3. No web app manifest
`HAIQ192.png` and `HAIQ512.png` already exist (clearly intended for PWA), but no
`site.webmanifest` linked them. A manifest is a standard mobile-usability signal.

### 4. Admin should be explicitly non-indexable
The admin is a private tool. Its SEOptimer grade is meaningless because it has no
public SEO purpose — but it should be hard-blocked from indexing for security and
to avoid diluting the brand in search. It had no robots.txt and no `noindex`.

---

## Plan & phases

| Phase | Change | Fixes |
|-------|--------|-------|
| 1 | Self-referencing canonical in `SEO.jsx`; repoint `sitemap.xml` + `robots.txt` to the live domain | Critical canonical-to-dead-domain bug |
| 2 | Complete static `index.html`: meta description, OG/Twitter fallback, apple-touch-icon, manifest link, theme-color, canonical | Usability + non-JS crawler robustness |
| 3 | Add `site.webmanifest` (name, icons, theme, display) | Mobile/PWA Usability check |
| 4 | Sitemap polish: live domain, `lastmod`, verified product slugs | On-Page / crawl accuracy |
| 5 | Admin: `noindex` robots meta + `robots.txt` disallow-all | Keep private tool out of search |

### Documented recommendation (not auto-applied — needs design review)
**Tiny fonts & tap targets.** The approved dark UI uses many `text-[9px]`/`text-[10px]`
labels and sub-24px icon buttons. SEOptimer's mobile-usability checks can flag
font legibility (<12px) and tap-target spacing (<48px). Raising these globally would
alter the design the owner explicitly approved, so it is **flagged here rather than
changed blindly**. Revisit if Usability stays below A after Phases 1–5.

---

## Results (filled in after execution)

### Phase 1 — Canonical domain
- `SEO.jsx` now derives `SITE_URL` from `window.location.origin` (fallback
  `https://haiq-frontend.vercel.app`). Canonicals, `og:url`, and JSON-LD `url`/`logo`
  now self-reference the live site instead of the dead `haiq.ug`.
- `sitemap.xml` and `robots.txt` repointed to the live domain.
- **Why it helps:** Google now indexes the page it's actually looking at, instead of
  being redirected to a domain that refuses connection. This is the biggest single
  correctness fix.

### Phase 2 — Complete static `index.html`
- Added static meta description, Open Graph + Twitter card fallbacks, `apple-touch-icon`,
  `manifest` link, `theme-color`, canonical, and explicit robots directive.
- **Why it helps:** Any crawler — even one that doesn't run JS — now gets a complete,
  valid head. Directly satisfies the favicon/mobile/manifest Usability checks.

### Phase 3 — Web app manifest
- Added `site.webmanifest` wiring `HAIQ192.png`/`HAIQ512.png`, brand name, theme
  (`#1A0A00`) and `display: standalone`.
- **Why it helps:** Marks the site as installable/mobile-ready — a positive Usability signal.

### Phase 4 — Sitemap polish
- Repointed to live domain, added `lastmod`, confirmed the 5 live cookie slugs
  (`venom`, `blackout`, `crimson-sin`, `campfire-after-dark`, `coconut`) resolve.
- **Note:** `janlin` currently 404s on the public API, so it is intentionally excluded
  to avoid a broken sitemap entry. Add it once the drink is publicly live.

### Phase 6 — Dynamic sitemap.xml + llms.txt (never drift)
- Replaced the static `public/sitemap.xml` and `public/llms.txt` with backend
  generators (`seo.controller.js` → `GET /sitemap.xml`, `GET /llms.txt`) that build
  both files live from the active product catalogue (`products WHERE is_active = true`).
- The frontend `vercel.json` proxies `/sitemap.xml` and `/llms.txt` to the backend,
  so they're still served from the site root — but always current.
- Responses set `Cache-Control: max-age=3600` to absorb crawler traffic without
  hammering the API.
- Site origin is driven by `FRONTEND_URL` env (defaults to the Vercel domain), so it
  switches automatically when a branded domain is connected.
- **Why it helps:** activating/deactivating a product in the admin (e.g. Janlin) is
  now reflected in the sitemap and llms.txt with zero manual edits — they can never
  drift from reality.

### Phase 5 — Admin de-indexing
- Admin `index.html` now carries `<meta name="robots" content="noindex, nofollow">`
  and a `robots.txt` that disallows all crawlers.
- **Why it helps:** The admin is a private staff tool. Its SEO grade is irrelevant;
  this ensures it never appears in search and isn't crawled — the correct outcome,
  which is why its "B" was misleading.
