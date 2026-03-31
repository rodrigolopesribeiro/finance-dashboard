import './ConfirmDeleteModal.css';

export type ConfirmDeleteMeta = {
  label: string;
  value: string;
};

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  title?: string;
  message: string;
  meta?: ConfirmDeleteMeta[];
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({
  isOpen,
  title = 'Confirmar exclusão',
  message,
  meta = [],
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <header className="confirm-header">
          <div className="confirm-icon">!</div>
          <div>
            <h2>{title}</h2>
            <p>{message}</p>
          </div>
        </header>

        {meta.length > 0 && (
          <div className="confirm-meta">
            {meta.map((item) => (
              <div key={item.label} className="confirm-meta-row">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        )}

        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Excluindo...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
