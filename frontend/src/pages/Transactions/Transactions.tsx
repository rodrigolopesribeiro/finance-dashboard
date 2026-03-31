import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/Card';
import { TransactionModal } from '../../components/TransactionModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import {
  deleteTransaction,
  getAccounts,
  getCategories,
  getTransactions,
} from '../../services/finance';
import type {
  SortDirection,
  Transaction,
  TransactionSortBy,
  TransactionStatus,
  TransactionType,
  TransactionsSummary,
} from '../../services/finance';
import './Transactions.css';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
};

const formatDateInput = (value: string) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  return formatDate(value);
};

const pad = (value: number) => String(value).padStart(2, '0');

const toDateInput = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const typeLabels: Record<TransactionType, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  TRANSFER: 'Transferência',
};

const statusLabels: Record<TransactionStatus, string> = {
  POSTED: 'Confirmada',
  PENDING: 'Pendente',
  CANCELED: 'Cancelada',
};

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

type PresetKey = 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom' | 'all';

type FilterValues = {
  search: string;
  categoryId: string;
  accountId: string;
  status: TransactionStatus | '';
  typeFilter: TransactionType | '';
  startDate: string;
  endDate: string;
  sortBy: TransactionSortBy;
  sortDir: SortDirection;
  pageSize: number;
  activePreset: PresetKey;
};

type SavedFilter = {
  id: string;
  name: string;
  createdAt: string;
  values: FilterValues;
};

type TransactionsScreenProps = {
  title: string;
  subtitle: string;
  filterType?: TransactionType;
  defaultType?: TransactionType;
  lockType?: boolean;
};

function getPresetRange(preset: PresetKey) {
  const today = new Date();
  const end = new Date(today);
  if (preset === 'today') {
    return { start: toDateInput(today), end: toDateInput(today) };
  }
  if (preset === 'last7') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { start: toDateInput(start), end: toDateInput(end) };
  }
  if (preset === 'last30') {
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    return { start: toDateInput(start), end: toDateInput(end) };
  }
  if (preset === 'thisMonth') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: toDateInput(start), end: toDateInput(end) };
  }
  if (preset === 'lastMonth') {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: toDateInput(start), end: toDateInput(lastDay) };
  }
  if (preset === 'thisYear') {
    const start = new Date(today.getFullYear(), 0, 1);
    return { start: toDateInput(start), end: toDateInput(end) };
  }
  return { start: '', end: '' };
}

const presets: Array<{ key: PresetKey; label: string }> = [
  { key: 'today', label: 'Hoje' },
  { key: 'last7', label: '7 dias' },
  { key: 'last30', label: '30 dias' },
  { key: 'thisMonth', label: 'Este mês' },
  { key: 'lastMonth', label: 'Mês passado' },
  { key: 'thisYear', label: 'Este ano' },
];

function getScreenKey(filterType?: TransactionType) {
  if (filterType === 'INCOME') return 'incomes';
  if (filterType === 'EXPENSE') return 'expenses';
  return 'transactions';
}

function buildCsvValue(value: string | number | null | undefined) {
  const safe = value === null || value === undefined ? '' : String(value);
  const escaped = safe.replace(/"/g, '""');
  return `"${escaped}"`;
}

function formatCsvAmount(amount: number, type: TransactionType) {
  const signed = type === 'EXPENSE' ? -amount : amount;
  return signed.toFixed(2).replace('.', ',');
}

function TransactionsScreen({ title, subtitle, filterType, defaultType, lockType }: TransactionsScreenProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<TransactionsSummary | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState<TransactionStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>(filterType ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<TransactionSortBy>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [activePreset, setActivePreset] = useState<PresetKey>('all');

  const [favorites, setFavorites] = useState<SavedFilter[]>([]);
  const [favoriteName, setFavoriteName] = useState('');
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  const resolvedType = filterType ?? (typeFilter || undefined);
  const categoryDisabled = resolvedType === 'TRANSFER';

  const screenKey = getScreenKey(filterType);
  const favoritesStorageKey = `financepro:favorites:${screenKey}`;

  useEffect(() => {
    if (!filterType) return;
    setTypeFilter(filterType);
  }, [filterType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    categoryId,
    accountId,
    status,
    startDate,
    endDate,
    resolvedType,
    sortBy,
    sortDir,
    pageSize,
  ]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [catData, accData] = await Promise.all([getCategories(), getAccounts()]);
        setCategories(catData);
        setAccounts(accData);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar filtros');
      }
    };
    loadLookups();
  }, []);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const raw = localStorage.getItem(favoritesStorageKey);
        if (!raw) {
          setFavorites([]);
          return;
        }
        const parsed = JSON.parse(raw) as SavedFilter[];
        setFavorites(Array.isArray(parsed) ? parsed : []);
      } catch {
        setFavorites([]);
      }
    };
    loadFavorites();
  }, [favoritesStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
    } catch {
      // ignore storage errors
    }
  }, [favorites, favoritesStorageKey]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const txData = await getTransactions({
          page,
          pageSize,
          type: resolvedType,
          accountId: accountId || undefined,
          categoryId: categoryId || undefined,
          status: status || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: debouncedSearch || undefined,
          sortBy,
          sortDir,
        });
        setTransactions(txData.items || []);
        setTotal(txData.total || 0);
        setSummary(txData.summary ?? null);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar transações');
      } finally {
        setLoading(false);
      }
    };
    loadTransactions();
  }, [
    page,
    pageSize,
    resolvedType,
    accountId,
    categoryId,
    status,
    startDate,
    endDate,
    debouncedSearch,
    sortBy,
    sortDir,
    refreshKey,
  ]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach((account) => {
      map[account.id] = account.name;
    });
    return map;
  }, [accounts]);

  const availableCategories = useMemo(() => {
    if (resolvedType && resolvedType !== 'TRANSFER') {
      return categories.filter((category) => category.type === resolvedType);
    }
    return categories;
  }, [categories, resolvedType]);

  useEffect(() => {
    if (!categoryId) return;
    const exists = availableCategories.some((category) => category.id === categoryId);
    if (!exists) setCategoryId('');
  }, [availableCategories, categoryId]);

  const summaryData = useMemo(() => {
    if (summary) return summary;
    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      const amount = Number(tx.amount || 0);
      if (tx.type === 'INCOME') income += amount;
      if (tx.type === 'EXPENSE') expense += amount;
    });
    return {
      income,
      expense,
      net: income - expense,
      count: total || transactions.length,
    };
  }, [summary, transactions, total]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showPagination = total > pageSize;

  const actionLabel = useMemo(() => {
    if (filterType === 'INCOME') return 'Nova Receita';
    if (filterType === 'EXPENSE') return 'Nova Despesa';
    return 'Nova Transação';
  }, [filterType]);

  const periodLabel = useMemo(() => {
    if (!startDate && !endDate) return 'Todo o período';
    if (startDate && endDate) {
      return `${formatDateInput(startDate)} → ${formatDateInput(endDate)}`;
    }
    if (startDate) return `Desde ${formatDateInput(startDate)}`;
    return `Até ${formatDateInput(endDate)}`;
  }, [startDate, endDate]);

  const activePresetLabel = useMemo(() => {
    if (!activePreset || activePreset === 'custom' || activePreset === 'all') return '';
    return presets.find((preset) => preset.key === activePreset)?.label || '';
  }, [activePreset]);

  const buildCurrentFilters = (): FilterValues => ({
    search,
    categoryId,
    accountId,
    status,
    typeFilter,
    startDate,
    endDate,
    sortBy,
    sortDir,
    pageSize,
    activePreset,
  });

  const applyFilters = (values: FilterValues) => {
    setSearch(values.search || '');
    setCategoryId(values.categoryId || '');
    setAccountId(values.accountId || '');
    setStatus(values.status || '');
    if (!filterType) setTypeFilter(values.typeFilter || '');
    setStartDate(values.startDate || '');
    setEndDate(values.endDate || '');
    setSortBy(values.sortBy || 'date');
    setSortDir(values.sortDir || 'desc');
    setPageSize(values.pageSize || 12);
    setActivePreset(values.activePreset || (values.startDate || values.endDate ? 'custom' : 'all'));
  };

  const handleEdit = (tx: Transaction) => {
    setEditing(tx);
    setModalOpen(true);
  };

  const handleClose = () => {
    setEditing(null);
    setModalOpen(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategoryId('');
    setAccountId('');
    setStatus('');
    if (!filterType) setTypeFilter('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortDir('desc');
    setPage(1);
    setPageSize(12);
    setActivePreset('all');
  };

  const applyPreset = (preset: PresetKey) => {
    const range = getPresetRange(preset);
    setStartDate(range.start);
    setEndDate(range.end);
    setActivePreset(preset);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeletingId(deleteTarget.id);
      await deleteTransaction(deleteTarget.id);
      setFeedback({ type: 'success', message: 'Transação excluída com sucesso.' });
      setDeleteTarget(null);
      if (transactions.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao excluir transação.' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveFavorite = () => {
    const trimmed = favoriteName.trim();
    if (!trimmed) {
      setFavoriteError('Informe um nome para o filtro.');
      return;
    }
    const newFavorite: SavedFilter = {
      id: `${Date.now()}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
      values: buildCurrentFilters(),
    };
    setFavorites((prev) => [newFavorite, ...prev]);
    setFavoriteName('');
    setSavingFavorite(false);
    setFavoriteError(null);
    setFeedback({ type: 'success', message: 'Filtro salvo com sucesso.' });
  };

  const handleApplyFavorite = (favorite: SavedFilter) => {
    applyFilters(favorite.values);
    setFeedback({ type: 'success', message: `Filtro "${favorite.name}" aplicado.` });
  };

  const handleRemoveFavorite = (favoriteId: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== favoriteId));
    setFeedback({ type: 'success', message: 'Filtro removido.' });
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const exportPageSize = 500;
      let currentPage = 1;
      let collected: Transaction[] = [];
      let totalCount = 0;

      while (true) {
        const data = await getTransactions({
          page: currentPage,
          pageSize: exportPageSize,
          type: resolvedType,
          accountId: accountId || undefined,
          categoryId: categoryId || undefined,
          status: status || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search.trim() || undefined,
          sortBy,
          sortDir,
        });
        const items = data.items || [];
        collected = [...collected, ...items];
        totalCount = data.total || collected.length;
        if (items.length === 0 || collected.length >= totalCount) {
          break;
        }
        currentPage += 1;
      }

      if (collected.length === 0) {
        setFeedback({ type: 'error', message: 'Não há dados para exportar com os filtros atuais.' });
        return;
      }

      const header = [
        'Data',
        'Descrição',
        'Tipo',
        'Categoria',
        'Conta',
        'Status',
        'Valor',
        'Observação',
      ];

      const rows = collected.map((tx) => {
        const amount = Number(tx.amount || 0);
        const accountLabel = accountMap[tx.accountId] || 'Conta';
        const toAccountLabel = tx.toAccountId ? accountMap[tx.toAccountId] : '';
        const categoryLabel = tx.categoryId ? categoryMap[tx.categoryId] : '';
        const accountValue = tx.type === 'TRANSFER'
          ? `${accountLabel} -> ${toAccountLabel || 'Conta destino'}`
          : accountLabel;
        return [
          formatDate(tx.date),
          tx.description,
          typeLabels[tx.type],
          tx.type === 'TRANSFER' ? '' : categoryLabel,
          accountValue,
          statusLabels[tx.status || 'POSTED'],
          formatCsvAmount(amount, tx.type),
          tx.notes || '',
        ];
      });

      const csvLines = [header, ...rows]
        .map((row) => row.map((value) => buildCsvValue(value)).join(';'))
        .join('\n');

      const csvContent = `\uFEFF${csvLines}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const periodLabelSafe = startDate || endDate
        ? `${startDate || 'inicio'}_${endDate || 'hoje'}`
        : 'todo-periodo';
      const prefix = filterType === 'INCOME'
        ? 'receitas'
        : filterType === 'EXPENSE'
          ? 'despesas'
          : 'transacoes';
      const filename = `${prefix}-${periodLabelSafe}.csv`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: `CSV exportado com ${collected.length} registro(s).` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao exportar CSV.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="transactions-screen">
      <header className="transactions-header">
        <div>
          <h1 className="transactions-title">{title}</h1>
          <p className="transactions-subtitle">{subtitle}</p>
        </div>
        <div className="transactions-actions">
          <button className="btn btn-ghost" onClick={handleExportCsv} disabled={exporting}>
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + {actionLabel}
          </button>
        </div>
      </header>

      <Card className="filters-card" padding="lg">
        <div className="preset-row">
          <span className="preset-label">Atalhos de período</span>
          <div className="preset-group">
            {presets.map((preset) => (
              <button
                key={preset.key}
                className={`preset-button ${activePreset === preset.key ? 'active' : ''}`}
                onClick={() => applyPreset(preset.key)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {favorites.length > 0 && (
          <div className="favorites-row">
            <span className="favorites-label">Favoritos</span>
            <div className="favorites-group">
              {favorites.map((favorite) => (
                <div key={favorite.id} className="favorite-chip">
                  <button className="favorite-apply" onClick={() => handleApplyFavorite(favorite)}>
                    {favorite.name}
                  </button>
                  <button
                    className="favorite-remove"
                    onClick={() => handleRemoveFavorite(favorite.id)}
                    aria-label={`Remover filtro ${favorite.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="filters-grid">
          <label className="filter-field">
            Buscar descrição
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex: mercado, salário..."
            />
          </label>

          <label className="filter-field">
            Período inicial
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('custom');
              }}
            />
          </label>

          <label className="filter-field">
            Período final
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('custom');
              }}
            />
          </label>

          <label className="filter-field">
            Categoria
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categoryDisabled}
            >
              <option value="">Todas</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            Conta
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Todas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value as TransactionStatus | '')}>
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {!filterType && (
            <label className="filter-field">
              Tipo
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TransactionType | '')}>
                <option value="">Todos</option>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="filter-field">
            Ordenar por
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as TransactionSortBy)}>
              <option value="date">Data</option>
              <option value="amount">Valor</option>
              <option value="description">Descrição</option>
            </select>
          </label>

          <label className="filter-field">
            Direção
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDirection)}>
              <option value="desc">Mais recente</option>
              <option value="asc">Mais antigo</option>
            </select>
          </label>
        </div>

        <div className="filters-footer">
          <div className="filters-meta">
            <span>{total} resultado(s)</span>
            <span>• Página {page} de {totalPages}</span>
          </div>
          <div className="filters-actions">
            <label className="filter-field inline">
              Itens por página
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {[8, 12, 20, 40].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSavingFavorite(true);
                setFavoriteError(null);
              }}
            >
              Salvar filtro
            </button>
            <button className="btn btn-ghost" onClick={handleClearFilters}>
              Limpar filtros
            </button>
          </div>
        </div>

        {savingFavorite && (
          <div className="save-filter-panel">
            <div>
              <label className="filter-field">
                Nome do filtro
                <input
                  value={favoriteName}
                  onChange={(e) => {
                    setFavoriteName(e.target.value);
                    if (favoriteError) setFavoriteError(null);
                  }}
                  placeholder="Ex: Despesas do mês"
                />
              </label>
              {favoriteError && <span className="save-filter-error">{favoriteError}</span>}
            </div>
            <div className="save-filter-actions">
              <button className="btn btn-primary" onClick={handleSaveFavorite}>
                Salvar
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSavingFavorite(false);
                  setFavoriteName('');
                  setFavoriteError(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Card>

      <Card className="summary-card" padding="lg">
        <div className="summary-header">
          <div>
            <h3>Resumo do período</h3>
            <p>
              {activePresetLabel ? `${activePresetLabel} • ` : ''}
              {periodLabel}
            </p>
          </div>
          <span className="summary-count">{summaryData.count} transações</span>
        </div>
        <div className="summary-grid">
          <div className="summary-item">
            <span>Receitas</span>
            <strong className="text-success">{formatCurrency(summaryData.income)}</strong>
          </div>
          <div className="summary-item">
            <span>Despesas</span>
            <strong className="text-danger">{formatCurrency(summaryData.expense)}</strong>
          </div>
          <div className="summary-item">
            <span>Saldo líquido</span>
            <strong className={summaryData.net >= 0 ? 'text-success' : 'text-danger'}>
              {formatCurrency(summaryData.net)}
            </strong>
          </div>
          <div className="summary-item">
            <span>Transações</span>
            <strong>{summaryData.count}</strong>
          </div>
        </div>
      </Card>

      <Card className="transactions-card" padding="lg">
        {feedback && (
          <div className={`feedback-banner ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {loading && <div className="state-message">Carregando transações...</div>}
        {error && <div className="state-message error">{error}</div>}
        {!loading && !error && transactions.length === 0 && (
          <div className="empty-state">
            <div>
              <strong>Nenhuma transação encontrada</strong>
              <p>Experimente ajustar os filtros ou registrar uma nova movimentação.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              + {actionLabel}
            </button>
          </div>
        )}

        {!loading && !error && transactions.length > 0 && (
          <div className="transactions-list">
            {transactions.map((tx) => {
              const amount = Number(tx.amount || 0);
              const isIncome = tx.type === 'INCOME';
              const statusLabel = statusLabels[tx.status || 'POSTED'];
              const accountLabel = accountMap[tx.accountId] || 'Conta';
              const toAccountLabel = tx.toAccountId ? accountMap[tx.toAccountId] : '';
              const categoryLabel = tx.categoryId ? categoryMap[tx.categoryId] : 'Sem categoria';

              const secondaryInfo = tx.type === 'TRANSFER'
                ? `${accountLabel} → ${toAccountLabel || 'Conta destino'}`
                : `${categoryLabel} • ${accountLabel}`;

              return (
                <div key={tx.id} className="transaction-row">
                  <div className="transaction-info">
                    <div className={`transaction-pill ${tx.type.toLowerCase()}`}>
                      {typeLabels[tx.type]}
                    </div>
                    <div>
                      <h4 className="transaction-title">{tx.description}</h4>
                      <div className="transaction-meta">
                        <span>{secondaryInfo}</span>
                        <span>• {formatDate(tx.date)}</span>
                      </div>
                      <span className={`transaction-status status-${tx.status?.toLowerCase() || 'posted'}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                  <div className="transaction-actions">
                    <div className={`transaction-amount ${isIncome ? 'text-success' : 'text-primary'}`}>
                      {isIncome ? '+' : '-'} {formatCurrency(amount)}
                    </div>
                    <div className="transaction-buttons">
                      <button className="btn btn-ghost" onClick={() => handleEdit(tx)}>
                        Editar
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => setDeleteTarget(tx)}
                        disabled={deletingId === tx.id}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showPagination && !loading && !error && (
          <div className="pagination">
            <button
              className="btn btn-ghost"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <div className="pagination-info">
              Página {page} de {totalPages}
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              Próxima
            </button>
          </div>
        )}
      </Card>

      <TransactionModal
        isOpen={modalOpen}
        onClose={handleClose}
        onSuccess={() => {
          setFeedback({
            type: 'success',
            message: editing ? 'Transação atualizada com sucesso.' : 'Transação criada com sucesso.',
          });
          setRefreshKey((prev) => prev + 1);
          setEditing(null);
        }}
        initialData={editing}
        defaultType={defaultType}
        lockType={lockType && !editing}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Excluir transação"
        message="Tem certeza que deseja excluir esta transação? Essa ação não poderá ser desfeita."
        meta={
          deleteTarget
            ? [
                { label: 'Descrição', value: deleteTarget.description },
                {
                  label: 'Valor',
                  value: `${deleteTarget.type === 'INCOME' ? '+' : '-'} ${formatCurrency(Number(deleteTarget.amount || 0))}`,
                },
                { label: 'Data', value: formatDate(deleteTarget.date) },
              ]
            : []
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={Boolean(deletingId)}
      />
    </div>
  );
}

export function TransactionsPage() {
  return (
    <TransactionsScreen
      title="Transações"
      subtitle="Listagem das movimentações registradas."
    />
  );
}

export function IncomesPage() {
  return (
    <TransactionsScreen
      title="Receitas"
      subtitle="Acompanhe suas entradas e receitas registradas."
      filterType="INCOME"
      defaultType="INCOME"
      lockType
    />
  );
}

export function ExpensesPage() {
  return (
    <TransactionsScreen
      title="Despesas"
      subtitle="Acompanhe seus gastos e despesas registradas."
      filterType="EXPENSE"
      defaultType="EXPENSE"
      lockType
    />
  );
}
