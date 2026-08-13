# Affiliate Marketplace Pro

A full-stack affiliate marketplace (ClickBank-style) where **sellers** list products, **affiliates** generate
tracked links and earn commissions, and **customers** shop a unified catalog — all under one **admin** panel.

- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, shadcn-style UI kit, Recharts
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT auth with role-based access control
- **File uploads:** Cloudinary
- **Payments:** Stripe (fully integrated — real card collection, server-side verification, webhook reconciliation)

> **Ready to put this on a real domain?** See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for a full walkthrough (MongoDB
> Atlas + Render + Vercel). Everything below is for local development.

Both the backend and frontend were verified to build/run cleanly in a sandboxed environment: the backend passes
`node --check` on every file and starts without error, and `npm run build` on the frontend compiles all 29 routes
successfully. No live MongoDB instance was available in that sandbox, so the seed script and live API calls should
be your first smoke test once you have MongoDB connected — see the checklist near the bottom.

---

## 1. Project structure

```
affiliate-marketplace-pro/
├── backend/                  Express API
│   ├── config/                db.js, cloudinary.js, stripe.js
│   ├── models/                User, Product, Category, Order, Affiliate, Commission, Click, Transaction
│   ├── middleware/             auth (JWT + RBAC), upload (multer), error handling
│   ├── controllers/            auth, products, categories, orders, affiliates, sellers, admin, upload
│   ├── routes/                 REST endpoints per resource
│   ├── seed/                   seed.js + products.js (your 14 sample products)
│   ├── utils/                  token, slugify, pagination/filter helper, commission math
│   └── server.js
└── frontend/                 Next.js app
    ├── app/                     all pages (marketing, marketplace, product, cart, checkout, 4 dashboards)
    ├── components/              ui kit, layout (header/footer/dashboard shell), shared widgets
    ├── context/                 auth, cart, wishlist (React context, localStorage-backed where relevant)
    └── lib/                     api client, formatting utils
```

---

## 2. Prerequisites

- Node.js 18+
- A MongoDB database (local `mongod`, or a free MongoDB Atlas cluster)
- A Cloudinary account (free tier is fine) — only needed for image uploads
- A Stripe account in test mode — only needed for real payment collection

## 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
MONGO_URI=mongodb://127.0.0.1:27017/affiliate_marketplace_pro   # or your Atlas connection string
JWT_SECRET=some_long_random_string
CLIENT_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
```

Seed the database (creates categories, your 14 products, demo accounts for every role, and one sample order with
affiliate attribution so the dashboards aren't empty on first login):

```bash
npm run seed
```

This prints a set of demo logins, e.g.:

```
Admin:             admin@marketplace.test / Admin@12345
Seller (approved): seller@marketplace.test / Seller@12345
Seller (pending):  pendingseller@marketplace.test / Seller@12345
Affiliate:         affiliate@marketplace.test / Affiliate@12345
Customer:          customer@marketplace.test / Customer@12345
```

Start the API:

```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start
```

The API runs on `http://localhost:5000` by default. Sanity check: `GET http://localhost:5000/api/health`.

## 4. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Visit `http://localhost:3000`.

> **Fonts:** the app ships with a system-font stack so it builds fully offline. To use Google Fonts (Manrope) as
> originally designed, see the comment block at the top of `app/layout.js` — it's a 3-line swap.

## 5. How the affiliate tracking works

1. An affiliate visits `/dashboard/affiliate/products`, clicks **Get link** on a product → backend returns
   `https://yoursite.com/products/<slug>?ref=<affiliateCode>`.
2. When anyone opens that link, the product page reads `?ref=`, stores the code in `localStorage`, and fires
   `POST /api/affiliates/track-click` to log a click against that affiliate (and increments `totalClicks`).
3. If that visitor checks out, the stored ref code is sent along with the order (`POST /api/orders`). The backend:
   - Looks up the affiliate by code.
   - For each line item, calculates commission = `price × qty × product.commissionPercent / 100`.
   - Creates a `Commission` record per line item, a `Transaction` record, and updates the affiliate's
     `totalConversions`, `totalEarnings`, and `balance`.
   - Marks the matching click(s) as `converted: true`.

Everything downstream (seller's "affiliate-driven sales" view, affiliate's commission history, admin's affiliate
performance table) reads from these `Commission`/`Transaction`/`Affiliate` records — there's a single source of
truth for the whole ledger.

## 6. Roles & access control

- Registration lets someone sign up as `customer`, `seller`, or `affiliate` (never `admin` — create that manually
  in MongoDB or promote a user's `role` field by hand for your first admin).
- Sellers start `status: "pending"` and cannot create products until an admin approves them from
  **Admin → Users**.
- Every protected route checks both a valid JWT (`protect` middleware) and role (`authorize(...)` middleware) on
  the backend — the frontend's route guards are a UX convenience, not the security boundary.

## 7. Password reset

Forgot-password is fully implemented, not just scaffolded:

- `POST /api/auth/forgot-password` — accepts an email, always returns the same generic success message whether
  or not that email has an account (prevents attackers from using this endpoint to discover which emails are
  registered), rate-limited to 5 requests per 15 minutes per IP.
- A random 32-byte token is generated, only its SHA-256 **hash** is stored on the user document with a 30-minute
  expiry (so a database leak alone can't be used to reset anyone's password), and the raw token is emailed as a
  link to `/reset-password/:token`.
- `POST /api/auth/reset-password/:token` — hashes the incoming token, looks up a user with a matching hash whose
  expiry hasn't passed, and updates the password. The token is single-use (cleared immediately after success).

**Email delivery:** if `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` aren't set in `backend/.env`, reset emails aren't sent —
instead, the full email content (including the reset link) is printed to the backend's console, so you can copy
the link out of the terminal and test the whole flow with zero email provider setup. Any standard SMTP provider
works once you're ready (Gmail app password, SendGrid, Mailgun, Postmark, Amazon SES, etc.) — just fill in the
`SMTP_*` variables.

## 8. Payments (real Stripe integration)

Checkout now uses **Stripe Elements** end to end, with the backend as the single source of truth for what actually
counts as "paid":

1. On the checkout page, `POST /api/orders/create-payment-intent` is called with the cart contents. The backend
   **recomputes the total from real product prices in the database** — it never trusts a client-supplied amount —
   and creates a Stripe PaymentIntent for that exact figure.
2. The frontend renders Stripe's `<PaymentElement>` (card fields, plus wallets like Apple Pay/Google Pay if enabled
   in your Stripe dashboard) and calls `stripe.confirmPayment()` when the customer submits.
3. Once Stripe confirms the charge succeeded client-side, the frontend calls `POST /api/orders` with the resulting
   `paymentIntentId`. The backend **independently re-verifies with Stripe** (`paymentIntents.retrieve`) that the
   PaymentIntent exists, has `status: "succeeded"`, matches the expected amount in cents, and belongs to the
   requesting user — only then is the order created, stock deducted, and commissions calculated. A client can't
   just POST `stripePaymentIntentId: "fake"` and get a free order.
4. A **Stripe webhook** (`POST /api/webhooks/stripe`) is also wired up as a safety net: if a customer's payment
   succeeds but their tab closes before step 3 completes, Stripe still notifies the backend directly and the
   matching order (once created) gets reconciled to `paid`.

### Required setup

Backend `.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Frontend `.env.local`:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

To test webhooks locally, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```
This prints a `whsec_...` value to use as `STRIPE_WEBHOOK_SECRET` for local testing.

**Test card:** `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

### Demo mode (no Stripe keys)

If `STRIPE_SECRET_KEY` isn't set, the backend logs a loud console warning and orders are auto-marked "paid"
without real payment collection — this is intentional so you can demo the full flow without a Stripe account, but
**the checkout page also shows the customer a visible banner saying payments aren't really being collected.** Do
not deploy to real customers in this state.

Because payments are isolated in `backend/config/stripe.js` plus the verification logic in `orderController.js`,
swapping providers (PayPal, Paddle, etc.) means replacing that config file and the two verification/creation call
sites — nothing in the affiliate/commission engine needs to change.

## 9. What's included vs. what to harden before production

**Included and working end to end:**
- JWT auth + RBAC across 4 roles
- Full product CRUD with Cloudinary image upload
- Cart → checkout → **real Stripe payment collection**, server-verified before order creation → automatic
  commission calculation
- Affiliate link generation + click tracking + conversion attribution
- Seller, Affiliate, Customer, and Admin dashboards with real charts (Recharts) backed by MongoDB aggregation
  pipelines
- Seller approval workflow, commission-rate overrides (admin), inventory overview, transaction ledger
- **Transactional email notifications** (order confirmation, seller approval/rejection, commission earned, payout
  processed) — see section 11
- **Admin payout action** for affiliate balances — see section 11
- **Bot protection on registration** (honeypot + rate limiting + optional reCAPTCHA v3) — see section 11
- **Terms of Service, Privacy Policy, and Refund Policy pages** with a required consent checkbox at registration
  and checkout — see section 11
- Dark/light mode, responsive layout, wishlist (localStorage), search/filter/sort/pagination on the marketplace

**Recommended before going live:**
- Add refresh tokens / shorter JWT expiry + rotation
- Server-side pagination hardening / rate limiting tuning for your traffic
- Input validation library (e.g. `zod`/`express-validator`) on top of the Mongoose-level checks already present
- **Replace every `[bracketed placeholder]` in the legal pages with your real business details, and have an
  attorney review them** — see section 11 for what's still a placeholder
- Real product photography (seed data ships with neutral stock placeholders — see section 11)
- Deploy to real infrastructure (Vercel for frontend, Render/Railway/VPS for backend, MongoDB Atlas for the
  database) with real HTTPS domains before pointing the live Stripe keys at it

---

## 10. Recently added: notifications, payouts, photos, bot protection

### Email notifications
Four events now trigger an email via the same SMTP config described in section 7:
- **Order confirmation** → sent to the customer immediately after a successful checkout
- **Commission earned** → sent to the affiliate the moment their referral converts into a paid order
- **Seller approved / rejected** → sent to the seller when an admin makes a decision on their application
- **Payout processed** → sent to the affiliate when an admin marks their balance as paid out (see below)

All four reuse `backend/utils/emailTemplates.js` for consistent styling, and all four are fire-and-forget — a
failed email is logged to the console but never fails the underlying action (an order still completes even if
the confirmation email bounces).

### Admin payout action
**Admin → Affiliates** now has a **Pay out** button on any affiliate with a positive balance. Clicking it:
1. Marks all of that affiliate's outstanding `Commission` records as `paid`
2. Zeroes their `balance` and adds the amount to `totalPaid`
3. Records a `payout` `Transaction` for the ledger
4. Emails the affiliate a payout confirmation

**Important:** this button records that a payout happened — it does **not** move real money. There's no
Stripe/PayPal payout API wired up (Stripe Connect, for instance, would be the real path for that, and requires
each affiliate to onboard a connected account). Make sure you've actually sent the money via bank transfer,
PayPal, etc. *before* clicking this button, or your ledger will say "paid" for a payout that never happened.

### Real product photos
The seed script now assigns each product a deterministic photo from Picsum (`picsum.photos/seed/<slug>/800/800`)
instead of a gray placehold.co box with text on it. These are real photographs, license-free, no attribution
required — but they're **neutral stock placeholders, not literal photos of each product** (there's no free,
reliably-licensed source of an actual photo of, say, your specific "4 Bed Doors" listing). Before a real launch,
replace them with real product photography using the seller dashboard's working Cloudinary upload (Seller →
Products → New/Edit → upload images) — that part of the pipeline was already fully functional.

### Bot protection on registration
Three layers, each degrading gracefully if unconfigured:
1. **Honeypot field** — a hidden `companyWebsite` input on the register form that's invisible to real users
   (off-screen, not in tab order) but frequently auto-filled by bots. Non-empty on submit → silent rejection.
   Always active, no configuration needed.
2. **Rate limiting** — registration is capped at 10 requests per hour per IP (`backend/routes/authRoutes.js`),
   separate from the global API rate limit. Always active.
3. **reCAPTCHA v3** (optional) — set `RECAPTCHA_SECRET_KEY` (backend) and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
   (frontend) to add Google's invisible bot-scoring on top of the above. Get keys at
   [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin) (choose v3). Without these set, only
   layers 1 and 2 apply — registration still works normally, just without the extra scoring.

---

## 11. Legal pages (Terms, Privacy, Refund Policy)

Three policy pages ship at `/terms`, `/privacy`, and `/refund-policy`, linked from the footer on every page. Both
the registration form and the checkout page require checking a consent box (linking to the relevant policies)
before the account/order can be created — the button stays disabled until it's checked, and the backend request
is blocked client-side either way.

**These are starting templates, not legal advice.** Each page opens with a visible banner saying exactly that.
Before using them for real:

1. **Replace every `[bracketed placeholder]`** — company name, support/privacy emails, governing jurisdiction,
   refund window length, minimum payout threshold, etc. Search the three files in `app/terms/page.js`,
   `app/privacy/page.js`, and `app/refund-policy/page.js` for `[` to find them all.
2. **Have a qualified attorney review them**, especially the liability/indemnification sections and anything
   related to consumer protection law in the jurisdictions you actually operate in — this varies significantly
   by state and country and generic templates don't cover it correctly.
3. **Note the one flagged implementation gap:** the Refund Policy describes affiliate commission reversal on a
   refunded order, but the codebase doesn't yet have an automated endpoint that processes a Stripe refund and
   reverses the associated commission in one step. Today that's a manual process (issue the Stripe refund
   directly, then adjust the affiliate's balance/commission status via the admin panel or database). Worth
   automating before order volume makes manual reversal impractical.

---

## 12. Sample products seeded

| Product | Price | Stock |
|---|---|---|
| 4 Bed Doors | $680 | 985 |
| Bluetooth Speaker | $49.99 | 1,729 |
| Boat | $490 | 984 |
| Cotton T-Shirt | $19.99 | 1,823 |
| Denim Jeans | $49.99 | 1,555 |
| Digital Gold | $500 | 760 |
| Hand Sanitizer 500ml | $5.99 | 70 |
| Laptop | $490 | 405 |
| LED Desk Lamp | $34.99 | 1,887 |
| Mineral Water 1L | $1.99 | 194 |
| Invoice #BVA4MAT1-0003 | $867 | 781 |
| Organic Coffee 250g | $12.99 | 53 |
| Smart Phone | $380 | 2,808 |
| USB-C Cable 2m | $9.99 | 93 |
