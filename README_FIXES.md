# FinVault — Bug Fixes (v1.1)

## 🔴 Critical Bugs Fixed

---

### Bug 1 — OTP Email पाठवत नाही (3 fixes)

**Files changed:** `backend/.env`, `backend/.env.example`, `backend/src/config/email.js`

#### 1A — `.env` placeholder values
```env
# चुकीचे (placeholder):
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# बरोबर — Gmail App Password:
EMAIL_USER=yourname@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop   ← 16-char App Password
```

**Gmail App Password कसे मिळवायचे:**
1. myaccount.google.com → Security
2. 2-Step Verification → ON
3. "App Passwords" search करा → Mail → Generate
4. 16-digit password copy करा

#### 1B — `EMAIL_FROM` quotes bug
```env
# WRONG — dotenv does NOT strip quotes from values with spaces:
EMAIL_FROM="FinVault <x@gmail.com>"   ← quotes included in string = invalid

# CORRECT — no quotes:
EMAIL_FROM=FinVault <x@gmail.com>
```

#### 1C — Dev fallback (नवीन feature)
SMTP configure नसेल तर OTP terminal मध्ये print होईल:
```
📧 [DEV EMAIL — SMTP NOT CONFIGURED]
   OTP: 482910  ← copy this!
```

---

### Bug 2 — Browser Refresh → Logout होतो

**File:** `frontend/src/context/AuthContext.jsx`

**Root cause:** Page load वर फक्त `localStorage` check होत होतं.
Access token 15 min expire होतो, पण refresh cookie 7 days valid असते.
जुना code refresh token try करत नव्हता — त्यामुळे token expire झाल्यावर user logout होत होता.

**Fix:** Page load वर आधी silent refresh token call करतो.
Cookie valid असेल तर नवीन access token मिळतो — logout नाही.

---

## 🟠 Important Bugs Fixed

---

### Bug 3 — Date Calculations चुकीच्या

**File:** `backend/src/utils/helpers.js` → `getPeriodRange()`

**Root cause:** `now.setHours()` हे `now` object mutate करतो.
`today` case मध्ये mutate झालेला `now` पुढच्या cases मध्ये wrong results देत होता.

**Fix:** प्रत्येक case मध्ये fresh `new Date()` वापरतो — कधीही mutate करत नाही.

---

### Bug 4 — Transaction Edit — File Upload काम करत नाही

**Files:** `frontend/src/api/index.js`, `frontend/src/components/forms/TransactionForm.jsx`

**Root cause:**
- `transactionsApi.update()` JSON पाठवत होता
- Server वर multer middleware आहे जे फक्त `multipart/form-data` parse करतो
- त्यामुळे receipt file update वर कधीच save होत नव्हती

**Fix:** Update API call ला `FormData` पाठवतो (create प्रमाणेच).

---

### Bug 5 — Budget Spending Aggregate — ObjectId Mismatch

**File:** `backend/src/controllers/controllers.js`

**Root cause:** MongoDB aggregation `$match` मध्ये `req.user._id` थेट वापरल्यास
कधी कधी string vs ObjectId comparison mismatch होतो.

**Fix:** Aggregate मध्ये `new mongoose.Types.ObjectId(req.user._id)` वापरतो.

---

### Bug 6 — Demo Login Button काम करत नव्हता

**File:** `frontend/src/pages/Auth.jsx`

**Root cause:** React Hook Form fields DOM manipulation ने update होत नाहीत.
जुना code `document.getElementById('email').value = '...'` करत होता —
हे React state update करत नाही, त्यामुळे form validate होत नव्हता.

**Fix:** `onSubmit()` ला directly demo credentials pass करतो.

---

### Bug 7 — Express Route Ordering (3 routes)

**Files:** `backend/src/routes/v1/routes.js`, `backend/src/routes/v1/account.routes.js`

**Root cause:** Express routes top-to-bottom match होतात.
Static routes (like `/transfer`, `/pause`, `/resume`, `/export`)
जर `/:id` नंतर असतील तर Express त्यांना `id="transfer"` असे match करतो.

**Affected routes:**
- `POST /accounts/transfer` → matched `PUT /accounts/:id` → wrong handler
- `PUT /recurring/:id/pause` → matched `PUT /recurring/:id` → wrong handler
- `GET /transactions/export` → matched `GET /transactions/:id` → wrong handler

**Fix:** Static routes → /:id sub-routes → generic /:id या order मध्ये ठेवले.

---

## 🚀 Setup Instructions

```bash
# 1. Backend
cd finvault/backend
npm install

# 2. .env setup
cp .env.example .env
# .env मध्ये हे बदला:
#   MONGO_URI=mongodb://localhost:27017/finvault
#   EMAIL_USER=your_gmail@gmail.com
#   EMAIL_PASS=your_16_char_app_password

# 3. Seed demo data
npm run seed

# 4. Start backend
npm run dev

# 5. Frontend (new terminal)
cd finvault/frontend
npm install
npm run dev
```

**Demo Login:** `demo@finvault.app` / `Demo@1234`

## Testing Email (Without Gmail Setup)

Email configure न करता OTP console मध्ये दिसेल:
```
📧 [DEV EMAIL — SMTP NOT CONFIGURED]
   OTP: 482910  ← copy this!
```
Register करा → terminal terminal मध्ये OTP पाहा → Verify करा.
