import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/index';
import { formatAmount, PERIODS } from '../utils/helpers';
import { StatCard, SkeletonStatCard, PeriodTabs, EmptyState, Skeleton } from '../components/ui/index';
import { IncomeExpenseChart, CategoryDonutChart, CashFlowChart, SavingsTrendChart, TopCategoriesChart, AccountsBarChart } from '../components/charts/index';
import { RecentTransactions } from './Transactions';
import { BudgetProgressSection } from './Pages';

const DASH_PERIODS = PERIODS.slice(0, 4);

export default function Dashboard() {
  const [period, setPeriod] = useState('this_month');
  const { stats, charts, loading } = useDashboard(period);
  const navigate = useNavigate();

  return (
    <div>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Financial Overview</h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Updated in real-time</p>
        </div>
        <PeriodTabs value={period} onChange={setPeriod} options={DASH_PERIODS} />
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {loading ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />) : stats ? (
          <>
            <StatCard type="balance" icon={<Wallet size={20} />} label="Total Balance"
              value={formatAmount(stats.totalBalance)} subtext="All active accounts" />
            <StatCard type="income" icon={<TrendingUp size={20} />} label="Income This Month"
              value={formatAmount(stats.income)} change={stats.changes?.income} />
            <StatCard type="expense" icon={<TrendingDown size={20} />} label="Expenses This Month"
              value={formatAmount(stats.expense)} change={stats.changes?.expense} />
            <StatCard type="savings" icon={<PiggyBank size={20} />} label="Net Savings"
              value={formatAmount(stats.savings)} change={stats.changes?.savings}
              subtext={`${stats.savingsRate}% savings rate`} />
          </>
        ) : null}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Income vs Expense */}
        <div className="chart-card" style={{ gridColumn: 'span 8' }}>
          <div className="chart-title">Income vs Expenses</div>
          <div className="chart-subtitle">Last 6 months comparison</div>
          <div className="chart-wrap" style={{ height: 240 }}>
            {loading ? <Skeleton height={240} borderRadius={8} /> :
              <IncomeExpenseChart data={charts?.incomeExpense?.data || []} />}
          </div>
        </div>

        {/* Category Donut */}
        <div className="chart-card" style={{ gridColumn: 'span 4' }}>
          <div className="chart-title">Expense Breakdown</div>
          <div className="chart-subtitle">By category this period</div>
          <div className="chart-wrap" style={{ height: 210, position: 'relative' }}>
            {loading ? <Skeleton height={210} borderRadius={8} /> : (
              <>
                <CategoryDonutChart data={charts?.categoryBreakdown?.data || []} />
                <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>
                    {formatAmount(charts?.categoryBreakdown?.data?.reduce((s, d) => s + d.total, 0) || 0)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700 }}>TOTAL</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cash Flow */}
        <div className="chart-card" style={{ gridColumn: 'span 8' }}>
          <div className="chart-title">Cash Flow Trend</div>
          <div className="chart-subtitle">Running balance over selected period</div>
          <div className="chart-wrap" style={{ height: 200 }}>
            {loading ? <Skeleton height={200} borderRadius={8} /> :
              <CashFlowChart data={charts?.cashFlow?.data || []} />}
          </div>
        </div>

        {/* Budget Progress */}
        <div className="chart-card" style={{ gridColumn: 'span 4' }}>
          <div className="chart-title">Budget Status</div>
          <div className="chart-subtitle">This month's utilization</div>
          <BudgetProgressSection mini />
        </div>

        {/* Savings Trend */}
        <div className="chart-card" style={{ gridColumn: 'span 6' }}>
          <div className="chart-title">Monthly Savings Trend</div>
          <div className="chart-subtitle">vs. savings goal (dashed line)</div>
          <div className="chart-wrap" style={{ height: 200 }}>
            {loading ? <Skeleton height={200} borderRadius={8} /> :
              <SavingsTrendChart data={charts?.savingsTrend?.data || []} />}
          </div>
        </div>

        {/* Top Categories */}
        <div className="chart-card" style={{ gridColumn: 'span 6' }}>
          <div className="chart-title">Top Spending Categories</div>
          <div className="chart-subtitle">This period's expense distribution</div>
          <div className="chart-wrap" style={{ height: 200 }}>
            {loading ? <Skeleton height={200} borderRadius={8} /> :
              <TopCategoriesChart data={charts?.categoryBreakdown?.data || []} />}
          </div>
        </div>

        {/* Account Balances */}
        <div className="chart-card" style={{ gridColumn: 'span 12' }}>
          <div className="chart-title">Account Balances</div>
          <div className="chart-subtitle">All active accounts overview</div>
          <div className="chart-wrap" style={{ height: 160 }}>
            {loading ? <Skeleton height={160} borderRadius={8} /> :
              <AccountsBarChart data={charts?.accounts?.data || []} />}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="fv-card">
        <div className="fv-card-header">
          <h3 className="fv-card-title">Recent Transactions</h3>
          <button className="btn-fv btn-outline btn-sm" onClick={() => navigate('/transactions')} style={{ gap: 6 }}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div style={{ padding: '12px 16px' }}>
          <RecentTransactions limit={10} />
        </div>
      </div>
    </div>
  );
}
