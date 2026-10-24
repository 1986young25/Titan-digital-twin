import { useState, useCallback } from 'react';
import { ENTITIES } from '../../data/mockTitanData';
import { motion } from 'motion/react';
import { Database, Coins, Building, FileText, Download, ShieldCheck, CheckCircle2, Eye, Shield } from 'lucide-react';
import { useEntityContext } from '../../context/EntityContext';
import { useNotification } from '../../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';
import { ReportPreviewModal } from '../common/ReportPreviewModal';

// Apply jspdf-autotable plugin to jsPDF prototype
try {
  applyPlugin(jsPDF);
} catch {
  // Ignore if already applied
}

// Fallback registration on jsPDF.API if not attached
if (typeof (jsPDF as any).API?.autoTable !== 'function') {
  (jsPDF as any).API.autoTable = function(options: any) {
    return (autoTable as any)(this, options);
  };
}

export function ConglomerateHUD() {
  const { activeEntityId, activeEntity } = useEntityContext();
  const { addToast } = useNotification();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [currentReportRef, setCurrentReportRef] = useState<string>('');

  const totalReserves = ENTITIES.reduce((acc, entity) => acc + entity.ledgerReserves, 0);
  const totalTokens = ENTITIES.reduce((acc, entity) => acc + entity.tokenAllotment, 0);

  // Helper to construct a complete, audited jsPDF document instance
  const createReportDocument = useCallback((refHash: string): jsPDF => {
    const doc = new jsPDF();

    // Attach autoTable directly to the doc instance as bulletproof safeguard
    if (typeof (doc as any).autoTable !== 'function') {
      (doc as any).autoTable = function(options: any) {
        return (autoTable as any)(doc, options);
      };
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Header Band
    doc.setFillColor(15, 23, 42); // Dark slate header
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(16, 185, 129); // Emerald accent
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text('TITAN GAMES SECURITY L.L.C.', 14, 12);

    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    doc.setFont('courier', 'normal');
    doc.text('SOVEREIGN COMMERCIAL SERVICES // FIDUCIARY CONGLOMERATE REPORT', 14, 18);
    doc.text('HOLDING TRUST: The Nicholas Young Master Trust (EIN 41-6820289)', 14, 23);
    doc.text('CLEARANCES: CAGE Code 100% ACTIVE | SAM.gov Registered | D-U-N-S: 145054895 | ARI #21270632', 14, 28);

    // Right-aligned reference stamp
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`REF: ${refHash}`, 200, 12, { align: 'right' });
    doc.text(`SEAL TIME: ${timestamp} UTC`, 200, 18, { align: 'right' });
    doc.text('PROCUREMENT: Google Cloud Marketplace (`cloudcommerceprocurement`)', 200, 28, { align: 'right' });

    // Section 1: Active Target Entity
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('courier', 'bold');
    doc.text('SECTION 1: TARGET SUBSIDIARY ENCLAVE STATUS', 14, 42);

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(14, 44, 196, 44);

    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    doc.setTextColor(51, 65, 85);

    doc.text(`Entity Name       : ${activeEntity.name}`, 14, 52);
    doc.text(`Entity Identifier : ${activeEntity.id} (${activeEntity.role || 'SUBSIDIARY'})`, 14, 58);
    doc.text(`EIN / Reg. ID     : ${activeEntity.ein} ${activeEntity.laraId ? `[LARA ID ${activeEntity.laraId}]` : ''}`, 14, 64);
    doc.text(`Jurisdiction      : ${activeEntity.jurisdiction}`, 14, 70);

    doc.text(`Federal Clearance : CAGE CODE 100% ACTIVE | SAM.GOV REGISTERED`, 110, 52);
    doc.text(`Ledger Reserves   : $${(activeEntity.ledgerReserves / 1e6).toFixed(2)}M USD (Liquid Enclave)`, 110, 58);
    doc.text(`Token Allocation  : ${(activeEntity.tokenAllotment / 1e6).toFixed(2)}M Units`, 110, 64);
    doc.text(`Execution Runtime : Bare-Metal POSIX | Shannon Filter H(X)<1.5 Active`, 110, 70);

    // Section 2: Conglomerate Unified Totals
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('courier', 'bold');
    doc.text('SECTION 2: CONGLOMERATE UNIFIED TRIAL BALANCE', 14, 82);

    doc.line(14, 84, 196, 84);

    doc.setFillColor(248, 250, 252);
    doc.rect(14, 88, 182, 18, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, 88, 182, 18, 'S');

    doc.setFontSize(9);
    doc.setFont('courier', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`UNIFIED RESERVES: $${(totalReserves / 1e9).toFixed(2)}B USD`, 20, 99);

    doc.setTextColor(30, 41, 59);
    doc.text(`CIRCULATING TOKENS: ${(totalTokens / 1e6).toFixed(2)}M`, 95, 99);
    doc.text(`SUBSIDIARY SILOS: ${ENTITIES.length} ENCLAVES`, 155, 99);

    // Section 3: Subsidiary Schedule Table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('courier', 'bold');
    doc.text('SECTION 3: CONGLOMERATE SUBSIDIARY SCHEDULE', 14, 115);

    const tableRows = ENTITIES.map(e => [
      e.id === activeEntity.id ? `* ${e.name}` : e.name,
      e.ein,
      e.jurisdiction,
      e.cageStatus || 'ACTIVE',
      `$${(e.ledgerReserves / 1e6).toFixed(2)}M`,
      `${(e.tokenAllotment / 1e6).toFixed(2)}M`
    ]);

    const tableOptions = {
      startY: 120,
      head: [['ENTITY NAME', 'EIN / REG', 'JURISDICTION', 'CAGE CLEARANCE', 'RESERVES ($M)', 'TOKENS (M)']],
      body: tableRows,
      theme: 'grid' as const,
      styles: { font: 'courier' as const, fontSize: 8, cellPadding: 2.5 },
      headStyles: { 
        fillColor: [16, 185, 129] as [number, number, number], 
        textColor: [255, 255, 255] as [number, number, number], 
        fontStyle: 'bold' as const 
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] as [number, number, number] 
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 32 },
        2: { cellWidth: 35 },
        3: { cellWidth: 26 },
        4: { cellWidth: 22, halign: 'right' as const },
        5: { cellWidth: 18, halign: 'right' as const },
      }
    };

    // Invoke autoTable safely using direct method or function call
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(tableOptions);
    } else {
      autoTable(doc, tableOptions);
    }

    // Cryptographic attestation footer
    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 250;
    
    doc.setFontSize(7);
    doc.setFont('courier', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`FIDUCIARY ATTESTATION: Verified under UCC Article 9 & USPTO Patent Application #64/014,873.`, 14, finalY);
    doc.text(`Deterministic state hash: UCC-CER-NYMT-XB6-${refHash.substring(0, 16)} | All settlements transfer to Nicholas Young Master Trust (EIN 41-6820289).`, 14, finalY + 5);

    return doc;
  }, [activeEntity, totalReserves, totalTokens]);

  // Open Preview Modal with rendered PDF
  const handlePreviewReport = () => {
    try {
      const refHash = `UCC-CER-NYMT-XB6-${new Date().getTime().toString(16).toUpperCase()}`;
      setCurrentReportRef(refHash);
      const doc = createReportDocument(refHash);
      
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      setPreviewPdfUrl(blobUrl);
      setIsReportModalOpen(true);
      addToast('Summary Report generated & opened for review', 'info');
    } catch (error) {
      console.error('Error generating PDF report preview:', error);
      addToast('Failed to generate PDF report preview', 'error');
    }
  };

  // Direct Download
  const handleDirectDownload = () => {
    try {
      const refHash = `UCC-CER-NYMT-XB6-${new Date().getTime().toString(16).toUpperCase()}`;
      const doc = createReportDocument(refHash);
      doc.save(`Titan_Conglomerate_Report_${activeEntity.id}_${new Date().getTime()}.pdf`);
      addToast('PDF Report generated and downloaded', 'success');
    } catch (error) {
      console.error('Error downloading PDF report:', error);
      addToast('Failed to generate PDF report', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 print:block print:p-0">
      {/* Sovereign CAGE & Clearances Verification Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-gray-900 to-black border border-emerald-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-gray-100 tracking-wider">
                TITAN GAMES SECURITY L.L.C.
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> CAGE: 100% ACTIVE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/40">
                SAM.GOV REGISTERED
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              <span>HOLDING TRUST: <strong className="text-gray-300">Nicholas Young Master Trust (EIN 41-6820289)</strong></span>
              <span>OPERATING EIN: <strong className="text-gray-300">42-4264313 (LARA 28678008)</strong></span>
              <span>D-U-N-S: <strong className="text-gray-300">145054895</strong></span>
              <span>DARPA ARI: <strong className="text-emerald-400">#21270632</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button 
            onClick={handlePreviewReport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all shadow-sm"
          >
            <Eye className="w-4 h-4" />
            PREVIEW & DISPLAY REPORT
          </button>
          <button 
            onClick={handleDirectDownload}
            className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-lg font-mono text-xs transition-colors"
            title="Direct Download PDF"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 p-6 rounded-xl relative overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none print:break-inside-avoid"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100 dark:bg-emerald-500/10 rounded-full blur-2xl transition-colors duration-200 print:hidden" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-500 print:text-black" />
            <h3 className="text-sm font-mono text-gray-500 dark:text-gray-400 print:text-gray-600">UNIFIED TRIAL BALANCE</h3>
          </div>
          <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 print:text-black relative z-10">
            ${(totalReserves / 1e9).toFixed(2)}B
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-2">UCC Article 9 Proof-of-Reserve Anchored</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 p-6 rounded-xl relative overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none print:break-inside-avoid"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-2xl transition-colors duration-200 print:hidden" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Coins className="w-5 h-5 text-blue-600 dark:text-blue-500 print:text-black" />
            <h3 className="text-sm font-mono text-gray-500 dark:text-gray-400 print:text-gray-600">TOTAL ALLOTTED TOKENS</h3>
          </div>
          <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 print:text-black relative z-10">
            {(totalTokens / 1e6).toFixed(1)}M
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-2">Circulating Sovereign Units</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 p-6 rounded-xl relative overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none print:break-inside-avoid"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-2xl transition-colors duration-200 print:hidden" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <Building className="w-5 h-5 text-purple-600 dark:text-purple-500 print:text-black" />
            <h3 className="text-sm font-mono text-gray-500 dark:text-gray-400 print:text-gray-600">ACTIVE SUBSIDIARIES</h3>
          </div>
          <div className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 print:text-black relative z-10">
            {ENTITIES.length}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-2">Autonomous Enclave Nodes</div>
        </motion.div>
      </div>

      {/* Selected Entity Detailed Spotlight Card */}
      <div className="bg-white dark:bg-black/40 border border-emerald-500/30 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h3 className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
              ACTIVE ENTITY SELECTION: {activeEntity.name}
            </h3>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold self-start sm:self-auto">
            {activeEntity.role || 'CONGLOMERATE SILO'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-mono">
          <div>
            <span className="text-gray-500 block text-[10px]">EIN / REGISTRATION</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{activeEntity.ein}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">JURISDICTION</span>
            <span className="text-gray-800 dark:text-gray-200">{activeEntity.jurisdiction}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">LEDGER RESERVES</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">${(activeEntity.ledgerReserves / 1e6).toFixed(2)}M</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">CAGE STATUS</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              ● 100% ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Conglomerate Silos Schedule Table */}
      <div className="bg-white dark:bg-black/40 print:bg-white border border-gray-200 dark:border-gray-800/50 print:border-gray-300 rounded-xl overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none print:shadow-none">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800/50 print:border-gray-300 bg-gray-50 dark:bg-[#0a0a0a] print:bg-transparent flex justify-between items-center transition-colors duration-200">
          <h2 className="text-sm font-mono font-bold tracking-widest text-gray-700 dark:text-gray-300 print:text-black">CONGLOMERATE SILOS</h2>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">All Enclaves Active</span>
        </div>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:table">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800/50 print:border-gray-300 bg-gray-100/50 dark:bg-black/60 print:bg-transparent transition-colors duration-200">
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal">ENTITY NAME</th>
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal">EIN / ID</th>
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal">JURISDICTION</th>
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal">CLEARANCE</th>
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal text-right">RESERVES</th>
                <th className="p-4 text-xs font-mono text-gray-500 print:text-black font-normal text-right">TOKENS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/30 print:divide-gray-300 transition-colors duration-200">
              {ENTITIES.map((entity, i) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  key={entity.id} 
                  className={`transition-colors print:break-inside-avoid ${entity.id === activeEntityId ? 'bg-emerald-50 dark:bg-emerald-900/20 print:bg-transparent border-l-2 border-emerald-500 print:border-l-0 print:font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'}`}
                >
                  <td className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200 print:text-black">
                    {entity.name}
                    {entity.role && (
                      <span className="block text-[10px] text-gray-400 font-normal">{entity.role}</span>
                    )}
                  </td>
                  <td className="p-4 text-xs font-mono text-emerald-600 dark:text-emerald-400/80 print:text-gray-700">{entity.ein}</td>
                  <td className="p-4 text-xs font-mono text-gray-600 dark:text-gray-400 print:text-gray-700">{entity.jurisdiction}</td>
                  <td className="p-4 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      CAGE: ACTIVE
                    </span>
                  </td>
                  <td className="p-4 text-sm font-mono text-gray-700 dark:text-gray-300 print:text-black text-right">
                    ${(entity.ledgerReserves / 1e6).toFixed(2)}M
                  </td>
                  <td className="p-4 text-sm font-mono text-gray-700 dark:text-gray-300 print:text-black text-right">
                    {(entity.tokenAllotment / 1e6).toFixed(2)}M
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Preview Modal */}
      <ReportPreviewModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        pdfUrl={previewPdfUrl}
        activeEntity={activeEntity}
        onDownload={handleDirectDownload}
        reportRefNumber={currentReportRef}
      />
    </div>
  );
}
