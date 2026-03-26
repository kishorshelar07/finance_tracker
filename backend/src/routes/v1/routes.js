// ─── category.routes.js ───────────────────────────────
const express = require('express');
const { protect } = require('../../middleware/auth');
const ctrl = require('../../controllers/controllers');

const categoryRouter = express.Router();
categoryRouter.use(protect);
categoryRouter.get('/', ctrl.getCategories);
categoryRouter.post('/', ctrl.createCategory);
categoryRouter.put('/:id', ctrl.updateCategory);
categoryRouter.delete('/:id', ctrl.deleteCategory);
module.exports.categoryRouter = categoryRouter;

// ─── transaction.routes.js ────────────────────────────
const txRouter = express.Router();
const txCtrl = require('../../controllers/transaction.controller');
const { upload, csvUpload } = require('../../config/multer');
const { transactionValidator } = require('../../middleware/validate');

txRouter.use(protect);
txRouter.get('/', txCtrl.getTransactions);
// BUG FIX: Static routes (/export, /import-csv, /bulk-delete) MUST come
// BEFORE the /:id param route, otherwise Express matches them as id="export" etc.
txRouter.get('/export', txCtrl.exportTransactions);
txRouter.post('/import-csv', csvUpload.single('file'), txCtrl.importCSV);
txRouter.post('/bulk-delete', txCtrl.bulkDelete);
// Dynamic :id routes come LAST
txRouter.post('/', upload.single('receipt'), transactionValidator, txCtrl.createTransaction);
txRouter.get('/:id', txCtrl.getTransaction);
txRouter.put('/:id', upload.single('receipt'), txCtrl.updateTransaction);
txRouter.delete('/:id', txCtrl.deleteTransaction);
module.exports.txRouter = txRouter;

// ─── recurring.routes.js ──────────────────────────────
const recurRouter = express.Router();
recurRouter.use(protect);
recurRouter.get('/', ctrl.getRecurring);
recurRouter.post('/', ctrl.createRecurring);
// BUG FIX: /:id/pause and /:id/resume MUST come BEFORE /:id
// Otherwise PUT /:id matches first and Express never reaches /:id/pause
recurRouter.put('/:id/pause', ctrl.pauseRecurring);
recurRouter.put('/:id/resume', ctrl.resumeRecurring);
// Generic /:id routes come after all specific sub-routes
recurRouter.put('/:id', ctrl.updateRecurring);
recurRouter.delete('/:id', ctrl.deleteRecurring);
module.exports.recurRouter = recurRouter;

// ─── budget.routes.js ─────────────────────────────────
const budgetRouter = express.Router();
const { budgetValidator } = require('../../middleware/validate');
budgetRouter.use(protect);
budgetRouter.get('/', ctrl.getBudgets);
budgetRouter.post('/', budgetValidator, ctrl.createBudget);
budgetRouter.put('/:id', ctrl.updateBudget);
budgetRouter.delete('/:id', ctrl.deleteBudget);
module.exports.budgetRouter = budgetRouter;

// ─── goal.routes.js ───────────────────────────────────
const goalRouter = express.Router();
const { goalValidator } = require('../../middleware/validate');
goalRouter.use(protect);
goalRouter.get('/', ctrl.getGoals);
goalRouter.post('/', goalValidator, ctrl.createGoal);
// BUG FIX: /:id/contribute and /:id/contributions BEFORE /:id
goalRouter.post('/:id/contribute', ctrl.addContribution);
goalRouter.get('/:id/contributions', ctrl.getContributions);
// Generic /:id routes come after
goalRouter.put('/:id', ctrl.updateGoal);
goalRouter.delete('/:id', ctrl.deleteGoal);
module.exports.goalRouter = goalRouter;

// ─── dashboard.routes.js ──────────────────────────────
const dashRouter = express.Router();
dashRouter.use(protect);
dashRouter.get('/stats', ctrl.getDashboardStats);
dashRouter.get('/charts/income-expense', ctrl.getIncomeExpenseChart);
dashRouter.get('/charts/category-breakdown', ctrl.getCategoryBreakdown);
dashRouter.get('/charts/cash-flow', ctrl.getCashFlow);
dashRouter.get('/charts/savings-trend', ctrl.getSavingsTrend);
dashRouter.get('/charts/accounts', ctrl.getAccountsChart);
module.exports.dashRouter = dashRouter;

// ─── report.routes.js ─────────────────────────────────
const reportRouter = express.Router();
reportRouter.use(protect);
reportRouter.get('/monthly', ctrl.getMonthlyReport);
module.exports.reportRouter = reportRouter;
