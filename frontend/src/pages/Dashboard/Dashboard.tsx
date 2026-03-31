import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  CreditCard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { Card } from '../../components/Card';
import { TransactionModal } from '../../components/TransactionModal';
import { getDashboardSummary, getTransactions, getCategories, getGoals } from '../../services/finance';
import './Dashboard.css';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function toNumber(value: any) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  return 0;
}

export function Dashboard() {
  const [summary, setSummary] = useState<any | null>(null);
  const [chartMonthly, setChartMonthly] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [lastTransactions, setLastTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [summaryData, txData, categories, goalsData] = await Promise.all([
          getDashboardSummary(),
          getTransactions({ page: 1, pageSize: 200 }),
          getCategories(),
          getGoals(),
        ]);

        const catMap: Record<string, string> = {};
        categories.forEach((c: any) => {
          catMap[c.id] = c.name;
        });

        setSummary(summaryData);
        setExpensesByCategory(
          summaryData.expensesByCategory.map((item: any) => ({
            name: item.categoryName,
            value: toNumber(item.total),
            color: '#4f9cf9',
          })),
        );

        const transactions = txData.items || [];
        const last = summaryData.lastTransactions || [];

        const normalizedLast = last.map((tx: any) => {
          const amount = toNumber(tx.amount);
          const isIncome = tx.type === 'INCOME';
          const isCard = tx.source === 'card';
          const signedAmount = isIncome ? amount : -amount;
          return {
            id: tx.id,
            description: tx.description,
            amount: isCard ? -amount : signedAmount,
            date: tx.date,
            category: catMap[tx.categoryId] || 'Sem categoria',
            status: tx.status === 'POSTED' || !tx.status ? 'completed' : 'pending',
          };
        });
        setLastTransactions(normalizedLast);

        const chart = buildMonthlyChart(transactions);
        setChartMonthly(chart);

        const mappedGoals = goalsData.map((goal: any) => {
          const target = toNumber(goal.targetAmount);
          const current = toNumber(goal.currentAmount);
          return {
            id: goal.id,
            name: goal.name,
            amount: target,
            saved: current,
            color: '#4f9cf9',
          };
        });
        setGoals(mappedGoals);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [refreshKey]);

  const metrics = useMemo(() => {
    if (!summary) return null;
    return {
      balance: toNumber(summary.balance),
      income: toNumber(summary.income),
      expense: toNumber(summary.expense),
      invoice: summary.currentBill ? toNumber(summary.currentBill.total) : 0,
    };
  }, [summary]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Carregando dashboard...</div>;
  }

  if (error || !summary || !metrics) {
    return <div style={{ color: '#fecaca' }}>{error || 'Erro ao carregar dados.'}</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Visão Geral</h1>
          <p className="dashboard-subtitle">Acompanhe suas finanças deste mês</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Nova Transação</button>
        </div>
      </header>

      <div className="metrics-grid">
        <Card className="metric-card">
          <div className="metric-item">
            <div className="metric-icon bg-info">
              <Wallet size={24} color="white" />
            </div>
            <div className="metric-content">
              <span className="metric-label">Saldo Atual</span>
              <h2 className="metric-value">{formatCurrency(metrics.balance)}</h2>
            </div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-item">
            <div className="metric-icon bg-success">
              <ArrowUpCircle size={24} color="white" />
            </div>
            <div className="metric-content">
              <span className="metric-label">Receitas do Mês</span>
              <h2 className="metric-value text-success">{formatCurrency(metrics.income)}</h2>
            </div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-item">
            <div className="metric-icon bg-danger">
              <ArrowDownCircle size={24} color="white" />
            </div>
            <div className="metric-content">
              <span className="metric-label">Despesas do Mês</span>
              <h2 className="metric-value text-danger">{formatCurrency(metrics.expense)}</h2>
            </div>
          </div>
        </Card>

        <Card className="metric-card">
          <div className="metric-item">
            <div className="metric-icon bg-warning">
              <CreditCard size={24} color="white" />
            </div>
            <div className="metric-content">
              <span className="metric-label">Fatura Atual</span>
              <h2 className="metric-value text-warning">{formatCurrency(metrics.invoice)}</h2>
            </div>
          </div>
        </Card>
      </div>

      <div className="charts-grid">
        <Card title="Receitas vs Despesas" className="chart-card">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="#a6b0c3" tick={{ fill: '#a6b0c3' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#a6b0c3" tick={{ fill: '#a6b0c3' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141b27', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '10px' }}
                  itemStyle={{ color: '#f5f7fb' }}
                  cursor={{ fill: 'rgba(79,156,249,0.08)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ color: '#a6b0c3' }} />
                <Bar dataKey="incomes" name="Receitas" fill="url(#incomesGradient)" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="expenses" name="Despesas" fill="url(#expensesGradient)" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Despesas por Categoria" className="chart-card">
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={74}
                  outerRadius={112}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#0b0f16"
                >
                  {expensesByCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#4f9cf9'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#141b27', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '10px' }}
                  itemStyle={{ color: '#f5f7fb' }}
                  formatter={(value: any) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pie-legend">
            {expensesByCategory.map((entry: any, index: number) => (
              <div key={index} className="pie-legend-item">
                <div className="pie-legend-color" style={{ backgroundColor: entry.color || '#4f9cf9' }}></div>
                <span className="pie-legend-label">{entry.name}</span>
                <span className="pie-legend-value">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="bottom-grid">
        <Card title="Últimas Transações" className="transactions-card">
          <div className="transactions-list">
            {lastTransactions.map((tx) => (
              <div key={tx.id} className="transaction-item">
                <div className="tx-info">
                  <div className={`tx-icon ${tx.amount > 0 ? 'bg-success-alpha' : 'bg-danger-alpha'}`}>
                    {tx.amount > 0 ? <ArrowUpCircle size={20} className="text-success" /> : <ArrowDownCircle size={20} className="text-danger" />}
                  </div>
                  <div>
                    <h4 className="tx-description">{tx.description}</h4>
                    <span className="tx-category">{tx.category} • {new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="tx-amount-col">
                  <span className={`tx-amount ${tx.amount > 0 ? 'text-success' : 'text-primary'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </span>
                  <span className={`tx-status status-${tx.status}`}>
                    {tx.status === 'completed' ? 'Concluído' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
            {lastTransactions.length === 0 && (
              <div style={{ color: 'var(--text-muted)' }}>Nenhuma transação recente.</div>
            )}
          </div>
          <button className="btn btn-ghost w-full mt-4">Ver todas transações</button>
        </Card>

        <Card title="Metas Financeiras" className="goals-card">
          <div className="goals-list">
            {goals.map((goal) => {
              const percentage = Math.min(100, Math.round((goal.saved / goal.amount) * 100));
              return (
                <div key={goal.id} className="goal-item">
                  <div className="goal-header">
                    <div className="goal-info">
                      <h4 className="goal-name">{goal.name}</h4>
                      <span className="goal-progress-text">
                        {formatCurrency(goal.saved)} / {formatCurrency(goal.amount)}
                      </span>
                    </div>
                    <span className="goal-percentage">{percentage}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {goals.length === 0 && (
              <div style={{ color: 'var(--text-muted)' }}>Nenhuma meta ativa.</div>
            )}
          </div>
          <button className="btn btn-ghost w-full mt-4">Gerenciar metas</button>
        </Card>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
}

function buildMonthlyChart(transactions: any[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const label = date.toLocaleDateString('pt-BR', { month: 'short' });
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      name: label.charAt(0).toUpperCase() + label.slice(1),
      incomes: 0,
      expenses: 0,
      month: date.getMonth(),
      year: date.getFullYear(),
    };
  });

  const map = new Map(months.map((m) => [m.key, m]));

  transactions.forEach((tx) => {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const target = map.get(key);
    if (!target) return;
    const amount = toNumber(tx.amount);
    if (tx.type === 'INCOME') target.incomes += amount;
    if (tx.type === 'EXPENSE') target.expenses += amount;
  });

  return months.map((m) => ({ name: m.name, incomes: m.incomes, expenses: m.expenses }));
}
