# TEAM_GUIDE.md — NWU Live Poll

> **Goal:** make it trivial for any teammate to run the project locally (Docker-only), understand the layout, and work productively—no guesswork.


> 🚨 **Branching rule (MANDATORY): _NEVER_ push directly to `dev` or `main`.**
> Create a `feature/<name>` branch from `dev`, then open a **Pull Request into `dev`**. Releases happen via **PR from `dev` → `main`** only.

---

## 1) Quick Start (local, Docker-only)

**Prereqs**
- Docker Desktop (Windows/macOS) or Docker Engine (Linux) running.
- Ports free: **8080** (API), **5173** (Web), **5432** (Postgres), **6379** (Redis).

**Do this from the repo root:**

```bash
# 1) First run only — copy environment defaults
cp .env.example .env

# 2) Start everything (build on first run)
docker compose up -d --build

# 3) Verify
# Web UI
open http://localhost:5173        # macOS
# xdg-open http://localhost:5173  # Linux
# start http://localhost:5173     # Windows PowerShell

# API health
curl http://localhost:8080/api/health
```

**Expected:**
- Web (Vite dev server): http://localhost:5173
- API (Express/Node): http://localhost:8080 (root), http://localhost:8080/api/health (JSON OK)
- Postgres (local only): `db:5432` (inside compose) / `localhost:5432` (host)
- Redis (local only): `redis:6379` (inside compose) / `localhost:6379` (host)

> If any service doesn’t start, see **Troubleshooting** at the end.

---

## 2) Project Structure & What Goes Where

> Tree depth shown is **3 levels**; This is a summary of only the important files that we will mostly be working with.

```
.
├── apps
│   ├── api
│   │   ├── Dockerfile
│   │   ├── eslint.config.js
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── prisma
│   │   ├── src
│   │   └── tsconfig.json
│   └── web
│       ├── Dockerfile
│       ├── eslint.config.js
│       ├── index.html
│       ├── package.json
│       ├── package-lock.json
│       ├── postcss.config.js
│       ├── src
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       └── vite.config.ts
├── docker-compose.yml
├── infra
│   └── azure-aca-setup.sh
├── lint-staged.config.cjs
├── package.json
├── package-lock.json
├── README.md
└── TEAM_GUIDE.md
```

### 2.1 `docker-compose.yml`
- **Orchestrates local dev**: Postgres, Redis, API, Web.
- **Healthchecks & dependencies**: API waits for DB/Redis to be ready.
- **Volumes**: persist Postgres data; mount code for API/Web containers.
- **Ports**: API → 8080, Web → 5173, DB → 5432, Redis → 6379.

> **Local dev rule:** run everything via `docker compose`. No global Node/Prisma installs required.

### 2.2 `apps/api` (Backend — Node/TypeScript/Express + Prisma)
```
apps/api
├── Dockerfile                 # Production-friendly image for the API
├── prisma
│   ├── migrations/           # ✅ Commit ALL migration folders
│   └── schema.prisma         # Prisma schema (models, enums)
├── src
│   ├── db.ts                 # PrismaClient init (singleton)
│   └── index.ts              # Express app entrypoint (routes, middleware, server)
├── package.json              # Scripts, deps
└── tsconfig.json             # TS compiler config
```

**Where to put new backend code**
- New endpoints / routers → `apps/api/src/` (create files or folders as needed and import in `index.ts`).
- Database models → edit `apps/api/prisma/schema.prisma`, then **run a migration** (see §3.3).

### 2.3 `apps/web` (Frontend — React + Vite + Tailwind)
```
apps/web
├── Dockerfile                 # Dev-friendly image for Vite server
├── src
│   ├── App.tsx               # Root app component
│   ├── main.tsx              # React bootstrap
│   └── index.css             # Global styles
├── index.html                # Vite HTML entry
├── tailwind.config.ts        # Tailwind setup
├── vite.config.ts            # Vite config (dev server/proxy etc.)
└── package.json              # Scripts, deps
```

**Where to put new frontend code**
- React components, pages, hooks → under `apps/web/src/`.
- API base URL for local dev → set in `.env` as `VITE_API_BASE=http://localhost:8080` (default is fine).

### 2.4 Root files
- `package.json` / `package-lock.json`: Only used if we ever add root-level tooling. Day-to-day, you’ll use app-level `package.json` inside `apps/api` and `apps/web` via Docker.
- `lint-staged.config.cjs`: Pre-commit formatting/lint rules (if enabled in your local Git).

### 2.5 `infra/azure-aca-setup.sh` (Cloud — **Not required for local**)
- Script to create Azure Container Apps env/ACR (on hold). Safe to ignore until further notice.

### 2.6 `.github/workflows/*` (CI/CD — **On hold**)
- `ci.yml`: builds API/Web on PRs (branch rules may apply).
- `build-and-push.yml`: builds and pushes images to ACR on `main` (when enabled).
- `deploy-aca.yml`: manual deploy of API image to Azure (when enabled).

> **Until we resume hosting**: avoid pushing to `main` unless you intend to run CI. Day-to-day work stays on `dev` and feature branches (see §4).

---

## 3) Common Tasks & Commands

> All commands assume you’re at the repo root and Docker is running.

### 3.1 Bring the stack up / down
```bash
# start (build on first run)
docker compose up -d --build

# follow logs (all services)
docker compose logs -f --tail=200

# stop and remove containers + volumes (⚠ wipes DB data)
docker compose down -v
```

### 3.2 Inspecting services
```bash
docker compose ps
docker compose logs -f nwu-db
docker compose logs -f nwu-redis
docker compose logs -f nwu-api
docker compose logs -f nwu-web
```

### 3.3 Prisma: editing models & running migrations (local)
> **Always commit** both `schema.prisma` **and** the created `prisma/migrations/**` to Git.

```bash
# open a shell in the API container
docker compose exec -it nwu-api sh

# inside the container:
npx prisma migrate dev --name <change-name>
npx prisma generate
exit
```

If you only changed TypeScript (not schema), just rebuild the API:
```bash
# recompile inside the API container then restart it
docker compose exec -it nwu-api sh -lc "npm run build"
docker compose restart nwu-api
```

### 3.4 Web: hot reload
Vite dev server in the `web` container watches files. Changes under `apps/web/src` should auto-refresh the browser. If not:
```bash
docker compose restart nwu-web
```

### 3.5 Database resets
> **This deletes local DB data**. Use when you want a clean slate.

```bash
docker compose down -v
docker compose up -d --build
```

---

## 4) Git Workflow (simple & safe)

- **main** → stable, deployable branch (we’re not auto-deploying right now; treat it as “protected”).
- **dev** → integration branch (where team PRs land for local testing).
- **feature/\*** → individual work branches.

**Day-to-day flow**
```bash
# start from dev
git checkout dev
git pull

# create a feature branch
git checkout -b feature/<short-name>

# work, commit, push
git add -A
git commit -m "feat(api): add <thing>"  # or "fix(web): ..." etc.
git push -u origin feature/<short-name>

# open PR: feature/<short-name> -> dev
# get review, CI (if enabled), merge

# release to main (when ready): open PR dev -> main
```

**Commit message hints (optional, but helpful):**
- `feat(api): ...`, `feat(web): ...`, `fix(api): ...`, `docs: ...`, `chore: ...`

> **HARD RULE:** _Never_ push directly to **`dev`** or **`main`**. Use feature branches and open PRs into `dev`. Releases are PRs `dev` → `main`.



**Local guardrail (recommended): block accidental pushes to `dev`/`main`**

Add a repo-managed pre-push hook:

```bash
# scripts/git-hooks/pre-push
#!/usr/bin/env bash
while read local_ref local_sha remote_ref remote_sha; do
  if [[ "$remote_ref" =~ refs/heads/dev || "$remote_ref" =~ refs/heads/main ]]; then
    echo "❌ Direct pushes to 'dev' or 'main' are not allowed. Open a PR instead."
    exit 1
  fi
done
exit 0
```

Enable it (one-time per clone):
```bash
git config core.hooksPath scripts/git-hooks
chmod +x scripts/git-hooks/pre-push
```


---

## 5) Environment Variables (local)

`.env.example` is the source of truth—copy to `.env` once. Common variables:

```
# Shared
NODE_ENV=development
API_PORT=8080
WEB_PORT=5173

# DB (local compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nwupoll

# Prisma (local DB inside compose)
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public

# Web -> local API base
VITE_API_BASE=http://localhost:8080
```

> If you change ports here, update any references (e.g., VITE_API_BASE) and restart the stack.

---

## 6) Coding Standards & Tooling

- **TypeScript everywhere**: keep types strict, prefer explicit return types on public functions.
- **ESLint**: present in both apps (`eslint.config.js`). You can lint inside containers:
  ```bash
  docker compose exec -it nwu-api npm run lint   # if defined in package.json
  docker compose exec -it nwu-web npm run lint
  ```
- **Formatting**: follow the project’s Prettier/ESLint rules (if lint-staged/husky is enabled locally, your staged files will auto-fix).

---

## 7) Troubleshooting (FAQ)

**Q: `Error: port already in use`**
A: Change the port in `.env` (e.g., `API_PORT`, `WEB_PORT`) or stop the conflicting process. Then:
```bash
docker compose down -v && docker compose up -d --build
```

**Q: API builds but my code changes don’t show.**
A: Rebuild inside the container and restart the API:
```bash
docker compose exec -it nwu-api sh -lc "npm run build"
docker compose restart nwu-api
```

**Q: Prisma complains about schema or client.**
A: Re-run inside API container:
```bash
npx prisma generate
npx prisma migrate dev --name <change>
```

**Q: How do I reset the database?**
A:
```bash
docker compose down -v
docker compose up -d --build
```

**Q: Can I run the apps without Docker?**
A: Official path is Docker-only. If you must, install Node 20, Postgres 16, Redis 7 locally and wire env vars yourself—unsupported for the team.

---

## 8) What’s deliberately out of scope (for now)

- **Azure hosting**: scripts/workflows exist but are parked. We’ll enable when we receive more info.
- **Production database**: no cloud DB is configured. Local Postgres only.
- **Secrets**: Do **not** commit `.env`. Keep credentials out of Git.

---

## 9) Contact & Ownership

N/A

---

*Last updated: __04/09/2025__*
