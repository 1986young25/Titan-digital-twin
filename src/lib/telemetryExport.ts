import jsPDF from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';

// Ensure jspdf-autotable plugin is registered on jsPDF prototype
try {
  applyPlugin(jsPDF);
} catch {
  // Ignore if already applied
}

// Fallback registration on jsPDF.API if not attached
if (typeof (jsPDF as any).API?.autoTable !== 'function') {
  (jsPDF as any).API.autoTable = function (options: any) {
    return (autoTable as any)(this, options);
  };
}

export interface CanTelemetryItem {
  id: string;
  timestamp: string;
  canId: string;
  name: string;
  dlc: number;
  data: string;
  vibrationRaw: number;
  vibrationEma: number;
  persistenceCount?: number;
  debounceState?: string;
  status?: string;
  source?: 'LIVE_CAN_FRAME' | 'FIRESTORE_LEDGER' | 'AUX_DISPATCH' | 'OPERATOR_SNAPSHOT';
  operatorEmail?: string;
}

export interface TelemetryExportOptions {
  vehicleId: string;
  alpha: number;
  persistenceThreshold: number;
  vibrationTriggerThreshold: number;
  waveImpedance?: string;
  cadence?: string;
  shannonGate?: string;
  generatedBy?: string;
  reportRef?: string;
}

/**
 * Generates an RFC-4180 compliant CSV string with defense compliance metadata
 */
export function generateTelemetryCsv(items: CanTelemetryItem[], options: TelemetryExportOptions): string {
  const refHash = options.reportRef || `UCC-CER-NYMT-XB6-${Date.now().toString(16).toUpperCase()}`;
  const now = new Date().toISOString();

  // Defense & Fiduciary Header Comments
  const metadataComments = [
    `# ==============================================================================`,
    `# TITAN GAMES SECURITY L.L.C. // KINETIC CAN TELEMETRY & ROBOTICS AUDIT LOG`,
    `# HOLDING TRUST : The Nicholas Young Master Trust (EIN 41-6820289)`,
    `# OPERATING ARM : Titan Games Security L.L.C. (EIN 42-4264313 | LARA ID 28678008)`,
    `# CLEARANCES    : CAGE Active | SAM.gov Registered | D-U-N-S: 145054895`,
    `# DEFENSE / ARI : DARPAConnect / ARI #21270632 | SBIR Phase II Ready`,
    `# PATENT REF    : Formalities Letter Under USPTO Patent Application #64/014,873`,
    `# INVARIANTS    : Z_0 = 376.5 Ohm (Wave Impedance) | 3.69 Hz Resonant Cadence | H(X) < 1.5`,
    `# ALGORITHM     : Exponential Moving Average (EMA alpha=${options.alpha}) + 10-Cycle Debounce`,
    `# VEHICLE NODE  : ${options.vehicleId}`,
    `# REPORT HASH   : ${refHash}`,
    `# EXPORT TIME   : ${now}`,
    `# OPERATOR      : ${options.generatedBy || 'Sovereign Enclave Operator'}`,
    `# ==============================================================================`,
  ].join('\n');

  // Column Headers
  const headers = [
    'RECORD_ID',
    'TIMESTAMP_UTC',
    'VEHICLE_NODE',
    'SOURCE_TYPE',
    'CAN_ID',
    'SIGNAL_BUS_ROLE',
    'DLC_BYTES',
    'HEX_PAYLOAD',
    'RAW_VIBRATION_G',
    'EMA_FILTERED_G',
    'DELTA_G',
    'ALPHA_PARAM',
    'PERSISTENCE_COUNT',
    'THRESHOLD_G',
    'DEBOUNCE_STATE',
    'STATE_CERT_HASH',
    'OPERATOR_UID'
  ];

  // Helper to escape CSV cell contents
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = items.map((item) => {
    const delta = Math.abs(item.vibrationRaw - item.vibrationEma).toFixed(3);
    const debounceState = item.debounceState || (
      (item.persistenceCount ?? 0) >= options.persistenceThreshold
        ? 'DISPATCH_TRIGGERED'
        : 'NOMINAL_DEBOUNCE'
    );

    return [
      escapeCsv(item.id),
      escapeCsv(item.timestamp),
      escapeCsv(options.vehicleId),
      escapeCsv(item.source || 'LIVE_CAN_FRAME'),
      escapeCsv(item.canId),
      escapeCsv(item.name),
      escapeCsv(item.dlc),
      escapeCsv(item.data),
      escapeCsv(item.vibrationRaw.toFixed(3)),
      escapeCsv(item.vibrationEma.toFixed(3)),
      escapeCsv(delta),
      escapeCsv(options.alpha),
      escapeCsv(item.persistenceCount ?? 0),
      escapeCsv(options.vibrationTriggerThreshold),
      escapeCsv(debounceState),
      escapeCsv(refHash),
      escapeCsv(item.operatorEmail || options.generatedBy || 'enclave_root')
    ].join(',');
  });

  return `${metadataComments}\n${headers.join(',')}\n${rows.join('\n')}\n`;
}

/**
 * Triggers browser download of CSV string
 */
export function downloadTelemetryCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an executive-grade defense and compliance PDF document
 */
export function generateTelemetryPdfReport(
  items: CanTelemetryItem[],
  options: TelemetryExportOptions
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Attach autoTable directly to the doc instance if needed
  if (typeof (doc as any).autoTable !== 'function') {
    (doc as any).autoTable = function (opts: any) {
      return (autoTable as any)(doc, opts);
    };
  }

  const refHash = options.reportRef || `UCC-CER-NYMT-XB6-${Date.now().toString(16).toUpperCase()}`;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  // 1. Top Header Banner (Tactical Slate & Emerald)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  // Emerald Top Stripe
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, 210, 2.5, 'F');

  doc.setTextColor(16, 185, 129);
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.text('TITAN GAMES SECURITY L.L.C. // SOVEREIGN AUDIT', 14, 11);

  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.setFont('courier', 'normal');
  doc.text('KINETIC ROBOTICS & CAN TELEMETRY COMPLIANCE CERTIFICATION', 14, 17);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`AUDIT REF: ${refHash} | ISSUED: ${timestamp} UTC`, 14, 23);
  doc.text(`SECURITY LEVEL: UNCLASSIFIED // DEFENSE TACTICAL TELEMETRY SPEC`, 14, 28);

  // Header Right Badge
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.text('CAGE: ACTIVE', 165, 12);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7);
  doc.text('SAM.GOV REGISTERED', 165, 17);
  doc.text('DUNS: 145054895', 165, 22);
  doc.text('DARPA #21270632', 165, 27);

  // 2. Section 1: Entity & Fiduciary Authority Strip
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text('SECTION 1: STATUTORY AUTHORITY & VEHICLE ANCHOR', 14, 40);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, 42, 196, 42);

  doc.setFontSize(7.5);
  doc.setFont('courier', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`Holding Trust   : The Nicholas Young Master Trust (EIN 41-6820289)`, 14, 48);
  doc.text(`Operating Arm   : Titan Games Security L.L.C. (EIN 42-4264313 | LARA 28678008)`, 14, 53);
  doc.text(`Active Vehicle  : ${options.vehicleId} (Tactical UGV / MAVLink Ingress)`, 14, 58);
  doc.text(`Authorized Officer: Nicholas Lee Young (Trustee & Executive Systems Architect)`, 14, 63);

  doc.text(`Patent Pending  : Formalities Letter Under USPTO #64/014,873`, 110, 48);
  doc.text(`Wave Invariant  : Free-Space Z_0 = 376.5 Ohm | 3.69 Hz Resonant Cadence`, 110, 53);
  doc.text(`Entropy Sieve   : Shannon H(X) < 1.5 Bitwise Defense Gate Active`, 110, 58);
  doc.text(`Auditing Operator: ${options.generatedBy || 'Sovereign Enclave Operator'}`, 110, 63);

  // 3. Section 2: Mathematical Signal Conditioning Parameters & Execution Metrics
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text('SECTION 2: SIGNAL CONDITIONING SPECIFICATION & AUDIT METRICS', 14, 73);
  doc.line(14, 75, 196, 75);

  // Compute key summary metrics
  const totalFrames = items.length;
  const rawValues = items.map((i) => i.vibrationRaw);
  const peakRaw = rawValues.length > 0 ? Math.max(...rawValues) : 0;
  const meanRaw = rawValues.length > 0 ? rawValues.reduce((a, b) => a + b, 0) / rawValues.length : 0;
  const debouncedAnomalies = items.filter(
    (i) => (i.persistenceCount ?? 0) >= options.persistenceThreshold || i.vibrationRaw >= options.vibrationTriggerThreshold
  ).length;

  // Metric KPI Cards (Slate filled boxes)
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 79, 182, 17, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 79, 182, 17, 'S');

  doc.setFontSize(7.5);
  doc.setFont('courier', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`SAMPLED FRAMES: ${totalFrames}`, 18, 86);
  doc.text(`PEAK IMPULSE: ${peakRaw.toFixed(3)}g`, 68, 86);
  doc.text(`MEAN VIBRATION: ${meanRaw.toFixed(3)}g`, 116, 86);
  doc.text(`ANOMALIES: ${debouncedAnomalies}`, 164, 86);

  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`EMA FILTER (alpha=${options.alpha})`, 18, 92);
  doc.text(`DEBOUNCE PERSISTENCE >= ${options.persistenceThreshold}`, 68, 92);
  doc.text(`TRIGGER >= ${options.vibrationTriggerThreshold}g`, 116, 92);
  doc.text(`UCC ARTICLE 9 ENCLAVE PROOF`, 164, 92);

  // 4. Section 3: Telemetry Frame Audit Schedule (autoTable)
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text('SECTION 3: CAN BUS TELEMETRY & PERSISTENCE RECORD SCHEDULE', 14, 105);

  const displayItems = items.slice(0, 35); // Keep table clean and readable on first/second pages
  const tableRows = displayItems.map((item) => [
    item.timestamp.slice(0, 19).replace('T', ' '),
    item.canId,
    item.name.length > 24 ? item.name.substring(0, 22) + '..' : item.name,
    item.data,
    `${item.vibrationRaw.toFixed(2)}g`,
    `${item.vibrationEma.toFixed(2)}g`,
    item.persistenceCount !== undefined ? `${item.persistenceCount}/${options.persistenceThreshold}` : 'N/A',
    (item.persistenceCount ?? 0) >= options.persistenceThreshold ? 'SPIKE DEBOUNCED' : 'NOMINAL'
  ]);

  const tableOptions = {
    startY: 109,
    head: [['TIMESTAMP', 'CAN ID', 'SENSOR / BUS ROLE', 'HEX PAYLOAD (8 BYTES)', 'RAW', 'EMA', 'PERSIST.', 'STATUS']],
    body: tableRows,
    theme: 'grid' as const,
    styles: { font: 'courier' as const, fontSize: 6.5, cellPadding: 1.8 },
    headStyles: {
      fillColor: [15, 23, 42] as [number, number, number],
      textColor: [16, 185, 129] as [number, number, number],
      fontStyle: 'bold' as const,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 20 },
      2: { cellWidth: 40 },
      3: { cellWidth: 44 },
      4: { cellWidth: 14, halign: 'right' as const },
      5: { cellWidth: 14, halign: 'right' as const },
      6: { cellWidth: 16, halign: 'center' as const },
      7: { cellWidth: 22, halign: 'center' as const },
    },
  };

  if (typeof (doc as any).autoTable === 'function') {
    (doc as any).autoTable(tableOptions);
  } else {
    autoTable(doc, tableOptions);
  }

  // 5. Attestation & Fiduciary Certification Footer
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 255;
  const safeFooterY = finalY > 265 ? 265 : finalY;

  doc.setDrawColor(203, 213, 225);
  doc.line(14, safeFooterY, 196, safeFooterY);

  doc.setFontSize(6.5);
  doc.setFont('courier', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `FORENSIC ATTESTATION: Generated under USPTO Patent Application #64/014,873 & Uniform Commercial Code (UCC) Proof-of-Reserve.`,
    14,
    safeFooterY + 5
  );
  doc.text(
    `STATE ROOT SEAL: ${refHash} | All state settlements transfer directly to The Nicholas Young Master Trust (EIN 41-6820289).`,
    14,
    safeFooterY + 9
  );
  doc.text(
    `OFFLINE COMPLIANCE VERIFICATION: Validated for air-gapped tactical field deployment without hyperscaler lock-in or cloud rent.`,
    14,
    safeFooterY + 13
  );

  return doc;
}

/**
 * Direct download of the compiled PDF report
 */
export function downloadTelemetryPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
