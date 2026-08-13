# Deploying Affiliate Marketplace Pro to production

This walks through getting the app live on a real domain, end to end. It uses a stack that's free or
near-free to start and requires no server administration:

- **Database:** MongoDB Atlas (managed, free tier available)
- **Backend API:** Render (or Railway/Fly.io — notes for alternatives included)
- **Frontend:** Vercel (built by the same team as Next.js; zero-config for this kind of app)

Total time if you're doing this for the first time: roughly 45–60 minutes, most of it waiting for deploys.

> **Before you start:** commit this project to a Git repository (GitHub, GitLab, or Bitbucket). Both Render and
> Vercel deploy by connecting to a repo — that's the easiest path. If you'd rather not use Git, both platforms
> also support a CLI-based/manual deploy, noted below where relevant.

---

## 0. Architecture at a glance

```
                 ┌─────────────────────┐
  Browser  ───▶  │  Vercel (frontend)  │   your-store.com
                 │  Next.js app        │
                 └──────────┬──────────┘
                             │ HTTPS API calls
                             ▼
                 ┌─────────────────────┐
                 │  Render (backend)   │   api.your-store.com
                 │  Express API        │
                 └──────────┬──────────┘
                             │
                             ▼
                 ┌─────────────────────┐
                 │  MongoDB Atlas      │
                 │  (managed database) │
                 └─────────────────────┘
```

Three independent pieces, each with its own env vars. The frontend never talks to MongoDB directly — only the
backend does — so the only thing the frontend needs to know is the backend's public URL.

---

## 1. Set up MongoDB Atlas (the database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Create a new **free (M0) cluster**. Pick any cloud provider/region close to where you'll host the backend.
3. **Database Access** (left sidebar) → **Add New Database User**. Create a username/password (not your Atlas
   login — a separate database-only credential). Save the password somewhere safe; you'll need it in step 3.
4. **Network Access** (left sidebar) → **Add IP Address**. For simplicity, choose **Allow Access From Anywhere**
   (`0.0.0.0/0`) — Render/Railway use dynamic IPs on the free tier, so a fixed IP allowlist isn't practical there.
   This is safe because access still requires the database username/password from step 3.
5. Go back to **Database** → **Connect** → **Drivers**. Copy the connection string — it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Add your database name to the path before the `?`, e.g.:
   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/affiliate_marketplace_pro?retryWrites=true&w=majority
   ```
   This full string is your production `MONGO_URI`. Keep it handy for step 3.

---

## 2. Get production API keys ready

Gather these now so you're not context-switching mid-deploy:

- **Stripe:** [dashboard.stripe.com](https://dashboard.stripe.com) → toggle out of test mode (top-right) →
  Developers → API keys. Copy the **Secret key** (`sk_live_...`) and **Publishable key** (`pk_live_...`). You can
  also stay in test mode for a soft launch — test keys (`sk_test_.../pk_test_...`) work identically in
  production, they just don't move real money.
- **Cloudinary:** [cloudinary.com/console](https://cloudinary.com/console) → your Cloud name, API key, API
  secret are on the dashboard home page.
- **SMTP (email):** any provider works — SendGrid, Mailgun, Postmark, Amazon SES, or a Gmail app password for
  low volume. You need a host, port, username, and password.

---

## 3. Deploy the backend (Render)

1. Push this project to a GitHub repo if you haven't already.
2. Go to [render.com](https://render.com), sign up, and click **New +** → **Web Service**.
3. Connect your GitHub account and select the repo.
4. Configure the service:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (fine to start; upgrade later for no cold-starts)
5. Under **Environment Variables**, add every variable from `backend/.env.example`, with real production values:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` (Render sets its own `PORT` automatically, but keeping this doesn't hurt) |
   | `MONGO_URI` | the Atlas connection string from step 1 |
   | `JWT_SECRET` | generate a new long random string — **don't reuse the dev one**. Run `openssl rand -hex 32` locally to generate one. |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | your frontend's URL once deployed, e.g. `https://your-store.vercel.app` (you can update this after step 5 once you know the real URL) |
   | `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from step 2 |
   | `STRIPE_SECRET_KEY` | from step 2 |
   | `STRIPE_WEBHOOK_SECRET` | leave a placeholder for now — you'll get the real value in step 6 |
   | `DEFAULT_COMMISSION_PERCENT` | `20` |
   | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | from step 2 |

6. Click **Create Web Service**. Render will build and deploy — watch the logs. Once live, you'll get a URL like
   `https://affiliate-marketplace-pro-backend.onrender.com`.
7. Verify it's actually up: visit `https://<your-render-url>/api/health` in a browser — you should see
   `{"success":true,"status":"ok"}`.

### Alternative: Railway

Railway works almost identically — **New Project** → **Deploy from GitHub repo** → set root directory to
`backend` → add the same environment variables → Railway auto-detects `npm start`. Railway's free tier has usage
credits rather than a fixed free plan, worth checking current pricing.

---

## 4. Seed the production database (one time)

You need at least an admin account and, if you want the same demo catalog, the sample products. **The seed
script wipes all existing data**, so only run it once, immediately after this first deploy, before any real
users sign up.

The easiest way: temporarily run it from your own machine pointed at the production database.

```bash
cd backend
# Use the PRODUCTION Mongo URI here, not your local one:
MONGO_URI="mongodb+srv://...atlas connection string..." npm run seed
```

This creates the demo accounts (including `admin@marketplace.test`). **Immediately log in and change the admin
password** (or better, go into Atlas and manually edit that user's role/email if you'd rather not have a
publicly-known admin login on a live site). For a real launch, consider skipping the seed script's demo accounts
entirely and instead register your own account normally, then promote it to `admin` directly in Atlas:

1. Atlas → Browse Collections → `affiliate_marketplace_pro` → `users`.
2. Find your user document, edit the `role` field from `"customer"` to `"admin"`, save.

---

## 5. Deploy the frontend (Vercel)

1. Go to [vercel.com](https://vercel.com), sign up, click **Add New** → **Project**.
2. Import the same GitHub repo.
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js (auto-detected)
4. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | your Render backend URL + `/api`, e.g. `https://affiliate-marketplace-pro-backend.onrender.com/api` |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | the `pk_...` key from step 2 |

5. Click **Deploy**. Once done, you'll get a URL like `https://affiliate-marketplace-pro.vercel.app`.

### Close the loop: update CORS

Go back to Render → your backend service → Environment → update `CLIENT_URL` to the real Vercel URL from step 5,
then **manually redeploy** the backend so it picks up the change. Without this, the browser will block API
requests from your frontend with a CORS error.

---

## 6. Wire up the Stripe webhook for production

1. [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks → **Add endpoint**.
2. Endpoint URL: `https://<your-render-url>/api/webhooks/stripe`
3. Select events to listen for: `payment_intent.succeeded` and `payment_intent.payment_failed`.
4. After creating it, Stripe shows a **Signing secret** (`whsec_...`) — copy it.
5. Back in Render → Environment → set `STRIPE_WEBHOOK_SECRET` to that value → redeploy.

---

## 7. Point a real domain at it (optional but recommended)

**Frontend (Vercel):** Project → Settings → Domains → add `www.yourdomain.com` (and `yourdomain.com` with a
redirect). Vercel gives you DNS records (usually a CNAME) to add at your domain registrar. SSL/HTTPS is issued
automatically once DNS propagates — no extra steps.

**Backend (Render):** Service → Settings → Custom Domain → add `api.yourdomain.com`, follow the CNAME instructions
Render gives you. Also automatic HTTPS.

Once both are live on your real domain, update:
- Render's `CLIENT_URL` → `https://www.yourdomain.com`
- Vercel's `NEXT_PUBLIC_API_URL` → `https://api.yourdomain.com/api`
- Stripe webhook endpoint URL → `https://api.yourdomain.com/api/webhooks/stripe` (create a new endpoint or edit
  the existing one; the signing secret will change if you create a new one — update `STRIPE_WEBHOOK_SECRET`
  accordingly)

Redeploy both services after changing env vars.

---

## 8. Post-deploy smoke test

Walk through the whole flow for real, on the live URL, before telling anyone it's ready:

1. Register a new customer account.
2. Browse the marketplace, view a product.
3. Add to cart, go to checkout, pay with a real Stripe test card (`4242 4242 4242 4242`) if you're using test
   keys, or a real card in a small amount if you're live.
4. Confirm the order appears in **Dashboard → Orders** for that customer.
5. Log in as the admin account, confirm the order appears in **Admin → Orders** and the revenue stat updated.
6. Register a seller account, confirm it shows as "pending" in **Admin → Users**, approve it, confirm the seller
   can now create a product.
7. Register an affiliate account, generate a link for a product, open it in an incognito window, complete a
   purchase as a different customer account, confirm the commission shows up under **Affiliate → Commissions**.
8. Trigger a password reset on the live site and confirm the email actually arrives (not just logs to a console
   you can't see anymore — this is the one thing that behaves differently between local dev and production).

If all of that works, you're genuinely live.

---

## 9. Ongoing operational notes

- **Backups:** Atlas's free M0 tier doesn't include automated backups. If this is a real business, upgrade to at
  least an M10 cluster ($/month) for continuous backups, or set up your own periodic `mongodump` export.
- **Cold starts:** Render's free tier spins down after inactivity and takes ~30–60 seconds to wake up on the
  next request. Fine for a demo; upgrade to a paid instance before real customer traffic so checkout doesn't
  time out.
- **Logs/monitoring:** Render and Vercel both have built-in log viewers under each project's dashboard — check
  those first if something breaks in production. Consider adding a proper error-tracking service (Sentry is a
  common free-tier choice) before scaling up.
- **Secrets rotation:** if `JWT_SECRET` is ever exposed, rotate it immediately — this invalidates every existing
  login token, forcing everyone to log in again, which is the correct trade-off for a leaked secret.
