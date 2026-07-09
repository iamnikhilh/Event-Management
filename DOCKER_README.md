# Docker Deployment Guide

This project is configured to run entirely in Docker with PostgreSQL, NestJS backend, and React frontend.

## Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- 2GB+ free disk space
- Ports 3000, 4000, 5432 available

## Quick Start

### 1. Start all services

```bash
cd Event-Management
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5432
- Build and start the backend API on port 4000
- Build and start the frontend on port 3000

### 2. Initialize the database

Run migrations:
```bash
docker-compose exec backend npm run db:push
```

Seed test data (optional):
```bash
docker-compose exec backend npx ts-node seed.ts
```

### 3. Access the application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/api/v1
- **API Docs**: http://localhost:4000/api/v1/docs
- **Database**: postgresql://postgres:postgres@localhost:5432/event_management

## Default Test Credentials

```
Email: admin@example.com
Password: password123
```

## Useful Commands

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Access database directly
```bash
docker-compose exec postgres psql -U postgres -d event_management
```

### Restart services
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Stop all services
```bash
docker-compose down
```

### Rebuild images
```bash
docker-compose up -d --build
```

### Remove all data (careful!)
```bash
docker-compose down -v
```

## Environment Variables

Create a `.env` file in the root directory to override defaults:

```env
# JWT Secrets (generate new ones for production)
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourapp.com
SMTP_FROM_NAME=Your App

# Frontend URL (used in emails)
FRONTEND_URL=http://localhost:3000
```

## Production Deployment

For production, use:

```bash
docker-compose -f docker-compose.yml up -d
```

Then update environment variables in `docker-compose.yml`:

1. Change `NODE_ENV` to `production`
2. Set strong JWT secrets
3. Update `FRONTEND_URL` to your domain
4. Configure SMTP with real credentials
5. Update database credentials (don't use default `postgres:postgres`)

## Troubleshooting

### Backend can't connect to database

```bash
# Check if postgres is running
docker-compose ps

# Check postgres logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres psql -U postgres -d event_management -c "SELECT 1"
```

### Frontend can't reach backend

- Check if backend is running: `docker-compose ps backend`
- Check backend logs: `docker-compose logs backend`
- Verify CORS is enabled in backend

### Port already in use

Change ports in `docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Use 5433 instead of 5432
  backend:
    ports:
      - "4001:4000"  # Use 4001 instead of 4000
  frontend:
    ports:
      - "3001:80"    # Use 3001 instead of 3000
```

### Out of memory

Increase Docker memory limit in Docker Desktop settings.

## Development

For development with hot reload:

```bash
# Terminal 1: Database only
docker-compose up postgres

# Terminal 2: Backend with nodemon
cd backend
npm install
npm run start:dev

# Terminal 3: Frontend with Vite
cd frontend
npm install
npm run dev
```

## Database Migrations

Create a new migration:
```bash
docker-compose exec backend npx drizzle-kit generate
```

Apply migrations:
```bash
docker-compose exec backend npm run db:push
```

## API Documentation

Once running, access Swagger docs at:
- http://localhost:4000/api/v1/docs

## Monitoring

Check service health:
```bash
docker-compose ps
```

Each service has a healthcheck that runs every 30 seconds.
