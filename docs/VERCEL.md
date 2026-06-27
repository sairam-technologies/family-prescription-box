# Vercel environment setup

Copy your local `.env` values to Vercel using one of the methods below.

## Required variables

| Variable | Local (`.env`) | Vercel production |
|----------|----------------|-------------------|
| `DATABASE_URL` | Neon connection string | Same as local |
| `AUTH_SECRET` | Your secret | Same as local |
| `OPENAI_API_KEY` | Your OpenAI key | Same as local |
| `R2_ENDPOINT` | Cloudflare R2 endpoint | Same as local |
| `R2_ACCESS_KEY_ID` | R2 access key | Same as local |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | Same as local |
| `R2_BUCKET_NAME` | `rxbox-prescriptions` | Same as local |
| `R2_PUBLIC_URL` | Optional | Same if using public bucket |
| `AUTH_TRUST_HOST` | `true` | `true` |
| `AUTH_URL` | `http://localhost:3000` | `https://your-app.vercel.app` |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://your-app.vercel.app` |

> **Important:** On Vercel, `AUTH_URL` and `NEXTAUTH_URL` must be your **production domain**, not `localhost`.

---

## Option A — Automatic sync (recommended)

Reads your local `.env` and pushes all values to Vercel (production, preview, development).

```bash
# 1. Install dependencies (includes Vercel CLI)
npm install

# 2. Log in and link project (first time only)
npx vercel login
npx vercel link

# 3. Sync .env → Vercel (replace with your actual Vercel URL)
npm run vercel:env -- https://your-app.vercel.app
```

Then redeploy from the Vercel dashboard or run `npx vercel --prod`.

---

## Option B — Vercel dashboard (manual)

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings** → **Environment Variables**
3. Add each variable from the table above
4. Enable for **Production**, **Preview**, and **Development**
5. Redeploy

---

## After first deploy

Run the database schema against Neon (once):

```bash
npx prisma db push
```

If you added the `isPrimary` column later, also run:

```bash
npx tsx scripts/backfill-primary-users.ts
```

---

## Pull env from Vercel to local (optional)

```bash
npx vercel env pull .env.vercel.local
```

This creates a local file with Vercel's values without overwriting your `.env`.
