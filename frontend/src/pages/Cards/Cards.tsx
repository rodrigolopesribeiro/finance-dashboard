import { useEffect, useState } from 'react';
import { getCreditCards } from '../../services/finance';
import { Card } from '../../components/Card';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getCreditCards();
        setCards(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar cartões');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cartões</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Acompanhe limites e cartões cadastrados.</p>
      </header>

      <Card>
        {loading && <div style={{ color: 'var(--text-secondary)' }}>Carregando cartões...</div>}
        {error && <div style={{ color: '#fecaca' }}>{error}</div>}
        {!loading && !error && cards.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>Nenhum cartão encontrado.</div>
        )}
        {!loading && !error && cards.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cards.map((card) => (
              <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{card.name}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{card.institution}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(Number(card.limitAvailable || 0))}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Limite total: {formatCurrency(Number(card.limitTotal || 0))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
