const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { RefreshToken } = require('../models/models');
const AppError = require('../utils/AppError');
const { asyncHandler, success } = require('../utils/helpers');
const { sendEmail } = require('../config/email');

// ─── Token Generators ─────────────────────────────────
const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

const setRefreshCookie = (res, token, rememberMe = false) => {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000   // 30 days
    : 7 * 24 * 60 * 60 * 1000;   // 7 days

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    maxAge,
    path: '/',
  });
};

// ─── Generate OTP ─────────────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─── REGISTER ─────────────────────────────────────────
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('Email already registered.', 409));

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const user = await User.create({
    name,
    email,
    password,
    verificationOTP: otp,
    verificationOTPExpiry: otpExpiry,
    isVerified: false,
  });

  // Send verification email
  try {
    await sendEmail({
      to: email,
      subject: 'Verify your FinVault account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#1A56DB">Welcome to FinVault, ${name}!</h2>
          <p>Your email verification code is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;
               background:#F0F4F8;padding:20px;border-radius:8px;color:#0F172A">${otp}</div>
          <p style="color:#475569">This code expires in <strong>10 minutes</strong>.</p>
        </div>`,
    });
  } catch (e) {
    console.warn('Email send failed (non-blocking):', e.message);
  }

  // Auto-create default categories for new user
  await createDefaultCategories(user._id);

  success(res, { userId: user._id, email: user.email },
    'Registration successful. Check your email for the OTP.', 201);
});

// ─── VERIFY EMAIL OTP ─────────────────────────────────
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId);
  if (!user) return next(new AppError('User not found.', 404));
  if (user.isVerified) return next(new AppError('Email already verified.', 400));

  if (
    user.verificationOTP !== otp ||
    user.verificationOTPExpiry < Date.now()
  ) {
    return next(new AppError('Invalid or expired OTP.', 400));
  }

  user.isVerified = true;
  user.verificationOTP = undefined;
  user.verificationOTPExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  // Issue tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  setRefreshCookie(res, refreshToken);

  success(res, {
    accessToken,
    user: { _id: user._id, name: user.name, email: user.email, currency: user.currency },
  }, 'Email verified successfully.');
});

// ─── LOGIN ────────────────────────────────────────────
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isVerified) {
    // Resend OTP
    const otp = generateOTP();
    user.verificationOTP = otp;
    user.verificationOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    try {
      await sendEmail({ to: email, subject: 'FinVault — New OTP', html: `<p>Your new OTP: <strong>${otp}</strong></p>` });
    } catch (e) { /* non-blocking */ }
    return next(new AppError('Please verify your email first. A new OTP has been sent.', 403));
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  setRefreshCookie(res, refreshToken, rememberMe);

  success(res, {
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      savingsGoalPercent: user.savingsGoalPercent,
      profilePicture: user.profilePicture,
    },
  }, 'Login successful.');
});

// ─── REFRESH TOKEN ────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;
  if (!token) return next(new AppError('No refresh token provided.', 401));

  const stored = await RefreshToken.findOne({ token, isRevoked: false });
  if (!stored || stored.expiresAt < new Date()) {
    return next(new AppError('Refresh token invalid or expired. Please log in.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return next(new AppError('Invalid refresh token.', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('User not found.', 401));

  const newAccessToken = generateAccessToken(user._id);

  success(res, {
    accessToken: newAccessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      profilePicture: user.profilePicture,
    },
  }, 'Token refreshed.');
});

// ─── LOGOUT ───────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
  }
  res.clearCookie('refreshToken', { path: '/' });
  success(res, null, 'Logged out successfully.');
});

// ─── FORGOT PASSWORD ──────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same to prevent enumeration
  if (!user) {
    return success(res, null, 'If that email exists, a reset link has been sent.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: email,
      subject: 'FinVault — Password Reset',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#1A56DB">Reset Your Password</h2>
          <p>Click the button below to reset your password. This link expires in <strong>30 minutes</strong>.</p>
          <a href="${resetURL}" style="display:inline-block;background:#1A56DB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
          <p style="color:#94A3B8;font-size:12px;margin-top:16px">If you didn't request this, please ignore this email.</p>
        </div>`,
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Email could not be sent. Try again later.', 500));
  }

  success(res, null, 'Password reset link sent to your email.');
});

// ─── RESET PASSWORD ───────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Invalid or expired reset token.', 400));

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  // Revoke all refresh tokens
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

  success(res, null, 'Password reset successful. Please log in.');
});

// ─── Helper: Default Categories ───────────────────────
const createDefaultCategories = async (userId) => {
  const Category = require('../models/Category');
  const defaults = [
    { name: 'Food & Dining', type: 'expense', color: '#EF4444', icon: '🍕' },
    { name: 'Transport', type: 'expense', color: '#3B82F6', icon: '🚗' },
    { name: 'Shopping', type: 'expense', color: '#8B5CF6', icon: '🛍️' },
    { name: 'Entertainment', type: 'expense', color: '#F59E0B', icon: '🎬' },
    { name: 'Healthcare', type: 'expense', color: '#10B981', icon: '💊' },
    { name: 'Bills & Utilities', type: 'expense', color: '#6B7280', icon: '💡' },
    { name: 'Rent / EMI', type: 'expense', color: '#DC2626', icon: '🏠' },
    { name: 'Groceries', type: 'expense', color: '#059669', icon: '🛒' },
    { name: 'Education', type: 'expense', color: '#0284C7', icon: '📚' },
    { name: 'Subscriptions', type: 'expense', color: '#7C3AED', icon: '📱' },
    { name: 'Travel', type: 'expense', color: '#0891B2', icon: '✈️' },
    { name: 'Salary', type: 'income', color: '#059669', icon: '💰' },
    { name: 'Freelance', type: 'income', color: '#0284C7', icon: '💻' },
    { name: 'Investment Returns', type: 'income', color: '#D97706', icon: '📊' },
    { name: 'Rental Income', type: 'income', color: '#16A34A', icon: '🏘️' },
    { name: 'Gift / Bonus', type: 'income', color: '#EC4899', icon: '🎁' },
  ];

  const docs = defaults.map(d => ({ ...d, userId, isDefault: true }));
  await Category.insertMany(docs, { ordered: false }).catch(() => {});
};
