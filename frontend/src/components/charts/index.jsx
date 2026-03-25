import React from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Filler, Tooltip, Legend, Title,
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import { CHART_COLORS } from '../../constants/index';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Filler, Tooltip, Legend, Title
);

const FONT = { family: "'DM Sans', sans-serif", size: 12 };

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

// ─── Income vs Expense Bar Chart ─────────────────────
export const IncomeExpenseChart = ({ data = [] }) => {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Income',
        data: data.map(d => (d.income || 0) / 1000),
        backgroundColor: '#05966920',
        borderColor: '#059669',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Expense',
        data: data.map(d => (d.expense || 0) / 1000),
        backgroundColor: '#DC262620',
        borderColor: '#DC2626',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  return (
    <Bar data={chartData} options={{
      ...baseOptions,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: FONT, padding: 16 } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ₹${(ctx.raw * 1000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
          },
        },
      },
      scales: {
        y: { grid: { color: '#F1F5F9' }, ticks: { callback: v => `₹${v}K`, font: FONT } },
        x: { grid: { display: false }, ticks: { font: FONT } },
      },
    }} />
  );
};

// ─── Category Doughnut ───────────────────────────────
export const CategoryDonutChart = ({ data = [] }) => {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [{
      data: data.map(d => d.total),
      backgroundColor: data.map((d, i) => d.color || CHART_COLORS[i % CHART_COLORS.length]),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  return (
    <Doughnut data={chartData} options={{
      ...baseOptions,
      cutout: '72%',
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: FONT, padding: 10 } },
        tooltip: { callbacks: { label: (ctx) => ` ₹${ctx.raw.toLocaleString('en-IN')}` } },
      },
    }} />
  );
};

// ─── Cash Flow Area Chart ────────────────────────────
export const CashFlowChart = ({ data = [] }) => {
  const ctx = document.createElement('canvas').getContext('2d');
  let gradient;
  try {
    gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, '#1A56DB30');
    gradient.addColorStop(1, '#1A56DB00');
  } catch { gradient = '#1A56DB20'; }

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [{
      label: 'Balance',
      data: data.map(d => (d.balance || 0) / 1000),
      fill: true,
      backgroundColor: gradient,
      borderColor: '#1A56DB',
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0.4,
    }],
  };

  return (
    <Line data={chartData} options={{
      ...baseOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ₹${(ctx.raw * 1000).toLocaleString('en-IN')}` } },
      },
      scales: {
        y: { grid: { color: '#F1F5F9' }, ticks: { callback: v => `₹${v}K`, font: FONT } },
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: FONT } },
      },
    }} />
  );
};

// ─── Savings Trend Line Chart ────────────────────────
export const SavingsTrendChart = ({ data = [] }) => {
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Savings',
        data: data.map(d => (d.savings || 0) / 1000),
        borderColor: '#059669',
        backgroundColor: '#05966918',
        fill: true,
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: (ctx) => {
          const val = ctx.raw;
          const goal = data[ctx.dataIndex]?.goal / 1000;
          return val >= goal ? '#059669' : '#DC2626';
        },
        pointBorderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Goal',
        data: data.map(d => (d.goal || 0) / 1000),
        borderColor: '#1A56DB',
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  return (
    <Line data={chartData} options={{
      ...baseOptions,
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: FONT, padding: 16 } },
        tooltip: { callbacks: { label: (ctx) => ` ₹${(ctx.raw * 1000).toLocaleString('en-IN')}` } },
      },
      scales: {
        y: { grid: { color: '#F1F5F9' }, ticks: { callback: v => `₹${v}K`, font: FONT } },
        x: { grid: { display: false }, ticks: { font: FONT } },
      },
    }} />
  );
};

// ─── Top Spending (Horizontal Bar) ───────────────────
export const TopCategoriesChart = ({ data = [] }) => {
  const top = [...data].sort((a, b) => b.total - a.total).slice(0, 8);
  const chartData = {
    labels: top.map(d => d.name),
    datasets: [{
      label: 'Spent',
      data: top.map(d => (d.total || 0) / 1000),
      backgroundColor: top.map((d, i) => (d.color || CHART_COLORS[i % CHART_COLORS.length]) + '90'),
      borderColor: top.map((d, i) => d.color || CHART_COLORS[i % CHART_COLORS.length]),
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  return (
    <Bar data={chartData} options={{
      ...baseOptions,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ₹${(ctx.raw * 1000).toLocaleString('en-IN')}` } },
      },
      scales: {
        x: { grid: { color: '#F1F5F9' }, ticks: { callback: v => `₹${v}K`, font: FONT } },
        y: { grid: { display: false }, ticks: { font: FONT } },
      },
    }} />
  );
};

// ─── Accounts Bar Chart ───────────────────────────────
export const AccountsBarChart = ({ data = [] }) => {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [{
      label: 'Balance',
      data: data.map(d => (d.balance || 0) / 1000),
      backgroundColor: data.map(d => (d.color || '#1A56DB') + '88'),
      borderColor: data.map(d => d.color || '#1A56DB'),
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  return (
    <Bar data={chartData} options={{
      ...baseOptions,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ₹${(ctx.raw * 1000).toLocaleString('en-IN')}` } },
      },
      scales: {
        y: { grid: { color: '#F1F5F9' }, ticks: { callback: v => `₹${v}K`, font: FONT } },
        x: { grid: { display: false }, ticks: { font: FONT } },
      },
    }} />
  );
};
