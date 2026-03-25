import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Wallet, List, PieChart, Target,
  Repeat, FileText, Settings, TrendingUp, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/index';

const NAV = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/accounts',     icon: Wallet,          label: 'Accounts' },
      { to: '/transactions', icon: List,            label: 'Transactions' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/budgets',   icon: PieChart, label: 'Budgets' },
      { to: '/goals',     icon: Target,   label: 'Savings Goals' },
      { to: '/recurring', icon: Repeat,   label: 'Recurring' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/reports',  icon: FileText, label: 'Reports' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <TrendingUp size={18} />
          </div>
          <span className="sidebar-logo-text">FinVault</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map((section) => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={onClose}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <NavLink to="/settings" className="sidebar-user" onClick={onClose}>
            <Avatar name={user?.name} src={user?.profilePicture} size="sm" />
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </NavLink>
          <button className="nav-item" style={{ marginTop: 6, color: '#EF4444' }}
            onClick={logout}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
