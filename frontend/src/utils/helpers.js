import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
dayjs.extend(relativeTimePlugin);
dayjs.extend(localizedFormat);

// ─── Currency ─────────────────────────────────────────
export const formatCurrency = (amount, currency = 'INR') => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatAmount = (amount) => {
  const num = parseFloat(amount) || 0;
  return '₹' + Math.abs(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatAmountSigned = (amount, type) => {
  const prefix = type === 'income' ? '+' : type === 'expense' ? '−' : '↔';
  return `${prefix}${formatAmount(amount)}`;
};

// ─── Dates ────────────────────────────────────────────
export const formatDate = (date, fmt = 'DD MMM YYYY') => {
  if (!date) return '—';
  return dayjs(date).format(fmt);
};

export const relativeTime = (date) => {
  if (!date) return '';
  const d = dayjs(date);
  const today = dayjs().startOf('day');
  const yesterday = dayjs().subtract(1, 'day').startOf('day');
  if (d.isSame(today, 'day')) return 'Today';
  if (d.isSame(yesterday, 'day')) return 'Yesterday';
  if (dayjs().diff(d, 'day') < 7) return d.fromNow();
  return d.format('DD MMM YYYY');
};

export const groupByDate = (transactions) => {
  const groups = {};
  transactions.forEach(tx => {
    const label = relativeTime(tx.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  });
  return groups;
};

export const getDaysLeft = (deadline) => {
  if (!deadline) return null;
  return Math.max(0, dayjs(deadline).diff(dayjs(), 'day'));
};

// ─── Numbers ──────────────────────────────────────────
export const calcPercent = (current, total) => {
  if (!total || total === 0) return 0;
  return Math.min(Math.round((current / total) * 100), 100);
};

export const getProgressColor = (pct) => {
  if (pct < 50) return 'success';
  if (pct < 80) return 'warning';
  return 'danger';
};

export const pctChange = (curr, prev) => {
  if (!prev || prev === 0) return null;
  return parseFloat(((curr - prev) / prev * 100).toFixed(1));
};

// ─── Text ─────────────────────────────────────────────
export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

export const truncate = (str, len = 40) =>
  str && str.length > len ? str.slice(0, len) + '…' : str || '';

// ─── File download ────────────────────────────────────
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ─── Period helpers ───────────────────────────────────
export const PERIODS = [
  { value: 'this_month',   label: 'This Month' },
  { value: 'last_month',   label: 'Last Month' },
  { value: 'last_3_months',label: 'Last 3 Months' },
  { value: 'last_6_months',label: 'Last 6 Months' },
  { value: 'this_year',    label: 'This Year' },
  { value: 'all',          label: 'All Time' },
];
