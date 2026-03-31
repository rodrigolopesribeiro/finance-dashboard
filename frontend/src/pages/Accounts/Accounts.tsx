import { useEffect, useMemo, useState } from 'react';
import { getAccounts } from '../../services/finance';
import { Card } from '../../components/Card';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAccounts();
        setAccounts(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar contas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const total = useMemo(() =>
    accounts.reduce((acc, item) => acc + Number(item.currentBalance || 0), 0),
  [accounts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Contas</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Saldo total: {formatCurrency(total)}</p>
      </header>

      <Card>
        {loading && <div style={{ color: 'var(--text-secondary)' }}>Carregando contas...</div>}
        {error && <div style={{ color: '#fecaca' }}>{error}</div>}
        {!loading && !error && accounts.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>Nenhuma conta encontrada.</div>
        )}
        {!loading && !error && accounts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {accounts.map((account) => (
              <div key={account.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{account.name}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{account.type}</div>
                </div>
                <div style={{ fontWeight: 600 }}>{formatCurrency(Number(account.currentBalance || 0))}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
