export const mockMetrics = {
  currentBalance: 12450.75,
  monthlyIncomes: 8500.0,
  monthlyExpenses: 4230.5,
  currentInvoice: 1850.25,
};

export const chartDataIncomesVsExpenses = [
  { name: 'Jan', incomes: 7200, expenses: 3800 },
  { name: 'Fev', incomes: 7200, expenses: 4100 },
  { name: 'Mar', incomes: 8000, expenses: 3900 },
  { name: 'Abr', incomes: 7800, expenses: 4500 },
  { name: 'Mai', incomes: 8200, expenses: 3600 },
  { name: 'Jun', incomes: 8500, expenses: 4230 },
];

export const chartDataExpensesByCategory = [
  { name: 'Moradia', value: 1500, color: '#4f9cf9' },
  { name: 'Alimentação', value: 900, color: '#22c55e' },
  { name: 'Transporte', value: 400, color: '#f59e0b' },
  { name: 'Lazer', value: 600, color: '#14b8a6' },
  { name: 'Saúde', value: 300, color: '#ef4444' },
  { name: 'Educação', value: 530, color: '#38bdf8' },
];

export const mockTransactions = [
  { id: '1', description: 'Supermercado', amount: -450.5, date: '2023-10-15', category: 'Alimentação', status: 'completed' },
  { id: '2', description: 'Salário', amount: 8500.0, date: '2023-10-05', category: 'Receita', status: 'completed' },
  { id: '3', description: 'Uber', amount: -65.2, date: '2023-10-14', category: 'Transporte', status: 'completed' },
  { id: '4', description: 'Netflix', amount: -55.9, date: '2023-10-10', category: 'Lazer', status: 'completed' },
  { id: '5', description: 'Aluguel', amount: -1500.0, date: '2023-10-02', category: 'Moradia', status: 'completed' },
  { id: '6', description: 'Farmácia', amount: -120.0, date: '2023-10-16', category: 'Saúde', status: 'pending' },
];

export const mockGoals = [
  { id: '1', name: 'Reserva de Emergência', amount: 20000, saved: 12500, color: '#22c55e' },
  { id: '2', name: 'Viagem de Férias', amount: 5000, saved: 1200, color: '#f97316' },
  { id: '3', name: 'Novo Notebook', amount: 8000, saved: 6000, color: '#38bdf8' },
];
