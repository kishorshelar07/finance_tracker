import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Modal, Spinner } from '../ui/index';
import { ACCOUNT_TYPES, BUDGET_PERIODS, GOAL_ICONS, FREQUENCIES, CURRENCIES } from '../../constants/index';

// ACCOUNT FORM
// ══════════════════════════════════════════════════════
const accSchema = z.object({
  name:    z.string().min(1, 'Account name is required').max(50),
  type:    z.enum(['bank','cash','credit_card','wallet','investment']),
  balance: z.coerce.number(),
  color:   z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color'),
});

export const AccountForm = ({ open, onClose, onSaved, editAccount = null }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(accSchema),
    defaultValues: { name: '', type: 'bank', balance: 0, color: '#1A56DB' },
  });

  useEffect(() => {
    if (editAccount) {
      reset({ name: editAccount.name, type: editAccount.type, balance: editAccount.balance, color: editAccount.color });
    } else {
      reset({ name: '', type: 'bank', balance: 0, color: '#1A56DB' });
    }
  }, [editAccount, open]);

  const onSubmit = async (values) => {
    try {
      const icon = ACCOUNT_TYPES.find(a => a.value === values.type)?.icon || '🏦';
      await onSaved?.({ ...values, icon });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save account');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editAccount ? 'Edit Account' : 'Add Account'} size="modal-sm"
      footer={
        <>
          <button className="btn-fv btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-fv btn-primary btn-sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size={14} /> : 'Save Account'}
          </button>
        </>
      }>
      <div className="form-group">
        <label className="form-label">Account Name</label>
        <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} placeholder="e.g. HDFC Savings" {...register('name')} />
        {errors.name && <span className="invalid-feedback">{errors.name.message}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Account Type</label>
        <select className="form-select" {...register('type')}>
          {ACCOUNT_TYPES.map(a => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
        </select>
      </div>
      {!editAccount && (
        <div className="form-group">
          <label className="form-label">Opening Balance (₹)</label>
          <input type="number" step="0.01" className="form-control" placeholder="0.00" {...register('balance')} />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Color</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="color" className="form-control" style={{ width: 56, height: 42, padding: 4, cursor: 'pointer' }} {...register('color')} />
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Choose account color</span>
        </div>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════
// TRANSFER FORM
// ══════════════════════════════════════════════════════
export const TransferForm = ({ open, onClose, onSaved, accounts = [] }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { fromAccountId: '', toAccountId: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => { if (open) reset({ fromAccountId: '', toAccountId: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) }); }, [open]);

  const onSubmit = async (values) => {
    if (values.fromAccountId === values.toAccountId) { toast.error('Cannot transfer to same account'); return; }
    try { await onSaved?.(values); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Transfer failed'); }
  };

  const activeAccounts = accounts.filter(a => a.isActive);

  return (
    <Modal open={open} onClose={onClose} title="Transfer Between Accounts" size="modal-sm"
      footer={
        <>
          <button className="btn-fv btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-fv btn-primary btn-sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size={14} /> : '↔️ Transfer'}
          </button>
        </>
      }>
      <div className="form-group">
        <label className="form-label">From Account</label>
        <select className="form-select" {...register('fromAccountId', { required: true })}>
          <option value="">Select account</option>
          {activeAccounts.map(a => <option key={a._id} value={a._id}>{a.icon} {a.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">To Account</label>
        <select className="form-select" {...register('toAccountId', { required: true })}>
          <option value="">Select account</option>
          {activeAccounts.map(a => <option key={a._id} value={a._id}>{a.icon} {a.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Amount (₹)</label>
        <input type="number" step="0.01" className="form-control" placeholder="0.00" {...register('amount', { required: true, min: 0.01 })} />
      </div>
      <div className="form-group">
        <label className="form-label">Date</label>
        <input type="date" className="form-control" {...register('date')} />
      </div>
      <div className="form-group">
        <label className="form-label">Description <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
        <input className="form-control" placeholder="Transfer reason" {...register('description')} />
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════
// BUDGET FORM
// ══════════════════════════════════════════════════════
const budgetSchema = z.object({
  categoryId:   z.string().min(1, 'Select a category'),
  amountLimit:  z.coerce.number().positive('Enter a positive limit'),
  period:       z.enum(['weekly', 'monthly', 'yearly']),
});

export const BudgetForm = ({ open, onClose, onSaved, categories = [], editBudget = null }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: { categoryId: '', amountLimit: '', period: 'monthly' },
  });

  useEffect(() => {
    if (editBudget) {
      reset({ categoryId: editBudget.categoryId?._id || editBudget.categoryId, amountLimit: editBudget.amountLimit, period: editBudget.period });
    } else { reset({ categoryId: '', amountLimit: '', period: 'monthly' }); }
  }, [editBudget, open]);

  const onSubmit = async (values) => {
    try { await onSaved?.(values); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to save budget'); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editBudget ? 'Edit Budget' : 'Create Budget'} size="modal-sm"
      footer={
        <>
          <button className="btn-fv btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-fv btn-primary btn-sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size={14} /> : 'Save Budget'}
          </button>
        </>
      }>
      <div className="form-group">
        <label className="form-label">Expense Category</label>
        <select className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`} {...register('categoryId')}>
          <option value="">Select category</option>
          {categories.filter(c => c.type === 'expense').map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
        </select>
        {errors.categoryId && <span className="invalid-feedback">{errors.categoryId.message}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Budget Limit (₹)</label>
        <input type="number" step="0.01" className={`form-control ${errors.amountLimit ? 'is-invalid' : ''}`} placeholder="10000" {...register('amountLimit')} />
        {errors.amountLimit && <span className="invalid-feedback">{errors.amountLimit.message}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Period</label>
        <select className="form-select" {...register('period')}>
          {BUDGET_PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════
// GOAL FORM
// ══════════════════════════════════════════════════════
const goalSchema = z.object({
  name:         z.string().min(1, 'Goal name is required'),
  targetAmount: z.coerce.number().positive('Target must be positive'),
  deadline:     z.string().optional(),
  icon:         z.string().default('🎯'),
  color:        z.string().default('#1A56DB'),
});

export const GoalForm = ({ open, onClose, onSaved, editGoal = null }) => {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: '', targetAmount: '', deadline: '', icon: '🎯', color: '#1A56DB' },
  });

  useEffect(() => {
    if (editGoal) { reset({ name: editGoal.name, targetAmount: editGoal.targetAmount, deadline: editGoal.deadline?.slice(0,10)||'', icon: editGoal.icon, color: editGoal.color }); }
    else { reset({ name: '', targetAmount: '', deadline: '', icon: '🎯', color: '#1A56DB' }); }
  }, [editGoal, open]);

  const selectedIcon = watch('icon');

  const onSubmit = async (values) => {
    try { await onSaved?.(values); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to save goal'); }
  };

  return (
    <Modal open={open} onClose={onClose} title={editGoal ? 'Edit Goal' : 'New Savings Goal'} size="modal-sm"
      footer={
        <>
          <button className="btn-fv btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-fv btn-primary btn-sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size={14} /> : 'Save Goal'}
          </button>
        </>
      }>
      <div className="form-group">
        <label className="form-label">Goal Name</label>
        <input className={`form-control ${errors.name ? 'is-invalid' : ''}`} placeholder="e.g. Emergency Fund" {...register('name')} />
        {errors.name && <span className="invalid-feedback">{errors.name.message}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Target Amount (₹)</label>
        <input type="number" step="0.01" className={`form-control ${errors.targetAmount ? 'is-invalid' : ''}`} placeholder="100000" {...register('targetAmount')} />
        {errors.targetAmount && <span className="invalid-feedback">{errors.targetAmount.message}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Deadline <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
        <input type="date" className="form-control" {...register('deadline')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input type="color" className="form-control" style={{ height: 42, padding: 4, cursor: 'pointer' }} {...register('color')} />
        </div>
        <div className="form-group">
          <label className="form-label">Icon</label>
          <input className="form-control" placeholder="🎯" maxLength={2} {...register('icon')} style={{ fontSize: 20, textAlign: 'center' }} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Quick Icons</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {GOAL_ICONS.map(ico => (
            <button key={ico} type="button"
              style={{ fontSize: 20, padding: '4px 8px', borderRadius: 8, cursor: 'pointer',
                background: selectedIcon === ico ? 'var(--primary-light)' : 'var(--bg)',
                border: selectedIcon === ico ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => setValue('icon', ico)}>{ico}</button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════
// RECURRING FORM
// ══════════════════════════════════════════════════════
export const RecurringForm = ({ open, onClose, onSaved, accounts = [], categories = [] }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { type: 'expense', amount: '', categoryId: '', accountId: '', description: '', frequency: 'monthly', nextDueDate: new Date().toISOString().slice(0, 10) },
  });

  useEffect(() => { if (open) reset({ type: 'expense', amount: '', categoryId: '', accountId: '', description: '', frequency: 'monthly', nextDueDate: new Date().toISOString().slice(0, 10) }); }, [open]);

  const onSubmit = async (values) => {
    try { await onSaved?.(values); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Recurring Entry" size="modal-sm"
      footer={
        <>
          <button className="btn-fv btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-fv btn-primary btn-sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size={14} /> : 'Save'}
          </button>
        </>
      }>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Type</label>
          <select className="form-select" {...register('type')}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Frequency</label>
          <select className="form-select" {...register('frequency')}>
            {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <input className={`form-control ${errors.description ? 'is-invalid' : ''}`} placeholder="e.g. Netflix Subscription" {...register('description', { required: true })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input type="number" step="0.01" className="form-control" placeholder="799" {...register('amount', { required: true })} />
        </div>
        <div className="form-group">
          <label className="form-label">Next Due Date</label>
          <input type="date" className="form-control" {...register('nextDueDate', { required: true })} />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" {...register('categoryId')}>
            <option value="">Select</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Account</label>
          <select className="form-select" {...register('accountId', { required: true })}>
            <option value="">Select</option>
            {accounts.filter(a => a.isActive).map(a => <option key={a._id} value={a._id}>{a.icon} {a.name}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════
// CONTRIBUTION FORM
// ══════════════════════════════════════════════════════
export const ContributionForm = ({ open, onClose, onSaved, goalName }) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { amount: '', note: '' },
  });

  useEffect(() => { if (open) reset({ amount: '', note: '' }); }, [open]);

  const onSubmit = async (values) => {
    try { await onSaved?.({ amount: parseFloat(values.amount), note: values.note }); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to add contribution'); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Contribute to ${goalName || 'Goal'}`} size="modal-sm"
      footer={
        <>
          <button className="btn-fv btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-fv btn-success btn-sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Spinner size={14} /> : '+ Add Contribution'}
          </button>
        </>
      }>
      <div className="form-group">
        <label className="form-label">Amount (₹)</label>
        <input type="number" step="0.01" className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
          placeholder="5000" autoFocus
          {...register('amount', { required: 'Amount required', min: { value: 1, message: 'Must be positive' } })} />
        {errors.amount && <span className="invalid-feedback">{errors.amount.message}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Note <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
        <input className="form-control" placeholder="e.g. Monthly savings transfer" {...register('note')} />
      </div>
    </Modal>
  );
};
