import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/index';
import { CURRENCIES } from '../constants/index';
import { Spinner, Toggle } from '../components/ui/index';
import { toast } from 'react-toastify';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const [tab, setTab]     = useState('profile');
  const [saving, setSaving] = useState(false);
  const [form, setForm]   = useState({
    name: user?.name || '',
    email: user?.email || '',
    monthlyIncome: user?.monthlyIncome || 0,
    savingsGoalPercent: user?.savingsGoalPercent || 20,
    currency: user?.currency || 'INR',
  });
  const [passwords, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput]     = useState('');
  const [prefs, setPrefs] = useState({ emailNotifications: true, budgetAlerts: true, recurringReminders: true });

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await userApi.updateProfile(form);
      updateUser(data.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) { toast.error("Passwords don't match"); return; }
    if (passwords.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    try {
      await userApi.changePassword(passwords);
      toast.success('Password changed. Logging out...');
      setTimeout(logout, 1500);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
  };

  const deleteAccount = async () => {
    if (deleteInput !== 'DELETE') { toast.error('Please type DELETE to confirm'); return; }
    try {
      await userApi.deleteAccount({ confirmation: 'DELETE' });
      toast.success('Account permanently deleted.');
      logout();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete account'); }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="settings-tabs">
        {[['profile','Profile'],['security','Security'],['preferences','Preferences']].map(([k,l]) => (
          <button key={k} className={`settings-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ─── Profile Tab ─────────────────────────────── */}
      {tab === 'profile' && (
        <div style={{ maxWidth: 560 }}>
          <h3 style={{ marginBottom: 4 }}>Profile Information</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>Update your personal details and preferences.</p>

          {/* Avatar */}
          <div className="settings-row">
            <div className="settings-row-info"><h4>Profile Photo</h4><p>Your display picture across the app</p></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, overflow: 'hidden' }}>
                {user?.profilePicture ? <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.slice(0, 2).toUpperCase()}
              </div>
              <button className="btn-fv btn-outline btn-sm" onClick={() => toast.info('Upload coming soon!')}>Upload Photo</button>
            </div>
          </div>

          {/* Fields */}
          {[
            { label: 'Full Name',       key: 'name',               type: 'text',   ph: 'Your full name' },
            { label: 'Email Address',   key: 'email',              type: 'email',  ph: 'you@example.com' },
            { label: 'Monthly Income',  key: 'monthlyIncome',      type: 'number', ph: '150000', prefix: '₹' },
            { label: 'Savings Goal %',  key: 'savingsGoalPercent', type: 'number', ph: '20', suffix: '% of income' },
          ].map(({ label, key, type, ph, prefix, suffix }) => (
            <div key={key} className="settings-row">
              <div className="settings-row-info" style={{ flex: '0 0 160px' }}><h4>{label}</h4></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {prefix && <span style={{ color: 'var(--text-3)', fontWeight: 700 }}>{prefix}</span>}
                <input type={type} className="form-control" style={{ maxWidth: 220 }}
                  placeholder={ph} value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))} />
                {suffix && <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{suffix}</span>}
              </div>
            </div>
          ))}

          <div className="settings-row">
            <div className="settings-row-info" style={{ flex: '0 0 160px' }}><h4>Currency</h4></div>
            <select className="form-select" style={{ maxWidth: 220 }} value={form.currency}
              onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
            <button className="btn-fv btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? <Spinner size={14} color="#fff" /> : '💾 Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Security Tab ──────────────────────────── */}
      {tab === 'security' && (
        <div style={{ maxWidth: 480 }}>
          <h3 style={{ marginBottom: 4 }}>Change Password</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
            Requires your current password. You'll be signed out after changing.
          </p>
          {[
            { label: 'Current Password',  key: 'currentPassword' },
            { label: 'New Password',      key: 'newPassword' },
            { label: 'Confirm New Password', key: 'confirmPassword' },
          ].map(({ label, key }) => (
            <div key={key} className="form-group">
              <label className="form-label">{label}</label>
              <input type="password" className="form-control" placeholder="••••••••"
                value={passwords[key]}
                onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
          <button className="btn-fv btn-primary" onClick={changePassword}>Update Password</button>

          <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

          <h3 style={{ color: 'var(--danger)', marginBottom: 4 }}>⚠️ Danger Zone</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
            Permanently delete your account and <strong>all data</strong>. This cannot be undone.
          </p>
          <button className="btn-fv btn-danger" onClick={() => setDeleteConfirm(true)}>Delete My Account</button>

          {deleteConfirm && (
            <div style={{ marginTop: 16, padding: 20, background: 'var(--danger-light)', borderRadius: 10, border: '1px solid var(--danger)' }}>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--danger)' }}>
                Are you absolutely sure? Type <strong>DELETE</strong> to confirm:
              </p>
              <input className="form-control" style={{ marginBottom: 12 }}
                value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE here" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-fv btn-danger btn-sm" onClick={deleteAccount}
                  disabled={deleteInput !== 'DELETE'}>Permanently Delete Account</button>
                <button className="btn-fv btn-outline btn-sm"
                  onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Preferences Tab ───────────────────────── */}
      {tab === 'preferences' && (
        <div style={{ maxWidth: 480 }}>
          <h3 style={{ marginBottom: 4 }}>App Preferences</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>Customize your FinVault experience.</p>

          {[
            { key: 'emailNotifications', label: 'Email Notifications',   desc: 'Budget alerts and recurring transaction reminders' },
            { key: 'budgetAlerts',       label: 'Budget Alerts',         desc: 'Alerts at 50%, 75%, 90%, and 100% of budget usage' },
            { key: 'recurringReminders', label: 'Recurring Reminders',   desc: 'Day-before email for upcoming auto-transactions' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="settings-row">
              <div className="settings-row-info">
                <h4>{label}</h4>
                <p>{desc}</p>
              </div>
              <Toggle checked={prefs[key]} onChange={() => setPrefs(p => ({ ...p, [key]: !p[key] }))} />
            </div>
          ))}

          <div className="settings-row">
            <div className="settings-row-info"><h4>Week Starts On</h4><p>First day of the week in calendar views</p></div>
            <select className="form-select" style={{ width: 'auto' }}>
              <option>Monday</option><option>Sunday</option>
            </select>
          </div>

          <div style={{ marginTop: 24 }}>
            <button className="btn-fv btn-primary" onClick={() => toast.success('Preferences saved!')}>
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
