import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInitials, formatAmount, calcPercent, getProgressColor } from '../../utils/helpers';

// ─── Modal ───────────────────────────────────
export const Modal = ({ open, onClose, title, children, footer, size = '' }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className={`modal-box ${size}`}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}>
          <div className="modal-header">
            <h4 className="modal-title">{title}</h4>
            <button className="btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── ConfirmModal ─────────────────────────────────────
export const ConfirmModal = ({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) => (
  <Modal open={open} onClose={onClose} title={title} size="modal-sm"
    footer={
      <>
        <button className="btn-fv btn-outline btn-sm" onClick={onClose} disabled={loading}>Cancel</button>
        <button className={`btn-fv btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner size={14} /> : confirmLabel}
        </button>
      </>
    }>
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ background: 'var(--danger-light)', borderRadius: 10, padding: 10, flexShrink: 0 }}>
        <AlertTriangle size={22} color="var(--danger)" />
      </div>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{message}</p>
    </div>
  </Modal>
);

// ─── Avatar ───────────────────────────────────────────
export const Avatar = ({ name, src, size = 'md', style = {} }) => {
  const sizeClass = `avatar avatar-${size}`;
  return (
    <div className={sizeClass} style={style}>
      {src ? <img src={src} alt={name} /> : getInitials(name)}
    </div>
  );
};

// ─── Badge ────────────────────────────────────────────
export const Badge = ({ type = 'neutral', children, className = '' }) => (
  <span className={`badge-fv badge-${type} ${className}`}>{children}</span>
);

// ─── Empty State ──────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon" style={{ fontSize: 48 }}>{icon || '📭'}</div>
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action}
  </div>
);

// ─── Skeleton ─────────────────────────────────────────
export const Skeleton = ({ width = '100%', height = 16, borderRadius = 6, className = '' }) => (
  <div className={`skeleton ${className}`} style={{ width, height, borderRadius }} />
);

export const SkeletonCard = ({ rows = 3 }) => (
  <div className="fv-card fv-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <Skeleton height={20} width="60%" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} height={14} width={`${70 + i * 10}%`} />
    ))}
  </div>
);

export const SkeletonStatCard = () => (
  <div className="stat-card">
    <Skeleton width={40} height={40} borderRadius={10} className="mb-2" />
    <Skeleton height={12} width="50%" className="mb-2" />
    <Skeleton height={24} width="70%" />
  </div>
);

// ─── Spinner ──────────────────────────────────────────
export const Spinner = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'spin 0.7s linear infinite' }}>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ─── StatCard ─────────────────────────────────────────
export const StatCard = ({ type, icon, label, value, change, subtext }) => (
  <motion.div className={`stat-card ${type}`}
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}>
    <div className={`stat-icon ${type}`}>{icon}</div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
    {change !== undefined && change !== null && (
      <div>
        <span className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 3 }}>vs last month</span>
        </span>
      </div>
    )}
    {subtext && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{subtext}</div>}
  </motion.div>
);

// ─── Progress Bar ─────────────────────────────────────
export const ProgressBar = ({ value, max, showLabel = false }) => {
  const pct = calcPercent(value, max);
  const color = getProgressColor(pct);
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatAmount(value)}</span>
          <span style={{ color: 'var(--text-3)' }}>of {formatAmount(max)}</span>
        </div>
      )}
      <div className="progress-bar-track">
        <motion.div className={`progress-bar-fill ${color}`}
          style={{ width: `${pct}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }} />
      </div>
    </div>
  );
};

// ─── Ring Progress ────────────────────────────────────
export const RingProgress = ({ value, max, color = '#1A56DB', size = 130 }) => {
  const pct = calcPercent(value, max);
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="goal-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg)" strokeWidth={10} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          strokeLinecap="round" />
      </svg>
      <div className="goal-ring-center">
        <div className="goal-ring-pct" style={{ color }}>{pct}%</div>
        <div className="goal-ring-label">done</div>
      </div>
    </div>
  );
};

// ─── Toggle ───────────────────────────────────────────
export const Toggle = ({ checked, onChange, name }) => (
  <label className="toggle">
    <input type="checkbox" checked={checked} onChange={onChange} name={name} />
    <span className="toggle-slider" />
  </label>
);

// ─── Divider ──────────────────────────────────────────
export const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--text-3)', fontSize: 12 }}>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    {label}
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

// ─── Pagination ───────────────────────────────────────
export const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="pagination-fv">
      <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page <= 1}>‹</button>
      {pages.map(p => (
        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      ))}
      <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>›</button>
    </div>
  );
};

// ─── Period Tabs ──────────────
export const PeriodTabs = ({ value, onChange, options }) => (
  <div className="period-tabs">
    {options.map(opt => (
      <button key={opt.value} className={`period-tab ${value === opt.value ? 'active' : ''}`}
        onClick={() => onChange(opt.value)}>
        {opt.label}
      </button>
    ))}
  </div>
);

// ─── Type Tabs ───────────────
export const TypeTabs = ({ value, onChange }) => (
  <div className="type-tabs">
    {['expense', 'income', 'transfer'].map(t => (
      <button key={t} className={`type-tab ${value === t ? `active ${t}` : ''}`}
        onClick={() => onChange(t)} style={{ textTransform: 'capitalize' }}>
        {t === 'expense' ? '💸' : t === 'income' ? '💰' : '↔️'} {t.charAt(0).toUpperCase() + t.slice(1)}
      </button>
    ))}
  </div>
);

// ─── Amount Display 
export const AmountDisplay = ({ amount, type, size = 15, className = '' }) => (
  <span className={`tx-amount ${type} ${className}`} style={{ fontSize: size }}>
    {type === 'income' ? '+' : type === 'expense' ? '−' : '↔'}
    {formatAmount(amount)}
  </span>
);
