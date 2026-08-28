import { useState, useCallback, useRef } from 'react';
import { ToastMessage } from '../types';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timerMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    if (timerMapRef.current.has(id)) {
      clearTimeout(timerMapRef.current.get(id));
      timerMapRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp: Date.now(),
      duration: toast.duration !== undefined ? toast.duration : 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
      timerMapRef.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  const updateToast = useCallback((id: string, updates: Partial<ToastMessage>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };

        // If duration updated or toast is now a success/error, manage timeout
        if (updates.duration !== undefined) {
          if (timerMapRef.current.has(id)) {
            clearTimeout(timerMapRef.current.get(id));
            timerMapRef.current.delete(id);
          }
          if (updates.duration > 0) {
            const timer = setTimeout(() => {
              removeToast(id);
            }, updates.duration);
            timerMapRef.current.set(id, timer);
          }
        }

        return updated;
      })
    );
  }, [removeToast]);

  const notifySuccess = useCallback((title: string, description?: string, duration = 4500) => {
    return addToast({ type: 'success', title, description, duration });
  }, [addToast]);

  const notifyError = useCallback((title: string, description?: string, duration = 6500) => {
    return addToast({ type: 'error', title, description, duration });
  }, [addToast]);

  const notifyInfo = useCallback((title: string, description?: string, duration = 4000) => {
    return addToast({ type: 'info', title, description, duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    updateToast,
    removeToast,
    notifySuccess,
    notifyError,
    notifyInfo,
  };
}
