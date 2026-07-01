# Vercel environment setup

Copy your local `.env` values to Vercel using one of the methods below.

## Required variables

| Variable | Local (`.env`) | Vercel production |
|----------|----------------|-------------------|
| `DATABASE_URL` | Neon connection string | Same as local |
| `AUTH_SECRET` | Your secret | Same as local |
| `AI_PROVIDER` | `gemini`, `openrouter`, `openai`, or `groq` | Same as local |
| `GEMINI_API_KEY` | Google AI Studio API key | Same as local |
| `GEMINI_MODEL` | Optional (default `gemini-2.5-flash`) | Same if set locally |
| `OPENROUTER_API_KEY` | OpenRouter key (if using openrouter) | Same as local |
| `OPENAI_API_KEY` | OpenAI key (if using openai) | Same as local |
| `GROQ_API_KEY` | Groq key (if using groq) | Same as local |
| `R2_ENDPOINT` | Cloudflare R2 endpoint | Same as local |
| `R2_ACCESS_KEY_ID` | R2 access key | Same as local |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | Same as local |
| `R2_BUCKET_NAME` | `rxbox-prescriptions` | Same as local |
| `R2_PUBLIC_URL` | Optional | Same if using public bucket |
| `AUTH_TRUST_HOST` | `true` | `true` |
| `AUTH_URL` | `http://localhost:3000` | `https://your-app.vercel.app` |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://your-app.vercel.app` |
| `RESEND_API_KEY` | Optional — for password reset emails | Same as local |
| `EMAIL_FROM` | Optional — e.g. `RxBox <noreply@yourdomain.com>` | Verified sender in Resend |

> **Important:** `AUTH_URL` and `NEXTAUTH_URL` must be your **site root only** — no path.
>
> - ✅ `https://family-prescription-box.vercel.app`
> - ❌ `https://family-prescription-box.vercel.app/login`
>
> Also use your production domain on Vercel, not `localhost`.

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
