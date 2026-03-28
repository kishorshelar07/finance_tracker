const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify()
  .then(() => console.log('✅ Gmail SMTP ready'))
  .catch(err => console.error('❌ Gmail SMTP error:', err.message));

const sendEmail = async ({ to, subject, html }) => {
  const otpMatch = html?.match(/\b\d{6}\b/);
  const linkMatch = html?.match(/href="([^"]+reset[^"]+)"/);
  if (otpMatch) console.log(`\n📧 OTP for ${to}: ${otpMatch[0]}`);
  if (linkMatch) console.log(`🔗 Reset link: ${linkMatch[1]}\n`);

  const info = await transporter.sendMail({
    from: `FinVault <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  return info;
};

module.exports = { sendEmail };