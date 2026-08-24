# 🔥 Firebase Deployment Guide

This guide walks you through deploying the **Voice Command Shopping Assistant** to **Firebase Hosting** (Frontend) and **Google Cloud Run / Firebase Functions** (Backend Express API), backed by **Turso (Edge SQLite)**.

---

## 🎙️ Why Firebase Hosting for Voice Apps?

1. **Automatic HTTPS:** Browser Web Speech API (`SpeechRecognition`) and Web Audio API (`AnalyserNode`) require an HTTPS origin to capture microphone audio in production. Firebase Hosting provides automatic SSL certificates on all `*.web.app` and `*.firebaseapp.com` domains.
2. **Global Edge CDN:** Sub-millisecond latency for static assets, Web Audio scripts, and PWA Service Worker caching.
3. **Single Command Deploy:** Deploys in seconds using `npm run deploy:firebase`.

---

## 📋 Prerequisites

1. A [Firebase account](https://console.firebase.google.com/) (Google account).
2. A Firebase project created in the console (e.g. `voice-shopping-assistant`).
3. A [Turso database](https://turso.tech/) (free tier).

---

## 🚀 Step 1: Deploy Backend (Google Cloud Run / Container)

The backend Express API runs on Google Cloud Run (which natively integrates with Firebase):

```bash
# 1. Build and push container to Google Artifact Registry
gcloud builds submit --tag gcr.io/[YOUR-FIREBASE-PROJECT-ID]/voice-shopping-api

# 2. Deploy Cloud Run service
gcloud run deploy voice-shopping-api \
  --image gcr.io/[YOUR-FIREBASE-PROJECT-ID]/voice-shopping-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=3001,CLIENT_ORIGIN=https://[YOUR-FIREBASE-PROJECT-ID].web.app,TURSO_DATABASE_URL="libsql://your-db.turso.io",TURSO_AUTH_TOKEN="your-turso-token"
```

*Copy the resulting Cloud Run API URL (e.g., `https://voice-shopping-api-xxxx.a.run.app`).*

> **Alternative (Render / Railway):** You can also run the backend on Render / Railway and point Firebase Hosting to it.

---

## ⚡ Step 2: Build & Deploy Frontend to Firebase Hosting

1. **Log in to Firebase CLI:**
   ```bash
   npx firebase login
   ```

2. **Select your Firebase Project:**
   ```bash
   npx firebase use --add
   # Select your Firebase project and give it an alias (e.g., 'default')
   ```

3. **Set the Backend API Target & Build:**
   ```bash
   # In PowerShell:
   $env:VITE_API_URL="https://voice-shopping-api-xxxx.a.run.app"
   npm run deploy:firebase

   # In Bash / macOS / Linux:
   export VITE_API_URL="https://voice-shopping-api-xxxx.a.run.app"
   npm run deploy:firebase
   ```

Firebase will upload your optimized production bundle from `client/dist` and output your live URLs:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project/overview
Hosting URL: https://your-project.web.app
```

---

## 🧪 Step 3: Verify Live Deployment

Open your Firebase Hosting URL in Google Chrome / Safari / Edge:

1. **Microphone Permission:** Click the microphone button — your browser will prompt for microphone permission (allowed because Firebase serves over HTTPS).
2. **Spoken Command:** Say *"Add 2 bottles of organic milk"* or Hinglish *"2 packet doodh add karo"*.
3. **Live Waveform:** Observe the 60fps real-time canvas waveform reacting to your voice amplitude.
4. **Command Chips:** Review the parsed intent and quantity chips.
5. **Smart Suggestions:** Check the recommendations tab for auto-suggested complementary items.
6. **Command Palette:** Press `Ctrl+K` to verify keyboard accessibility and action shortcuts.

---

## ⚙️ Configuration Files Reference

- [firebase.json](file:///d:/voice%20commanding/firebase.json) — Configured with SPA rewrite rules (`/index.html`) and 1-year immutable caching for static JS/CSS assets.
- [.firebaserc](file:///d:/voice%20commanding/.firebaserc) — Project alias configuration.
- [Dockerfile](file:///d:/voice%20commanding/Dockerfile) — Multi-stage Alpine container for Google Cloud Run / Docker hosts.
