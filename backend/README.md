# FinVault Backend — Fixed Setup

## Bugs Fixed
1. **CORS** — Added localhost to allowed origins in `.env` and `app.js`
2. **OTP Email** — Server now logs OTP to console as backup; dev mode returns OTP in response
3. **Resend OTP** — Frontend button now actually calls the API
4. **ResetPassword** — Fixed token extraction from URL params (was using wrong query string)
5. **Single Server (No Vite)** — Express now serves frontend from `public/` folder

---

## Run WITHOUT Vite (Single Server — Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Run server
npm start
# OR for development with auto-reload:
npm run dev

# App runs at: http://localhost:5000
```

Frontend is served from `backend/public/` (copied from frontend/dist).

---

## Run WITH Vite (Two Servers — For Frontend Development)

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# Frontend at: http://localhost:5173
```

After making frontend changes, rebuild and copy to backend:
```bash
cd frontend && npm run build && cp -r dist/* ../backend/public/
```

---

## If OTP Email Doesn't Arrive

1. Check server terminal — OTP is always printed there:
   ```
   ═══════════════════════════════
   📧 OTP for yourname@gmail.com
      OTP:  482916  ← copy this!
   ═══════════════════════════════
   ```

2. In development mode (`NODE_ENV=development`), OTP is also shown on the verify screen automatically.

3. To fix Gmail SMTP:
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Generate a new App Password for "Mail"
   - Update `EMAIL_PASS` in `.env`
