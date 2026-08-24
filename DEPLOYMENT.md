# 🚀 Production Deployment Manual

Complete step-by-step instructions for deploying the **Voice Command Shopping Assistant** across major hosting environments:
- **Option A (Zero-Cost Default):** [Vercel (Client) + Render (Server) + Turso (Database)](#option-a-zero-cost-edge-stack-recommended)
- **Option B (Google Cloud / Firebase):** [Firebase Hosting (Client) + Cloud Run (Server) + Turso (Database)](#option-b-google-cloud--firebase-stack)
- **Option C (Amazon Web Services):** [AWS Amplify / S3 (Client) + AWS App Runner / ECS (Server) + Turso (Database)](#option-c-amazon-web-services-aws-stack)
- **Option D (Docker Container):** [Self-Hosted Multi-Stage Docker Container](#option-d-docker-container-deployment)

---

## 🎙️ Critical Browser Voice & Microphone Prerequisite: HTTPS

> **IMPORTANT:** Browser security standards mandate that the **Web Speech API (`SpeechRecognition`)** and **Web Audio API (`AudioContext`)** can only access the microphone over:
> 1. `https://` secure domains (e.g., `https://your-app.vercel.app`, `https://your-app.web.app`)
> 2. `http://localhost` (local development)
>
> All deployment options below automatically provide free SSL/TLS certificates and serve over HTTPS.

---

## Option A: Zero-Cost Edge Stack (Recommended)

### 1. Database — Turso (libSQL over HTTP)

1. **Install Turso CLI:**
   ```bash
   # macOS/Linux
   curl -sSfL https://get.tur.so/install.sh | bash

   # Windows (Scoop / PowerShell)
   scoop install turso
   # Or visit https://turso.tech/app to create via browser dashboard
   ```

2. **Authenticate & Create Database:**
   ```bash
   turso auth login
   turso db create voice-shopping-assistant
   ```

3. **Retrieve Credentials:**
   ```bash
   turso db show voice-shopping-assistant --url
   # Output: libsql://voice-shopping-assistant-<username>.turso.io

   turso db tokens create voice-shopping-assistant
   # Output: eyJhbGci... (Save securely)
   ```

4. **Seed Remote Turso Database:**
   ```bash
   export TURSO_DATABASE_URL="libsql://voice-shopping-assistant-<username>.turso.io"
   export TURSO_AUTH_TOKEN="eyJhbGci..."
   npm --prefix server run db:seed
   ```

---

### 2. Backend — Render (Node.js Web Service)

1. Connect your repository on [render.com](https://render.com) → **New** → **Web Service** (or use the included `render.yaml` Blueprint).
2. Configure settings:
   - **Root Directory:** (leave blank / root)
   - **Build Command:** `npm ci && npm --prefix shared run build && npm --prefix server run build`
   - **Start Command:** `node server/dist/index.js`
   - **Instance Type:** Free
3. Add Environment Variables in the Render dashboard:
   ```env
   NODE_ENV=production
   PORT=3001
   CLIENT_ORIGIN=https://your-app.vercel.app
   TURSO_DATABASE_URL=libsql://voice-shopping-assistant-<username>.turso.io
   TURSO_AUTH_TOKEN=eyJhbGci...
   ```
4. Click **Create Web Service** and copy your backend URL (e.g., `https://voice-shopping-api.onrender.com`).

---

### 3. Frontend — Vercel (React Single Page App)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import your GitHub repository.
3. Configure settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   ```env
   VITE_API_URL=https://voice-shopping-api.onrender.com
   ```
5. Click **Deploy**. Vercel uses `client/vercel.json` for SPA rewrites, caching, and security headers.
6. **Final Step:** Update Render's `CLIENT_ORIGIN` env var to match your Vercel URL (`https://your-app.vercel.app`) to lock CORS.

---

## Option B: Google Cloud / Firebase Stack

### 1. Backend on Google Cloud Run (Containerized Express)

1. Build and push the Docker image to Google Container Registry / Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT-ID]/voice-shopping-api
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy voice-shopping-api \
     --image gcr.io/[PROJECT-ID]/voice-shopping-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production,CLIENT_ORIGIN=https://[PROJECT-ID].web.app,TURSO_DATABASE_URL="libsql://...",TURSO_AUTH_TOKEN="..."
   ```
3. Copy the generated Service URL (e.g. `https://voice-shopping-api-xxxx.a.run.app`).

### 2. Frontend on Firebase Hosting

1. Build the production client bundle with your Cloud Run API URL:
   ```bash
   export VITE_API_URL="https://voice-shopping-api-xxxx.a.run.app"
   npm --prefix shared run build
   npm --prefix client run build
   ```
2. Deploy via Firebase CLI using the included `firebase.json`:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting   # Select existing project, set public dir to client/dist
   firebase deploy --only hosting
   ```
3. The app is instantly live with global CDN caching and HTTPS.

---

## Option C: Amazon Web Services (AWS) Stack

### 1. Backend on AWS App Runner / ECS

1. Build the multi-stage `Dockerfile`:
   ```bash
   docker build -t voice-shopping-api .
   ```
2. Authenticate and push to Amazon ECR:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin [ACCOUNT-ID].dkr.ecr.us-east-1.amazonaws.com
   docker tag voice-shopping-api:latest [ACCOUNT-ID].dkr.ecr.us-east-1.amazonaws.com/voice-shopping-api:latest
   docker push [ACCOUNT-ID].dkr.ecr.us-east-1.amazonaws.com/voice-shopping-api:latest
   ```
3. Create an **AWS App Runner** service pointing to the ECR image with Port `3001` and environment variables.

### 2. Frontend on AWS Amplify / S3 + CloudFront

1. In AWS Amplify Console, select **Host web app** → connect Git repo.
2. Set build settings:
   - App root: `client`
   - Build command: `npm run build`
   - Output directory: `client/dist`
   - Environment variables: `VITE_API_URL=https://[app-runner-id].us-east-1.awsapprunner.com`

---

## Option D: Docker Container Deployment

You can run the entire backend container on any VPS (DigitalOcean, Hetzner, AWS EC2, Linode):

```bash
# Build production image
docker build -t voice-shopping-assistant .

# Run container with environment variables
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e CLIENT_ORIGIN=https://your-frontend-domain.com \
  -e TURSO_DATABASE_URL="libsql://your-db.turso.io" \
  -e TURSO_AUTH_TOKEN="your-token" \
  --name voice-shopping-api \
  voice-shopping-assistant
```

---

## 🔍 Post-Deployment Verification Checklist

Run these curls against your deployed backend URL:

```bash
# 1. Check health & database connection mode
curl https://your-deployed-api.com/api/health

# 2. Check shopping list retrieval
curl https://your-deployed-api.com/api/shopping-list

# 3. Test voice command parsing
curl -X POST https://your-deployed-api.com/api/shopping-list/parse-command \
  -H "Content-Type: application/json" \
  -d '{"text": "Add 2 bottles of milk", "execute": true}'

# 4. Test catalog search
curl "https://your-deployed-api.com/api/products/search?q=milk"

# 5. Test smart suggestions
curl https://your-deployed-api.com/api/suggestions
```

---

## 🛡️ Security & CORS Checklist

| Security Control | Implementation | Verification |
| :--- | :--- | :--- |
| **Strict Origin Locking** | `cors({ origin: allowedOrigin })` in `server/src/app.ts` | Disallows untrusted origins outside `CLIENT_ORIGIN`. |
| **Zero Client Secrets** | No API keys or tokens in frontend client bundles | Client uses browser Web Speech API with 0 paid keys. |
| **Encrypted Edge Transport** | HTTPS enforced across Vercel, Cloud Run, Firebase, AWS | Enables browser microphone capture & protects transit. |
| **Turso Auth Tokens** | Bearer tokens stored in server-only environment variables | Database inaccessible without valid auth tokens. |
