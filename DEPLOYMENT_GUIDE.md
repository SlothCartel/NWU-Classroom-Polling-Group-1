# Cloud Deployment Setup

This document outlines the changes made to prepare the NWU Classroom Polling application for cloud deployment on Azure App Service (backend) and Vercel (frontend).

## ✅ Changes Implemented

### 1. Backend API Changes (Azure App Service Ready)

#### Environment Configuration
- **Updated CORS handling**: Now reads from `CORS_ORIGIN` or `FRONTEND_URL` environment variables
- **Enhanced Socket.IO CORS**: Configured to use environment variables for allowed origins
- **Improved logging**: Shows allowed origin in startup logs

#### Files Modified:
- `apps/api/src/app.ts`: Updated CORS middleware to use environment variables
- `apps/api/src/server.ts`: Enhanced logging for deployment debugging
- `apps/api/src/services/socketService.ts`: Updated Socket.IO CORS configuration
- `apps/api/.env.example`: Added `CORS_ORIGIN` environment variable
- `apps/api/Dockerfile`: Fixed entry point to use `server.js`
- `apps/api/package.json`: Added `@types/node` dependency

#### Environment Variables for Azure:
```bash
DATABASE_URL=your_neon_connection_string
CORS_ORIGIN=https://your-vercel-app.vercel.app
JWT_SECRET=your_production_secret
PORT=8080
NODE_ENV=production
```

### 2. Frontend Changes (Vercel Ready)

#### Build Configuration
- **Updated Vite config**: Proper server and build settings for production
- **Modified build script**: Separated type checking from build process
- **Enhanced Socket.IO**: Added polling fallback for better Azure compatibility

#### Files Modified:
- `apps/web/vite.config.ts`: Added proper server port and build configuration
- `apps/web/src/lib/socket.ts`: Added polling transport fallback
- `apps/web/package.json`: Separated build and type checking
- `apps/web/.env.example`: Created environment variable example

#### Environment Variables for Vercel:
```bash
VITE_API_BASE_URL=https://your-api-name.azurewebsites.net/api
```

## 🚀 Deployment Steps

### 1. Azure App Service (Backend)

1. **Create App Service**:
   - Runtime: Node 20 LTS
   - Deployment method: GitHub (connect to your repo)
   - Branch: `main` (deploy from main after merging changes)

2. **Configure Environment Variables** in Azure Portal:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   JWT_SECRET=your-super-secure-jwt-secret
   PORT=8080
   NODE_ENV=production
   ```

3. **Database Setup** (Neon.tech recommended):
   - Create PostgreSQL database on Neon.tech
   - Copy connection string to `DATABASE_URL`
   - Run migrations: `npx prisma migrate deploy`

### 2. Vercel (Frontend)

1. **Import Project**:
   - Connect GitHub repository
   - Set root directory: `apps/web`
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Configure Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-api-name.azurewebsites.net/api
   ```

## 🔧 Local Development

The changes are backward compatible with local development:

1. **API (.env)**:
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nwupoll
   CORS_ORIGIN=http://localhost:5173
   JWT_SECRET=your_local_secret
   PORT=8080
   ```

2. **Frontend (.env.local)**:
   ```bash
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

## ✅ Verification Steps

1. **Local Build Test**:
   ```bash
   cd apps/api && npm run build
   cd apps/web && npm run build
   ```

2. **Production Verification**:
   - API health check: `https://your-api.azurewebsites.net/api/health`
   - Frontend loads: `https://your-app.vercel.app`
   - Socket.IO connects (check browser DevTools Network tab)
   - CORS allows frontend domain

## 🛠 Technical Notes

### Socket.IO Configuration
- Added both websocket and polling transports for Azure compatibility
- CORS properly configured for cross-origin connections
- Authentication token passed in connection handshake

### Build Optimizations
- Frontend build separated from TypeScript checking for faster CI/CD
- API Dockerfile optimized for production deployment
- Health check endpoints available for container monitoring

### Environment Variable Priority
- `CORS_ORIGIN` takes precedence over `FRONTEND_URL`
- Falls back to localhost for development
- Clear logging shows which origin is being used

## 📝 Merge Instructions

1. Test locally to ensure everything works
2. Merge `deploy-setup` branch to `main`
3. Deploy backend to Azure App Service from `main` branch
4. Deploy frontend to Vercel from `main` branch
5. Update environment variables in both platforms
6. Test end-to-end functionality
