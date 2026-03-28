const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const { globalErrorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const authRoutes    = require('./routes/v1/auth.routes');
const userRoutes    = require('./routes/v1/user.routes');
const accountRoutes = require('./routes/v1/account.routes');
const {
  categoryRouter: categoryRoutes,
  txRouter: transactionRoutes,
  recurRouter: recurringRoutes,
  budgetRouter: budgetRoutes,
  goalRouter: goalRoutes,
  dashRouter: dashboardRoutes,
  reportRouter: reportRoutes,
} = require('./routes/v1/routes');

const app = express();

// ─── Security ─────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Disable CSP for dev (re-enable in prod with proper config)
}));

// ─── CORS FIX: Allow localhost + production origins ───
app.use(cors({
  origin: (origin, callback) => {
    // Always allow requests with no origin (mobile apps, curl, Postman, same-origin)
    if (!origin) return callback(null, true);

    const allowedEnv = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5000')
      .split(',')
      .map(o => o.trim());

    // Always allow localhost in development
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

    if (allowedEnv.includes(origin) || isLocalhost) {
      return callback(null, true);
    }

    console.warn('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────
app.use(morgan('dev'));

// ─── Static Files ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// ─── Serve Frontend Build (No Vite needed) ────────────
// Place your frontend/dist folder inside backend as "public"
// Run: npm run build in frontend, then copy dist → backend/public
const frontendPath = path.join(__dirname, '../public');
app.use(express.static(frontendPath));

// ─── Health Check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FinVault API is running', timestamp: new Date() });
});

// ─── API Routes ───────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`,         authRoutes);
app.use(`${API}/user`,         userRoutes);
app.use(`${API}/accounts`,     accountRoutes);
app.use(`${API}/categories`,   categoryRoutes);
app.use(`${API}/transactions`, transactionRoutes);
app.use(`${API}/recurring`,    recurringRoutes);
app.use(`${API}/budgets`,      budgetRoutes);
app.use(`${API}/goals`,        goalRoutes);
app.use(`${API}/dashboard`,    dashboardRoutes);
app.use(`${API}/reports`,      reportRoutes);

// ─── Frontend Catch-all (SPA support) ─────────────────
// Must be AFTER API routes — sends index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next(); // Let API 404 handler handle it
  const indexFile = path.join(frontendPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) next(); // Frontend not built yet, continue to 404 handler
  });
});

// ─── Error Handling ───────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;
