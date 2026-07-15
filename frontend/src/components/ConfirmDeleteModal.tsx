import { useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  description: string;
  /** Текст ошибки API при неудачном удалении */
  error?: string | null;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * МОДАЛЬНОЕ ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ (F-BIKE-DELETE-02)
 * Вместо браузерного window.confirm — диалог внутри приложения.
 */
export default function ConfirmDeleteModal({
  open,
  title,
  description,
  error,
  isDeleting = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(open, panelRef, onCancel, {
    escapeDisabled: isDeleting,
    initialFocusSelector: '[data-testid="delete-confirm-btn"]',
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      data-testid="delete-confirm-modal"
      onKeyDown={(event) => {
        // Enter на диалоге — подтверждение (кроме фокуса на «Отмена»)
        if (event.key !== 'Enter' || isDeleting) return;
        const target = event.target as HTMLElement;
        if (target.closest('[data-testid="delete-cancel-btn"]')) return;
        if (target.closest('[data-testid="delete-confirm-btn"]')) return;
        event.preventDefault();
        onConfirm();
      }}
    >
      <div
        ref={panelRef}
        className="flex max-h-[100dvh] w-full max-w-md flex-col overflow-y-auto overscroll-contain rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:max-h-[min(90vh,100dvh)] sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-rose-100 p-2 text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 id="delete-confirm-title" className="text-lg font-bold text-slate-800">
                {title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p
            data-testid="delete-error-message"
            className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            data-testid="delete-cancel-btn"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            data-testid="delete-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 rounded-xl bg-rose-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md shadow-rose-200 transition-all hover:bg-rose-700 disabled:opacity-60"
          >
            {isDeleting ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
