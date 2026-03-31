import { apiRequest } from './api';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'POSTED' | 'PENDING' | 'CANCELED';
export type TransactionSortBy = 'date' | 'amount' | 'description';
export type SortDirection = 'asc' | 'desc';

export type TransactionsSummary = {
  income: number;
  expense: number;
  net: number;
  count: number;
};

export type DashboardSummary = {
  month: number;
  year: number;
  balance: number | string;
  income: number | string;
  expense: number | string;
  currentBill: null | {
    id: string;
    total: number | string;
    paid: number | string;
    dueDate: string;
    status: string;
  };
  goals: Array<any>;
  lastTransactions: Array<any>;
  expensesByCategory: Array<{
    categoryId: string;
    categoryName: string;
    total: number | string;
  }>;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  summary?: TransactionsSummary;
};

export type Transaction = {
  id: string;
  description: string;
  amount: number | string;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  notes?: string | null;
};

export type TransactionPayload = {
  description: string;
  amount: number;
  type: TransactionType;
  status?: TransactionStatus;
  date: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  notes?: string;
};

export type TransactionsQuery = {
  page?: number;
  pageSize?: number;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: TransactionSortBy;
  sortDir?: SortDirection;
};

export async function getDashboardSummary() {
  return apiRequest<DashboardSummary>('/dashboard/summary');
}

function buildQuery(params: TransactionsQuery = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.type) query.set('type', params.type);
  if (params.accountId) query.set('accountId', params.accountId);
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.status) query.set('status', params.status);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export async function getTransactions(params: TransactionsQuery = {}) {
  return apiRequest<Paginated<Transaction>>(`/transactions${buildQuery(params)}`);
}

export async function createTransaction(payload: TransactionPayload) {
  return apiRequest<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTransaction(id: string, payload: TransactionPayload) {
  return apiRequest<Transaction>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTransaction(id: string) {
  return apiRequest<Transaction>(`/transactions/${id}`, {
    method: 'DELETE',
  });
}

export async function getCategories() {
  return apiRequest<any[]>('/categories');
}

export async function getAccounts() {
  return apiRequest<any[]>('/accounts');
}

export async function getCreditCards() {
  return apiRequest<any[]>('/credit-cards');
}

export async function getGoals() {
  return apiRequest<any[]>('/goals');
}
