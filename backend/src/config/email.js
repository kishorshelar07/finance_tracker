// ─── Resend (production) + Console fallback (local dev) ──────────

let _resend = null;

const getResend = () => {
  if (!_resend) {
    const { Resend } = require('resend');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
};

const hasResend = () =>
  !!process.env.RESEND_API_KEY &&
  !process.env.RESEND_API_KEY.startsWith('re_xxx');

// ─── Startup log ──────────────────────────────────────────────────
if (hasResend()) {
  console.log('✅ Resend email service ready');
} else {
  console.warn('⚠️  RESEND_API_KEY not set — OTP will be logged to console (dev mode)');
}

// ─── Send email ───────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  // Always print OTP to console — visible in Render logs as backup
  const otpMatch = html?.match(/\b\d{6}\b/);
  const linkMatch = html?.match(/href="([^"]+reset[^"]+)"/);
  if (otpMatch) console.log(`\n📧 OTP for ${to}: ${otpMatch[0]}`);
  if (linkMatch) console.log(`🔗 Reset link: ${linkMatch[1]}\n`);

  // If no Resend key → just log (local dev fallback, don't crash)
  if (!hasResend()) {
    console.log(`[DEV] Email skipped — no RESEND_API_KEY. OTP logged above.`);
    return { id: 'dev-console' };
  }

  const from = process.env.EMAIL_FROM || 'FinVault <onboarding@resend.dev>';

  const resend = getResend();
  const { data, error } = await resend.emails.send({ from, to, subject, html });

  if (error) {
    console.error(`❌ Resend failed for ${to}:`, error.message);
    throw new Error(error.message);
  }

  console.log(`✅ Email sent to ${to} — id: ${data.id}`);
  return data;
};

module.exports = { sendEmail };
