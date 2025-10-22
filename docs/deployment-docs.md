# NWU Live Poll Deployment Documentation

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Docker Commands](#docker-commands)
3. [Database Migrations](#database-migrations)
4. [Production Deployment](#production-deployment)
5. [VSCode Tunnels Configuration](#vscode-tunnels-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20 or higher (for local development without Docker)
- PostgreSQL client tools (optional, for direct database access)
- Git for version control

### Initial Setup

**1. Clone the Repository**
```bash
git clone https://github.com/FCVenter/NWU-Classroom-Polling-Group-1.git
cd NWU-Classroom-Polling-Group-1
```

**2. Environment Configuration**

Create `.env` file in the root directory:
```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nwupoll

# API Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random_12345678

# Optional: Custom Ports
WEB_PORT=5173
```

Create `apps/api/.env` file:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nwupoll"
JWT_SECRET="your_super_secret_jwt_key_here_make_it_long_and_random_12345678"
PORT=8080
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
FRONTEND_URL="http://localhost:5173"
```

Create `apps/web/.env` file:
```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## Docker Commands

### Starting the Application

**Start all services (detached mode):**
```bash
docker-compose up -d
```

**Start with logs visible:**
```bash
docker-compose up
```

**Start specific service:**
```bash
docker-compose up api
docker-compose up web
docker-compose up db
```

### Stopping the Application

**Stop all services:**
```bash
docker-compose down
```

**Stop and remove volumes (WARNING: deletes database data):**
```bash
docker-compose down -v
```

**Stop specific service:**
```bash
docker-compose stop api
```

### Viewing Logs

**View all logs:**
```bash
docker-compose logs
```

**Follow logs in real-time:**
```bash
docker-compose logs -f
```

**View logs for specific service:**
```bash
docker-compose logs api
docker-compose logs web
docker-compose logs db
```

**View last 100 lines:**
```bash
docker-compose logs --tail=100 api
```

### Container Management

**List running containers:**
```bash
docker-compose ps
```

**Restart a service:**
```bash
docker-compose restart api
```

**Rebuild containers after code changes:**
```bash
docker-compose up --build
```

**Rebuild specific service:**
```bash
docker-compose up --build api
```

**Execute commands in running container:**
```bash
docker-compose exec api sh
docker-compose exec db psql -U postgres -d nwupoll
```

### Cleanup Commands

**Remove stopped containers:**
```bash
docker-compose rm
```

**Remove all containers and networks:**
```bash
docker-compose down
```

**Remove everything including volumes:**
```bash
docker-compose down -v
docker system prune -a
```

---

## Database Migrations

### Prisma Migration Commands

The application uses Prisma as an ORM with PostgreSQL. Migrations track database schema changes over time.

**Navigate to API directory:**
```bash
cd apps/api
```

### Development Migrations

**Create and apply migration (development):**
```bash
npx prisma migrate dev --name description_of_changes
```

This command:
- Creates a new migration file in `prisma/migrations/`
- Applies the migration to the database
- Regenerates Prisma Client

**Apply existing migrations:**
```bash
npx prisma migrate dev
```

**Reset database (WARNING: deletes all data):**
```bash
npx prisma migrate reset
```

This will:
- Drop the database
- Create a new database
- Apply all migrations
- Run seed scripts (if configured)

### Production Migrations

**Deploy migrations to production:**
```bash
npx prisma migrate deploy
```

Use this command for production environments. It applies pending migrations without creating new ones.

### Migration Status and Management

**Check migration status:**
```bash
npx prisma migrate status
```

**Generate Prisma Client (after schema changes):**
```bash
npx prisma generate
```

**View database in Prisma Studio:**
```bash
npx prisma studio
```

Opens a web interface at `http://localhost:5555` to browse and edit database records.

### Existing Migrations

The project includes the following migrations:

1. **20250925084044_auto** - Initial auto-generated migration
2. **20250925084059_init** - Core schema initialization
3. **20250925090114_add_poll_requirements** - Added poll requirements and constraints
4. **20251009012003_cascade_delete_answers** - Cascade delete for answers
5. **20251012163553_add_lobby_entries** - Added lobby entry tracking
6. **20251012165950_add_lobby_entry** - Lobby entry refinements
7. **20251012180546_live_chart_lobby_indexes_and_unique_vote** - Performance indexes and unique constraints
8. **20251012192839_lobbyentry_poll_ondelete_cascade** - Cascade delete for lobby entries

### Direct Database Access

**Connect to PostgreSQL in Docker:**
```bash
docker-compose exec db psql -U postgres -d nwupoll
```

**Common PostgreSQL commands:**
```sql
\dt                  -- List all tables
\d table_name        -- Describe table structure
SELECT * FROM "User" LIMIT 10;
\q                   -- Quit
```

**Backup database:**
```bash
docker-compose exec db pg_dump -U postgres nwupoll > backup.sql
```

**Restore database:**
```bash
docker-compose exec -T db psql -U postgres nwupoll < backup.sql
```

---

## Production Deployment

### Architecture Overview

The application uses a split deployment strategy:
- **Frontend:** Hosted on Vercel (static React build)
- **Backend API:** Hosted via VSCode Tunnels with port forwarding
- **Database:** Can use Neon.tech, Azure PostgreSQL, or other managed PostgreSQL services

### Frontend Deployment (Vercel)

**1. Connect Repository to Vercel**
- Import the GitHub repository in Vercel dashboard
- Set root directory to `apps/web`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

**2. Configure Environment Variables in Vercel**
```bash
VITE_API_BASE_URL=https://zsn02j9r-8080.inc1.devtunnels.ms/api
```

**3. Deploy**
- Vercel automatically builds and deploys on push to main branch
- Custom domains can be configured in project settings

**Local build test:**
```bash
cd apps/web
npm install
npm run build
npm run preview
```

### Backend API Deployment

The API is deployed using VSCode Tunnels for port forwarding, making the local API accessible via a public URL.

**Build and run API locally:**
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

### Database Setup

**Option 1: Neon.tech (Recommended)**
- Create account at neon.tech
- Create new PostgreSQL database
- Copy connection string
- Update `DATABASE_URL` in environment variables

**Option 2: Docker PostgreSQL (Local/Development)**
- Already configured in docker-compose.yml
- Data persists in Docker volume

**Apply migrations to production database:**
```bash
DATABASE_URL="your_production_connection_string" npx prisma migrate deploy
```

---

## VSCode Tunnels Configuration

VSCode Tunnels allows you to expose your local development server to the internet with a secure, authenticated tunnel. This is the current hosting method for the API.

### Setup VSCode Tunnels

**1. Install VSCode (if not already installed)**
```bash
code --version
```

**2. Enable Port Forwarding**
- Open your project in VSCode
- Start the API server (port 8080)
- Open the "Ports" panel (View > Ports, or Ctrl+`)
- Click "Forward a Port"
- Enter port: `8080`
- Right-click the forwarded port and select "Port Visibility > Public"

**3. Get Tunnel URL**
- The forwarded port will show a tunnel URL like:
  ```
  https://zsn02j9r-8080.inc1.devtunnels.ms
  ```
- This URL is publicly accessible and routes to your local port 8080

### Configure CORS for Tunnel

**Update `apps/api/.env`:**
```bash
CORS_ORIGIN="https://nwu-live-poll.vercel.app"
FRONTEND_URL="https://nwu-live-poll.vercel.app"
```

The API automatically allows requests from these domains.

### Current Production Setup

**Frontend URL:** `https://nwu-live-poll.vercel.app`
**API URL:** `https://zsn02j9r-8080.inc1.devtunnels.ms/api`

**API running on local machine:**
```bash
cd apps/api
npm install
npx prisma generate
npm run build
npm start
```

**VSCode Tunnel forwarding port 8080:**
- Public URL: `https://zsn02j9r-8080.inc1.devtunnels.ms`
- Local port: `8080`
- Visibility: Public

### Tunnel Management

**View active tunnels:**
- Check the "Ports" panel in VSCode
- All forwarded ports are listed with their public URLs

**Stop tunnel:**
- Right-click the port in the Ports panel
- Select "Stop Forwarding Port"

**Restart tunnel:**
- Forward the port again
- Note: The tunnel URL may change

**Keep server running:**
```bash
# Use a process manager like PM2
npm install -g pm2
pm2 start npm --name "nwu-api" -- start
pm2 save
pm2 startup
```

### Important Notes

**Tunnel Limitations:**
- Tunnel URL may change if VSCode is restarted
- Requires VSCode to be running
- Network connectivity required
- Free tier has usage limits

**For persistent production hosting, consider:**
- Azure App Service
- AWS EC2 or Elastic Beanstalk
- Heroku
- Railway.app
- Render.com

---

## Troubleshooting

### Docker Issues

**Port already in use:**
```bash
# Find process using port
lsof -i :8080
lsof -i :5173

# Kill process
kill -9 <PID>

# Or change port in .env file
WEB_PORT=5174
```

**Database connection failed:**
```bash
# Check if database is running
docker-compose ps

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

**Cannot connect to Docker daemon:**
```bash
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in
```

### Migration Issues

**Migration failed:**
```bash
# Check migration status
npx prisma migrate status

# Mark migration as applied (if already in DB)
npx prisma migrate resolve --applied <migration_name>

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>
```

**Schema and database out of sync:**
```bash
# Reset development database
npx prisma migrate reset

# Or push schema without migrations
npx prisma db push
```

### API Issues

**500 Internal Server Error:**
- Check API logs: `docker-compose logs api`
- Verify DATABASE_URL is correct
- Ensure migrations are applied

**CORS errors:**
- Verify CORS_ORIGIN matches frontend URL
- Check that frontend is sending requests to correct API URL
- Review browser console for specific CORS error

**WebSocket connection failed:**
- Ensure Socket.io is configured with correct CORS
- Check that WebSocket upgrade is allowed
- Verify authentication token is being sent

### VSCode Tunnel Issues

**Tunnel URL not accessible:**
- Verify port visibility is set to "Public"
- Check that API server is running on correct port
- Restart VSCode and re-forward port

**CORS errors with tunnel:**
- Update CORS_ORIGIN in API environment variables
- Restart API server after changing environment variables
- Verify Vercel environment variables point to current tunnel URL

### General Debugging

**Check environment variables:**
```bash
# In API container
docker-compose exec api printenv | grep DATABASE_URL

# Locally
cd apps/api
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

**Test API health:**
```bash
curl http://localhost:8080/api/health
```

**Test database connection:**
```bash
docker-compose exec api npx prisma db execute --stdin <<< "SELECT 1"
```

**Clear node_modules and reinstall:**
```bash
docker-compose down
docker volume rm nwu-classroom-polling-group-1_api_node_modules
docker-compose up --build
```
