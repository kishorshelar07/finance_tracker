import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Bell, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/index';

export const Header = ({ onMenuToggle, pageTitle, onAddTx }) => {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="top-header">
      <button className="btn-icon" onClick={onMenuToggle} aria-label="Toggle menu">
        <Menu size={18} />
      </button>
      <h1 className="page-title">{pageTitle}</h1>
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button className="btn-fv btn-primary btn-sm" onClick={onAddTx}
          style={{ gap: 6 }}>
          <Plus size={15} /> Add Transaction
        </button>

        {/* Notifications */}
        <div className="dropdown-wrapper">
          <button className="btn-icon" style={{ position: 'relative' }}
            onClick={() => setNotifOpen(v => !v)}>
            <Bell size={17} />
            <span className="notif-dot" />
          </button>
          {notifOpen && (
            <div className="dropdown-menu-fv" style={{ width: 300, right: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                <button className="btn-icon" style={{ width: 24, height: 24 }}
                  onClick={() => setNotifOpen(false)}><X size={14} /></button>
              </div>
              {[
                { msg: 'Shopping budget at 82% — ₹12,376 of ₹15,000', time: '2h ago', dot: true },
                { msg: 'Netflix subscription due tomorrow', time: '5h ago', dot: true },
                { msg: 'Salary credited ₹1,50,000', time: '2 days ago', dot: false },
              ].map((n, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px',
                  borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background 200ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                    background: n.dot ? 'var(--primary)' : 'var(--border)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.5 }}>{n.msg}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <NavLink to="/settings">
          <Avatar name={user?.name} src={user?.profilePicture} size="sm" style={{ cursor: 'pointer' }} />
        </NavLink>
      </div>
    </header>
  );
};
