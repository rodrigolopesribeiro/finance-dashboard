import { useEffect, useMemo, useState } from 'react';
import { createTransaction, updateTransaction, getAccounts, getCategories } from '../../services/finance';
import type {
  Transaction,
  TransactionPayload,
  TransactionType,
  TransactionStatus,
} from '../../services/finance';
import './TransactionModal.css';

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

type FormState = {
  description: string;
  amount: string;
  type: TransactionType;
  date: string;
  accountId: string;
  toAccountId: string;
  categoryId: string;
  status: TransactionStatus;
  notes: string;
};

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transaction: Transaction) => void;
  initialData?: Transaction | null;
  defaultType?: TransactionType;
  lockType?: boolean;
};

const defaultForm: FormState = {
  description: '',
  amount: '',
  type: 'EXPENSE',
  date: new Date().toISOString().slice(0, 10),
  accountId: '',
  toAccountId: '',
  categoryId: '',
  status: 'POSTED',
  notes: '',
};

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultType,
  lockType,
}: TransactionModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const [accountsData, categoriesData] = await Promise.all([
          getAccounts(),
          getCategories(),
        ]);
        setAccounts(accountsData);
        setCategories(categoriesData);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados do formulário');
      }
    };
    load();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setForm({
        description: initialData.description || '',
        amount: String(initialData.amount ?? ''),
        type: initialData.type,
        date: new Date(initialData.date).toISOString().slice(0, 10),
        accountId: initialData.accountId || '',
        toAccountId: initialData.toAccountId || '',
        categoryId: initialData.categoryId || '',
        status: (initialData.status as TransactionStatus) || 'POSTED',
        notes: initialData.notes || '',
      });
    } else {
      setForm({
        ...defaultForm,
        type: defaultType || defaultForm.type,
      });
    }
    setError(null);
    setSuccess(null);
  }, [isOpen, initialData, defaultType]);

  const filteredCategories = useMemo(() => {
    if (form.type === 'TRANSFER') return [];
    return categories.filter((cat) => cat.type === form.type);
  }, [categories, form.type]);

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!form.description.trim()) return 'Informe a descrição';
    if (!form.amount || Number(form.amount) <= 0) return 'Informe um valor válido';
    if (!form.accountId) return 'Selecione a conta';
    if (!form.date) return 'Selecione a data';
    if (form.type === 'TRANSFER' && !form.toAccountId) return 'Selecione a conta de destino';
    if (form.type === 'TRANSFER' && form.toAccountId === form.accountId) return 'A conta de destino deve ser diferente';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    try {
      setLoading(true);
      const payload: TransactionPayload = {
        description: form.description.trim(),
        amount: Number(form.amount),
        type: form.type,
        date: form.date,
        accountId: form.accountId,
        status: form.status,
      };

      if (form.type === 'TRANSFER' && form.toAccountId) {
        payload.toAccountId = form.toAccountId;
      }

      if (form.type !== 'TRANSFER' && form.categoryId) {
        payload.categoryId = form.categoryId;
      }

      if (form.notes?.trim()) payload.notes = form.notes.trim();

      const response = initialData
        ? await updateTransaction(initialData.id, payload)
        : await createTransaction(payload);

      setSuccess('Transação salva com sucesso');
      onSuccess?.(response);
      setTimeout(() => onClose(), 400);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar transação');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-container">
        <header className="modal-header">
          <div>
            <h2>{initialData ? 'Editar Transação' : 'Nova Transação'}</h2>
            <p>{initialData ? 'Atualize os dados da movimentação.' : 'Registre uma nova movimentação financeira.'}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <form className="transaction-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="form-field">
              Descrição
              <input
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Ex: Salário, Supermercado..."
                required
              />
            </label>

            <label className="form-field">
              Valor
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="0,00"
                required
              />
            </label>

            <label className="form-field">
              Tipo
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value as TransactionType)}
                disabled={lockType}
              >
                {Object.entries(typeLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              Data
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </label>

            <label className="form-field">
              Conta
              <select
                value={form.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                required
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>

            {form.type === 'TRANSFER' ? (
              <label className="form-field">
                Conta de destino
                <select
                  value={form.toAccountId}
                  onChange={(e) => handleChange('toAccountId', e.target.value)}
                  required
                >
                  <option value="">Selecione a conta de destino</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="form-field">
                Categoria
                <select
                  value={form.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                >
                  <option value="">Selecione uma categoria</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="form-field">
              Status
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value as TransactionStatus)}
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field form-notes">
              Observações
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Informações adicionais"
              />
            </label>
          </div>

          {error && <div className="form-feedback error">{error}</div>}
          {success && <div className="form-feedback success">{success}</div>}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
