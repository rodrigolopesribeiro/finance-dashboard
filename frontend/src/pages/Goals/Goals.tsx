import { useEffect, useState } from 'react';
import { getGoals } from '../../services/finance';
import { Card } from '../../components/Card';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getGoals();
        setGoals(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar metas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Metas</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Evolução das suas metas financeiras.</p>
      </header>

      <Card>
        {loading && <div style={{ color: 'var(--text-secondary)' }}>Carregando metas...</div>}
        {error && <div style={{ color: '#fecaca' }}>{error}</div>}
        {!loading && !error && goals.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>Nenhuma meta encontrada.</div>
        )}
        {!loading && !error && goals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {goals.map((goal) => {
              const target = Number(goal.targetAmount || 0);
              const current = Number(goal.currentAmount || 0);
              const percent = target > 0 ? Math.round((current / target) * 100) : 0;
              return (
                <div key={goal.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{goal.name}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatCurrency(current)} / {formatCurrency(target)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{percent}%</div>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 9999, overflow: 'hidden', marginTop: 8 }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
