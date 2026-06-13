# BONU Member Services Platform

Digital platform for Botswana Nurses Union member registration, subscriptions, service applications, payments, and CSR/back-office processing.

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase Auth, database, storage, and row level security
- Stripe Checkout for membership subscriptions, premiums, and service payments

## Included Screens

- `/` operations-first platform overview
- `/portal` member self-service dashboard
- `/back-office` CSR and admin workbench
- `/auth/login` Supabase-ready login screen
- `/api/payments/create-checkout` Stripe Checkout session endpoint
- `/api/payments/webhook` Stripe webhook endpoint

## Source Documents

The supplied BONU PDFs were copied into `docs/` and converted to text for implementation reference:

- `docs/Pega Blueprint - BONU Member Services Platform.pdf`
- `docs/Botswana Nurses Union.pdf`
- `docs/pega-blueprint.txt`
- `docs/botswana-nurses-union.txt`

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply `lib/db/schema.sql` in the Supabase SQL editor, then add the Supabase and Stripe credentials to `.env.local`.
Create a private Supabase Storage bucket named `member-documents` for member document uploads, or set `SUPABASE_MEMBER_DOCUMENTS_BUCKET` to your bucket name.

When `STRIPE_SECRET_KEY` is not set, checkout posts redirect back to the member portal in demo mode.

## Development Admin Login

After applying `lib/db/schema.sql` and setting `NEXT_PUBLIC_SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, run:

```bash
npm run seed:admin
```

Default development credentials:

- Email: the value configured in `SEED_ADMIN_EMAIL`
- Password: the value configured in `SEED_ADMIN_PASSWORD`

Then log in at `/auth/login`. The seeded admin email is confirmed automatically for development.

## Forgot Password

In Supabase, add this redirect URL under **Authentication > URL Configuration > Redirect URLs**:

```text
http://localhost:3000/auth/callback
```

For production, add the same path on your live domain.

## Complaints Module Migration

If you already applied the original schema before the complaints module was added, run:

```sql
-- Supabase SQL editor
-- paste and run lib/db/migrations/001-admin-complaints.sql
```
