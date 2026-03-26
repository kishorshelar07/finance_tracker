import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Search, Trash2, Pencil, ChevronDown, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTransactions } from '../hooks/index';
import { formatDate, relativeTime, formatAmount, groupByDate, downloadBlob } from '../utils/helpers';
import { EmptyState, Pagination, Badge, Skeleton, AmountDisplay, ConfirmModal } from '../components/ui/index';
import { transactionsApi } from '../api/index';

// ─── Transaction Row ──────────────────────────────────
const TxRow = ({ tx, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const cat = tx.categoryId;
  const acc = tx.accountId;

  return (
    <div>
      <motion.div className="tx-row" onClick={() => setExpanded(v => !v)}
        layout transition={{ duration: 0.15 }}>
        <div className="tx-cat-icon" style={{ background: cat?.color || '#94A3B8' }}>
          {cat?.icon || '💰'}
        </div>
        <div className="tx-info">
          <div className="tx-desc">{tx.description || cat?.name || 'Transaction'}
{tx.autoCreated && <span className="badge-fv badge-primary" style={{ marginLeft: 8, fontSize: 10 }}>AUTO</span>}            {tx.isRecurring && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>↻</span>}
          </div>
          <div className="tx-meta">
            {acc && <span className="acc-chip">{acc.icon} {acc.name}</span>}
            <span>{relativeTime(tx.date)}</span>
            {tx.referenceNumber && <span>#{tx.referenceNumber}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <AmountDisplay amount={tx.amount} type={tx.type} />
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{formatDate(tx.date)}</div>
        </div>
        <ChevronDown size={16} color="var(--text-3)"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '200ms', flexShrink: 0 }} />
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', marginBottom: 4 }}>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 12 }}>
                {[['Category', cat ? `${cat.icon} ${cat.name}` : '—'],
                  ['Account', acc ? `${acc.icon} ${acc.name}` : '—'],
                  ['Date', formatDate(tx.date, 'DD MMM YYYY')],
                  ['Amount', formatAmount(tx.amount)],
                  ['Type', tx.type],
                  ['Reference', tx.referenceNumber || '—'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
                  </div>
                ))}
                {tx.notes && <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Notes</div>
                  <div style={{ fontSize: 13 }}>{tx.notes}</div>
                </div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-fv btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(tx); }}>
                  <Pencil size={14} /> Edit
                </button>
                <button className="btn-fv btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(tx._id); }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Recent Transactions (for Dashboard) ─────────────
export function RecentTransactions({ limit = 10 }) {
  const { transactions, loading } = useTransactions({ limit, period: 'this_month' });
  if (loading) return <>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={56} borderRadius={8} className="mb-2" />)}</>;
  if (!transactions.length) return <EmptyState icon="📭" title="No transactions" description="Add your first transaction to get started." />;
  return (
    <div>
      {transactions.map(tx => {
        const cat = tx.categoryId;
        const acc = tx.accountId;
        return (
          <div key={tx._id} className="tx-row" style={{ cursor: 'default', marginBottom: 4 }}>
            <div className="tx-cat-icon" style={{ background: cat?.color || '#94A3B8' }}>{cat?.icon || '💰'}</div>
            <div className="tx-info">
              <div className="tx-desc">{tx.description || cat?.name}</div>
              <div className="tx-meta">{acc && <span className="acc-chip">{acc.name}</span>}<span>{relativeTime(tx.date)}</span></div>
            </div>
            <AmountDisplay amount={tx.amount} type={tx.type} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Transactions Page ────────────────────────────────
export default function Transactions({ onEdit, accounts = [] }) {
  const [filters, setFilters] = useState({ period: 'this_month', type: 'all', search: '', page: 1 });
  const [deleteId, setDeleteId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { transactions, summary, pagination, loading, refetch, remove, bulkDelete } = useTransactions({ ...filters, limit: 20 });

  const updateFilter = (key, val) => setFilters(p => ({ ...p, [key]: val, page: 1 }));

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await transactionsApi.export({ ...filters, format });
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      downloadBlob(res.data, `transactions.${ext}`);
      toast.success(`Exported as .${ext}`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const grouped = groupByDate(transactions);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          <span style={{ color: 'var(--success)', fontWeight: 700 }}>+{formatAmount(summary.income)}</span>
          {' '}·{' '}
          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>−{formatAmount(summary.expense)}</span>
          {' '}· {pagination.total} total
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-fv btn-outline btn-sm" onClick={() => handleExport('csv')} disabled={exporting}>
            <Download size={14} /> CSV
          </button>
          <button className="btn-fv btn-outline btn-sm" onClick={() => handleExport('xlsx')} disabled={exporting}>
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">Period</span>
          <select className="form-select" style={{ width: 'auto' }} value={filters.period} onChange={e => updateFilter('period', e.target.value)}>
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="this_year">This Year</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Type</span>
          <select className="form-select" style={{ width: 'auto' }} value={filters.type} onChange={e => updateFilter('type', e.target.value)}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1, minWidth: 200 }}>
          <span className="filter-label">Search</span>
          <div className="input-group">
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="search-input form-control" style={{ paddingLeft: 32 }}
              placeholder="Search description or ref#..."
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)} />
          </div>
        </div>
        {(filters.search || filters.type !== 'all' || filters.period !== 'this_month') && (
          <button className="btn-fv btn-outline btn-sm"
            onClick={() => setFilters({ period: 'this_month', type: 'all', search: '', page: 1 })}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 8, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{selected.length} selected</span>
          <button className="btn-fv btn-danger btn-sm" onClick={() => setBulkConfirm(true)}>
            <Trash2 size={14} /> Delete Selected
          </button>
          <button className="btn-fv btn-ghost btn-sm" onClick={() => setSelected([])}>Cancel</button>
        </div>
      )}

      {/* Transaction List */}
      {loading ? (
        <div>{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={62} borderRadius={8} className="mb-2" />)}</div>
      ) : !transactions.length ? (
        <EmptyState icon="🔍" title="No transactions found"
          description="Try adjusting your filters or add a new transaction." />
      ) : (
        Object.entries(grouped).map(([dateLabel, txList]) => (
          <div key={dateLabel} className="tx-date-group" style={{ marginBottom: 16 }}>
            <div className="tx-date-label">{dateLabel}</div>
            {txList.map(tx => (
              <TxRow key={tx._id} tx={tx}
                onEdit={onEdit}
                onDelete={(id) => setDeleteId(id)} />
            ))}
          </div>
        ))
      )}

      <Pagination page={filters.page} totalPages={pagination.totalPages}
        onChange={(p) => setFilters(prev => ({ ...prev, page: p }))} />

      {/* Delete Confirm */}
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} danger
        title="Delete Transaction"
        message="This action cannot be undone. The account balance will be reversed."
        confirmLabel="Delete"
        onConfirm={async () => { await remove(deleteId); setDeleteId(null); }} />

      <ConfirmModal open={bulkConfirm} onClose={() => setBulkConfirm(false)} danger
        title={`Delete ${selected.length} transactions?`}
        message="All selected transactions will be permanently deleted."
        confirmLabel="Delete All"
        onConfirm={async () => { await bulkDelete(selected); setSelected([]); setBulkConfirm(false); }} />
    </div>
  );
}
