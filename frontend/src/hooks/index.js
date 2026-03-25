import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  accountsApi, transactionsApi, dashboardApi,
  budgetsApi, goalsApi, categoriesApi, recurringApi,
} from '../api/index';

// ─── Generic fetch hook ───────────────────────────────
export const useFetch = (fetchFn, deps = [], immediate = true) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async (...args) => {
    setLoading(true); setError(null);
    try {
      const res = await fetchFn(...args);
      setData(res.data.data);
      return res.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { if (immediate) fetch(); }, [fetch, immediate]);

  return { data, loading, error, refetch: fetch };
};

// ─── useAccounts ──────────────────────────────────────
export const useAccounts = () => {
  const [accounts, setAccounts]     = useState([]);
  const [totalBalance, setTotal]    = useState(0);
  const [loading, setLoading]       = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await accountsApi.getAll();
      setAccounts(data.data.accounts);
      setTotal(data.data.totalBalance);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (payload) => {
    const { data } = await accountsApi.create(payload);
    await load();
    toast.success('Account created!');
    return data.data.account;
  };

  const update = async (id, payload) => {
    await accountsApi.update(id, payload);
    await load();
    toast.success('Account updated!');
  };

  const remove = async (id) => {
    await accountsApi.delete(id);
    await load();
    toast.success('Account deleted.');
  };

  const archive = async (id) => {
    await accountsApi.archive(id);
    await load();
  };

  const transfer = async (payload) => {
    const { data } = await accountsApi.transfer(payload);
    await load();
    toast.success('Transfer completed!');
    return data.data;
  };

  return { accounts, totalBalance, loading, refetch: load, create, update, remove, archive, transfer };
};

// ─── useCategories ────────────────────────────────────
export const useCategories = (type) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    categoriesApi.getAll(type ? { type } : {})
      .then(({ data }) => setCategories(data.data.categories))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [type]);

  return { categories, loading };
};

// ─── useTransactions ──────────────────────────────────
export const useTransactions = (params = {}) => {
  const [transactions, setTxs]  = useState([]);
  const [summary, setSummary]   = useState({ income: 0, expense: 0, transfer: 0 });
  const [pagination, setPag]    = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async (p = params) => {
    setLoading(true);
    try {
      const { data } = await transactionsApi.getAll(p);
      setTxs(data.data.transactions);
      setSummary(data.data.summary);
      setPag(data.pagination);
    } catch { /* silent */ }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    await transactionsApi.delete(id);
    await load();
    toast.success('Transaction deleted.');
  };

  const bulkDelete = async (ids) => {
    await transactionsApi.bulkDelete(ids);
    await load();
    toast.success(`${ids.length} transactions deleted.`);
  };

  return { transactions, summary, pagination, loading, refetch: load, remove, bulkDelete };
};

// ─── useDashboard ─────────────────────────────────────
export const useDashboard = (period = 'this_month') => {
  const [stats, setStats]       = useState(null);
  const [charts, setCharts]     = useState({});
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, incExpRes, catRes, cashRes, savingsRes, accRes] = await Promise.all([
        dashboardApi.getStats({ period }),
        dashboardApi.getIncomeExpense({ period }),
        dashboardApi.getCategoryBreakdown({ period }),
        dashboardApi.getCashFlow({ period }),
        dashboardApi.getSavingsTrend(),
        dashboardApi.getAccountsChart(),
      ]);
      setStats(statsRes.data.data);
      setCharts({
        incomeExpense:      incExpRes.data.data,
        categoryBreakdown:  catRes.data.data,
        cashFlow:           cashRes.data.data,
        savingsTrend:       savingsRes.data.data,
        accounts:           accRes.data.data,
      });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return { stats, charts, loading, refetch: load };
};

// ─── useBudgets ───────────────────────────────────────
export const useBudgets = () => {
  const [budgets, setBudgets]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await budgetsApi.getAll();
      setBudgets(data.data.budgets);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (payload) => {
    await budgetsApi.create(payload);
    await load();
    toast.success('Budget created!');
  };

  const update = async (id, payload) => {
    await budgetsApi.update(id, payload);
    await load();
    toast.success('Budget updated!');
  };

  const remove = async (id) => {
    await budgetsApi.delete(id);
    await load();
    toast.success('Budget deleted.');
  };

  return { budgets, loading, refetch: load, create, update, remove };
};

// ─── useGoals ─────────────────────────────────────────
export const useGoals = () => {
  const [goals, setGoals]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await goalsApi.getAll();
      setGoals(data.data.goals);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (payload) => {
    await goalsApi.create(payload);
    await load();
    toast.success('Goal created!');
  };

  const update = async (id, payload) => {
    await goalsApi.update(id, payload);
    await load();
    toast.success('Goal updated!');
  };

  const remove = async (id) => {
    await goalsApi.delete(id);
    await load();
    toast.success('Goal deleted.');
  };

  const contribute = async (id, payload) => {
    const { data } = await goalsApi.addContribution(id, payload);
    await load();
    toast.success('Contribution added!');
    return data.data;
  };

  return { goals, loading, refetch: load, create, update, remove, contribute };
};

// ─── useRecurring ─────────────────────────────────────
export const useRecurring = () => {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recurringApi.getAll();
      setRecurring(data.data.recurring);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (payload) => { await recurringApi.create(payload); await load(); toast.success('Recurring added!'); };
  const remove = async (id) => { await recurringApi.delete(id); await load(); toast.success('Deleted.'); };
  const pause  = async (id) => { await recurringApi.pause(id);  await load(); toast.success('Paused.'); };
  const resume = async (id) => { await recurringApi.resume(id); await load(); toast.success('Resumed.'); };

  return { recurring, loading, refetch: load, create, remove, pause, resume };
};
