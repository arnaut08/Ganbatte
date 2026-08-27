import { useCallback, useEffect, useState } from 'react';
import type { ToastAction, ToastType, ToastValue } from '../types';

export default function useToast() {
  const [toast, setToast] = useState<ToastValue>(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), toast.actions?.length ? 30000 : 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message: string, type: ToastType = 'success', actions?: ToastAction[]) => {
    setToast({ message, type, ...(actions?.length ? { actions } : {}) });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  return { toast, showToast, clearToast };
}
