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

// ─── OTP Email HTML ───────────────────────────────────
const otpEmailHtml = (name, otp, expiryMinutes = 10) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <div style="background:linear-gradient(135deg,#1A56DB,#1e40af);padding:32px 40px;text-align:center">
        <div style="display:inline-block;background:rgba(255,255,255,.15);border-radius:12px;padding:10px 16px;margin-bottom:12px">
          <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">FinVault</span>
        </div>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Verify your email</h1>
      </div>
      <div style="padding:40px">
        <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>${name}</strong>,</p>
        <p style="color:#6b7280;font-size:14px;margin:0 0 28px;line-height:1.6">
          Use the code below to verify your FinVault account. It expires in <strong>${expiryMinutes} minutes</strong>.
        </p>
        <div style="background:#f0f4ff;border:2px dashed #c7d7fe;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:#1A56DB;font-family:monospace">${otp}</div>
          <p style="margin:8px 0 0;color:#6b7280;font-size:12px">Do not share this code with anyone</p>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center">
          If you didn't create a FinVault account, you can safely ignore this email.
        </p>
      </div>
      <div style="background:#f9fafb;padding:16px 40px;border-top:1px solid #f3f4f6;text-align:center">
        <p style="color:#9ca3af;font-size:11px;margin:0">© ${new Date().getFullYear()} FinVault. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

const resetEmailHtml = (name, resetURL) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
      <div style="background:linear-gradient(135deg,#1A56DB,#1e40af);padding:32px 40px;text-align:center">
        <div style="display:inline-block;background:rgba(255,255,255,.15);border-radius:12px;padding:10px 16px;margin-bottom:12px">
          <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px">FinVault</span>
        </div>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">Reset your password</h1>
      </div>
      <div style="padding:40px">
        <p style="color:#374151;font-size:15px;margin:0 0 8px">Hi <strong>${name}</strong>,</p>
        <p style="color:#6b7280;font-size:14px;margin:0 0 28px;line-height:1.6">
          We received a request to reset your password. Click the button below — this link expires in <strong>30 minutes</strong>.
        </p>
        <div style="text-align:center;margin-bottom:28px">
          <a href="${resetURL}" style="display:inline-block;background:#1A56DB;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px">
            Reset Password
          </a>
        </div>
        <p style="color:#6b7280;font-size:12px;word-break:break-all;margin:0">
          Or paste this link: <a href="${resetURL}" style="color:#1A56DB">${resetURL}</a>
        </p>
        <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;text-align:center">
          If you didn't request a password reset, ignore this email — your password won't change.
        </p>
      </div>
    </div>
  </body>
  </html>
`;

// ─── REGISTER ─────────────────────────────────────────
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });

  // BUG FIX: If user exists AND is verified → block (already registered)
  // If user exists but NOT verified → delete old record, let them re-register
  // (their OTP expired or they want a fresh start)
  if (existing) {
    if (existing.isVerified) {
      return next(new AppError('Email already registered. Please login or use Forgot Password.', 409));
    }
    // Unverified user — clean up old record so they can register fresh
    await existing.deleteOne();
  }

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

  // Send verification email — non-blocking (don't fail registration if email fails)
  try {
    await sendEmail({
      to: email,
      subject: 'FinVault — Verify your email',
      html: otpEmailHtml(name, otp, 10),
    });
  } catch (e) {
    // OTP already logged to console by email.js fallback
    console.warn('Register: email send failed (non-blocking):', e.message);
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

  // FIX: compare as strings (both should already be strings, but be safe)
  const otpMatch = String(user.verificationOTP) === String(otp);
  const otpValid = user.verificationOTPExpiry > Date.now();

  if (!otpMatch || !otpValid) {
    const reason = !otpMatch ? 'Invalid OTP.' : 'OTP has expired. Please request a new one.';
    return next(new AppError(reason, 400));
  }

  user.isVerified = true;
  user.verificationOTP = undefined;
  user.verificationOTPExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  // Issue tokens immediately after verification
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
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncome: user.monthlyIncome,
      savingsGoalPercent: user.savingsGoalPercent,
      profilePicture: user.profilePicture,
    },
  }, 'Email verified successfully. Welcome to FinVault!');
});

// ─── RESEND OTP ───────────────────────────────────────
exports.resendOTP = asyncHandler(async (req, res, next) => {
  const { userId, email } = req.body;
  const user = await User.findOne(userId ? { _id: userId } : { email });
  if (!user) return next(new AppError('User not found.', 404));
  if (user.isVerified) return next(new AppError('Email already verified.', 400));

  const otp = generateOTP();
  user.verificationOTP = otp;
  user.verificationOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      to: user.email,
      subject: 'FinVault — New Verification OTP',
      html: otpEmailHtml(user.name, otp, 10),
    });
  } catch (e) {
    console.warn('Resend OTP: email failed (OTP logged above):', e.message);
  }

  success(res, { userId: user._id }, 'New OTP sent to your email.');
});

// ─── LOGIN ────────────────────────────────────────────
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  if (!user.isVerified) {
    // Resend a fresh OTP automatically
    const otp = generateOTP();
    user.verificationOTP = otp;
    user.verificationOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    try {
      await sendEmail({
        to: user.email,
        subject: 'FinVault — New Verification OTP',
        html: otpEmailHtml(user.name, otp, 10),
      });
    } catch (e) { /* non-blocking — OTP logged to console */ }
    return next(new AppError(
      'Please verify your email first. A new OTP has been sent to your inbox.',
      403
    ));
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
      monthlyIncome: user.monthlyIncome,
      savingsGoalPercent: user.savingsGoalPercent,
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

  // Always respond the same to prevent email enumeration
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
      subject: 'FinVault — Password Reset Request',
      html: resetEmailHtml(user.name, resetURL),
    });
  } catch (e) {
    // Rollback token if email truly fails (not just console fallback)
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Email could not be sent. Please try again later.', 500));
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

  // Revoke all refresh tokens for security
  await RefreshToken.updateMany({ userId: user._id }, { isRevoked: true });

  success(res, null, 'Password reset successful. Please log in.');
});

// ─── Helper: Default Categories ───────────────────────
const createDefaultCategories = async (userId) => {
  const Category = require('../models/Category');
  const defaults = [
    { name: 'Food & Dining',    type: 'expense', color: '#EF4444', icon: '🍕' },
    { name: 'Transport',        type: 'expense', color: '#3B82F6', icon: '🚗' },
    { name: 'Shopping',         type: 'expense', color: '#8B5CF6', icon: '🛍️' },
    { name: 'Entertainment',    type: 'expense', color: '#F59E0B', icon: '🎬' },
    { name: 'Healthcare',       type: 'expense', color: '#10B981', icon: '💊' },
    { name: 'Bills & Utilities',type: 'expense', color: '#6B7280', icon: '💡' },
    { name: 'Rent / EMI',       type: 'expense', color: '#DC2626', icon: '🏠' },
    { name: 'Groceries',        type: 'expense', color: '#059669', icon: '🛒' },
    { name: 'Education',        type: 'expense', color: '#0284C7', icon: '📚' },
    { name: 'Subscriptions',    type: 'expense', color: '#7C3AED', icon: '📱' },
    { name: 'Travel',           type: 'expense', color: '#0891B2', icon: '✈️' },
    { name: 'Personal Care',    type: 'expense', color: '#F43F5E', icon: '🪥' },
    { name: 'Salary',           type: 'income',  color: '#059669', icon: '💰' },
    { name: 'Freelance',        type: 'income',  color: '#0284C7', icon: '💻' },
    { name: 'Investment Returns',type: 'income', color: '#D97706', icon: '📊' },
    { name: 'Rental Income',    type: 'income',  color: '#16A34A', icon: '🏘️' },
    { name: 'Gift / Bonus',     type: 'income',  color: '#EC4899', icon: '🎁' },
  ];

  const docs = defaults.map(d => ({ ...d, userId, isDefault: true }));
  // ordered:false = don't stop if one duplicate slips through
  await Category.insertMany(docs, { ordered: false }).catch(() => {});
};
