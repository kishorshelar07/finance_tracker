// ─── routes/v1/auth.routes.js ─────────────────────────
const express = require('express');
const router = express.Router();
const { register, verifyEmail, login, refreshToken, logout, forgotPassword, resetPassword } = require('../../controllers/auth.controller');
const { registerValidator, loginValidator } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post('/register', authLimiter, registerValidator, register);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/login', authLimiter, loginValidator, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;
