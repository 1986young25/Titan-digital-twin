import { X } from 'lucide-react';
import { format } from 'date-fns';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-[#121212] border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#1a1a1a]">
          <h2 className="text-lg font-bold tracking-wide text-gray-100 flex items-center gap-2">
            {title}
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}

// Subcomponents for the specific node details view

interface HistoryEvent {
  timestamp: string;
  type: 'STATUS_CHANGE' | 'ACOUSTIC_EVENT' | 'TELEMETRY_LOG';
  details: string;
  severity?: 'normal' | 'warning' | 'critical';
}

interface NodeDetailsProps {
  nodeId: string;
  currentNode: any;
  history: HistoryEvent[];
}

export function NodeDetailsView({ nodeId, currentNode, history }: NodeDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Current Status Header */}
      <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
        <div>
          <div className="text-xs text-gray-500 font-mono mb-1">NODE IDENTIFIER</div>
          <div className="text-xl font-bold font-mono tracking-widest text-emerald-400">
            {nodeId.toUpperCase()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 font-mono mb-1">CURRENT STATUS</div>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold font-mono border ${
            currentNode?.status === 'WARNING' 
              ? 'bg-red-900/30 text-red-400 border-red-800' 
              : 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
          }`}>
            {currentNode?.status || 'UNKNOWN'}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
          <div className="text-xs text-gray-500 font-mono mb-2">INTEGRITY</div>
          <div className={`text-lg font-mono ${currentNode?.health < 95 ? 'text-amber-400' : 'text-gray-200'}`}>
            {currentNode?.health?.toFixed(2) || '---'}%
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
          <div className="text-xs text-gray-500 font-mono mb-2">LATITUDE</div>
          <div className="text-lg font-mono text-gray-200">
            {currentNode?.lat?.toFixed(5) || '---'}
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-4 rounded-lg border border-gray-800">
          <div className="text-xs text-gray-500 font-mono mb-2">LONGITUDE</div>
          <div className="text-lg font-mono text-gray-200">
            {currentNode?.lng?.toFixed(5) || '---'}
          </div>
        </div>
      </div>

      {/* Event History Timeline */}
      <div>
        <h3 className="text-sm font-bold tracking-widest text-gray-400 mb-4 uppercase border-b border-gray-800 pb-2">
          Historical Event Log
        </h3>
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((event, idx) => (
              <div key={idx} className="flex gap-4 items-start relative">
                {/* Timeline connector */}
                {idx !== history.length - 1 && (
                  <div className="absolute left-2.5 top-7 bottom-[-16px] w-px bg-gray-800"></div>
                )}
                
                {/* Timeline dot */}
                <div className={`mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-[#121212] ${
                  event.severity === 'critical' ? 'border-red-500' :
                  event.severity === 'warning' ? 'border-amber-500' : 'border-emerald-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    event.severity === 'critical' ? 'bg-red-500' :
                    event.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                </div>

                {/* Event Content */}
                <div className="flex-1 bg-[#1a1a1a] p-3 rounded-lg border border-gray-800">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-gray-300 font-mono uppercase">{event.type.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {format(new Date(event.timestamp), 'HH:mm:ss.SSS')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 font-mono">{event.details}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm font-mono text-gray-500 bg-[#0a0a0a] rounded-lg border border-gray-800 border-dashed">
            NO HISTORICAL EVENTS RECORDED FOR THIS NODE.
          </div>
        )}
      </div>
    </div>
  );
}
