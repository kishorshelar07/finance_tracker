# FinVault — Personal Finance Tracker

> Full-stack production-grade finance tracker built with React.js + Node.js + MongoDB

![FinVault](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js) ![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb)

---

## 🚀 Demo Credentials
```
URL:      http://localhost:5173
Email:    demo@finvault.app
Password: Demo@1234
```

---

## 📁 Project Structure

```
finvault/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # db.js, email.js, multer.js, seed.js
│   │   ├── controllers/       # auth, user, account, transaction, controllers.js
│   │   ├── middleware/        # auth.js, validate.js, rateLimiter.js, errorHandler.js
│   │   ├── models/            # User, Account, Category, Transaction, models.js
│   │   ├── routes/v1/         # auth, user, account, routes.js
│   │   ├── jobs/              # recurringJob.js (node-cron)
│   │   └── app.js
│   ├── uploads/               # Uploaded files
│   ├── .env.example
│   └── server.js
│
└── frontend/                  # React.js + Vite
    ├── src/
    │   ├── api/               # axios.js, index.js (all API services)
    │   ├── components/
    │   │   ├── charts/        # 6 Chart.js chart components
    │   │   ├── forms/         # TransactionForm, AccountForm, BudgetForm, GoalForm...
    │   │   ├── layout/        # Sidebar, Header, AppLayout, MobileTabBar
    │   │   └── ui/            # Modal, Avatar, Badge, Skeleton, StatCard, Pagination...
    │   ├── context/           # AuthContext (JWT + auto-refresh)
    │   ├── hooks/             # useAccounts, useTransactions, useDashboard, useBudgets...
    │   ├── pages/             # Landing, Auth, Dashboard, Transactions, Accounts...
    │   ├── constants/         # CHART_COLORS, ACCOUNT_TYPES, CURRENCIES, FREQUENCIES
    │   ├── utils/             # formatCurrency, formatDate, relativeTime, helpers
    │   ├── App.jsx            # Router + Auth Guards
    │   └── index.css          # Complete design system (CSS variables)
    └── vite.config.js
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
git clone <repo>
cd finvault

# Backend
cd backend
npm install
cp .env.example .env   # Edit with your values

# Frontend
cd ../frontend
npm install
```

### 2. Configure Backend `.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/finvault
JWT_ACCESS_SECRET=your_access_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```

### 3. Seed Demo Data

```bash
cd backend
npm run seed
```

### 4. Start Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

App runs at: **http://localhost:5173**

---

## ✨ Features

### Authentication
- JWT access token (15 min) + refresh token (7 days, httpOnly cookie)
- Email OTP verification (6-digit, 10 min expiry)
- "Remember me" — extends refresh to 30 days
- Forgot/reset password via email link
- Auto-silent token refresh with retry queue

### Dashboard
- Real-time stats: Total Balance, Income, Expenses, Net Savings, Savings Rate %
- Month-over-month % change indicators
- **8 interactive Chart.js charts:**
  - Income vs Expense (grouped bar, 6 months)
  - Expense Breakdown (doughnut with center total)
  - Cash Flow Trend (area chart, 30 days)
  - Monthly Savings Trend vs Goal (line chart, 12 months)
  - Top Spending Categories (horizontal bar)
  - Account Balances (bar chart)
  - Budget Utilization (progress bars)
- Period filter: This Month / Last Month / Last 3 Months / This Year

### Transactions
- Add/Edit/Delete with account balance auto-adjustment
- Group by date (Today / Yesterday / DD MMM YYYY)
- Inline expand — full details, edit, delete
- Filter by period, type, search (debounced)
- Export CSV / Excel (.xlsx)
- Bulk delete
- Receipt upload (image/PDF, max 5MB)
- Pagination (20 per page)

### Accounts
- Types: Bank, Cash, Credit Card, Wallet, Investment
- Custom color per account
- Archive / Restore
- Inter-account Transfer (updates both balances)
- Cannot delete account with transactions

### Budgets
- Per-category monthly/weekly/yearly budgets
- Color-coded progress (green → yellow → red at 50%/80%/100%)
- "Over Budget!" badge
- Days remaining in current period
- Email alerts at 50%, 75%, 90%, 100%

### Savings Goals
- Animated SVG ring progress
- Contribution tracking with history timeline
- Confetti 🎉 animation on 100% completion
- Estimated completion based on contribution rate

### Recurring Transactions
- Daily/Weekly/Monthly/Yearly auto-creation
- Pause/Resume/Delete
- node-cron daily midnight IST job
- Email notification on auto-creation

### Reports
- Monthly summary: Income, Expenses, Savings, Rate
- Category breakdown table with % of total
- Top 5 largest expenses
- Export CSV/Excel/PDF

### Settings
- Profile: name, email, avatar upload, income, savings goal %, currency
- Security: change password, delete account (type DELETE to confirm)
- Preferences: email notifications toggles

---

## 🔐 Security Features

- Bcrypt password hashing (rounds: 12)
- JWT access + httpOnly refresh cookie
- Rate limiting: 10 req/15min auth, 100 req/15min API
- Helmet.js security headers
- CORS restricted to frontend origin
- Input validation on all routes (express-validator)
- All DB queries scoped to `req.user._id`
- File type + size validation
- Refresh token stored in DB (revokable)
- SQL injection prevention via Mongoose

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Framer Motion |
| State | Custom hooks + Context API |
| Forms | React Hook Form + Zod validation |
| Charts | Chart.js + react-chartjs-2 |
| Styling | Custom CSS (design system) + Bootstrap 5 |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (access + refresh) + bcryptjs |
| Email | Nodemailer |
| Upload | Multer |
| Cron | node-cron |
| Export | ExcelJS (xlsx), native CSV |

---

## 📡 API Reference

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/logout
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

GET    /api/v1/user/profile
PUT    /api/v1/user/profile
PUT    /api/v1/user/password
DELETE /api/v1/user/account

GET    /api/v1/accounts
POST   /api/v1/accounts
PUT    /api/v1/accounts/:id
DELETE /api/v1/accounts/:id
PATCH  /api/v1/accounts/:id/archive
POST   /api/v1/accounts/transfer

GET    /api/v1/transactions?period=&type=&search=&page=
POST   /api/v1/transactions
PUT    /api/v1/transactions/:id
DELETE /api/v1/transactions/:id
POST   /api/v1/transactions/bulk-delete
GET    /api/v1/transactions/export?format=csv|xlsx

GET    /api/v1/budgets
POST   /api/v1/budgets
PUT    /api/v1/budgets/:id
DELETE /api/v1/budgets/:id

GET    /api/v1/goals
POST   /api/v1/goals
POST   /api/v1/goals/:id/contribute
GET    /api/v1/goals/:id/contributions

GET    /api/v1/dashboard/stats?period=
GET    /api/v1/dashboard/charts/income-expense
GET    /api/v1/dashboard/charts/category-breakdown
GET    /api/v1/dashboard/charts/cash-flow
GET    /api/v1/dashboard/charts/savings-trend
GET    /api/v1/dashboard/charts/accounts

GET    /api/v1/reports/monthly?month=&year=
```
