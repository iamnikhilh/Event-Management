# EventMatrix

Full-stack event management platform for organizers — plan events, manage sessions, sell tickets, track attendees, and publish a public event site.

## Features

- **Organizer dashboard** — events, sessions, sponsors, ticket types, attendees, speakers, analytics
- **Multi-tenant isolation** — organizers only see and manage their own data (JWT-scoped API + Postgres RLS)
- **Public event site** — browse events, event detail pages, registration
- **Auth** — signup, login, JWT access/refresh tokens, role-based access (`admin`, `organizer`, `attendee`)
- **Image uploads** — banner images, speaker photos, sponsor logos (Supabase Storage in production)
- **Analytics** — overview and per-event charts (Recharts)

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite 8, TanStack Router, TanStack Query, Tailwind CSS 4, shadcn/ui |
| Backend | NestJS 10, Drizzle ORM, PostgreSQL |
| Auth | Passport JWT |
| Storage | Supabase Storage (production) / local disk (dev fallback) |
| Deploy | Docker, Render |

## Project structure

```
Event-Management/
├── backend/          # NestJS API (port 4000)
│   ├── src/
│   ├── drizzle/      # SQL migrations
│   └── seed.ts
├── frontend/         # React SPA (port 5173)
│   └── src/routes/   # File-based routes
└── docker-compose.yml
```

## Prerequisites

- **Node.js** 22+ (24.x works on Render)
- **PostgreSQL** (local or hosted — e.g. Supabase, Neon, Render Postgres)
- **Supabase** project (recommended for production image storage)

## Local development

### 1. Clone and install

```bash
git clone <repo-url>
cd Event-Management

cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend environment

Create `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=4000
API_PREFIX=api/v1
FRONTEND_URL=http://localhost:5173

# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/event_management

# JWT (required)
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Supabase — required for production uploads; optional locally (falls back to disk)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=event-images
UPLOAD_STORAGE=auto

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
SMTP_FROM_NAME=EventMatrix
```

### 3. Frontend environment

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

### 4. Database setup

```bash
cd backend
npm run db:push      # apply migrations
npm run db:seed      # seed categories + sample data
```

### 5. Supabase Storage (for images)

1. Open your Supabase project → **Storage**
2. Create a bucket named `event-images` (or match `SUPABASE_STORAGE_BUCKET`)
3. Set the bucket to **public** (or add a policy allowing public read)
4. Do **not** use the S3 endpoint URL in env — use `SUPABASE_URL=https://your-project.supabase.co`

### 6. Run

```bash
# Terminal 1 — API
cd backend
npm run start:dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/api/v1/docs |

## Environment variables reference

### Backend (required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |

### Backend (production uploads)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (keep secret) |
| `SUPABASE_STORAGE_BUCKET` | Bucket name, default `event-images` |
| `UPLOAD_STORAGE` | `auto` (default), `supabase`, or `local` |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base URL, e.g. `https://your-api.onrender.com/api/v1` |

For Docker deployments, you can also set `API_BASE_URL` at container runtime (injected via `runtime-config.js`).

## Scripts

### Backend

```bash
npm run start:dev    # dev server with watch
npm run build        # compile for production
npm run start:prod   # run compiled app
npm run test         # Jest unit + integration tests
npm run db:generate  # generate migration from schema changes
npm run db:push      # run migrations
npm run db:seed      # seed database
```

### Frontend

```bash
npm run dev          # Vite dev server
npm run build        # production build
npm run preview      # preview production build
```

## Docker

```bash
# Build images (set VITE_API_BASE_URL for frontend build)
docker compose up -d
```

Frontend image supports:

- **Build arg:** `VITE_API_BASE_URL`
- **Runtime env:** `API_BASE_URL` (written to `/runtime-config.js` on start)

## Deploying to Render

### Backend web service

- **Build command:** `cd backend && npm install && npm run build`
- **Start command:** `cd backend && npm run start:prod`
- Set all backend env vars (especially `DATABASE_URL`, JWT secrets, Supabase vars)
- `@types/multer` is in `dependencies` so production installs include upload types

### Frontend static site / web service

- **Build command:** `cd frontend && npm install && npm run build`
- Set **`VITE_API_BASE_URL`** to your deployed API URL before build
- Publish the `frontend/dist` directory

### Images in production

- Local `uploads/` folder is **ephemeral** on Render — use Supabase Storage
- Re-upload images after switching to Supabase; old disk uploads are not retained across deploys
- Stored URLs look like:  
  `https://<project>.supabase.co/storage/v1/object/public/event-images/<filename>`

## API documentation

- Interactive docs: `/api/v1/docs` (Swagger) when the backend is running
- Full endpoint reference: [backend/API_ENDPOINTS.md](backend/API_ENDPOINTS.md)

## Testing

```bash
cd backend
npm test
```

Includes organizer isolation tests and scoping unit tests.

## Security notes

- Never commit `.env` files or expose `SUPABASE_SERVICE_ROLE_KEY` / JWT secrets
- Organizers receive **404** (not 403) for cross-tenant resource access
- Public routes still parse JWT when present for scoped list endpoints

## License

UNLICENSED — private project.
