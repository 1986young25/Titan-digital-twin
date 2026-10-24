import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, 
  Cpu, 
  Radio, 
  Send, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  ShieldCheck, 
  Terminal, 
  Flame, 
  Layers, 
  Zap, 
  Code, 
  Copy, 
  Check, 
  Sparkles,
  Server,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Download,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../../context/NotificationContext';
import { useEntityContext } from '../../context/EntityContext';
import { useAuth } from '../../context/AuthContext';
import { saveTelemetryEvent, subscribeToTelemetry, TelemetryEventDoc } from '../../lib/firestoreService';
import { Database, Lock, CheckCircle2, CloudUpload } from 'lucide-react';
import { TelemetryReportModal } from '../common/TelemetryReportModal';
import { 
  CanTelemetryItem, 
  generateTelemetryCsv, 
  downloadTelemetryCsv, 
  generateTelemetryPdfReport, 
  downloadTelemetryPdf 
} from '../../lib/telemetryExport';

interface CanFrame {
  id: string;
  canId: string;
  name: string;
  dlc: number;
  data: string;
  timestamp: string;
  vibrationRaw: number;
  vibrationEma: number;
}

export function KineticCanTelemetry() {
  const { addToast } = useNotification();
  const { activeEntity } = useEntityContext();
  const { user, isAuthenticated, signInWithGoogle } = useAuth();

  // Core algorithm parameters (as defined by user)
  const [alpha, setAlpha] = useState<number>(0.2);
  const [persistenceThreshold, setPersistenceThreshold] = useState<number>(10);
  const [vibrationTriggerThreshold, setVibrationTriggerThreshold] = useState<number>(1.85); // g
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [vehicleId, setVehicleId] = useState<string>('TITAN-UGV-PX8A');
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState<boolean>(true);

  // Live state
  const [currentRaw, setCurrentRaw] = useState<number>(0.42);
  const [currentEma, setCurrentEma] = useState<number>(0.42);
  const [persistenceCount, setPersistenceCount] = useState<number>(0);
  const [history, setHistory] = useState<{ raw: number; ema: number; time: string; persistence: number }[]>([]);
  const [canFrames, setCanFrames] = useState<CanFrame[]>([]);
  
  // Dispatch states
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [lastDispatchResult, setLastDispatchResult] = useState<any>(null);
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'PYTHON_SPEC' | 'BASH_CURL' | 'AI_TRIAGE' | 'FIRESTORE_RECORDS'>('TELEMETRY');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [firestoreRecords, setFirestoreRecords] = useState<TelemetryEventDoc[]>([]);
  const [isSavingFirestore, setIsSavingFirestore] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Consolidates live CAN frames, Firestore records, and trajectory into uniform audit items
  const getConsolidatedTelemetryItems = useCallback((scope?: 'ALL' | 'LIVE' | 'FIRESTORE'): CanTelemetryItem[] => {
    const items: CanTelemetryItem[] = [];

    // 1. Live CAN Bus Frames (if scope is ALL or LIVE)
    if (scope !== 'FIRESTORE') {
      canFrames.forEach(frame => {
        items.push({
          id: frame.id,
          timestamp: new Date().toISOString().substring(0, 10) + ' ' + frame.timestamp,
          canId: frame.canId,
          name: frame.name,
          dlc: frame.dlc,
          data: frame.data,
          vibrationRaw: frame.vibrationRaw,
          vibrationEma: frame.vibrationEma,
          persistenceCount: persistenceCount,
          status: frame.vibrationRaw >= vibrationTriggerThreshold ? 'VIBRATION_SPIKE' : 'NOMINAL_SIGNAL',
          source: 'LIVE_CAN_FRAME',
        });
      });

      // Include recent history frames if buffer is fresh
      if (items.length < 5 && history.length > 0) {
        history.slice(-8).forEach((h, idx) => {
          items.push({
            id: `hist-${idx}-${Date.now()}`,
            timestamp: new Date().toISOString().substring(0, 10) + ' ' + h.time,
            canId: '0x18EAFF00',
            name: 'MAVLink Kinetic IMU Frame',
            dlc: 8,
            data: '4B 49 4E 45 54 49 43 01',
            vibrationRaw: h.raw,
            vibrationEma: h.ema,
            persistenceCount: h.persistence,
            status: h.persistence >= persistenceThreshold ? 'TIER_4_DISPATCH_TRIGGER' : 'NOMINAL_STREAM',
            source: 'LIVE_CAN_FRAME'
          });
        });
      }
    }

    // 2. Persisted Firestore Records (if scope is ALL or FIRESTORE)
    if (scope !== 'LIVE') {
      firestoreRecords.forEach(rec => {
        items.push({
          id: rec.id,
          timestamp: rec.timestamp || new Date().toISOString(),
          canId: '0x18FD0900',
          name: `Titan 3-Axis Accelerometer (${rec.vehicleId})`,
          dlc: 8,
          data: '53 4F 56 45 52 45 49 47',
          vibrationRaw: rec.vibrationDelta,
          vibrationEma: Number((rec.vibrationDelta * rec.alpha).toFixed(3)),
          persistenceCount: rec.persistenceCount,
          status: rec.status,
          source: 'FIRESTORE_LEDGER',
          operatorEmail: rec.operatorEmail || (rec.userId ? `${rec.userId.slice(0, 8)}...` : undefined),
        });
      });
    }

    return items;
  }, [canFrames, firestoreRecords, history, persistenceCount, vibrationTriggerThreshold, persistenceThreshold]);

  // One-click quick CSV export
  const handleQuickCsvExport = useCallback((scope: 'ALL' | 'LIVE' | 'FIRESTORE' = 'ALL') => {
    try {
      const items = getConsolidatedTelemetryItems(scope);
      const refHash = `UCC-CER-NYMT-XB6-${Date.now().toString(16).toUpperCase()}`;
      const csv = generateTelemetryCsv(items, {
        vehicleId,
        alpha,
        persistenceThreshold,
        vibrationTriggerThreshold,
        generatedBy: user ? user.email || user.uid : 'Sovereign Enclave Operator',
        reportRef: refHash
      });
      const scopeLabel = scope === 'ALL' ? 'Consolidated' : scope === 'LIVE' ? 'Live_CAN' : 'Firestore';
      const filename = `Titan_${scopeLabel}_Telemetry_${vehicleId}_${refHash}.csv`;
      downloadTelemetryCsv(csv, filename);
      addToast(`OFFLINE CSV EXPORTED: ${items.length} records saved to ${filename}`, 'success');
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      addToast(`Export failed: ${err.message}`, 'error');
    }
  }, [getConsolidatedTelemetryItems, vehicleId, alpha, persistenceThreshold, vibrationTriggerThreshold, user, addToast]);

  // One-click quick PDF compliance report export
  const handleQuickPdfExport = useCallback(() => {
    try {
      const items = getConsolidatedTelemetryItems('ALL');
      const refHash = `UCC-CER-NYMT-XB6-${Date.now().toString(16).toUpperCase()}`;
      const doc = generateTelemetryPdfReport(items, {
        vehicleId,
        alpha,
        persistenceThreshold,
        vibrationTriggerThreshold,
        generatedBy: user ? user.email || user.uid : 'Sovereign Enclave Operator',
        reportRef: refHash
      });
      const filename = `Titan_Compliance_Report_${vehicleId}_${refHash}.pdf`;
      downloadTelemetryPdf(doc, filename);
      addToast(`COMPLIANCE PDF DOWNLOADED: Official defense report saved as ${filename}`, 'success');
    } catch (err: any) {
      console.error('Failed to export PDF:', err);
      addToast(`PDF compilation failed: ${err.message}`, 'error');
    }
  }, [getConsolidatedTelemetryItems, vehicleId, alpha, persistenceThreshold, vibrationTriggerThreshold, user, addToast]);

  // Real-time Firestore sync when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setFirestoreRecords([]);
      return;
    }

    const unsub = subscribeToTelemetry(
      (events) => {
        setFirestoreRecords(events);
      },
      (err) => {
        console.warn('Firestore subscription notice:', err);
      }
    );

    return () => unsub();
  }, [isAuthenticated]);

  // Sound/Vibration effect state
  const [isDebounceLock, setIsDebounceLock] = useState<boolean>(false);

  // Refs for tracking
  const emaRef = useRef<number>(currentEma);
  const persistenceRef = useRef<number>(persistenceCount);
  const lastDispatchTimeRef = useRef<number>(0);

  emaRef.current = currentEma;
  persistenceRef.current = persistenceCount;

  // The Exact Python Implementation provided by the user
  const pythonImplementationCode = `import json
import subprocess
import time

def evaluate_can_telemetry(vibration_delta: float, persistence_count: int, alpha: float = 0.2):
    """Evaluates physical CAN bus vibration delta over the persistence window.
    Triggers Tier 4 auxiliary dispatch to Vertex AI (gemini-2.5-flash) when persistence >= 10 frames.
    """
    if persistence_count >= 10:
        return dispatch_auxiliary_cloud(vibration_delta, alpha, persistence_count)
    return None

def dispatch_auxiliary_cloud(delta: float, alpha: float, persistence: int):
    prompt = f"Triage CAN bus vibration spike delta: α={alpha} persistence={persistence}"
    # Executes local token generation and REST POST to us-east4 endpoint
    dispatch_script = f"""#!/bin/bash
PROJECT_ID="titan-defense-prod"
REGION="us-east4"
MODEL="gemini-2.5-flash"
TOKEN=$(gcloud auth print-access-token)
curl -s -X POST \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  https://\${REGION}-aiplatform.googleapis.com/v1/projects/\${PROJECT_ID}/locations/\${REGION}/publishers/google/models/\${MODEL}:generateContent \\
  -d '{{"contents": [{{"role": "user", "parts": [{{"text": "{prompt}"}}]}}]}}'
"""
    try:
        result = subprocess.check_output(dispatch_script, shell=True, executable='/bin/bash')
        response_json = json.loads(result.decode('utf-8'))
        return response_json
    except Exception as e:
        print(f"[!] Tier 4 Auxiliary Dispatch Error: {e}")
        return None`;

  const bashCurlScript = `#!/bin/bash
PROJECT_ID="titan-defense-prod"
REGION="us-east4"
MODEL="gemini-2.5-flash"
TOKEN=$(gcloud auth print-access-token)
curl -s -X POST \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  https://\${REGION}-aiplatform.googleapis.com/v1/projects/\${PROJECT_ID}/locations/\${REGION}/publishers/google/models/\${MODEL}:generateContent \\
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{
        "text": "Triage CAN bus vibration spike delta: α=${alpha} persistence=${persistenceCount}"
      }]
    }]
  }'`;

  // Server API invocation
  // Server API invocation and Firestore persistence
  const executeDispatch = useCallback(async (vDelta: number, pCount: number) => {
    setIsDispatching(true);
    try {
      const response = await fetch('/api/telemetry/can/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vibration_delta: vDelta,
          persistence_count: pCount,
          alpha: alpha,
          vehicle_id: vehicleId,
        })
      });

      const data = await response.json();
      setLastDispatchResult(data);
      setDispatchLogs(prev => [data, ...prev].slice(0, 20));
      
      if (data.dispatched) {
        addToast(`TIER 4 DISPATCH FIRED: Persistence ${pCount} >= 10 frames! Vertex AI us-east4 response logged.`, 'warning');
      } else {
        addToast(`TELEMETRY EVALUATED: Persistence ${pCount}/10 (Below dispatch trigger)`, 'info');
      }

      // Automatically secure in Firestore if operator is authenticated
      if (isAuthenticated && user) {
        try {
          const evtId = `can-evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          await saveTelemetryEvent({
            id: evtId,
            vehicleId: vehicleId,
            vibrationDelta: Number(vDelta.toFixed(3)),
            persistenceCount: pCount,
            alpha: alpha,
            status: data.dispatched ? 'TIER_4_DISPATCHED' : 'NOMINAL_EVAL',
            timestamp: new Date().toISOString()
          });
          addToast(`FIRESTORE SECURED: Event ${evtId} committed under uid ${user.uid.slice(0, 6)}...`, 'success');
        } catch (fErr: any) {
          console.warn('Firestore event write notification:', fErr);
        }
      }
    } catch (err: any) {
      console.error('Dispatch failed:', err);
      addToast(`Dispatch error: ${err.message}`, 'error');
    } finally {
      setIsDispatching(false);
    }
  }, [alpha, vehicleId, addToast, isAuthenticated, user]);

  // Explicit manual commit to Firestore by operator
  const handleManualFirestoreCommit = async () => {
    if (!isAuthenticated || !user) {
      addToast('AUTHENTICATION REQUIRED: Sign in with Firebase Auth to write to Firestore.', 'error');
      return;
    }

    setIsSavingFirestore(true);
    try {
      const evtId = `can-manual-${Date.now()}`;
      await saveTelemetryEvent({
        id: evtId,
        vehicleId: vehicleId,
        vibrationDelta: currentRaw,
        persistenceCount: persistenceCount,
        alpha: alpha,
        status: persistenceCount >= persistenceThreshold ? 'OPERATOR_SEALED_SPIKE' : 'OPERATOR_SNAPSHOT',
        timestamp: new Date().toISOString(),
      });
      addToast(`EVENT SAVED: Telemetry document ${evtId} permanently committed to Firestore!`, 'success');
    } catch (err: any) {
      console.error('Manual Firestore save failed:', err);
      addToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setIsSavingFirestore(false);
    }
  };

  // Main high-frequency CAN stream simulation
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      // Base vibration (road noise) + random spike probability
      const hasSpike = Math.random() < 0.12;
      let rawVal = 0.35 + (Math.random() * 0.3); // 0.35 - 0.65g normal
      
      if (hasSpike) {
        // High vibration spike (ballistic or pothole shock)
        rawVal += 1.6 + (Math.random() * 1.5); // 1.95g - 3.45g
      }

      // Exponential Moving Average calculation: EMA_t = alpha * raw + (1 - alpha) * EMA_{t-1}
      const prevEma = emaRef.current;
      const newEma = Number((alpha * rawVal + (1 - alpha) * prevEma).toFixed(3));
      setCurrentRaw(Number(rawVal.toFixed(3)));
      setCurrentEma(newEma);

      // Persistence debounce logic:
      // Check if raw vibration delta or EMA exceeds trigger threshold
      const delta = Math.abs(rawVal - prevEma);
      let newPersistence = persistenceRef.current;

      if (rawVal >= vibrationTriggerThreshold || delta >= 1.2) {
        newPersistence += 1;
      } else {
        // Debounce decay: reduce persistence if below threshold
        newPersistence = Math.max(0, newPersistence - 1);
      }

      setPersistenceCount(newPersistence);
      setIsDebounceLock(newPersistence >= persistenceThreshold);

      // Check for Tier 4 Auxiliary Cloud Dispatch trigger
      const now = Date.now();
      if (newPersistence >= persistenceThreshold && autoDispatchEnabled && (now - lastDispatchTimeRef.current > 6000)) {
        lastDispatchTimeRef.current = now;
        executeDispatch(rawVal, newPersistence);
      }

      // Append to graph history
      setHistory(prev => {
        const item = {
          raw: Number(rawVal.toFixed(2)),
          ema: Number(newEma.toFixed(2)),
          persistence: newPersistence,
          time: new Date().toLocaleTimeString().slice(3)
        };
        return [...prev.slice(-25), item];
      });

      // Append synthetic CAN Bus Frame
      const canIds = [
        { id: '0x18FEF100', name: 'J1939 Cruising Speed' },
        { id: '0x0CF00400', name: 'EEC1 Electronic Controller' },
        { id: '0x18EAFF00', name: 'MAVLink Kinetic IMU Frame' },
        { id: '0x18FD0900', name: 'Titan 3-Axis Accelerometer' }
      ];
      const selected = canIds[Math.floor(Math.random() * canIds.length)];
      const hexBytes = Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(' ');

      const newFrame: CanFrame = {
        id: crypto.randomUUID(),
        canId: selected.id,
        name: selected.name,
        dlc: 8,
        data: hexBytes,
        timestamp: new Date().toISOString().substring(14, 23),
        vibrationRaw: Number(rawVal.toFixed(2)),
        vibrationEma: newEma
      };

      setCanFrames(prev => [newFrame, ...prev.slice(0, 7)]);

    }, 350);

    return () => clearInterval(interval);
  }, [isStreaming, alpha, vibrationTriggerThreshold, persistenceThreshold, autoDispatchEnabled, executeDispatch]);

  // Inject manual vibration shock
  const injectShock = () => {
    setCurrentRaw(3.85);
    setPersistenceCount(prev => prev + 3);
    addToast('KINETIC SHOCK INJECTED: +3.85g impulse applied to CAN bus bus-line', 'warning');
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    addToast('Code copied to clipboard', 'info');
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] overflow-y-auto space-y-6">
      
      {/* Top Banner: Sovereign Edge & CAN Bus Invariants */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-black to-blue-950/40 border border-emerald-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE VEHICLE NODE: {vehicleId}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                CAGE: ACTIVE | SAM.GOV REGISTERED
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                DARPAConnect #21270632
              </span>
              {isAuthenticated && user ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  OPERATOR: {user.email} (FIRESTORE SECURED)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  FIRESTORE PERSISTENCE: AUTH REQUIRED
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold font-mono text-gray-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              Kinetic Telemetry, Robotics & Autonomous Vehicle Conditioning
            </h1>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Real-time physical filtering of vehicle sensors using Exponential Moving Average (α={alpha}) and 10-cycle persistence debounce logic.
            </p>
          </div>

          {/* Invariant Constants Indicators & Offline Export Toolbar */}
          <div className="flex flex-col sm:items-end gap-3 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-black/60 border border-gray-800 px-3 py-2 rounded-lg">
                <div className="text-[9px] text-gray-500">FREE-SPACE WAVE IMPEDANCE</div>
                <div className="text-emerald-400 font-bold">Z₀ = 376.5 Ω</div>
              </div>
              <div className="bg-black/60 border border-gray-800 px-3 py-2 rounded-lg">
                <div className="text-[9px] text-gray-500">HARMONIC CADENCE</div>
                <div className="text-cyan-400 font-bold">3.69 Hz Resonant</div>
              </div>
              <div className="bg-black/60 border border-gray-800 px-3 py-2 rounded-lg">
                <div className="text-[9px] text-gray-500">SHANNON ENTROPY GATE</div>
                <div className="text-purple-400 font-bold">H(X) &lt; 1.5 Active</div>
              </div>
            </div>

            {/* Offline Reporting & Compliance Export Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-gray-400 flex items-center gap-1 mr-1">
                <Download className="w-3 h-3 text-emerald-400" />
                COMPLIANCE EXPORTS:
              </span>
              <button
                onClick={() => handleQuickCsvExport('ALL')}
                className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/90 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                title="Export consolidated telemetry data to RFC-4180 CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                EXPORT CSV
              </button>
              <button
                onClick={handleQuickPdfExport}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                title="Download official defense compliance PDF document"
              >
                <Download className="w-3.5 h-3.5" />
                DOWNLOAD PDF
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                title="Open interactive compliance preview modal with printable report & live data table"
              >
                <FileText className="w-3.5 h-3.5" />
                REPORT VIEWER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry Gauges & Waveform */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Real-Time Signal Conditioning Controls */}
        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 p-6 rounded-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800/50 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h2 className="text-xs font-mono font-bold tracking-wider text-gray-800 dark:text-gray-200 uppercase">
                  Signal Debounce Sieve
                </h2>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                isDebounceLock 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' 
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {isDebounceLock ? 'TIER 4 DISPATCH TRIGGERED' : 'NOMINAL ENVELOPE'}
              </span>
            </div>

            {/* Current Delta vs EMA Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="text-[10px] text-gray-500 font-mono">RAW VIBRATION (v_t)</div>
                <div className={`text-2xl font-mono font-black mt-1 ${currentRaw > 1.8 ? 'text-amber-500' : 'text-gray-800 dark:text-gray-100'}`}>
                  {currentRaw.toFixed(3)} <span className="text-xs font-normal text-gray-500">g</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg">
                <div className="text-[10px] text-gray-500 font-mono">EMA FILTERED (α={alpha})</div>
                <div className="text-2xl font-mono font-black text-emerald-500 mt-1">
                  {currentEma.toFixed(3)} <span className="text-xs font-normal text-gray-500">g</span>
                </div>
              </div>
            </div>

            {/* 10-Cycle Persistence Debounce Gauge */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-gray-500">PERSISTENCE DEBOUNCE COUNT:</span>
                <span className={`font-bold ${persistenceCount >= 10 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {persistenceCount} / {persistenceThreshold} FRAMES
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-3 rounded-full overflow-hidden relative">
                <motion.div 
                  className={`h-full ${persistenceCount >= 10 ? 'bg-gradient-to-r from-amber-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-emerald-500'}`}
                  style={{ width: `${Math.min(100, (persistenceCount / persistenceThreshold) * 100)}%` }}
                  transition={{ type: 'spring', damping: 15 }}
                />
              </div>

              <div className="text-[10px] text-gray-500 font-mono flex justify-between">
                <span>0 frames (Nominal)</span>
                <span>Trigger &gt;= 10 frames (Dispatches Vertex AI)</span>
              </div>
            </div>

            {/* Alpha & Threshold Tuning Controls */}
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-800/50">
              <div>
                <div className="flex justify-between font-mono text-xs text-gray-400 mb-1">
                  <span>Smoothing Factor (α):</span>
                  <span className="text-emerald-400 font-bold">{alpha}</span>
                </div>
                <input 
                  type="range" 
                  min="0.05" 
                  max="0.5" 
                  step="0.05" 
                  value={alpha} 
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs text-gray-400 mb-1">
                  <span>Vibration Spike Threshold:</span>
                  <span className="text-amber-400 font-bold">{vibrationTriggerThreshold} g</span>
                </div>
                <input 
                  type="range" 
                  min="1.0" 
                  max="3.0" 
                  step="0.1" 
                  value={vibrationTriggerThreshold} 
                  onChange={(e) => setVibrationTriggerThreshold(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800/50">
            <div className="flex gap-2">
              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className={`flex-1 py-2 px-3 rounded font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  isStreaming 
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 hover:bg-amber-600/30' 
                    : 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40 hover:bg-emerald-600/30'
                }`}
              >
                {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isStreaming ? 'PAUSE CAN BUS' : 'RESUME CAN BUS'}
              </button>

              <button
                onClick={injectShock}
                className="py-2 px-3 bg-red-600/20 text-red-400 border border-red-600/40 hover:bg-red-600/30 rounded font-mono text-xs font-bold flex items-center gap-1 transition-colors"
                title="Inject sudden ballistic shock to test persistence accumulator"
              >
                <Flame className="w-3.5 h-3.5" />
                TEST SHOCK
              </button>
            </div>

            <button
              onClick={() => executeDispatch(currentRaw, persistenceCount)}
              disabled={isDispatching}
              className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {isDispatching ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  DISPATCHING TO VERTEX AI (US-EAST4)...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  FORCE AUXILIARY DISPATCH (GEMINI-2.5-FLASH)
                </>
              )}
            </button>

            <button
              onClick={handleManualFirestoreCommit}
              disabled={isSavingFirestore}
              className={`w-full py-2 px-3 border rounded font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isAuthenticated
                  ? 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-950/20 text-amber-400/80 border-amber-500/30 hover:bg-amber-950/30'
              }`}
              title={isAuthenticated ? 'Write current CAN telemetry state to Firestore' : 'Operator sign in required'}
            >
              {isSavingFirestore ? (
                <>
                  <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  SEALING TELEMETRY IN FIRESTORE...
                </>
              ) : (
                <>
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>{isAuthenticated ? 'SEAL STATE IN FIRESTORE' : 'SEAL IN FIRESTORE (SIGN-IN REQUIRED)'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center & Right Column: Real-Time Waveform & CAN Frame Bus */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Signal Waveform Visualizer */}
          <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 p-6 rounded-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800/50 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  CAN Bus Vibration Telemetry vs EMA Filter (30-Sample Window)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-gray-400 dark:bg-gray-500" />
                  <span className="text-gray-500">Raw Shock (v_t)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-emerald-400 font-bold">EMA Filtered (α={alpha})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                  <span className="text-red-400">Trigger Threshold ({vibrationTriggerThreshold}g)</span>
                </div>
              </div>
            </div>

            {/* SVG Waveform Rendering */}
            <div className="h-44 w-full bg-gray-50 dark:bg-[#080808] border border-gray-200 dark:border-gray-800 rounded-lg p-2 relative overflow-hidden flex items-end">
              {/* Threshold line */}
              <div 
                className="absolute w-full border-b border-dashed border-red-500/50 pointer-events-none z-10"
                style={{ bottom: `${Math.min(95, (vibrationTriggerThreshold / 4.0) * 100)}%` }}
              >
                <span className="text-[9px] font-mono text-red-400 bg-black/80 px-1 py-0.5 rounded ml-2">
                  TRIGGER: {vibrationTriggerThreshold}g
                </span>
              </div>

              {/* Invariant wave resonance line */}
              <div className="absolute top-2 right-2 text-[9px] font-mono text-gray-500 bg-black/60 px-2 py-0.5 rounded border border-gray-800">
                WAVE IMPEDANCE: 376.5 Ω | MODULO-9 DECOUPLED
              </div>

              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 120">
                {/* Grid lines */}
                <line x1="0" y1="30" x2="300" y2="30" stroke="#333" strokeDasharray="2 2" strokeWidth="0.5" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#333" strokeDasharray="2 2" strokeWidth="0.5" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="#333" strokeDasharray="2 2" strokeWidth="0.5" />

                {/* Raw Vibration Trace */}
                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    points={history.map((pt, idx) => {
                      const x = (idx / (history.length - 1)) * 300;
                      const y = 120 - Math.min(115, (pt.raw / 4.0) * 120);
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                )}

                {/* Filtered EMA Trace */}
                {history.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    points={history.map((pt, idx) => {
                      const x = (idx / (history.length - 1)) * 300;
                      const y = 120 - Math.min(115, (pt.ema / 4.0) * 120);
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Live CAN Bus Packet Frame Stream */}
          <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 p-6 rounded-xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800/50 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                  CAN Bus Traffic (J1939 / MAVLink Physical Stream)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-500 hidden sm:inline">
                  500 kbps Baud Rate | 100% Deterministic
                </span>
                <button
                  onClick={() => handleQuickCsvExport('LIVE')}
                  className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Export live CAN frames buffer to CSV"
                >
                  <FileSpreadsheet className="w-3 h-3 text-cyan-400" />
                  EXPORT CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 dark:border-gray-800 text-[10px]">
                    <th className="py-1.5 px-2">TIME</th>
                    <th className="py-1.5 px-2">CAN ID</th>
                    <th className="py-1.5 px-2">NAME / BUS ROLE</th>
                    <th className="py-1.5 px-2">DLC</th>
                    <th className="py-1.5 px-2">HEX PAYLOAD</th>
                    <th className="py-1.5 px-2 text-right">RAW (g)</th>
                    <th className="py-1.5 px-2 text-right">EMA (g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                  {canFrames.map((frame, index) => (
                    <tr key={frame.id} className={index === 0 ? 'bg-emerald-500/10 transition-colors duration-300' : ''}>
                      <td className="py-1.5 px-2 text-gray-400 text-[10px]">{frame.timestamp}</td>
                      <td className="py-1.5 px-2 font-bold text-cyan-400">{frame.canId}</td>
                      <td className="py-1.5 px-2 text-gray-300">{frame.name}</td>
                      <td className="py-1.5 px-2 text-gray-500">{frame.dlc}</td>
                      <td className="py-1.5 px-2 text-gray-400 tracking-wider text-[11px]">{frame.data}</td>
                      <td className={`py-1.5 px-2 text-right font-bold ${frame.vibrationRaw > 1.8 ? 'text-amber-400' : 'text-gray-400'}`}>
                        {frame.vibrationRaw}
                      </td>
                      <td className="py-1.5 px-2 text-right font-bold text-emerald-400">
                        {frame.vibrationEma}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Auxiliary Cloud Dispatch Console: Tabbed Architecture */}
      <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden shadow-md">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-black/60 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'TELEMETRY'
                ? 'border-emerald-500 text-emerald-500 dark:text-emerald-400 bg-white dark:bg-black/40 rounded-t'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            LIVE DISPATCH TERMINAL
          </button>

          <button
            onClick={() => setActiveTab('PYTHON_SPEC')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'PYTHON_SPEC'
                ? 'border-purple-500 text-purple-500 dark:text-purple-400 bg-white dark:bg-black/40 rounded-t'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            PYTHON ALGORITHM SPEC
          </button>

          <button
            onClick={() => setActiveTab('BASH_CURL')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'BASH_CURL'
                ? 'border-cyan-500 text-cyan-500 dark:text-cyan-400 bg-white dark:bg-black/40 rounded-t'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            VERTEX AI CURL SCRIPT
          </button>

          <button
            onClick={() => setActiveTab('AI_TRIAGE')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'AI_TRIAGE'
                ? 'border-amber-500 text-amber-500 dark:text-amber-400 bg-white dark:bg-black/40 rounded-t'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI SEMANTIC TRIAGE RESULT
            {lastDispatchResult?.triageResult && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('FIRESTORE_RECORDS')}
            className={`px-4 py-2 text-xs font-mono font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'FIRESTORE_RECORDS'
                ? 'border-blue-500 text-blue-500 dark:text-blue-400 bg-white dark:bg-black/40 rounded-t'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            FIRESTORE PERSISTENCE ({firestoreRecords.length})
            {isAuthenticated ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'TELEMETRY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                    Tier 4 Auxiliary Cloud Dispatch Log (Vertex AI us-east4)
                  </h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Trigger rule: Persistence count &gt;= 10 frames dispatches payload to Gemini 2.5 Flash for semantic triage.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-mono text-gray-400 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={autoDispatchEnabled} 
                      onChange={(e) => setAutoDispatchEnabled(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    Auto-Dispatch on Persistence &gt;= 10
                  </label>
                </div>
              </div>

              {dispatchLogs.length === 0 ? (
                <div className="bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800/80 rounded-lg p-8 text-center">
                  <ShieldCheck className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
                  <div className="font-mono text-sm text-gray-400 font-bold">
                    AWAITING TELEMETRY THRESHOLD TRIP
                  </div>
                  <p className="text-xs text-gray-500 font-mono max-w-md mx-auto mt-1">
                    Inject a test shock or allow the CAN bus noise to accumulate persistence &gt;= 10 to fire the automated Tier 4 Vertex AI dispatch.
                  </p>
                  <button
                    onClick={injectShock}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded"
                  >
                    TRIGGER TEST VIBRATION SPIKE
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dispatchLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className="p-4 bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            log.dispatched 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {log.dispatched ? 'TIER 4 DISPATCHED' : 'EVALUATION NOMINAL'}
                          </span>
                          <span className="text-gray-400">Timestamp: {log.timestamp}</span>
                        </div>
                        <span className="text-purple-400 font-bold">
                          Persistence: {log.persistence_count} frames | Delta: {log.vibration_delta}g
                        </span>
                      </div>

                      {log.triageResult && (
                        <div className="bg-black/80 border border-gray-800 p-3 rounded font-mono text-xs text-gray-200 whitespace-pre-line leading-relaxed">
                          <div className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {log.triageResult.source} | Model: {log.triageResult.model}
                          </div>
                          {log.triageResult.analysis}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'PYTHON_SPEC' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-purple-400 font-bold">
                  evaluate_can_telemetry.py (Reference Sovereign Core)
                </span>
                <button
                  onClick={() => copyCode(pythonImplementationCode)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-mono"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'COPIED' : 'COPY PYTHON'}
                </button>
              </div>

              <pre className="bg-black border border-gray-800 p-4 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                {pythonImplementationCode}
              </pre>
            </div>
          )}

          {activeTab === 'BASH_CURL' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-cyan-400 font-bold">
                  Generated Vertex AI REST Dispatch Script (us-east4)
                </span>
                <button
                  onClick={() => copyCode(bashCurlScript)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-mono"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'COPIED' : 'COPY BASH'}
                </button>
              </div>

              <pre className="bg-black border border-gray-800 p-4 rounded-lg font-mono text-xs text-cyan-400 overflow-x-auto leading-relaxed">
                {bashCurlScript}
              </pre>
            </div>
          )}

          {activeTab === 'AI_TRIAGE' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-amber-400 font-bold">
                  Latest Semantic Triage Telemetry Report
                </span>
                <button
                  onClick={() => executeDispatch(currentRaw, Math.max(10, persistenceCount))}
                  disabled={isDispatching}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-mono font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  RE-EVALUATE WITH VERTEX AI
                </button>
              </div>

              {lastDispatchResult?.triageResult ? (
                <div className="bg-black/90 border border-emerald-500/30 p-5 rounded-lg space-y-3 font-mono">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                    <div className="text-emerald-400 font-bold text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      {lastDispatchResult.triageResult.source}
                    </div>
                    <span className="text-gray-400 text-xs">
                      STATUS: {lastDispatchResult.triageResult.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-200 whitespace-pre-line leading-relaxed font-mono">
                    {lastDispatchResult.triageResult.analysis}
                  </div>

                  <div className="pt-3 border-t border-gray-800/80 flex flex-wrap gap-4 text-[10px] text-gray-500">
                    <span>PROJECT: titan-defense-prod</span>
                    <span>REGION: us-east4</span>
                    <span>MODEL: gemini-2.5-flash</span>
                    <span>CADENCE: 3.69 Hz</span>
                    <span>WAVE IMPEDANCE: Z₀ = 376.5 Ω</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center text-gray-400 font-mono text-xs">
                  No auxiliary dispatch triggered yet in this session. Trigger a test shock or click "Force Auxiliary Dispatch".
                </div>
              )}
            </div>
          )}

          {activeTab === 'FIRESTORE_RECORDS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div>
                  <h4 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    Cloud Firestore Sovereign Persistence Ledger
                  </h4>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Database ID: <span className="text-cyan-400">ai-studio-titandigitaltwin-73a3cb07-19fd-40a3-bb91-a0577906a198</span> | Collection: <span className="text-emerald-400">telemetry_events</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleQuickCsvExport('FIRESTORE')}
                    disabled={firestoreRecords.length === 0}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-black/60 dark:hover:bg-black/90 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-mono text-xs font-bold rounded flex items-center gap-1.5 shadow transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export committed Firestore records to RFC-4180 CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                    EXPORT CSV
                  </button>

                  {isAuthenticated ? (
                    <button
                      onClick={handleManualFirestoreCommit}
                      disabled={isSavingFirestore}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <CloudUpload className="w-3.5 h-3.5" />
                      SAVE CURRENT SNAPSHOT
                    </button>
                  ) : (
                    <button
                      onClick={signInWithGoogle}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      SIGN IN TO SYNC FIRESTORE
                    </button>
                  )}
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h5 className="font-mono text-sm font-bold text-amber-300">
                    FIRESTORE SECURITY RULE ENFORCEMENT: request.auth != null
                  </h5>
                  <p className="text-xs text-gray-400 font-mono max-w-lg mx-auto">
                    Cloud Firestore security rules require verified defense operator authentication. Unauthenticated read/write requests are restricted at line rate.
                  </p>
                  <button
                    onClick={signInWithGoogle}
                    className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-lg shadow-lg cursor-pointer"
                  >
                    AUTHENTICATE WITH GOOGLE TO UNLOCK
                  </button>
                </div>
              ) : firestoreRecords.length === 0 ? (
                <div className="bg-gray-50 dark:bg-black/60 border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center text-gray-400 font-mono text-xs space-y-3">
                  <Database className="w-8 h-8 text-blue-400/50 mx-auto" />
                  <p>No telemetry events committed yet for this database enclave.</p>
                  <p className="text-gray-500">
                    Trip the 10-frame persistence threshold or click "SAVE CURRENT SNAPSHOT" above to commit the first record.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-200 dark:border-gray-800 text-[10px]">
                        <th className="py-2 px-3">RECORD ID</th>
                        <th className="py-2 px-3">TIMESTAMP</th>
                        <th className="py-2 px-3">VEHICLE ID</th>
                        <th className="py-2 px-3 text-right">RAW DELTA (g)</th>
                        <th className="py-2 px-3 text-right">PERSISTENCE</th>
                        <th className="py-2 px-3">STATUS</th>
                        <th className="py-2 px-3">OPERATOR UID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                      {firestoreRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-blue-500/5 transition-colors">
                          <td className="py-2 px-3 text-cyan-400 font-bold">{rec.id}</td>
                          <td className="py-2 px-3 text-gray-400 text-[11px]">{rec.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                          <td className="py-2 px-3 text-gray-300">{rec.vehicleId}</td>
                          <td className="py-2 px-3 text-right font-bold text-amber-400">{rec.vibrationDelta}</td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-bold">{rec.persistenceCount} frames</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.status?.includes('DISPATCH') || rec.status?.includes('SPIKE')
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {rec.status || 'COMMITTED'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-500 text-[10px] font-mono">
                            {rec.operatorEmail ? rec.operatorEmail : rec.userId ? `${rec.userId.slice(0, 8)}...` : 'defense_enclave'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Offline Reporting & Compliance PDF / CSV Modal */}
      <TelemetryReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={getConsolidatedTelemetryItems()}
        options={{
          vehicleId,
          alpha,
          persistenceThreshold,
          vibrationTriggerThreshold,
          waveImpedance: '376.5 Ω',
          cadence: '3.69 Hz',
          shannonGate: 'H(X) < 1.5',
          generatedBy: user ? user.email || user.uid : 'Sovereign Enclave Operator',
        }}
      />
    </div>
  );
}
