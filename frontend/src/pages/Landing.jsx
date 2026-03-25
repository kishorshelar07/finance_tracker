import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Rocket, Play, BarChart2, Wallet, Target, PieChart, Repeat, FileText } from 'lucide-react';

const FEATURES = [
  { icon: BarChart2, title: 'Smart Analytics', desc: '8 interactive charts revealing where your money goes and how to optimize your finances.' },
  { icon: Wallet,    title: 'Multi-Account',  desc: 'Track bank accounts, cash, credit cards, and investments all in one dashboard.' },
  { icon: PieChart,  title: 'Budget Manager', desc: 'Set category budgets with color-coded alerts before you overspend your limits.' },
  { icon: Target,    title: 'Savings Goals',  desc: 'Visual progress rings for every savings goal with detailed contribution tracking.' },
  { icon: Repeat,    title: 'Auto-Recurring', desc: 'Auto-create recurring transactions and get email reminders for upcoming payments.' },
  { icon: FileText,  title: 'Export Reports', desc: 'Export filtered data to Excel, CSV, or PDF with one click whenever needed.' },
];

const STEPS = [
  { num: '01', title: 'Create Account', desc: 'Sign up free in 30 seconds and verify your email to get started instantly.' },
  { num: '02', title: 'Add Accounts',   desc: 'Link your bank, cash, and credit card accounts with accurate opening balances.' },
  { num: '03', title: 'Track & Grow',   desc: 'Log transactions, set budgets, and watch your savings grow with real-time analytics.' },
];

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } };

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <TrendingUp size={18} />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff' }}>FinVault</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-fv btn-outline" style={{ borderColor: '#334155', color: '#fff' }} onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-fv btn-primary" onClick={() => navigate('/register')}>Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <div className="hero-badge">
            <Shield size={14} color="var(--primary)" /> Secure · Private · Powerful
          </div>
        </motion.div>
        <motion.h1 className="hero-title" {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
          Your Money.<br />Your <span>Intelligence</span>.
        </motion.h1>
        <motion.p className="hero-subtitle" {...fadeUp} transition={{ duration: 0.5, delay: 0.2 }}>
          Track every rupee, understand your spending patterns, and hit your savings goals — all in one beautiful, secure dashboard.
        </motion.p>
        <motion.div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }} {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }}>
          <button className="btn-fv btn-primary btn-lg" onClick={() => navigate('/register')}>
            <Rocket size={18} /> Start Free Today
          </button>
          <button className="btn-fv btn-outline btn-lg" style={{ borderColor: '#334155', color: '#fff' }} onClick={() => navigate('/login')}>
            <Play size={18} /> Live Demo
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 60, flexWrap: 'wrap' }} {...fadeUp} transition={{ duration: 0.5, delay: 0.4 }}>
          {[['₹0', 'Always Free'], ['256-bit', 'Encryption'], ['Real-time', 'Analytics'], ['8+', 'Chart Types']].map(([val, lab]) => (
            <div key={lab} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#60A5FA' }}>{val}</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>{lab}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', marginBottom: 10 }}>Everything You Need</h2>
          <p style={{ color: '#94A3B8', fontSize: 16 }}>A complete financial toolkit, beautifully designed.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title} className="feature-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}>
              <div style={{ width: 48, height: 48, background: 'rgba(26,86,219,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#60A5FA' }}>
                <Icon size={22} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: '80px 60px', background: '#1E293B' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', textAlign: 'center', marginBottom: 50 }}>Get Started in 3 Steps</h2>
        <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 800, margin: '0 auto' }}>
          {STEPS.map((s, i) => (
            <motion.div key={s.num} style={{ textAlign: 'center', maxWidth: 220 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}>
              <div style={{ width: 56, height: 56, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', margin: '0 auto 16px', color: '#fff' }}>{s.num}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 60px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', marginBottom: 16 }}>Ready to take control?</h2>
        <p style={{ color: '#94A3B8', fontSize: 16, marginBottom: 32 }}>Join thousands of smart savers. It's completely free.</p>
        <button className="btn-fv btn-primary btn-lg" onClick={() => navigate('/register')}>
          <Rocket size={18} /> Create Free Account
        </button>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 60px', borderTop: '1px solid #1E293B', textAlign: 'center', color: '#475569', fontSize: 13 }}>
        © {new Date().getFullYear()} FinVault · Built for smart savers · Demo: demo@finvault.app / Demo@1234
      </footer>
    </div>
  );
}
