const nodemailer = require('nodemailer');

// ─── Validate email config on startup ────────────────────────────
const validateEmailConfig = () => {
  const required = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'];
  const missing = required.filter(k => !process.env[k] || process.env[k].startsWith('your_'));
  if (missing.length > 0) {
    console.warn(`⚠️  Email not configured. Missing/placeholder: ${missing.join(', ')}`);
    console.warn('   OTP emails will be logged to console instead.');
    return false;
  }
  return true;
};

const isEmailConfigured = validateEmailConfig();

// ─── Reusable transporter (singleton) ────────────────────────────
let _transporter = null;
const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      // Use EMAIL_SECURE=true only for port 465
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,  // Helps with self-signed certs
        minVersion: 'TLSv1.2',
      },
    });
  }
  return _transporter;
};

// ─── Verify connection once on startup ───────────────────────────
const verifyEmailConnection = async () => {
  if (!isEmailConfigured) return;
  try {
    await getTransporter().verify();
    console.log('✅ Email (SMTP) connection verified');
  } catch (err) {
    console.error('❌ Email SMTP error:', err.message);
    console.error('   Fix .env: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS');
    _transporter = null; // Reset so it tries again next time
  }
};
// Verify without blocking server startup
verifyEmailConnection();

// ─── Send email ──────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  // BUG FIX: dotenv does NOT strip quotes from values with spaces.
  // If .env has: EMAIL_FROM="FinVault <x@x.com>"  ← quotes stay in the string!
  // Solution: strip surrounding quotes from EMAIL_FROM at runtime.
  const rawFrom = process.env.EMAIL_FROM || `FinVault <${process.env.EMAIL_USER}>`;
  const from = rawFrom.replace(/^["']|["']$/g, '').trim();

  // If email not configured — just log OTP to console (dev fallback)
  if (!isEmailConfigured) {
    console.log('\n' + '─'.repeat(60));
    console.log('📧 [DEV EMAIL — SMTP NOT CONFIGURED]');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    // Extract OTP from HTML for easy copy-paste during dev
    const otpMatch = html?.match(/\b\d{6}\b/);
    if (otpMatch) console.log(`   OTP:     ${otpMatch[0]}  ← copy this!`);
    // Extract reset link
    const linkMatch = html?.match(/href="([^"]+)"/);
    if (linkMatch) console.log(`   Link:    ${linkMatch[1]}`);
    console.log('─'.repeat(60) + '\n');
    return { messageId: 'dev-console-log' };
  }

  try {
    const info = await getTransporter().sendMail({ from, to, subject, html, text });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Email send failed to ${to}:`, err.message);
    // Log OTP to console as fallback so dev can still test
    const otpMatch = html?.match(/\b\d{6}\b/);
    if (otpMatch) {
      console.log(`🔑 [FALLBACK] OTP for ${to}: ${otpMatch[0]}`);
    }
    throw err;  // Let caller handle (auth controller catches this)
  }
};

module.exports = { sendEmail };
