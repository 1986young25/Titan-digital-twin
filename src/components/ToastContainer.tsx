import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Loader2, 
  X, 
  ExternalLink, 
  FileSpreadsheet, 
  Mail, 
  Activity,
  Check
} from 'lucide-react';
import { ToastMessage, ToastStep } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div 
      id="titan-toast-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            id={`toast-${toast.id}`}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.18 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto w-full bg-[#121212]/95 backdrop-blur-md border border-gray-800 text-gray-100 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Ambient accent bar at top */}
            <div 
              className={`h-1 w-full ${
                toast.type === 'success' ? 'bg-emerald-500' :
                toast.type === 'error' ? 'bg-red-500' :
                toast.type === 'warning' ? 'bg-amber-500' :
                toast.type === 'export_progress' ? 'bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-500' :
                toast.type === 'loading' ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            />

            <div className="p-4 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0">
                    {toast.type === 'success' && (
                      <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    {toast.type === 'error' && (
                      <div className="w-7 h-7 rounded-lg bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                    {toast.type === 'warning' && (
                      <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                    {toast.type === 'info' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                    {(toast.type === 'loading' || toast.type === 'export_progress') && (
                      <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800 flex items-center justify-center text-blue-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-100 tracking-wide font-sans flex items-center gap-2">
                      {toast.title}
                    </h4>
                    {toast.description && (
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        {toast.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  id={`toast-dismiss-${toast.id}`}
                  onClick={() => onDismiss(toast.id)}
                  className="shrink-0 p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Multi-step progress list for Export workflow */}
              {toast.steps && toast.steps.length > 0 && (
                <div className="mt-1 pt-2 border-t border-gray-800/80 flex flex-col gap-2 font-mono text-xs">
                  {toast.steps.map((step, idx) => (
                    <StepItem key={step.id || idx} step={step} index={idx} />
                  ))}
                </div>
              )}

              {/* Optional Actions */}
              {toast.action && (
                <div className="pt-2 border-t border-gray-800/80 flex items-center justify-end gap-2">
                  {toast.action.url ? (
                    <a
                      id={`toast-action-link-${toast.id}`}
                      href={toast.action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{toast.action.label}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                    </a>
                  ) : (
                    <button
                      id={`toast-action-btn-${toast.id}`}
                      onClick={toast.action.onClick}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold tracking-wider uppercase transition-colors shadow-sm"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const StepItem: React.FC<{ step: ToastStep; index: number }> = ({ step, index }) => {
  const getIcon = () => {
    switch (step.status) {
      case 'completed':
        return (
          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        );
      case 'in-progress':
        return (
          <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
          </div>
        );
      case 'failed':
        return (
          <div className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center">
            <X className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        );
      default:
        return (
          <div className="w-4 h-4 rounded-full bg-gray-800 text-gray-500 border border-gray-700 flex items-center justify-center text-[9px] font-bold">
            {index + 1}
          </div>
        );
    }
  };

  const getStepVisualIcon = (id: string) => {
    if (id.includes('prep') || id.includes('telemetry')) return <Activity className="w-3 h-3 opacity-60" />;
    if (id.includes('sheet')) return <FileSpreadsheet className="w-3 h-3 opacity-60" />;
    if (id.includes('mail') || id.includes('gmail')) return <Mail className="w-3 h-3 opacity-60" />;
    return null;
  };

  return (
    <div 
      className={`flex items-center justify-between py-1 px-2 rounded transition-colors ${
        step.status === 'in-progress' ? 'bg-blue-950/30 text-blue-200 border border-blue-900/40' :
        step.status === 'completed' ? 'text-gray-300' :
        step.status === 'failed' ? 'text-red-300 bg-red-950/20' : 'text-gray-500'
      }`}
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="flex items-center gap-1.5 text-[11px]">
          {getStepVisualIcon(step.id)}
          <span className={step.status === 'completed' ? 'text-gray-200' : step.status === 'in-progress' ? 'text-blue-300 font-semibold' : ''}>
            {step.label}
          </span>
        </span>
      </div>

      {step.detail && (
        <span className="text-[10px] text-gray-500 font-mono">
          {step.detail}
        </span>
      )}
    </div>
  );
};
