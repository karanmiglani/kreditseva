# KreditSeva — Production Readiness Audit

**Last reviewed:** June 2026  
**Verdict:** Not fully production-ready. UI and content are largely in place, but critical SEO, security, and deployment gaps should be addressed before launch.

---

## Scorecard

| Area | Status | Notes |
|------|--------|-------|
| UI / Design | Good | Consistent footer, trust badges, responsive layout |
| Content & SEO | Needs work | Competitor copy, wrong meta titles, blog SEO |
| Backend security | Needs work | Auth, rate limiting, error handling gaps |
| Forms & leads | Mostly OK | Wired to APIs; minor JS bugs |
| Deployment | Not ready | No `start` script, weak prod config |
| Legal pages | Good | Privacy, terms, disclaimer, grievance present |
| Admin panel | Partial | Works but has security gaps |

---

## P0 — Fix before launch

### 1. Competitor brand copy ("My Mudra") — 8 pages — **FIXED**

Meta descriptions updated with KreditSeva-specific copy on all affected pages.

| File | Status |
|------|--------|
| `pages/home-loan.html` | Fixed |
| `pages/secured-loan.html` | Fixed |
| `pages/loan-against-property.html` | Fixed |
| `pages/professional-loan.html` | Fixed |
| `pages/business-loan.html` | Fixed |
| `pages/loan-for-doctor.html` | Fixed |
| `pages/loan-for-ca.html` | Fixed |
| `pages/loan-for-cs.html` | Fixed |

### 2. Wrong page titles / meta — **FIXED**

| File | Was | Now |
|------|-----|-----|
| `pages/insta-loan.html` | Personal Loan title | Insta Loan — up to ₹5 Lakhs |
| `pages/debt-consolidation.html` | Personal Loan title | Debt Consolidation Loan |
| `pages/home-loan.html` | LAP title/meta | Home Loan — up to ₹5 Crore |
| `pages/secured-loan.html` | LAP title/meta | Secured Loan |

### 3. Duplicate URLs (SEO risk) — **FIXED**

- Removed public static serving of `/pages/` from `backend/server.js`
- Added 301 redirects: `/pages/*.html` → clean URLs (e.g. `/pages/personal-loan.html` → `/personal-loan`)
- Updated `robots.txt` with `Disallow: /pages/`, `/admin`, `/api/`

### 4. Blog SEO broken

`views/blog-detail.ejs` uses hardcoded title/description ("Types of Debt Funds...") for every blog post. Meta tags should be generated from `blog[0].title`, description, and image.

### 5. Backend security (critical)

| Issue | File(s) | Risk |
|-------|---------|------|
| Login response returns full admin row (includes password hash) | `backend/controllers/loginController.js` | Data leak |
| Cookie `secure: false` hardcoded | `backend/controllers/loginController.js` | Session hijack on HTTP |
| No rate limiting on login/forms | `backend/server.js`, route files | Brute force / spam |
| No global error handler | `backend/server.js` | Crashes, hung requests |
| `POST /api/blog/dummy-blogs` in production | `backend/routes/blogRoutes.js` | Fake data insert |
| CSP disabled in Helmet | `backend/server.js` | XSS risk (especially blog HTML) |

### 6. Deployment blocker

`backend/package.json` has no `"start": "node server.js"` script. Deploy platforms (Render, Heroku, etc.) may fail without a custom start command.

### 7. Broken admin download route

`protected/raw-leads.html` calls `/api/dashboard/raw-leads/download` but that route does not exist. Working download may be at a different path (e.g. `/download-exel-report`).

### 8. Error handling gaps

| Route | Issue | File |
|-------|-------|------|
| `/blog/:slug` | Catch block logs error but sends no response | `backend/routes/pageRoutes.js` |
| `/loan/:slug` (invalid) | Returns plain text, not styled 404 | `backend/routes/pageRoutes.js` |
| `/admin` | Redirect when token exists but still calls `sendFile` (missing `return`) | `backend/routes/pageRoutes.js` |

---

## P1 — High priority (soon after launch)

### SEO & discoverability

- **2 pages** missing `meta description`: `personal-overdraft.html`, `balance-transfer.html` (insta-loan and debt-consolidation fixed)
- **~20 pages** missing explicit `meta name="robots"`
- **No favicon** on any page (`rel="icon"` not set)
- OG/JSON-LD URLs inconsistent: mix of `kreditseva.com`, `www.kreditseva.com`, and `/pages/*.html` paths
  - Affected: `working-capital.html`, `unsecured-business-loan.html`, `business-overdraft.html`
- **Duplicate robots meta** on `views/loan-amount.ejs` and `views/loan-city.ejs`
- **Sitemap gaps** (`sitemap.xml`): missing `/our-team`, HTML sitemap `/sitemap`, individual `/blog/:slug` posts
- **robots.txt gaps**: ~~no `Disallow: /pages/`~~ fixed; `/admin` and `/api/` now disallowed

### Forms & JavaScript

| File | Issue |
|------|--------|
| `js/credit-card.js` | References undefined `rawLeadId` (should use `sessionStorage.getItem('id')`) |
| `js/api.js` | `rawLeadId` read once at page load; can go stale |
| `js/api.js` | `creditCard()` stub calls `showMessage('', ...)` with empty element ID |
| `pages/apply.html` | Form fields use placeholders only; missing `<label for="...">` |
| `pages/contact-us.html` | `console.log` in submit handler |
| `pages/check_cibil_score.html` | `console.log('Hit')` in production |
| `backend/routes/pageRoutes.js` | Debug `console.log` / `console.time` on blog routes |

### Backend hardening

- No `.env.example` for safe onboarding
- No env validation on boot (`PORT`, `DB_*`, `JWT_SECRET_KEY`)
- No `trust proxy` (needed behind Render/reverse proxy for secure cookies)
- No CSRF protection on cookie-authenticated POSTs
- No role-based authorization beyond JWT verify (`backend/midllewares/authMiddleware.js`)
- DB pool: no `connectionLimit`, no SSL for managed MySQL (`backend/config/db.js`)
- No database migration/schema files in repo
- No `/health` or `/ready` endpoint for monitoring
- Logout via GET (`/admin/logout`) — should be POST to avoid CSRF logout
- CORS origins hardcoded in `server.js` (may miss staging/non-www)
- `nodemon` in production `dependencies` (should be `devDependencies`)
- Weak local `.env` values; `JWT_SECRET_KEY` may have leading space/quotes issue

### Stored XSS surface

- `views/blog-detail.ejs` renders `<%- blog[0].content %>` unescaped
- Sanitize on save or enforce CSP if untrusted input paths exist

---

## P2 — Maintainability & polish

### Architecture

- Footer/header copy-pasted across **34 templates** (~80 lines each) — extract EJS partials or shared component
- Unused CSS likely present: `css/footer.css`, `css/common.css`, `css/style.css`, `css/1.css`
- `css/footer.css` exists but is never linked (styles duplicated in `global.css`)

### Accessibility

- No skip-to-content link sitewide
- Only `about-us.html` and `our-team.html` use `<main id="main-content">`
- `views/blogs.ejs` — hardcoded alt text for all blog cards
- `views/blog-detail.ejs` — OG image is relative (`/images/blog/blog1.png`), not absolute URL
- Social share buttons use `href="#"` (non-functional) on `blog-detail.ejs`

### Performance (optional)

- Large page-specific CSS (e.g. `credit_card.css` ~1850 lines)
- Google Fonts loaded separately on every page
- Partner images use WebP with lazy loading (good)

### Monitoring & ops

- No structured logging (pino/winston); only `console.log` / `console.error`
- No graceful shutdown handler for `SIGTERM` / `SIGINT`
- No automated tests in `package.json`
- `package.json` `main` points to `index.js` but entry is `server.js`

---

## Fixed / intentional (no action needed)

| Item | Status |
|------|--------|
| Font URL `0600` → `0,600` | **Fixed** on 8 pages |
| My Mudra meta copy + wrong titles (10 pages) | **Fixed** |
| Lender count (15+ / 25+ / 30+) | **Client-provided** — keep as-is per page |
| Interest rate (9.98% vs 9.99% in tables) | **Client-provided** — keep as-is |
| Our Team page / "Prataham" name | Page link commented out in footer; no change requested |
| Footer address, GST, trust badges | Updated and consistent |
| "Our Lending Partners" footer text | Standardized across all pages |

---

## What is already working well

- Clean URL routing via `backend/routes/pageRoutes.js`
- Global 404 handler serves `pages/404.html`
- `robots.txt` and `sitemap.xml` served dynamically
- Legal pages: privacy, terms, disclaimer, grievance redressal
- Lead forms connected to backend APIs (apply, contact, partner, credit card)
- Parameterized SQL queries (low SQL injection risk)
- JWT in `httpOnly` cookie with `sameSite: 'strict'`
- Admin HTML routes behind `authMiddleware`; `protected/` not statically exposed
- Multer upload: 2MB limit, MIME filter
- Lead save uses transactions in `saveLead`
- City/amount dynamic loan pages via EJS templates
- Helmet and CORS partially configured

---

## Recommended fix order

### Week 1 — Blockers

1. ~~Remove "My Mudra" copy and fix wrong titles/meta (8+ pages)~~ Done
2. Add `npm start` script, env validation, `.env.example`
3. Fix login: strip password from response, `secure: true` in prod, `trust proxy`
4. Add rate limiting on login and public form endpoints
5. Wire dynamic SEO in `blog-detail.ejs`
6. Block or disallow `/pages/` duplicate URLs — done (redirects + robots)

### Week 2 — Security & SEO

1. Global error handler; fix blog/loan error routes
2. Update `robots.txt` and `sitemap.xml`
3. Add favicon and missing meta descriptions (4 pages)
4. Remove `console.log` and gate `dummy-blogs` in production
5. Fix `credit-card.js` / `api.js` session bugs

### Week 3 — Polish

1. Extract footer/header into EJS partials
2. Form accessibility (labels on `apply.html`)
3. `/health` endpoint and structured logging
4. DB migrations and pool tuning

---

## Quick reference — files to touch first

```
pages/home-loan.html
pages/secured-loan.html
pages/loan-against-property.html
pages/professional-loan.html
pages/business-loan.html
pages/loan-for-doctor.html
pages/loan-for-ca.html
pages/loan-for-cs.html
pages/insta-loan.html
pages/debt-consolidation.html
views/blog-detail.ejs
backend/server.js
backend/package.json
backend/controllers/loginController.js
backend/routes/pageRoutes.js
protected/raw-leads.html
```
