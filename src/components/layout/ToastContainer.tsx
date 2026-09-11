import { useNotification } from '../../context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />
};

const STYLES = {
  success: 'border-emerald-200 dark:border-emerald-500/50 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-100',
  warning: 'border-amber-200 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-100',
  error: 'border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-100',
  info: 'border-blue-200 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100'
};

export function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            className={`pointer-events-auto w-80 p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 ${STYLES[toast.type]}`}
          >
            <div className="shrink-0 mt-0.5">{ICONS[toast.type]}</div>
            <div className="flex-1">
              <p className="text-xs font-mono tracking-wide leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
