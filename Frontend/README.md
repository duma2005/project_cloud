# FilmConsensus (IMDb-style movie review + rating aggregator)

A production-ready Next.js 14 (App Router) + TypeScript + TailwindCSS + Prisma/PostgreSQL web app focused on **aggregating ratings from multiple sources** (TMDb metadata + OMDb Ratings + optional Rotten Tomatoes key).

## Features

- Search movies with autocomplete (debounced)
- Lists: Trending / Top Rated / Upcoming
- Discover with filters (genre, year)
- Movie detail page: Overview, Cast, Ratings (aggregated) + **Consensus score**
- Cached data in PostgreSQL via Prisma (tmdbId as primary key)
- Server caching + revalidation + basic rate limiting for API routes
- SEO: metadata, OG/Twitter, canonical, sitemap.xml, robots.txt
- Schema.org JSON-LD: WebSite, Organization, Movie, BreadcrumbList
- Contact form with validation + mock API

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- TailwindCSS
- PostgreSQL + Prisma

## Requirements

- Node.js 18.17+ (recommended Node 20)
- PostgreSQL database (for Prisma cache)
- FastAPI backend running (provides Trakt + OMDb integration)

## Setup

1) Install deps

```bash
cd film-consensus
npm install
```

2) Configure environment

Create `.env` from `.env.example` and fill values. Point `BACKEND_API_URL` to your FastAPI server.
Optional: set `DATABASE_SCHEMA` if you want Prisma/Backend to target a non-default Postgres schema (use a schema name like `seed_test`, not a URL).

3) Start backend

```bash
cd ../Backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/python -m uvicorn main:app --reload --port 8000
```

The backend should have `TRAKT_CLIENT_ID` and `OMDB_API_KEY` configured.
Next.js proxies `/backend/*` to this server using `BACKEND_API_URL`.

4) Prisma

```bash
npx prisma generate
npm run db:push
```

## Seed data (optional)

If you want an easy way to replace catalog data, use the JSON seed file at `prisma/seed-data.json`.
Set `SEED_DATA_PATH` if you want to point to a different JSON file.

```bash
# Reset the schema (optional, destructive)
SEED_CONFIRM=YES npm run db:schema:reset

# Push Prisma schema into DATABASE_SCHEMA
npm run db:push

# Seed data (non-destructive)
npm run db:seed

# Replace all seed data (drop + push + seed)
SEED_CONFIRM=YES npm run db:reset

# Validate seed
npm run db:validate
```

## Import test4.sql (optional)

If you want to use `Backend/test4.sql` as the seed source, convert it to JSON and import it:

```bash
# Convert only (outputs prisma/seed-test4.json)
npm run db:test4:convert

# Convert + reset schema + seed + validate
SEED_CONFIRM=YES npm run db:test4:import
```

Env overrides:

```bash
# Custom input/output paths
TEST4_SQL_PATH=../Backend/test4.sql TEST4_OUTPUT_PATH=./prisma/seed-test4.json npm run db:test4:convert

# Optional: derive imdbScore from imdb_rank for sorting
IMDB_SCORE_FROM_RANK=true SEED_CONFIRM=YES npm run db:test4:import
```

5) Run dev

```bash
npm run dev
```

Open http://localhost:3000

## Quick Run (Summary)

```bash
# Terminal 1 (backend)
cd Backend
./.venv/bin/python -m uvicorn main:app --reload --port 8000

# Terminal 2 (frontend)
cd film-consensus
npm run dev
```

## React Grab integration (dev only)

The React Grab integration is loaded only when `NODE_ENV=development`.
To disable it, remove the `<Script>` block in `src/app/layout.tsx` or run the app in production mode.

## Build / Start

```bash
npm run build
npm run start
```

## Deploy (Vercel)

- Set env vars in Vercel project settings
- Use a hosted Postgres (Neon/Supabase/Railway)
- Ensure `DATABASE_URL` points to pooled connection if required
- Deploy normally (Next.js)

## Notes on legal/data usage

- No HTML scraping.
- Trakt API is used for metadata.
- OMDb API is used for Ratings array (often includes IMDb/Metacritic and sometimes Rotten Tomatoes).
- Rotten Tomatoes API integration is **optional** and only enabled if you provide a valid key; otherwise RT fields show `Not available`.

## Cron / Refresh

- Ratings are stored with TTL (default 24h).
- Data is refreshed on-demand when stale.
- Optional cron endpoint can be called by an external scheduler (e.g. Vercel Cron).

---

Assumptions and details are documented in the project files.
