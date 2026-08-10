import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; variant: ToastVariant };

type ToastContextType = {
  notify: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES: Record<ToastVariant, string> = {
  success: 'border-secondary-200 bg-secondary-50 text-secondary-800',
  error: 'border-error-500/30 bg-error-500/10 text-error-600',
  info: 'border-primary-200 bg-primary-50 text-primary-800',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div key={t.id} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg animate-slide-up ${STYLES[t.variant]}`}>
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="Fermer la notification" className="opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
