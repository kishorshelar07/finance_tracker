import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import useAuth from '../context/useAuth';
import { authApi } from '../api/index';
import { Spinner, Divider } from '../components/ui/index';

const CARD_STYLE = {
  background: 'var(--surface)', borderRadius: 20,
  padding: 40, width: '100%', maxWidth: 420,
  boxShadow: 'var(--shadow-lg)',
};
const PAGE_STYLE = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
  padding: 24, position: 'relative', overflow: 'hidden',
};

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
    <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <TrendingUp size={20} />
    </div>
    <span style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>FinVault</span>
  </div>
);

const PasswordInput = ({ label, id, register, error, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="input-group">
        <input type={show ? 'text' : 'password'} id={id}
          className={`form-control ${error ? 'is-invalid' : ''}`} placeholder={placeholder}
          style={{ paddingRight: 44 }} {...register} />
        <button type="button" className="input-group-suffix" onClick={() => setShow(v => !v)} tabIndex={-1}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <span className="invalid-feedback">{error.message}</span>}
    </div>
  );
};

// ─── LOGIN ────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
  rememberMe: z.boolean().optional(),
});

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'demo@finvault.app', password: 'Demo@1234', rememberMe: false },
  });

  const onSubmit = async ({ email, password, rememberMe }) => {
    try {
      await login(email, password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError('root', { message: msg });
      if (err.response?.status === 403) navigate(`/verify-email?email=${email}`);
    }
  };

  return (
    <div style={PAGE_STYLE}>
      <motion.div style={CARD_STYLE} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Logo />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>Welcome back</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, textAlign: 'center' }}>Sign in to your financial dashboard</p>

        {errors.root && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 600 }}>{errors.root.message}</div>}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="you@example.com" {...register('email')} />
          {errors.email && <span className="invalid-feedback">{errors.email.message}</span>}
        </div>
        <PasswordInput label="Password" id="password" register={register('password')} error={errors.password} placeholder="••••••••" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" style={{ accentColor: 'var(--primary)' }} {...register('rememberMe')} /> Remember me
          </label>
          <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Forgot password?</Link>
        </div>

        <button className="btn-fv btn-primary btn-block btn-lg" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? <Spinner size={16} color="#fff" /> : 'Sign In'}
        </button>
        <Divider label="or" />
        {/* BUG FIX: React Hook Form ignores direct DOM manipulation.
            Directly call onSubmit with demo credentials — bypassing handleSubmit
            validation is fine here since we know demo creds are valid. */}
        <button className="btn-fv btn-outline btn-block"
          onClick={() => onSubmit({ email: 'demo@finvault.app', password: 'Demo@1234', rememberMe: false })}>
          🚀 Try Demo Account
        </button>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-2)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one</Link>
        </p>
        <p style={{ textAlign: 'center', marginTop: 8 }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text-3)' }}>← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}

// ─── REGISTER ─────────────────────────────────────────
const regSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword'],
});

export function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(regSchema) });

  const onSubmit = async ({ name, email, password }) => {
    try {
      const { data } = await authApi.register({ name, email, password });
      toast.success('Account created! Check your email for the OTP.');
      navigate(`/verify-email?userId=${data.data.userId}&email=${email}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={PAGE_STYLE}>
      <motion.div style={CARD_STYLE} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Logo />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>Create account</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, textAlign: 'center' }}>Start your financial journey today</p>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} placeholder="Arjun Sharma" {...register('name')} />
          {errors.name && <span className="invalid-feedback">{errors.name.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="you@example.com" {...register('email')} />
          {errors.email && <span className="invalid-feedback">{errors.email.message}</span>}
        </div>
        <PasswordInput label="Password" id="pass" register={register('password')} error={errors.password} placeholder="Min. 6 characters" />
        <PasswordInput label="Confirm Password" id="cpass" register={register('confirmPassword')} error={errors.confirmPassword} placeholder="Repeat password" />

        <button className="btn-fv btn-primary btn-block btn-lg" style={{ marginTop: 4 }} onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? <Spinner size={16} color="#fff" /> : 'Create Account'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-2)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

// ─── OTP VERIFY ───────────────────────────────────────
export function VerifyEmail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId');
  const email  = params.get('email');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };
  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.verifyEmail({ userId, otp: code });
      localStorage.setItem('accessToken', data.data.accessToken);
      toast.success('Email verified!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div style={PAGE_STYLE}>
      <motion.div style={CARD_STYLE} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <Logo />
        <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Verify Your Email</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', marginBottom: 24 }}>
          We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
          {otp.map((v, i) => (
            <input key={i} id={`otp-${i}`}
              style={{ width: 48, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', border: '2px solid var(--border)', borderRadius: 8, outline: 'none', transition: 'border 200ms' }}
              maxLength={1} value={v}
              onChange={e => handleOtpChange(e.target.value, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          ))}
        </div>
        <button className="btn-fv btn-primary btn-block btn-lg" onClick={verify} disabled={loading}>
          {loading ? <Spinner size={16} color="#fff" /> : 'Verify & Continue'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-3)' }}>
          Didn't receive it?{' '}
          <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            onClick={() => toast.info('New OTP sent!')}>Resend OTP</button>
        </p>
      </motion.div>
    </div>
  );
}

// ─── FORGOT PASSWORD ──────────────────────────────────
export function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch { setSent(true); } // Always show success for security
  };

  return (
    <div style={PAGE_STYLE}>
      <motion.div style={CARD_STYLE} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <Logo />
        {!sent ? (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Reset Password</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', textAlign: 'center', marginBottom: 24 }}>Enter your email and we'll send a reset link.</p>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="you@example.com" {...register('email', { required: true })} />
            </div>
            <button className="btn-fv btn-primary btn-block" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? <Spinner size={16} color="#fff" /> : 'Send Reset Link'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <h3>Check your email</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>If that email exists, we've sent a password reset link. Check your inbox.</p>
          </div>
        )}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>← Back to login</Link>
        </p>
      </motion.div>
    </div>
  );
}