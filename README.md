# RxBox — Family Prescription Manager

A Vercel-ready web app for families to upload prescription photos, extract medicines with AI, and search across all family prescriptions from a shared dashboard.

## Features

- **Shared family dashboard** — Multiple users join one family via invite code; everyone sees the same data
- **Family members** — Add profiles for each person (name, relationship, DOB)
- **Prescription upload** — Photo upload with drag-and-drop or camera capture
- **AI scanning** — OpenAI Vision extracts medicines, doctor name, clinic, date, and diagnosis
- **Global search** — Search medicines, doctors, diagnoses, and family members across the whole family

## Tech Stack

- **Next.js 16** (App Router)
- **PostgreSQL** + Prisma
- **NextAuth** (credentials)
- **OpenAI GPT-4o-mini** (vision)
- **Cloudflare R2** (S3-compatible image storage)

## Quick Start

### 1. Clone and install

```bash
cd family-prescription-box
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Random secret: `openssl rand -base64 32` |
| `OPENAI_API_KEY` | From [OpenAI](https://platform.openai.com) |
| `R2_ENDPOINT` | Cloudflare R2 S3 endpoint |
| `R2_ACCESS_KEY_ID` | R2 API token → S3 credentials |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key |
| `R2_BUCKET_NAME` | R2 bucket name (create in Cloudflare dashboard) |
| `R2_PUBLIC_URL` | Optional public bucket URL (`*.r2.dev`) |

### 3. Set up database

```bash
npx prisma db push
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. **Add environment variables** — see [docs/VERCEL.md](docs/VERCEL.md) for the full list

   Quick sync from your local `.env`:

   ```bash
   npx vercel login
   npx vercel link
   npm run vercel:env -- https://your-app.vercel.app
   ```

4. Create an R2 bucket named `rxbox-prescriptions` in Cloudflare (if not done)
5. Deploy — Vercel runs `prisma generate` via `postinstall`

After first deploy, push the database schema:

```bash
npx prisma db push
```

## How family sharing works

1. **First user** registers and creates a family → receives an **invite code**
2. **Other family members** register using "Join family" with that code
3. All users in the family share the same dashboard, members, and prescriptions

## AI scanning

When you upload a prescription image, the app sends it to OpenAI's vision model which returns structured JSON:

- Doctor name, clinic, date
- Diagnosis and notes
- List of medicines with dosage, frequency, duration, instructions

You can re-scan any prescription from its detail page.

## Project structure

```
src/
  app/
    (app)/          # Authenticated routes
    api/            # REST API
    login/          # Auth pages
  components/       # UI components
  lib/              # Auth, Prisma, AI
  generated/prisma/ # Prisma client
```

## License

MIT
