import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';

import { AuthProvider } from './context/AuthContext';
import useAuth from './context/useAuth';
import { AppLayout } from './components/layout/AppLayout';
import { TransactionForm } from './components/forms/TransactionForm';
import { Spinner } from './components/ui/index';
import { useAccounts } from './hooks/index';

// Pages
import Landing from './pages/Landing';
import { Login, Register, VerifyEmail, ForgotPassword } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import { Accounts, Budgets, Goals, Recurring, Reports } from './pages/Pages';
import Settings from './pages/Settings';

// ─── Auth Guard ───────────────────────────────────────
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner size={40} color="var(--primary)" />
          <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-2)', fontWeight: 600 }}>Loading FinVault...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// ─── Redirect if authenticated ────────────────────────
function RedirectIfAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Page transition wrapper ─────────────────────────
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}>
    {children}
  </motion.div>
);

// ─── App Shell with TX modal ─────────────────────────
function AppShell() {
  const [txModal, setTxModal]   = useState(false);
  const [editTx, setEditTx]     = useState(null);
  const { accounts, refetch: refetchAccounts } = useAccounts();

  const openAddTx = () => { setEditTx(null); setTxModal(true); };
  const openEditTx = (tx) => { setEditTx(tx); setTxModal(true); };
  const handleSaved = () => { refetchAccounts(); };

  return (
    <AppLayout onAddTx={openAddTx}>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/dashboard"    element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/accounts"     element={<PageWrapper><Accounts /></PageWrapper>} />
          <Route path="/transactions" element={<PageWrapper><Transactions onEdit={openEditTx} accounts={accounts} /></PageWrapper>} />
          <Route path="/budgets"      element={<PageWrapper><Budgets /></PageWrapper>} />
          <Route path="/goals"        element={<PageWrapper><Goals /></PageWrapper>} />
          <Route path="/recurring"    element={<PageWrapper><Recurring accounts={accounts} /></PageWrapper>} />
          <Route path="/reports"      element={<PageWrapper><Reports /></PageWrapper>} />
          <Route path="/settings"     element={<PageWrapper><Settings /></PageWrapper>} />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AnimatePresence>

      <TransactionForm
        open={txModal}
        onClose={() => { setTxModal(false); setEditTx(null); }}
        onSaved={handleSaved}
        accounts={accounts}
        editTx={editTx}
      />
    </AppLayout>
  );
}

// ─── Root App ─────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RedirectIfAuth><Landing /></RedirectIfAuth>} />
        <Route path="/login"          element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
        <Route path="/register"       element={<RedirectIfAuth><Register /></RedirectIfAuth>} />
        <Route path="/verify-email"   element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected routes */}
        <Route path="/*" element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        } />
      </Routes>
    </AuthProvider>
  );
}