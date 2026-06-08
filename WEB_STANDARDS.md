# Professional Website Building Standards
> A universal reference standard for building, auditing, and grading any production website.
> Derived from PageSpeed Insights methodology, SEOptimer audit framework, and industry best practices.
> Use this document as the benchmark for every website built or audited.

---

## How To Use This Document

This is an ordered checklist of everything a production-grade website must have. Items are listed in order of priority — the higher an item appears, the more foundational it is. Do not skip to lower sections before the higher ones are complete. Each section carries a weight in the final score.

**Grading:** Each section is scored independently. The final score is a weighted average out of 100%.

---

## SECTION 1 — Technical Foundation
**Weight: 20% of total score**
*These are non-negotiable. A website that fails here fails at the infrastructure level — everything built on top is compromised.*

---

### 1.1 HTTPS — SSL Certificate
**Priority: CRITICAL**

Every website must be served over HTTPS, not HTTP. Without it, browsers display a "Not Secure" warning, Google ranks the site lower, and user data sent through forms is unencrypted and interceptable.

**How to implement:**
- Use a host that provides SSL automatically (Vercel, Netlify, Cloudflare, Render all do this)
- Verify the padlock appears in the browser address bar on your live domain
- Ensure all HTTP requests redirect to HTTPS — there must be no way to access the site on unencrypted HTTP

**Why:** Google has confirmed HTTPS is a ranking signal. Users who see "Not Secure" leave immediately. Forms submitted over HTTP expose personal data to interception.

---

### 1.2 HTTP/2 Protocol
**Priority: HIGH**

HTTP/2 allows multiple files to load simultaneously over a single connection, dramatically improving load speed compared to HTTP/1.1 which loads files one at a time.

**How to implement:**
- Modern hosting platforms (Vercel, Cloudflare, Netlify) enable HTTP/2 by default
- Verify using browser DevTools → Network tab → Protocol column should show `h2`

**Why:** HTTP/2 can reduce page load time by 30–50% on asset-heavy pages by multiplexing requests.

---

### 1.3 No Broken Links or Errors
**Priority: HIGH**

Every link in the navigation, footer, in-page links, and anchor tags must resolve to a valid destination. Every API call must have proper error handling so a failed request does not crash the page.

**How to implement:**
- Run a broken link checker (Screaming Frog, Ahrefs, or browser extension) before launch
- Implement 404 pages that are branded and helpful, not raw server errors
- All external links should open in `target="_blank"` with `rel="noopener noreferrer"`

**Why:** Broken links destroy user trust immediately, signal poor maintenance to Google, and increase bounce rate.

---

### 1.4 Image Optimisation
**Priority: HIGH**

Images are the single largest contributor to slow page load. Every image must be correctly sized, compressed, and served in a modern format.

**How to implement:**
- Use WebP or AVIF format for all images (not PNG or JPEG — these are 2–3x larger for the same visual quality)
- The hero image (largest image on any page) must be compressed and pre-sized to the largest breakpoint it will display at — never serve a 4000px image to a 400px mobile screen
- Use `loading="lazy"` attribute on all images below the fold (not the hero — that should load immediately)
- Use a CDN for image delivery (Cloudinary, Imgix, or the host's built-in CDN)
- Set explicit `width` and `height` attributes on all images to prevent layout shift

**Why:** Google's Core Web Vitals penalise slow image loading. Large uncompressed images are the number-one cause of poor mobile performance. WebP is 25–35% smaller than JPEG at equal quality.

---

### 1.5 Mobile Responsiveness
**Priority: CRITICAL**

More than 60% of web traffic globally comes from mobile devices. A website that is not fully responsive on all screen sizes is failing the majority of its visitors.

**How to implement:**
- Design mobile-first — start with the smallest screen and scale up, not the reverse
- Test at 320px (small phone), 375px (standard), 768px (tablet), 1024px (laptop), 1440px (desktop)
- No horizontal scrollbars on any screen size
- Touch targets (buttons, links) must be at minimum 44×44 pixels
- Font sizes must be readable without zooming — minimum 16px body text on mobile
- No elements that overflow or overlap on small screens

**Why:** Google uses mobile-first indexing — it crawls and ranks the mobile version of your site, not the desktop version. A poor mobile experience directly reduces your search ranking.

---

### 1.6 Core Web Vitals
**Priority: HIGH**

Google measures three specific performance metrics that directly influence search ranking. These are non-negotiable for competitive websites.

| Metric | What It Measures | Target |
|---|---|---|
| **LCP** (Largest Contentful Paint) | How long until the main content is visible | Under 2.5 seconds |
| **FID / INP** (Interaction to Next Paint) | How responsive the page is to user input | Under 200ms |
| **CLS** (Cumulative Layout Shift) | How much content shifts around as it loads | Under 0.1 |

**How to improve LCP:**
- Optimise the hero image (biggest single impact)
- Preload the hero image using `<link rel="preload" as="image">`
- Use server-side rendering or static generation where possible
- Minimise render-blocking JavaScript

**How to improve CLS:**
- Always set `width` and `height` on images and iframes
- Reserve space for dynamically loaded content (skeleton loaders)
- Avoid inserting content above existing content after load

**Why:** Since 2021, Google uses Core Web Vitals as a direct ranking factor. A site that scores poorly loses search visibility to competitors who score well.

---

### 1.7 Page Speed (Desktop & Mobile)
**Priority: HIGH**

**Benchmarks:**
- Desktop: Score of 90+ on Google PageSpeed Insights
- Mobile: Score of 70+ on Google PageSpeed Insights (lower target due to network constraints)

**How to achieve:**
- Minimise and bundle JavaScript (Vite, Webpack do this automatically)
- Remove unused CSS
- Defer non-critical JavaScript with `defer` or `async`
- Enable text compression (Gzip or Brotli) on the server
- Use a CDN for all static assets

**Why:** Every additional second of load time reduces conversions by an average of 7%. Users abandon pages that take more than 3 seconds to load on mobile.

---

## SECTION 2 — Search Engine Optimisation (SEO)
**Weight: 25% of total score**
*SEO determines whether your website can be found by people searching for what you offer. Without it, the site is invisible.*

---

### 2.1 Title Tag
**Priority: CRITICAL**

The page title is the blue clickable headline in Google search results. It is the single most important SEO element on a page.

**Rules:**
- Length: 50–60 characters (Google truncates anything longer)
- Must include the primary keyword for that page
- Must be unique — every page on the site must have a different title
- Format: `[Primary Keyword] — [Secondary Keyword] | [Brand Name]`
- Homepage: `[What You Do] in [Location] | [Brand Name]` — be descriptive, not just the brand name

**Why:** Google uses the title to determine what a page is about and which search queries it should rank for. A vague or missing title means Google cannot place the page accurately in search results.

---

### 2.2 Meta Description
**Priority: HIGH**

The meta description is the grey paragraph below the title in search results. It does not directly influence ranking but strongly influences whether users click.

**Rules:**
- Length: 120–160 characters
- Must describe exactly what is on the page and why someone should click
- Include a natural call to action ("Order now", "Learn more", "Browse the full range")
- Never use developer placeholder text like "Website created using create-react-app"
- Must be unique per page — never copy the same description to multiple pages

**Why:** A compelling meta description increases click-through rate from search results. More clicks → more traffic → Google interprets the page as relevant → ranking improves over time.

---

### 2.3 Canonical Tags
**Priority: HIGH**

A canonical tag (`<link rel="canonical" href="...">`) tells Google which version of a URL is the authoritative "master" version.

**Why you need this:**
- `https://yoursite.com`, `https://www.yoursite.com`, `https://yoursite.com/`, and `https://yoursite.com/index.html` all look like different URLs to Google but point to the same page
- Without canonical tags, Google may split your ranking power across multiple versions of the same page, weakening each one

**How to implement:**
- Add `<link rel="canonical" href="[full URL of this page]">` to every page
- The canonical URL should always be the preferred version (with or without `www`, with or without trailing slash — be consistent)
- Use an absolute URL, not a relative path

**Why:** Prevents "duplicate content" penalties where Google sees the same content at multiple URLs and doesn't know which one to rank.

---

### 2.4 XML Sitemap
**Priority: HIGH**

A sitemap is a file (`/sitemap.xml`) that lists every public page on your website. It is submitted to Google Search Console so Google knows exactly which pages exist and can index them faster.

**How to implement:**
- Create `/sitemap.xml` in your public folder
- Include every public-facing page with its full URL
- Exclude private pages: account pages, checkout, order confirmation, admin areas
- Include `<lastmod>` dates where relevant (product pages change more often than the homepage)
- Submit the sitemap URL to Google Search Console after deployment

**Format example:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

**Why:** Without a sitemap, Google discovers pages only by following links. New pages or pages with few internal links may never be found. A sitemap guarantees Google knows every page exists.

---

### 2.5 robots.txt
**Priority: HIGH**

The `robots.txt` file tells search engine crawlers which pages they are allowed to index and which to ignore.

**How to implement:**
- Create `/robots.txt` in your public folder
- Always point to your sitemap in this file
- Disallow private/transactional pages (account, checkout, admin)
- Allow all other pages unless there is a specific reason not to

**Standard format:**
```
User-agent: *
Allow: /
Disallow: /account
Disallow: /checkout
Disallow: /admin
Sitemap: https://yoursite.com/sitemap.xml
```

**Why:** Without this file, Google may waste crawl budget on pages you do not want indexed (checkout flows, account pages) at the expense of your important public pages. It also prevents admin panels from appearing in search results.

---

### 2.6 Structured Data / Schema Markup (JSON-LD)
**Priority: HIGH**

Structured data is JSON code embedded in your page that tells Google what type of entity your page represents — a business, a product, a review, a breadcrumb trail.

**Types relevant to e-commerce and business sites:**
- `Organization` or `LocalBusiness` — your company name, address, contact, social links
- `Product` — name, price, availability, description, image
- `BreadcrumbList` — navigation path (Home > Shop > Product Name)
- `FAQPage` — question/answer pairs (Google can display these in search results)
- `Review`/`AggregateRating` — star ratings in search results

**How to implement:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Your Business Name",
  "address": { "@type": "PostalAddress", "addressLocality": "City" },
  "url": "https://yoursite.com"
}
</script>
```

**Why:** Structured data enables "rich results" in Google — star ratings, price, availability, FAQ dropdowns directly in search results. Rich results significantly increase click-through rates and make your listing stand out from competitors.

---

### 2.7 Open Graph & Social Media Tags
**Priority: MEDIUM**

When someone shares your page on Facebook, LinkedIn, WhatsApp, or Twitter, these platforms read `og:` meta tags to generate the preview card — title, description, and image.

**Required tags:**
- `og:title` — title of the page
- `og:description` — description (can match meta description)
- `og:image` — preview image (minimum 1200×630px recommended)
- `og:url` — canonical URL of the page
- `og:type` — `website`, `article`, or `product`
- `twitter:card` — `summary_large_image` for most pages

**Why:** Without these, social media shares look broken — no image, no formatted title. A share that looks broken gets ignored. A share with a professional preview card drives traffic.

---

### 2.8 SEO Coverage on All Public Pages
**Priority: HIGH**

Every public page needs its own unique title, description, canonical, and structured data. A single shared SEO component is not enough if it outputs the same data on every page.

**Pages that must have unique SEO:**
- Homepage
- Shop / Product listing page
- Each individual product page
- FAQ page
- Contact page
- Blog posts (if applicable)
- Legal pages (Privacy, Terms — these can be `noindex`)

**Pages that should be noindex:**
- Account / dashboard
- Checkout
- Order confirmation
- Password reset
- Admin areas

**Why:** Google assigns individual rankings to individual pages. A product page that shares its title with the homepage cannot rank for its own keywords.

---

### 2.9 Analytics & Tracking
**Priority: HIGH**

Without analytics, you are operating blind. You do not know who visits, where they come from, what pages they visit, how long they stay, or where they leave.

**Minimum required setup:**
- **Google Analytics 4 (GA4)** — free, tracks users, sessions, events, conversions
- **Google Search Console** — shows which search queries bring traffic, which pages rank, and any indexing errors

**How to implement GA4:**
- Create a GA4 property at analytics.google.com
- Copy the Measurement ID (format: G-XXXXXXXXXX)
- Add the tracking script to your site's `<head>` on every page
- Verify data is arriving in the Realtime report

**How to implement Search Console:**
- Go to search.google.com/search-console
- Add your domain and verify ownership
- Submit your sitemap URL
- Monitor for crawl errors, index coverage, and search performance

**Why:** Without data, you cannot make decisions. You cannot know which pages are performing, which keywords bring traffic, or where users are dropping off. Analytics is the measurement system for every other improvement you make.

---

### 2.10 Keyword Relevance in Content
**Priority: MEDIUM**

The text on your pages must use the words and phrases that your target audience types into Google. This is not about stuffing keywords — it is about writing content that naturally uses the language your customers use.

**How to implement:**
- Identify 5–10 primary keywords relevant to your business (what would someone type to find you?)
- Use the primary keyword naturally in: the page title (H1), the first paragraph, at least one subheading (H2/H3), and the meta description
- Each page should target a specific keyword — not the same keyword on every page
- Do not sacrifice readability — content that reads unnaturally scores poorly

**Why:** Google ranks pages based on relevance to the search query. A page about cookies that never uses the word "cookies" cannot rank for "cookies". Natural keyword usage is how Google matches your content to user searches.

---

## SECTION 3 — Performance & Mobile Experience
**Weight: 20% of total score**

---

### 3.1 First Contentful Paint (FCP) — Under 1.8s
The time until the first text or image appears on screen. Reduces user anxiety about whether the page is loading.

### 3.2 Largest Contentful Paint (LCP) — Under 2.5s
The time until the largest element (usually the hero image) is fully visible. This is the primary user-perceived load time.

**Critical techniques:**
- Preload the hero image: `<link rel="preload" as="image" href="/hero.webp">`
- Use `fetchpriority="high"` on the hero `<img>` element
- Host images on a CDN (not your own server)
- Consider Server-Side Rendering for the initial HTML if using a JavaScript framework

### 3.3 Cumulative Layout Shift (CLS) — Under 0.1
Content must not jump around as the page loads. Reserve space for images and dynamic content before it loads.

### 3.4 Mobile-Specific Optimisations
- Font size minimum 16px body text
- No content wider than the viewport
- Touch targets minimum 44×44px
- Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`

---

## SECTION 4 — Content Quality
**Weight: 15% of total score**

---

### 4.1 Homepage Content Volume
**Minimum: 600–800 words of visible, meaningful content**

A homepage with less than 500 words of actual content is considered "thin content" by Google and will struggle to rank. The homepage should clearly explain: who you are, what you offer, who it is for, where you are located, and why someone should choose you.

This does not mean cramming text — it means ensuring that all sections of the homepage (hero, features, process, testimonials, CTA) collectively contain enough substance that Google understands the business clearly.

### 4.2 Product/Service Pages
Each product or service must have its own dedicated page with:
- A descriptive title (not just the product name)
- At least 150–300 words of descriptive copy
- Clear price display
- Clear availability status
- At least one high-quality image with descriptive alt text
- A clear call to action (buy, enquire, contact)

### 4.3 Image Alt Text
Every image must have an `alt` attribute describing what is in the image. Decorative images use `alt=""`. Product images should describe the product: `alt="Venom double-chocolate cookie on dark ceramic plate"`.

**Why:** Alt text is how Google reads images (it cannot actually see them). Missing alt text means images contribute zero SEO value. It is also required for screen readers used by people with visual impairments — an accessibility requirement.

### 4.4 Heading Hierarchy
Each page must have exactly one H1 (the main topic of the page). Subheadings use H2. Sub-subheadings use H3. Do not skip levels (e.g., H1 → H3 with no H2). Do not use headings for visual style — use them for document structure.

### 4.5 Content Freshness
Google favours websites that update their content regularly. A static site with no new content added in months drops in ranking over time. Options for maintaining freshness:
- A blog or editorial section
- Regular product updates
- Customer reviews and testimonials (user-generated content)
- A news or announcements section

---

## SECTION 5 — Conversion & User Experience
**Weight: 15% of total score**

---

### 5.1 Clear Calls to Action (CTAs)
Every page must have a clear next step for the visitor. The CTA must be:
- Visually prominent (contrasting colour, not buried in text)
- Action-oriented ("Order Now", "Get a Quote", "Book a Table" — not "Learn More" or "Click Here")
- Located above the fold on the homepage (visible without scrolling)
- Repeated at logical points down the page (not just once at the top)

### 5.2 Contact Accessibility
Visitors must be able to contact you in under 2 clicks from any page. This means:
- Phone number, email, or contact form visible in the header or footer (not just on the Contact page)
- Contact page linked in the main navigation
- Form fields labelled clearly
- Confirmation message after form submission

### 5.3 Navigation Clarity
- Maximum 7 items in the main navigation (cognitive load limit)
- Current page indicated visually (active state)
- Consistent navigation on every page
- Mobile navigation must be accessible via a clear hamburger/menu button
- Logo always links back to the homepage

### 5.4 Error States & Empty States
- Form validation errors must be displayed immediately and clearly, adjacent to the field that caused the error
- Empty search results must explain what happened and suggest alternatives
- Server errors (500) must show a branded page, not a raw error message
- 404 pages must be branded and link back to the homepage and key sections

### 5.5 Loading States
Any action that takes more than 300ms must show a loading indicator:
- Skeleton loaders for content that is fetching from an API
- Spinner or progress indicator for form submissions
- Disabled submit button after first click (prevents double submission)

### 5.6 Conversion Funnel
A website exists to generate a result — an order, an enquiry, a sign-up. Map the path from landing page to conversion and ensure every step is clear, short, and reduces friction:
- Remove unnecessary form fields
- Show progress indicators in multi-step processes
- Allow guest checkout (do not force account creation before purchase)
- Show trust signals near conversion points (security badges, return policy, contact info)

---

## SECTION 6 — Security & Compliance
**Weight: 5% of total score**

---

### 6.1 Security Headers
The server must set these HTTP headers on every response:
- `Content-Security-Policy` — restricts which scripts/styles/images can load
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `X-Frame-Options: DENY` — prevents clickjacking in iframes
- `Strict-Transport-Security` — forces HTTPS for future visits
- `Referrer-Policy: strict-origin-when-cross-origin`

### 6.2 Privacy Policy & Terms
Every website that collects any user data (even just an email address) must have:
- A Privacy Policy explaining what data is collected and how it is used
- Terms of Use/Service
- Cookie consent (if using tracking cookies or analytics)

### 6.3 Form Security
- All forms must use CSRF protection
- Rate limiting on form submission endpoints
- Input sanitisation and validation on both client and server
- Never store or log raw passwords — always hash with bcrypt or Argon2

### 6.4 Dependency Security
- Keep all npm/pip/gem packages updated
- Run `npm audit` regularly and address critical vulnerabilities
- Do not commit `.env` files or API keys to version control

---

## SECTION 7 — Authority & Off-Site Signals
**Weight: 5% of total score**

*These take the longest to build but have compounding returns over time.*

---

### 7.1 Backlinks
Backlinks are links from other websites pointing to yours. Each one signals to Google that your site is trustworthy and worth ranking. Quality matters far more than quantity — one link from a relevant, respected publication is worth more than 100 links from low-quality directories.

**How to build backlinks:**
- Get listed in industry directories and association websites
- Publish genuinely useful content that others want to reference
- Partner with complementary businesses who link to each other
- Submit to Google My Business, Yelp, and location-based directories
- Publish case studies that clients share on their own websites

### 7.2 Google Business Profile
For any business with a physical location, a verified Google Business Profile is essential. It displays your business in Google Maps, the local "3-pack" at the top of local searches, and adds legitimacy.

**Required fields:**
- Business name, address, phone, website
- Opening hours
- Photos (at minimum: exterior, interior, products/work)
- Business category
- Description

### 7.3 Social Media Consistency
Your brand name, logo, and description must be consistent across all social media profiles. Social profiles rank in Google for branded searches and act as additional signals of legitimacy. Inconsistency confuses both users and Google.

---

## Scoring Reference

| Section | Weight | Max Points |
|---|---|---|
| 1. Technical Foundation | 20% | 20 |
| 2. SEO | 25% | 25 |
| 3. Performance & Mobile | 20% | 20 |
| 4. Content Quality | 15% | 15 |
| 5. Conversion & UX | 15% | 15 |
| 6. Security & Compliance | 5% | 5 |
| 7. Authority & Off-Site | 5% | 5 |
| **TOTAL** | **100%** | **100** |

### Grade Bands

| Score | Grade | Interpretation |
|---|---|---|
| 90–100 | A | Production-ready, competitive, fully optimised |
| 80–89 | B | Strong foundation, minor gaps, competitive |
| 70–79 | C | Functional, significant improvements needed to compete |
| 60–69 | D | Structural issues present, will struggle in search |
| Below 60 | F | Fundamental gaps — not ready for serious traffic |

---

*This document is a living standard. Update it as web platform best practices evolve.*
