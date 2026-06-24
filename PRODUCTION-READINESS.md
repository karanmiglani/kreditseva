# KreditSeva — Production Readiness Audit

**Last reviewed:** June 2026  
**Verdict:** Not fully production-ready. The public site (UI, content, static SEO) is in good shape. Five P0 backend/deployment items should be fixed before a confident launch.

---

## Scorecard

| Area | Status | Notes |
|------|--------|-------|
| UI / Design | Good | Consistent footer, GST, trust badges, address |
| Static page SEO | Good | Meta, favicon, robots, sitemap, clean URLs |
| Blog SEO | Not ready | `blog-detail.ejs` uses hardcoded title/description for every post |
| Backend security | Partial | Hash leak, CSP, sanitization fixed; cookies, rate limit open |
| Forms & leads | Mostly OK | APIs wired; minor JS bugs and debug logs remain |
| Deployment | Partial | `npm start` added; env validation and `.env.example` still missing |
| Legal pages | Good | Privacy, terms, disclaimer, grievance present |
| Admin panel | Partial | Auth works; `dummy-blogs` endpoint, GET logout |

---

## Completed (no further action)

| Item | Details |
|------|---------|
| Competitor copy ("My Mudra") | Removed from all pages |
| Wrong page titles / meta | Fixed on insta-loan, debt-consolidation, home-loan, secured-loan, and 8+ product pages |
| Duplicate `/pages/` URLs | Static `/pages/` serving removed; 301 redirects to clean URLs; `robots.txt` disallows `/pages/` |
| Login password hash leak | `loginController.js` returns only id, name, email, role |
| Global error handler | `errorHandler` middleware; blog/loan routes use `next(err)` |
| CSP + blog XSS | Helmet CSP enabled; `sanitize-html` on blog create/update/render |
| Admin raw-leads download | `protected/raw-leads.html` uses `/download-exel-report` |
| Error handling gaps | Invalid blog/loan slugs → `404.html`; admin redirect uses `return` |
| Missing meta descriptions | Added to `personal-overdraft.html`, `balance-transfer.html` |
| Missing `meta robots` | `index, follow` on all indexable pages; `404.html` keeps `noindex` |
| Favicon | `rel="icon"` on all pages; `/favicon.ico` → `/images/credit-gauge.svg` |
| OG/JSON-LD URL consistency | Business loan pages use `www.kreditseva.com` and `credit-gauge.svg` |
| Duplicate robots meta | Removed from `views/loan-amount.ejs`, `views/loan-city.ejs` |
| Sitemap | `/our-team`, `/sitemap` added; `/sitemap.xml` dynamically appends published blog slugs |
| `robots.txt` | Disallows `/pages/`, `/admin`, `/api/` |
| Footer consistency | Address, GST, trust badges, lending partners text standardized |
| Font URL typo | `0600` → `0,600` on affected pages |
| `npm start` script | `"start": "node server.js"` added; `main` corrected to `server.js` |

**Intentionally unchanged (client-provided):** lender counts (15+/25+/30+), interest rate variations, Our Team footer link commented out.

---

## P0 — Fix before launch

### 1. Blog SEO broken — `views/blog-detail.ejs`

Every blog post renders the same hardcoded meta:

- Title: "Types of Debt Funds You Should Know"
- Description: debt-funds copy
- OG image: `/images/blog/blog1.png` (relative, not per-post)

Should use `blog[0].title`, excerpt/description, and `blog[0].image` with absolute URLs.

### 2. Insecure session cookie — `backend/controllers/loginController.js`

```js
secure: false  // hardcoded
```

In production behind HTTPS (Render), this should be `secure: process.env.NODE_ENV === 'production'`.

### 3. No `trust proxy` — `backend/server.js`

Required when running behind Render/nginx so Express correctly detects HTTPS and client IP. Without it, `secure` cookies and any IP-based logic will not work correctly.

```js
app.set('trust proxy', 1);
```

### 4. No rate limiting

No rate limiting on:

- `POST /api/auth/login` — brute force risk
- Public form endpoints (`/api/leads/*`, `/api/partner/*`, contact) — spam risk

Recommend `express-rate-limit` with stricter limits on login.

### 5. `dummy-blogs` endpoint in production — `backend/routes/blogRoutes.js`

`POST /api/blog/dummy-blogs` is auth-protected but still live. Should be removed or gated behind `NODE_ENV !== 'production'`.

---

## P1 — High priority (soon after launch)

### Forms & JavaScript

| File | Issue |
|------|--------|
| `js/credit-card.js` | Line 77 references undefined `rawLeadId` (should use `sessionStorage.getItem('id')`) |
| `js/api.js` | `rawLeadId` read once at page load; goes stale if session changes without reload |
| `js/api.js` | `creditCard()` stub calls `showMessage('', ...)` with empty element ID |
| `pages/apply.html` | Form fields use placeholders only; missing `<label for="...">` on inputs |
| `pages/contact-us.html` | `console.log` in submit handler (lines ~415, 424) |
| `pages/check_cibil_score.html` | `console.log('Hit')` in production |
| `js/credit-card.js`, `js/api.js`, `js/debt-consolidation.js` | `console.log` in catch blocks |

### Backend hardening

| Item | File(s) |
|------|---------|
| No `.env.example` | repo root / `backend/` |
| No env validation on boot | `PORT`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET_KEY` |
| No CSRF protection | Cookie-authenticated admin POSTs |
| No role-based authorization | `authMiddleware.js` verifies JWT only; no role checks |
| DB pool not tuned | `backend/config/db.js` — no `connectionLimit`, no SSL for managed MySQL |
| No schema/migration files | Database structure not versioned in repo |
| No `/health` or `/ready` endpoint | Monitoring / load balancer probes |
| Logout via GET | `/admin/logout` — should be POST to prevent CSRF logout |
| CORS origins hardcoded | `server.js` — may miss `kreditseva.com` (non-www) or staging |
| `nodemon` in `dependencies` | Should be `devDependencies` |
| JWT secret hygiene | Verify `.env` has no leading spaces or stray quotes on `JWT_SECRET_KEY` |

### Blog & accessibility (P1/P2 border)

| Item | File |
|------|------|
| OG image relative, not absolute | `views/blog-detail.ejs` |
| Social share buttons non-functional (`href="#"`) | `views/blog-detail.ejs` |
| Hardcoded alt text on all blog cards | `views/blogs.ejs` |

---

## P2 — Maintainability & polish

### Architecture

- Footer/header copy-pasted across **34 templates** (~80 lines each) — extract EJS partials
- Likely unused CSS: `css/footer.css`, `css/common.css`, `css/style.css`, `css/1.css`
- `css/footer.css` never linked (styles live in `global.css`)

### Accessibility

- No skip-to-content link sitewide
- Only `about-us.html` and `our-team.html` use `<main id="main-content">`

### Performance (optional)

- Large page CSS (e.g. `credit_card.css` ~1850 lines)
- Google Fonts loaded separately on every page
- Partner images use WebP + lazy loading (good)

### Monitoring & ops

- No structured logging (pino/winston); `console.log` / `console.error` only
- No graceful shutdown for `SIGTERM` / `SIGINT`
- No automated tests in `package.json`

---

## What is working well

- Clean URL routing via `backend/routes/pageRoutes.js`
- Global 404 handler serves `pages/404.html`
- Dynamic `robots.txt` and `sitemap.xml` (with blog slug injection)
- Lead forms connected to backend APIs (apply, contact, partner, credit card)
- Parameterized SQL queries (low SQL injection risk)
- JWT in `httpOnly` cookie with `sameSite: 'strict'`
- Admin HTML routes behind `authMiddleware`; `protected/` not statically exposed
- Multer upload: 2MB limit, MIME filter
- Lead save uses transactions
- City/amount dynamic loan pages via EJS templates
- Helmet + CORS configured

---

## Recommended fix order

### Before launch (P0) — ~1 day

1. Add `.env.example` + boot-time env validation
2. `trust proxy` + `secure: true` cookie in production
3. Rate limiting on login and public form POSTs
4. Remove or gate `dummy-blogs` in production
5. Dynamic SEO in `blog-detail.ejs`

### Week after launch (P1)

1. Fix `credit-card.js` / `api.js` session bugs
2. Remove frontend `console.log` calls
3. Add `/health` endpoint
4. Form accessibility labels on `apply.html`
5. DB pool tuning + SSL for production MySQL

### Later (P2)

1. Extract footer/header into EJS partials
2. Structured logging + graceful shutdown
3. Accessibility pass (skip link, `<main>`, blog alt text)

---

## Quick reference — files to touch first

```
backend/package.json
backend/server.js
backend/controllers/loginController.js
backend/routes/blogRoutes.js
views/blog-detail.ejs
backend/.env.example          (create)
js/credit-card.js
js/api.js
pages/contact-us.html
pages/check_cibil_score.html
```
