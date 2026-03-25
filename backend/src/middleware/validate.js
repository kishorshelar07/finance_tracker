const { validationResult, body, query, param } = require('express-validator');
const AppError = require('../utils/AppError');

// Run validations and return errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return next(new AppError(messages.join('. '), 400));
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  validate,
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ─── Transaction Validators ───────────────────────────
const transactionValidator = [
  body('type').isIn(['income', 'expense', 'transfer']).withMessage('Invalid transaction type'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('accountId').isMongoId().withMessage('Invalid account ID'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('description').optional().trim().isLength({ max: 200 }),
  validate,
];

// ─── Account Validators ───────────────────────────────
const accountValidator = [
  body('name').trim().notEmpty().withMessage('Account name is required').isLength({ max: 50 }),
  body('type').isIn(['cash', 'bank', 'credit_card', 'wallet', 'investment']).withMessage('Invalid account type'),
  body('balance').optional().isFloat().withMessage('Balance must be a number'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex color'),
  validate,
];

// ─── Budget Validators ────────────────────────────────
const budgetValidator = [
  body('categoryId').isMongoId().withMessage('Invalid category ID'),
  body('amountLimit').isFloat({ min: 1 }).withMessage('Budget limit must be positive'),
  body('period').isIn(['weekly', 'monthly', 'yearly']).withMessage('Invalid period'),
  validate,
];

// ─── Goal Validators ──────────────────────────────────
const goalValidator = [
  body('name').trim().notEmpty().withMessage('Goal name is required'),
  body('targetAmount').isFloat({ min: 1 }).withMessage('Target amount must be positive'),
  body('deadline').optional().isISO8601().withMessage('Valid deadline date required'),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  transactionValidator,
  accountValidator,
  budgetValidator,
  goalValidator,
};
