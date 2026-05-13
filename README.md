# ORIZ

Quiet, live menus for fine restaurants. Replaces the paper menu and the restaurant website.

## Stack

- Next.js 16 (App Router) · TypeScript · Tailwind
- Supabase (Postgres + Auth + Realtime), Frankfurt
- Vercel deploy target

## First-time setup

1. Create a Supabase project in the **Frankfurt** region.
2. Copy `.env.local.example` → `.env.local` and fill in the URL + anon key from Supabase → Settings → API.
3. In Supabase → SQL Editor, run in order:
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_realtime.sql`
4. `npm install && npm run dev` and open `http://localhost:3000/admin/login`. Enter your email, click the magic link.
5. Open `supabase/seed.sql`, replace `OWNER_EMAIL` with your auth email, and run it. Refresh `/admin`.
6. Guest menu lives at `http://localhost:3000/oriz-demo`.

## Demo script

- Window A (guest): `/oriz-demo`
- Window B (owner): `/admin`
- Change a price in B → A updates instantly. Toggle "Sold out" → item dims live.

## Out of scope for MVP

`image_url` column exists for the future AI photo pipeline. Telegram bot, gallery, About page, item create/delete are deliberate follow-ups — schema already supports them.
