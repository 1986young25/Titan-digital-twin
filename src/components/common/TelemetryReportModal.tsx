import { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  FileText, 
  Copy, 
  Check, 
  Database, 
  Activity, 
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { 
  CanTelemetryItem, 
  TelemetryExportOptions, 
  generateTelemetryCsv, 
  downloadTelemetryCsv, 
  generateTelemetryPdfReport, 
  downloadTelemetryPdf 
} from '../../lib/telemetryExport';

interface TelemetryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CanTelemetryItem[];
  options: TelemetryExportOptions;
}

export function TelemetryReportModal({
  isOpen,
  onClose,
  items,
  options
}: TelemetryReportModalProps) {
  const { addToast } = useNotification();
  const [activeTab, setActiveTab] = useState<'pdf' | 'csv'>('pdf');
  const [copiedRef, setCopiedRef] = useState(false);
  const [datasetScope, setDatasetScope] = useState<'ALL' | 'LIVE' | 'FIRESTORE'>('ALL');

  // Filter items based on selected scope
  const filteredItems = useMemo(() => {
    if (datasetScope === 'LIVE') {
      return items.filter(i => !i.source || i.source === 'LIVE_CAN_FRAME');
    }
    if (datasetScope === 'FIRESTORE') {
      return items.filter(i => i.source === 'FIRESTORE_LEDGER' || i.source === 'OPERATOR_SNAPSHOT');
    }
    return items;
  }, [items, datasetScope]);

  const reportRefNumber = useMemo(() => {
    return options.reportRef || `UCC-CER-NYMT-XB6-${Date.now().toString(16).toUpperCase()}`;
  }, [options.reportRef]);

  // Generate PDF document and object URL for preview
  const { pdfDoc, pdfBlobUrl } = useMemo(() => {
    if (!isOpen) return { pdfDoc: null, pdfBlobUrl: null };
    try {
      const doc = generateTelemetryPdfReport(filteredItems, {
        ...options,
        reportRef: reportRefNumber,
      });
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      return { pdfDoc: doc, pdfBlobUrl: url };
    } catch (e) {
      console.error('Failed to compile PDF preview:', e);
      return { pdfDoc: null, pdfBlobUrl: null };
    }
  }, [isOpen, filteredItems, options, reportRefNumber]);

  // Generate CSV text
  const csvContent = useMemo(() => {
    return generateTelemetryCsv(filteredItems, {
      ...options,
      reportRef: reportRefNumber
    });
  }, [filteredItems, options, reportRefNumber]);

  if (!isOpen) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(reportRefNumber);
    setCopiedRef(true);
    addToast('State Root Reference Hash copied to clipboard', 'info');
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!pdfDoc) return;
    const filename = `Titan_Kinetic_CAN_Telemetry_${options.vehicleId}_${reportRefNumber}.pdf`;
    downloadTelemetryPdf(pdfDoc, filename);
    addToast(`COMPLIANCE PDF DOWNLOADED: ${filename}`, 'success');
  };

  const handleDownloadCsv = () => {
    const filename = `Titan_Kinetic_CAN_Telemetry_${options.vehicleId}_${reportRefNumber}.csv`;
    downloadTelemetryCsv(csvContent, filename);
    addToast(`TELEMETRY CSV DOWNLOADED: ${filename}`, 'success');
  };

  const handlePrint = () => {
    if (pdfBlobUrl) {
      const printWindow = window.open(pdfBlobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      } else {
        window.print();
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0c0f14] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-gray-900 dark:text-gray-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="telemetry-export-modal-title"
      >
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#12161f]/90 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <FileCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="telemetry-export-modal-title" className="text-sm sm:text-base font-mono font-bold tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
                OFFLINE TELEMETRY & COMPLIANCE EXPORT
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" /> CAGE: ACTIVE
                </span>
              </h2>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">VEHICLE: {options.vehicleId}</span>
                <span>•</span>
                <span>{filteredItems.length} RECORDS SAMPLED</span>
                <span>•</span>
                <button 
                  onClick={handleCopyRef} 
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400"
                  title="Click to copy state hash"
                >
                  STATE: {reportRefNumber}
                  {copiedRef ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-60" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Strip: Scope Selector + Tab Toggle + Download Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Scope Filter */}
            <div className="bg-gray-200 dark:bg-gray-800/80 p-0.5 rounded-lg text-xs font-mono flex items-center">
              <button
                onClick={() => setDatasetScope('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  datasetScope === 'ALL'
                    ? 'bg-white dark:bg-black text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                ALL ({items.length})
              </button>
              <button
                onClick={() => setDatasetScope('LIVE')}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  datasetScope === 'LIVE'
                    ? 'bg-white dark:bg-black text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                LIVE CAN
              </button>
              <button
                onClick={() => setDatasetScope('FIRESTORE')}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  datasetScope === 'FIRESTORE'
                    ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                FIRESTORE
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="bg-gray-200 dark:bg-gray-800/80 p-0.5 rounded-lg text-xs font-mono flex items-center">
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
                  activeTab === 'pdf'
                    ? 'bg-white dark:bg-black text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                PDF REPORT
              </button>
              <button
                onClick={() => setActiveTab('csv')}
                className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
                  activeTab === 'csv'
                    ? 'bg-white dark:bg-black text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                CSV DATA
              </button>
            </div>

            {/* Print Button (for PDF) */}
            {activeTab === 'pdf' && (
              <button
                onClick={handlePrint}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}

            {/* Download Buttons */}
            {activeTab === 'pdf' ? (
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD PDF
              </button>
            ) : (
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD CSV
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Close Preview"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100/70 dark:bg-[#07090e]">
          {activeTab === 'pdf' ? (
            <div className="w-full h-full min-h-[580px] flex flex-col bg-white dark:bg-[#10141d] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-inner">
              {pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="PDF Telemetry Compliance Report Preview"
                  className="w-full h-full min-h-[580px] border-0"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
                  <p className="font-mono text-sm text-gray-500">Compiling Defense Telemetry & Attestation Matrix...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 font-mono text-xs">
              
              {/* CSV Meta Strip */}
              <div className="bg-white dark:bg-[#0a0d14] border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <div className="text-gray-800 dark:text-gray-200 font-bold flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    RFC-4180 Standard Comma-Separated Values Stream
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Includes full header comment blocks, Shannon entropy H(X)&lt;1.5 bounds, alpha={options.alpha}, and nanosecond timestamps.
                  </div>
                </div>

                <button
                  onClick={handleDownloadCsv}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 self-start sm:self-auto shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  EXPORT CSV FILE ({filteredItems.length} ROWS)
                </button>
              </div>

              {/* Data Table Preview */}
              <div className="bg-white dark:bg-[#0a0d14] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[460px]">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 text-[10px] text-gray-500">
                      <tr>
                        <th className="py-2.5 px-3">TIMESTAMP (UTC)</th>
                        <th className="py-2.5 px-3">CAN ID</th>
                        <th className="py-2.5 px-3">NAME / SIGNAL ROLE</th>
                        <th className="py-2.5 px-3">HEX PAYLOAD</th>
                        <th className="py-2.5 px-3 text-right">RAW (g)</th>
                        <th className="py-2.5 px-3 text-right">EMA (g)</th>
                        <th className="py-2.5 px-3 text-right">DELTA</th>
                        <th className="py-2.5 px-3 text-center">PERSIST.</th>
                        <th className="py-2.5 px-3">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                      {filteredItems.map((item, idx) => {
                        const delta = Math.abs(item.vibrationRaw - item.vibrationEma);
                        const isSpike = delta >= 1.0 || (item.persistenceCount ?? 0) >= options.persistenceThreshold;
                        return (
                          <tr key={item.id + idx} className="hover:bg-cyan-500/5 transition-colors">
                            <td className="py-2 px-3 text-gray-500 text-[11px]">{item.timestamp}</td>
                            <td className="py-2 px-3 font-bold text-cyan-400">{item.canId}</td>
                            <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">{item.name}</td>
                            <td className="py-2 px-3 text-gray-500 text-[11px] tracking-wider">{item.data}</td>
                            <td className={`py-2 px-3 text-right font-bold ${item.vibrationRaw > 1.8 ? 'text-amber-500' : 'text-gray-700 dark:text-gray-300'}`}>
                              {item.vibrationRaw.toFixed(2)}g
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-500">
                              {item.vibrationEma.toFixed(2)}g
                            </td>
                            <td className="py-2 px-3 text-right text-gray-500">
                              {delta.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`font-bold ${(item.persistenceCount ?? 0) >= options.persistenceThreshold ? 'text-red-400' : 'text-gray-400'}`}>
                                {item.persistenceCount ?? 0}/{options.persistenceThreshold}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isSpike 
                                  ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30' 
                                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              }`}>
                                {item.status || (isSpike ? 'SPIKE DEBOUNCED' : 'NOMINAL')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}
