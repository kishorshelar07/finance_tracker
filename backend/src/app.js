const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

const { globalErrorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/v1/auth.routes');
const userRoutes = require('./routes/v1/user.routes');
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
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_URL || 'http://localhost:5173')
      .split(',')
      .map(o => o.trim());
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowed.includes(origin)) return callback(null, true);
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
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Static Files ─────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/exports', express.static(path.join(__dirname, '../exports')));

// ─── Health Check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FinVault API is running', timestamp: new Date() });
});

// ─── API Routes ───────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/user`, userRoutes);
app.use(`${API}/accounts`, accountRoutes);
app.use(`${API}/categories`, categoryRoutes);
app.use(`${API}/transactions`, transactionRoutes);
app.use(`${API}/recurring`, recurringRoutes);
app.use(`${API}/budgets`, budgetRoutes);
app.use(`${API}/goals`, goalRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/reports`, reportRoutes);

// ─── Error Handling ───────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;