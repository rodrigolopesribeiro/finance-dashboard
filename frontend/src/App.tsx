import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { TransactionsPage, IncomesPage, ExpensesPage } from './pages/Transactions/Transactions';
import { AccountsPage } from './pages/Accounts/Accounts';
import { CardsPage } from './pages/Cards/Cards';
import { GoalsPage } from './pages/Goals/Goals';
import { Profile } from './pages/Profile/Profile';
import { useAuth } from './hooks/useAuth';

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { accessToken, initializing } = useAuth();
  if (initializing) {
    return <div style={{ color: 'var(--text-secondary)' }}>Carregando sessão...</div>;
  }
  if (!accessToken) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="incomes" element={<IncomesPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="cards" element={<CardsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
