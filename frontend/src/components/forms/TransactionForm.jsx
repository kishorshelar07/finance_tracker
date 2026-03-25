import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Modal } from '../ui/index';
import { Spinner, TypeTabs } from '../ui/index';
import { useCategories } from '../../hooks/index';
import { transactionsApi } from '../../api/index';

const schema = z.object({
  amount: z.coerce.number({ invalid_type_error: 'Enter a valid amount' }).positive('Amount must be positive'),
  accountId: z.string().min(1, 'Select an account'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  referenceNumber: z.string().max(50).optional(),
});

export const TransactionForm = ({ open, onClose, onSaved, accounts, editTx = null }) => {
  const [txType, setTxType]       = useState(editTx?.type || 'expense');
  const [selectedCat, setSelCat]  = useState(editTx?.categoryId?._id || '');
  const [loading, setLoading]     = useState(false);
  const [receiptFile, setReceipt] = useState(null);

  const { categories } = useCategories(txType !== 'transfer' ? txType : undefined);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      accountId: '',
      description: '',
    },
  });

  // Populate on edit
  useEffect(() => {
    if (editTx) {
      setTxType(editTx.type);
      setSelCat(editTx.categoryId?._id || '');
      setValue('amount', editTx.amount);
      setValue('accountId', editTx.accountId?._id || editTx.accountId);
      setValue('date', new Date(editTx.date).toISOString().slice(0, 10));
      setValue('description', editTx.description || '');
      setValue('notes', editTx.notes || '');
      setValue('referenceNumber', editTx.referenceNumber || '');
    } else {
      reset({ date: new Date().toISOString().slice(0, 10), amount: '', accountId: '', description: '' });
      setTxType('expense');
      setSelCat('');
    }
  }, [editTx, open]);

  const onSubmit = async (values) => {
    if (!selectedCat && txType !== 'transfer') {
      toast.error('Please select a category'); return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('type', txType);
      form.append('amount', values.amount);
      form.append('accountId', values.accountId);
      form.append('date', values.date);
      if (selectedCat) form.append('categoryId', selectedCat);
      if (values.description) form.append('description', values.description);
      if (values.notes) form.append('notes', values.notes);
      if (values.referenceNumber) form.append('referenceNumber', values.referenceNumber);
      if (receiptFile) form.append('receipt', receiptFile);

      if (editTx) {
        await transactionsApi.update(editTx._id, Object.fromEntries(form));
        toast.success('Transaction updated!');
      } else {
        await transactionsApi.create(form);
        toast.success('Transaction added!');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}
      title={editTx ? 'Edit Transaction' : 'Add Transaction'}
      size="modal-lg"
      footer={
        <>
          <button className="btn-fv btn-outline btn-sm" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-fv btn-primary btn-sm" onClick={handleSubmit(onSubmit)} disabled={loading}>
            {loading ? <Spinner size={14} /> : (editTx ? 'Update' : 'Save Transaction')}
          </button>
        </>
      }>
      {/* Type Tabs */}
      <TypeTabs value={txType} onChange={(t) => { setTxType(t); setSelCat(''); }} />

      {/* Amount */}
      <div className="amount-input-wrap">
        <span className="amount-currency">₹</span>
        <input className={`amount-input ${txType}-mode`}
          type="number" step="0.01" min="0" placeholder="0.00"
          {...register('amount')} />
      </div>
      {errors.amount && <div className="invalid-feedback mb-3">{errors.amount.message}</div>}

      {/* Category Grid */}
      {txType !== 'transfer' && (
        <div className="form-group">
          <label className="form-label">Category</label>
          <div className="category-grid">
            {categories.map(cat => (
              <div key={cat._id}
                className={`cat-chip ${selectedCat === cat._id ? 'selected' : ''}`}
                style={{ color: cat.color }}
                onClick={() => setSelCat(cat._id)}>
                <span className="cat-chip-icon">{cat.icon}</span>
                <span className="cat-chip-name">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Account</label>
          <select className={`form-select ${errors.accountId ? 'is-invalid' : ''}`} {...register('accountId')}>
            <option value="">Select Account</option>
            {accounts.map(acc => (
              <option key={acc._id} value={acc._id}>{acc.icon} {acc.name}</option>
            ))}
          </select>
          {errors.accountId && <span className="invalid-feedback">{errors.accountId.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className={`form-control ${errors.date ? 'is-invalid' : ''}`} {...register('date')} />
          {errors.date && <span className="invalid-feedback">{errors.date.message}</span>}
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Description</label>
          <input className="form-control" placeholder="What was this for?" {...register('description')} />
        </div>

        <div className="form-group">
          <label className="form-label">Reference # <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(optional)</span></label>
          <input className="form-control" placeholder="INV-001" {...register('referenceNumber')} />
        </div>

        <div className="form-group">
          <label className="form-label">Receipt <span style={{ fontWeight: 400, color: 'var(--text-3)' }}>(optional, max 5MB)</span></label>
          <input type="file" className="form-control" accept="image/*,application/pdf"
            onChange={e => setReceipt(e.target.files[0])} style={{ fontSize: 13 }} />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={2} placeholder="Additional notes..."
            style={{ resize: 'vertical' }} {...register('notes')} />
        </div>
      </div>
    </Modal>
  );
};
