# NodeMind — Autonomous Code Review Engine

NodeMind is an AI-powered code review and vulnerability analysis platform built with a high-performance React 19 frontend and an Express 5 backend integrated with Supabase.

---

## ⚡ Quickstart Guide (Run on Any System)

Follow these steps to clone and run NodeMind locally on Windows, macOS, or Linux.

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ LTS recommended) — [Download Node.js](https://nodejs.org/)
- **Git**: Installed and configured — [Download Git](https://git-scm.com/)
- **npm**: v9 or higher (bundled with Node.js)

Verify your installations:
```bash
node -v
npm -v
git -v
```

---

### 2. Clone the Repository
```bash
git clone https://github.com/ushashwat909/NodeMind.git
cd NodeMind
```

---

### 3. Install All Dependencies
Install root, client, and server dependencies in one command:
```bash
npm run install:all
```
*(Or install manually: `npm install && npm install --prefix client && npm install --prefix server`)*

---

### 4. Configure Environment Variables

The repository includes `.env.example` templates in both `client/` and `server/`.

#### Client Configuration (`client/.env`)
Create `client/.env` by copying `client/.env.example`:

**macOS / Linux**:
```bash
cp client/.env.example client/.env
```

**Windows (PowerShell)**:
```powershell
Copy-Item client/.env.example client/.env
```

Edit `client/.env`:
```env
# Supabase project URL & publishable anon key
VITE_SUPABASE_URL=https://byztyberaoyczdaffbbe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enR5YmVyYW95Y3pkYWZmYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjA4NjMsImV4cCI6MjEwNjc5Njg2M30.VLd4yVlRrA5OtAmHx1fb8I5xWHPgPw6kluSALCJY8Bg

# API Server URL (leave empty in dev to use Vite proxy, or set http://localhost:3001)
VITE_API_URL=http://localhost:3001
```

#### Server Configuration (`server/.env`)
Create `server/.env` by copying `server/.env.example`:

**macOS / Linux**:
```bash
cp server/.env.example server/.env
```

**Windows (PowerShell)**:
```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env`:
```env
# Supabase Configuration
SUPABASE_URL=https://byztyberaoyczdaffbbe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enR5YmVyYW95Y3pkYWZmYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjA4NjMsImV4cCI6MjEwNjc5Njg2M30.VLd4yVlRrA5OtAmHx1fb8I5xWHPgPw6kluSALCJY8Bg
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=120
```

> **Note**: For local development and reviews, `SUPABASE_SERVICE_ROLE_KEY` is optional; standard user-authenticated actions and reviews use the client-scoped Supabase JWT.

---

### 5. Start the Development Servers

Run both the frontend and backend concurrently from the project root:
```bash
npm run dev
```

Once running:
- **Client (Frontend)**: [http://localhost:5173](http://localhost:5173)
- **Server (API)**: [http://localhost:3001](http://localhost:3001)
- **API Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 🛠️ Running Services Separately (Optional)

If you prefer separate terminal windows:

### Frontend Only:
```bash
npm run dev:client
# or: cd client && npm run dev
```

### Backend Only:
```bash
npm run dev:server
# or: cd server && npm run dev
```

---

## 🗄️ Setting Up Your Own Supabase Instance (Optional)

If you want an isolated database instead of the shared instance:
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open [`supabase/migrations/20261006000000_core_schema.sql`](./supabase/migrations/20261006000000_core_schema.sql) and execute the SQL script. This sets up:
   - `repositories` table with RLS policies
   - `review_jobs` table
   - `review_findings` table
   - Helper indexes, enum types, and triggers
4. Update `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` in your `.env` files with your project credentials from **Project Settings > API**.

---

## 🧪 Testing & Verification

Run backend unit and integration tests:
```bash
npm test --prefix server
```

Build production client assets:
```bash
npm run build:client
```

---

## 🔍 Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `EADDRINUSE: port 3001 already in use` | Another process is using port 3001 | Kill the process or set `PORT=3002` in `server/.env` and `VITE_API_URL=http://localhost:3002` in `client/.env`. |
| `Missing Supabase environment variables` | `client/.env` or `server/.env` is missing | Ensure you copied `.env.example` to `.env` in both `client/` and `server/`. |
| `fetch failed / ECONNREFUSED` on review | Backend server isn't running | Run `npm run dev` from root so both client and server start together. |
| Node version warnings | Using older Node.js (< 18) | Upgrade Node.js using [nvm](https://github.com/nvm-sh/nvm) or download latest LTS from [nodejs.org](https://nodejs.org). |