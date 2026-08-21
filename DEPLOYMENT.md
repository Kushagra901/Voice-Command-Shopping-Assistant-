# Deployment Guide

Step-by-step deployment instructions for **Vercel** (client), **Render** (server), and **Turso** (database).

> **Do not deploy until the security review passes.** This guide assumes you have accounts on all three platforms (all have free tiers).

---

## 1. Database — Turso

### Setup

1. Install the Turso CLI:
   ```bash
   # macOS/Linux
   curl -sSfL https://get.tur.so/install.sh | bash

   # Windows (via scoop)
   scoop install turso
   ```

2. Sign up and authenticate:
   ```bash
   turso auth signup    # or: turso auth login
   ```

3. Create a database:
   ```bash
   turso db create voice-shopping-assistant
   ```

4. Get your connection credentials:
   ```bash
   # Database URL
   turso db show voice-shopping-assistant --url
   # Output: libsql://voice-shopping-assistant-<your-username>.turso.io

   # Auth token
   turso db tokens create voice-shopping-assistant
   # Output: eyJhbGci... (save this securely!)
   ```

5. Seed the remote database:
   ```bash
   # Set env vars temporarily for seeding
   export TURSO_DATABASE_URL="libsql://voice-shopping-assistant-<your-username>.turso.io"
   export TURSO_AUTH_TOKEN="eyJhbGci..."

   npm --prefix server run db:seed
   ```

   You should see: `Seeded demo data successfully: 4 list items, 28 products, 9 history items.`

---

## 2. Backend — Render

### Setup

1. Push your code to GitHub (the repo at `https://github.com/Kushagra901/voice-command-shopping-assistant.git`)

2. Go to [render.com](https://render.com) → **New** → **Web Service**

3. Connect your GitHub repo

4. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | `voice-shopping-api` |
   | **Region** | Choose closest to your users |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `node dist/index.js` |
   | **Instance Type** | Free |

5. Add **Environment Variables** in the Render dashboard:

   | Variable | Value |
   |----------|-------|
   | `PORT` | `3001` (Render may override this with its own `PORT`) |
   | `NODE_ENV` | `production` |
   | `CLIENT_ORIGIN` | `https://your-app-name.vercel.app` ← Set this AFTER deploying client |
   | `TURSO_DATABASE_URL` | `libsql://voice-shopping-assistant-<your-username>.turso.io` |
   | `TURSO_AUTH_TOKEN` | `eyJhbGci...` (your Turso token) |

6. Click **Create Web Service**

7. Note the deployed URL (e.g., `https://voice-shopping-api.onrender.com`)

> **Important:** Render free tier spins down after 15 minutes of inactivity. First requests after idle will take ~30 seconds to cold-start.

---

## 3. Frontend — Vercel

### Setup

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**

2. Import your GitHub repo

3. Configure the project:

   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Vite |
   | **Root Directory** | `client` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |
   | **Install Command** | `npm install` |

4. Add **Environment Variables** in the Vercel dashboard:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://voice-shopping-api.onrender.com` |

   > **Note:** Currently the client uses a Vite proxy in development. For production, you need to update the API client to use the `VITE_API_URL` environment variable. See the "Production API URL" section below.

5. Click **Deploy**

6. Note the deployed URL (e.g., `https://your-app-name.vercel.app`)

### Production API URL Configuration

Update `client/src/services/api.ts` to use the production API URL:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || "";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  // ... rest of the function
}
```

---

## 4. Post-Deployment: Wire CORS

After both client and server are deployed:

1. **Update Render env var** `CLIENT_ORIGIN` to your Vercel URL:
   ```
   CLIENT_ORIGIN=https://your-app-name.vercel.app
   ```
   The server's CORS middleware reads this and only allows requests from this origin.

2. **Redeploy the Render service** (trigger manual deploy or push a commit).

3. **Verify CORS** by opening your Vercel URL and checking the browser console for CORS errors. The server should accept requests only from your Vercel domain.

---

## 5. Deployment Verification Checklist

After deployment, verify each endpoint:

```bash
# Health check
curl https://voice-shopping-api.onrender.com/api/health

# List items
curl https://voice-shopping-api.onrender.com/api/shopping-list

# Parse a voice command
curl -X POST https://voice-shopping-api.onrender.com/api/shopping-list/parse-command \
  -H "Content-Type: application/json" \
  -d '{"text": "Add milk", "execute": true}'

# Search products
curl "https://voice-shopping-api.onrender.com/api/products/search?q=milk"

# Get suggestions
curl https://voice-shopping-api.onrender.com/api/suggestions

# Get categories
curl https://voice-shopping-api.onrender.com/api/categories
```

---

## Environment Variables Summary

### Render (Backend)
| Variable | Required | Example |
|----------|----------|---------|
| `PORT` | No | `3001` |
| `NODE_ENV` | Yes | `production` |
| `CLIENT_ORIGIN` | Yes | `https://your-app.vercel.app` |
| `TURSO_DATABASE_URL` | Yes | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Yes | `eyJhbGci...` |

### Vercel (Frontend)
| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | Yes | `https://voice-shopping-api.onrender.com` |

### Turso (Database)
No env vars needed on Turso itself — it's configured via CLI. The credentials are set on Render.

---

## Security Notes

- **CORS** is locked to `CLIENT_ORIGIN` (not `*`). Only your Vercel domain can make API requests.
- **No secrets in client code** — the client has no API keys or tokens. All sensitive config lives server-side.
- **`.env` is gitignored** — only `.env.example` (with variable names, no values) is committed.
- **Turso auth tokens** should be rotated periodically via `turso db tokens create`.
