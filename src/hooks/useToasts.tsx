import React from 'react';
import { useCallback, useState } from 'react';
import type { Toast } from '../../lib/frontend-contracts';

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    const id = toast.id ?? Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, display: 'grid', gap: 8 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            minWidth: 260,
            padding: 12,
            borderRadius: 8,
            background: t.variant === 'destructive' ? '#fee' : '#eef',
            border: '1px solid #ccd',
          }}
          role="status"
          aria-live="polite"
        >
          {t.title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title}</div>}
          {t.description && <div style={{ marginBottom: 8 }}>{t.description}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {t.action}
            {t.id && (
              <button onClick={() => onDismiss(t.id!)} style={{ padding: '4px 8px' }}>
                Dismiss
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}