export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading' | 'export_progress';

export interface ToastStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  detail?: string;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
  url?: string;
  primary?: boolean;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  timestamp: number;
  duration?: number; // ms, 0 means persistent until closed
  steps?: ToastStep[];
  action?: ToastAction;
}
