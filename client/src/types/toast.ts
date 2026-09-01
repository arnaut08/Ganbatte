/** Shared toast notification types. Used by the toast hook, socket layer and UI. */

export type ToastType = 'success' | 'warning' | 'error' | 'neutral';

export type ToastAction = { label: string; onClick: () => void };

/** A non-null toast notification payload. */
export type Toast = {
  message: string;
  type: ToastType;
  actions?: ToastAction[];
};

/** The nullable value held by the toast state (for "no toast" = null). */
export type ToastValue = Toast | null;