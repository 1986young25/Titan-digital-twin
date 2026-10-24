import React, { useState } from 'react';
import { X, Download, Printer, ShieldCheck, FileText, CheckCircle2, Building2, Landmark, Copy, Check } from 'lucide-react';
import { CorporateEntity } from '../../types/titan';
import { ENTITIES } from '../../data/mockTitanData';
import { useNotification } from '../../context/NotificationContext';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  activeEntity: CorporateEntity;
  onDownload: () => void;
  reportRefNumber: string;
}

export function ReportPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  activeEntity,
  onDownload,
  reportRefNumber
}: ReportPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'template'>('pdf');
  const [copied, setCopied] = useState(false);
  const { addToast } = useNotification();

  if (!isOpen) return null;

  const totalReserves = ENTITIES.reduce((acc, e) => acc + e.ledgerReserves, 0);
  const totalTokens = ENTITIES.reduce((acc, e) => acc + e.tokenAllotment, 0);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(reportRefNumber);
    setCopied(true);
    addToast('Report Reference Hash copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0c0f14] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-gray-900 dark:text-gray-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#12161f]/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="report-modal-title" className="text-sm sm:text-base font-mono font-bold tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
                TITAN CONGLOMERATE // EXECUTIVE SUMMARY REPORT
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" /> CAGE: ACTIVE
                </span>
              </h2>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-2 mt-0.5">
                <span>ENTITY: {activeEntity.name}</span>
                <span>•</span>
                <button 
                  onClick={handleCopyRef} 
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1"
                  title="Click to copy Reference Hash"
                >
                  REF: {reportRefNumber}
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-60" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg text-xs font-mono">
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'pdf'
                    ? 'bg-white dark:bg-black text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                PDF PREVIEW
              </button>
              <button
                onClick={() => setActiveTab('template')}
                className={`px-3 py-1 rounded transition-colors ${
                  activeTab === 'template'
                    ? 'bg-white dark:bg-black text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                TEMPLATE VIEW
              </button>
            </div>

            <button
              onClick={handlePrint}
              aria-label="Print Report"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD PDF
            </button>

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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100/60 dark:bg-[#07090e]">
          {activeTab === 'pdf' ? (
            <div className="w-full h-full min-h-[580px] flex flex-col bg-white dark:bg-[#10141d] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-inner">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="PDF Summary Report Preview"
                  className="w-full h-full min-h-[580px] border-0"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
                  <p className="font-mono text-sm text-gray-500">Compiling Report Stream & Cryptographic Roots...</p>
                </div>
              )}
            </div>
          ) : (
            /* Structured Template View */
            <div className="max-w-4xl mx-auto space-y-6 bg-white dark:bg-[#0a0d14] p-6 sm:p-8 rounded-xl border border-gray-200 dark:border-gray-800 font-mono shadow-sm">
              {/* Report Header Band */}
              <div className="border-b-2 border-emerald-500 pb-5 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">TITAN GAMES SECURITY L.L.C. // MASTER DISPATCH</div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-gray-100 mt-1">
                    SOVEREIGN CONGLOMERATE STATUS REPORT
                  </h1>
                  <div className="text-xs text-gray-500 mt-1">
                    FORMAL FIDUCIARY TITLE & STATE AUDIT LEDGER
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-gray-600 dark:text-gray-400">
                  <div>DATE: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold">CAGE: 100% ACTIVE | SAM.GOV</div>
                </div>
              </div>

              {/* Clearance & Procurement Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-[#05070c] p-3 rounded-lg border border-gray-200 dark:border-gray-800 text-[11px]">
                <div>
                  <div className="text-gray-500">HOLDING TRUST</div>
                  <div className="font-bold text-gray-900 dark:text-gray-200">Nicholas Young Master Trust</div>
                  <div className="text-gray-400">EIN: 41-6820289</div>
                </div>
                <div>
                  <div className="text-gray-500">OPERATING ARM</div>
                  <div className="font-bold text-gray-900 dark:text-gray-200">Titan Games Security L.L.C.</div>
                  <div className="text-gray-400">EIN: 42-4264313 | LARA: 28678008</div>
                </div>
                <div>
                  <div className="text-gray-500">FEDERAL IDENTIFIERS</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">CAGE Code: ACTIVE</div>
                  <div className="text-gray-400">D-U-N-S: 145054895 | ARI: #21270632</div>
                </div>
                <div>
                  <div className="text-gray-500">PROCUREMENT VEHICLE</div>
                  <div className="font-bold text-gray-900 dark:text-gray-200">Google Cloud Marketplace</div>
                  <div className="text-gray-400">cloudcommerceprocurement / ACH</div>
                </div>
              </div>

              {/* Selected Entity Card */}
              <div className="p-4 rounded-lg border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">SELECTED TARGET: {activeEntity.name}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold">
                    {activeEntity.role || 'SUBSIDIARY'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block">EIN / REGISTRATION</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{activeEntity.ein}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">JURISDICTION</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{activeEntity.jurisdiction}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">LEDGER RESERVES</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">${(activeEntity.ledgerReserves / 1e6).toFixed(2)}M USD</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">TOKEN ALLOTMENT</span>
                    <span className="font-bold text-gray-900 dark:text-gray-100">{(activeEntity.tokenAllotment / 1e6).toFixed(2)}M UNITS</span>
                  </div>
                </div>
              </div>

              {/* Conglomerate Aggregates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#05070c]">
                  <div className="text-xs text-gray-500">CONGLOMERATE TOTAL RESERVES</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    ${(totalReserves / 1e9).toFixed(2)}B USD
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#05070c]">
                  <div className="text-xs text-gray-500">CIRCULATING TOKEN SUPPLY</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {(totalTokens / 1e6).toFixed(2)}M TOKENS
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#05070c]">
                  <div className="text-xs text-gray-500">SUBSIDIARY ENCLAVES</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                    {ENTITIES.length} SEALED SILOS
                  </div>
                </div>
              </div>

              {/* Subsidiary Table in Template */}
              <div>
                <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  CONGLOMERATE SCHEDULE OF SUBSIDIARIES
                </h3>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-900/60 text-gray-600 dark:text-gray-400 font-mono">
                      <tr>
                        <th className="p-2.5">ENTITY NAME</th>
                        <th className="p-2.5">EIN/ID</th>
                        <th className="p-2.5">JURISDICTION</th>
                        <th className="p-2.5 text-right">RESERVES</th>
                        <th className="p-2.5 text-right">TOKENS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {ENTITIES.map((e) => (
                        <tr 
                          key={e.id}
                          className={e.id === activeEntity.id ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-bold' : ''}
                        >
                          <td className="p-2.5 text-gray-900 dark:text-gray-100">{e.name}</td>
                          <td className="p-2.5 text-emerald-600 dark:text-emerald-400">{e.ein}</td>
                          <td className="p-2.5 text-gray-600 dark:text-gray-400">{e.jurisdiction}</td>
                          <td className="p-2.5 text-right">${(e.ledgerReserves / 1e6).toFixed(2)}M</td>
                          <td className="p-2.5 text-right">{(e.tokenAllotment / 1e6).toFixed(2)}M</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cryptographic Attestation Footer */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-gray-500 space-y-2 sm:space-y-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>STATE ROOT: {reportRefNumber}</span>
                </div>
                <div>USPTO APPLICATION #64/014,873 | DETERMINISTIC SHANNON SIEVE CERTIFIED</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0e121a] flex justify-between items-center text-xs font-mono">
          <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Fiduciary State Proof Sealed via Ed25519 & SQLite nanosecond clock</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download .PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
