// ─── Chart Colors ─────────────────────────────────────
export const CHART_COLORS = [
  '#1A56DB','#059669','#DC2626','#D97706',
  '#8B5CF6','#0284C7','#F59E0B','#10B981',
  '#EC4899','#14B8A6','#F97316','#6366F1',
];

export const CHART_DEFAULTS = {
  income:  '#059669',
  expense: '#DC2626',
  transfer:'#0284C7',
  goal:    '#1A56DB',
};

// ─── Account Types ─────────────────────────────────────
export const ACCOUNT_TYPES = [
  { value: 'bank',        label: 'Bank Account', icon: '🏦' },
  { value: 'cash',        label: 'Cash',         icon: '💵' },
  { value: 'credit_card', label: 'Credit Card',  icon: '💳' },
  { value: 'wallet',      label: 'Digital Wallet',icon: '👛' },
  { value: 'investment',  label: 'Investment',   icon: '📈' },
];

export const ACCOUNT_ICONS = {
  bank: '🏦', cash: '💵', credit_card: '💳',
  wallet: '👛', investment: '📈',
};

// ─── Frequencies ──────────────────────────────────────
export const FREQUENCIES = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
];

// ─── Currency List ────────────────────────────────────
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
];

// ─── Budget Periods ───────────────────────────────────
export const BUDGET_PERIODS = [
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
];

// ─── Goal Icons ───────────────────────────────────────
export const GOAL_ICONS = [
  '🎯','🏖️','🏠','🚗','💻','📱','✈️','🎓','💍','🛡️',
  '🏥','🎁','🌍','⛵','🏔️','🎨','📚','🍕','💰','🌟',
];
