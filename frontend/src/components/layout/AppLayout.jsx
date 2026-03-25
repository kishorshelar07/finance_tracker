import React, { useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { LayoutDashboard, List, PieChart, Target, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// ─── Mobile Tab Bar ───────────────────────────────────
export const MobileTabBar = ({ onAddTx }) => {
  const { pathname } = useLocation();
  const tabs = [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
    { to: '/transactions', icon: List,            label: 'Txns' },
    { to: '/budgets',      icon: PieChart,        label: 'Budgets' },
    { to: '/goals',        icon: Target,          label: 'Goals' },
  ];

  return (
    <div className="mobile-tab-bar">
      {tabs.slice(0, 2).map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
      <button className="mobile-fab" onClick={onAddTx}><Plus size={24} /></button>
      {tabs.slice(2).map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </div>
  );
};

// ─── PAGE TITLES ──────────────────────────────────────
const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/accounts':     'Accounts',
  '/transactions': 'Transactions',
  '/budgets':      'Budgets',
  '/goals':        'Savings Goals',
  '/recurring':    'Recurring Transactions',
  '/reports':      'Reports',
  '/settings':     'Settings',
};

// ─── App Layout ───────────────────────────────────────
export const AppLayout = ({ children, onAddTx }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || 'FinVault';

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header
          onMenuToggle={() => setSidebarOpen(v => !v)}
          pageTitle={title}
          onAddTx={onAddTx}
        />
        <main className="page-body">{children}</main>
        <MobileTabBar onAddTx={onAddTx} />
      </div>
    </div>
  );
};
