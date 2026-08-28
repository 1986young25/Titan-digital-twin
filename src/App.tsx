/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { googleSignIn, initAuth, logout } from './lib/firebase';
import { User } from 'firebase/auth';
import { LogOut, Folder, Map as MapIcon, Activity, Server, ShieldCheck, AlertTriangle, FileDown } from 'lucide-react';
import { useToast } from './lib/useToast';
import { ToastContainer } from './components/ToastContainer';

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [titanData, setTitanData] = useState<any>(null);
  const [mapError, setMapError] = useState(false);

  const { toasts, addToast, updateToast, removeToast, notifySuccess, notifyError, notifyInfo } = useToast();

  // You would typically get this from environment variables. Use the demo key for prototyping.
  let API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (API_KEY === 'MY_MAPS_API_KEY') {
    API_KEY = '';
  }

  useEffect(() => {
    // Handle invalid Google Maps API keys gracefully
    (window as any).gm_authFailure = () => {
      setMapError(true);
    };

    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('InvalidKeyMapError')) {
        setMapError(true);
        return; // Suppress it from console
      }
      originalConsoleError(...args);
    };

    const errorHandler = (e: ErrorEvent) => {
      if (e.message.includes('Script error.') || e.message.includes('InvalidKeyMapError')) {
        setMapError(true);
        e.preventDefault(); // Suppress the global error
      }
    };
    window.addEventListener('error', errorHandler);

    initAuth(
      (user, token) => {
        setNeedsAuth(false);
        setUser(user);
        setToken(token);
        fetchFiles(token);
      },
      () => setNeedsAuth(true)
    );

    // Initialize Titan SSE Connection
    const eventSource = new EventSource('/api/stream/titan');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTitanData(data);
      } catch (e) {
        originalConsoleError("Error parsing Titan stream", e);
      }
    };
    
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', errorHandler);
      eventSource.close();
    };
  }, []);

  const fetchFiles = async (accessToken: string) => {
    setLoadingFiles(true);
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType)', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleExport = async () => {
    if (!token || !user || !titanData) return;
    setIsExporting(true);

    const exportToastId = addToast({
      type: 'export_progress',
      title: 'Exporting Telemetry & Acoustic Logs',
      description: 'Synthesizing real-time node telemetry and acoustic spectrum data...',
      duration: 0,
      steps: [
        { id: 'prep', label: 'Packaging Node Telemetry & Acoustic Logs', status: 'in-progress', detail: 'State Matrix' },
        { id: 'sheets', label: 'Provisioning Google Sheet Document', status: 'pending' },
        { id: 'gmail', label: 'Dispatching Signed Report via Gmail', status: 'pending' },
      ]
    });
    
    try {
      // Step 1: Package telemetry & acoustic events
      await new Promise((resolve) => setTimeout(resolve, 350));

      updateToast(exportToastId, {
        description: 'Uploading formatted matrix to Google Sheets API v4...',
        steps: [
          { id: 'prep', label: 'Packaging Node Telemetry & Acoustic Logs', status: 'completed', detail: 'Vectorized' },
          { id: 'sheets', label: 'Provisioning Google Sheet Document', status: 'in-progress', detail: 'REST v4 Ingress' },
          { id: 'gmail', label: 'Dispatching Signed Report via Gmail', status: 'pending' },
        ]
      });

      // 1. Create a Google Sheet
      const sheetBody = {
        properties: { title: `TITAN_TELEMETRY_EXPORT_${new Date().toISOString()}` },
        sheets: [
          {
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: 'NODE' } },
                      { userEnteredValue: { stringValue: 'HEALTH (%)' } },
                      { userEnteredValue: { stringValue: 'STATUS' } },
                      { userEnteredValue: { stringValue: 'LAT' } },
                      { userEnteredValue: { stringValue: 'LNG' } }
                    ]
                  },
                  ...Object.entries(titanData.nodes).map(([name, node]: [string, any]) => ({
                    values: [
                      { userEnteredValue: { stringValue: name.toUpperCase() } },
                      { userEnteredValue: { numberValue: node.health } },
                      { userEnteredValue: { stringValue: node.status } },
                      { userEnteredValue: { numberValue: node.lat } },
                      { userEnteredValue: { numberValue: node.lng } }
                    ]
                  }))
                ]
              }
            ]
          }
        ]
      };

      const sheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sheetBody)
      });
      const sheetData = await sheetRes.json();
      
      if (!sheetData.spreadsheetUrl) {
        throw new Error(sheetData.error?.message || 'Failed to provision Google Sheet');
      }

      // Step 2 Completed -> Step 3: Gmail
      updateToast(exportToastId, {
        description: `Spreadsheet verified. Dispatching email report to ${user.email}...`,
        steps: [
          { id: 'prep', label: 'Packaging Node Telemetry & Acoustic Logs', status: 'completed', detail: 'Vectorized' },
          { id: 'sheets', label: 'Provisioning Google Sheet Document', status: 'completed', detail: 'Ready' },
          { id: 'gmail', label: 'Dispatching Signed Report via Gmail', status: 'in-progress', detail: 'Sending MIME' },
        ]
      });

      // 2. Send email via Gmail
      const emailLines = [
        `To: ${user.email}`,
        `Subject: TITAN MASTER SYSTEM - Telemetry Export`,
        `Content-Type: text/plain; charset="UTF-8"`,
        ``,
        `The latest telemetry and acoustic NDT logs have been exported securely.`,
        ``,
        `View the formatted document here:`,
        `${sheetData.spreadsheetUrl}`,
        ``,
        `System Status Summary:`,
        ...Object.entries(titanData.nodes).map(([k, v]: [string, any]) => `[NODE-${k.toUpperCase()}]: ${v.status} (Health: ${v.health.toFixed(1)}%)`),
        ``,
        `Ledger Hash: ${titanData.ledger?.hash || 'N/A'}`
      ];
      
      const rawEmail = btoa(unescape(encodeURIComponent(emailLines.join('\r\n')))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawEmail })
      });

      if (!gmailRes.ok) {
        const gmailErr = await gmailRes.json();
        throw new Error(gmailErr.error?.message || 'Gmail transmission failed');
      }

      // Step 3 Completed -> Final Toast with Action Link
      updateToast(exportToastId, {
        type: 'success',
        title: 'Export & Dispatch Completed',
        description: `Telemetry document secured in Google Sheets and emailed to ${user.email}.`,
        duration: 9000,
        steps: [
          { id: 'prep', label: 'Packaging Node Telemetry & Acoustic Logs', status: 'completed', detail: 'Vectorized' },
          { id: 'sheets', label: 'Provisioning Google Sheet Document', status: 'completed', detail: '100% Synced' },
          { id: 'gmail', label: 'Dispatching Signed Report via Gmail', status: 'completed', detail: 'Delivered' },
        ],
        action: {
          label: 'Open Sheet',
          url: sheetData.spreadsheetUrl,
          primary: true,
          onClick: () => {}
        }
      });
      
      // Refresh files list
      fetchFiles(token);
    } catch (err) {
      console.error('Export failed:', err);
      updateToast(exportToastId, {
        type: 'error',
        title: 'Telemetry Export Pipeline Failed',
        description: err instanceof Error ? err.message : 'Please ensure Google Sheets and Gmail permissions are granted.',
        duration: 8000,
        steps: [
          { id: 'prep', label: 'Packaging Node Telemetry & Acoustic Logs', status: 'completed', detail: 'Vectorized' },
          { id: 'sheets', label: 'Provisioning Google Sheet Document', status: 'failed', detail: 'Aborted' },
          { id: 'gmail', label: 'Dispatching Signed Report via Gmail', status: 'failed', detail: 'Skipped' },
        ]
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        fetchFiles(result.accessToken);
        notifySuccess('Authentication Verified', `Secure session established for ${result.user.email}`);
      }
    } catch (err) {
      console.error('Login failed:', err);
      notifyError('Authentication Failed', 'Please grant the requested Google Workspace permissions.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    notifyInfo('Session Terminated', 'Signed out of Titan Games Security console.');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans flex flex-col">
      <header className="bg-[#121212] border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-wide flex items-center gap-3 text-gray-100">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            TITAN MASTER SYSTEM (Σ-2026)
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-900 border border-gray-800 text-[11px] font-mono text-gray-400">
            <span className="text-emerald-400 font-bold">TITAN GAMES SECURITY LLC</span> • EIN: 42-4264313
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-400">{user.email}</span>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-800 rounded-full transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
        {/* Top Row: Map & Node Status */}
        <div className="flex flex-col lg:flex-row gap-6 h-[500px]">
          {/* Map Panel */}
          <section className="flex-[2] bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 overflow-hidden flex flex-col relative">
            <div className="absolute top-4 left-4 z-10 bg-[#121212]/90 backdrop-blur border border-gray-800 p-3 rounded-lg shadow-xl">
              <h2 className="text-sm font-semibold tracking-wider text-emerald-400 mb-1 flex items-center gap-2">
                <MapIcon className="w-4 h-4" />
                TACTICAL OVERVIEW
              </h2>
              <div className="text-xs text-gray-400 font-mono">
                Lat: 37.4221 • Lng: -122.0841 • R_xw Active
              </div>
            </div>
            
            {API_KEY && !mapError ? (
              <APIProvider apiKey={API_KEY}>
                <Map
                  mapId="DEMO_MAP_ID"
                  style={{ width: '100%', height: '100%' }}
                  defaultCenter={{ lat: 37.4221, lng: -122.0841 }}
                  defaultZoom={16}
                  gestureHandling={'greedy'}
                  disableDefaultUI={true}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                >
                  {titanData?.nodes && Object.entries(titanData.nodes).map(([name, node]: [string, any]) => (
                    <AdvancedMarker key={name} position={{ lat: node.lat, lng: node.lng }}>
                      <Pin 
                        background={node.status === 'WARNING' ? '#ef4444' : '#10b981'}
                        borderColor={node.status === 'WARNING' ? '#991b1b' : '#047857'}
                        glyphColor={node.status === 'WARNING' ? '#fee2e2' : '#d1fae5'}
                      />
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#1a1a1a]">
                <MapIcon className={`w-12 h-12 mb-4 ${mapError ? 'text-red-500' : 'text-gray-700'}`} />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  {mapError ? 'Maps API Authentication Failed' : 'Maps API Disconnected'}
                </h3>
                <p className="text-gray-500 max-w-sm mb-6">
                  {mapError 
                    ? 'The provided Google Maps API key is invalid or unauthorized. Please verify your VITE_GOOGLE_MAPS_API_KEY.' 
                    : 'Add VITE_GOOGLE_MAPS_API_KEY to environment variables to render live spatial data.'}
                </p>
              </div>
            )}
          </section>

          {/* Real-time Telemetry */}
          <section className="flex-1 bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 flex flex-col overflow-hidden">
            <h2 className="text-sm font-bold tracking-widest text-gray-400 mb-4 flex items-center gap-2 uppercase">
              <Activity className="w-4 h-4 text-blue-500" />
              Node Telemetry
            </h2>
            
            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {titanData?.nodes ? (
                Object.entries(titanData.nodes).map(([name, node]: [string, any]) => (
                  <div key={name} className="bg-[#121212] border border-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono font-bold text-gray-200">NODE-{name.toUpperCase()}</span>
                      <span className={`text-xs px-2 py-1 rounded font-mono font-bold ${node.status === 'WARNING' ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800'}`}>
                        {node.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-500">
                      <div>HLTH: <span className={node.health < 95 ? 'text-red-400' : 'text-emerald-400'}>{node.health.toFixed(1)}%</span></div>
                      <div>POS: {node.lat.toFixed(4)}, {node.lng.toFixed(4)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 font-mono animate-pulse">Initializing Labyrinth 3-6-9 Vortex Resonance...</div>
              )}
            </div>

            {/* Cryptographic Ledger */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <h2 className="text-xs font-bold tracking-widest text-gray-500 mb-2 flex items-center gap-2 uppercase">
                <Server className="w-3 h-3" />
                State Serialization
              </h2>
              <div className="bg-[#0a0a0a] p-3 rounded border border-gray-800 font-mono text-xs">
                <div className="text-gray-400 mb-1">SHA-256 HASH</div>
                <div className="text-emerald-500 truncate">{titanData?.ledger?.hash || 'AWAITING_SYNC...'}</div>
                <div className="text-gray-500 mt-2 flex justify-between">
                  <span>OPS/SEC</span>
                  <span>{titanData?.ledger?.opsPerSec ? titanData.ledger.opsPerSec.toLocaleString() : 0}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom Row: Acoustic Emissions & Drive */}
        <div className="flex flex-col lg:flex-row gap-6 h-[400px]">
          {/* Acoustic NDT Panel */}
          <section className="flex-[2] bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 flex flex-col overflow-hidden">
            <h2 className="text-sm font-bold tracking-widest text-gray-400 mb-4 flex items-center gap-2 uppercase">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Acoustic NDT Log
            </h2>
            <div className="flex-1 bg-[#0a0a0a] border border-gray-800 rounded-lg p-4 overflow-y-auto font-mono text-xs space-y-2">
              {titanData?.acousticEvent ? (
                <div className="flex items-start gap-4 text-amber-400 border-b border-gray-800/50 pb-2">
                  <span className="text-gray-500 shrink-0">{titanData.acousticEvent.timestamp.split('T')[1].replace('Z', '')}</span>
                  <div className="flex-1">
                    <span className="font-bold">MICRO-FRACTURE EVENT DETECTED [{titanData.acousticEvent.node}]</span>
                    <div className="grid grid-cols-3 gap-2 mt-1 text-gray-400">
                      <div>LATENCY: {titanData.acousticEvent.latencyUs}µs</div>
                      <div>INTENSITY: {titanData.acousticEvent.intensity}</div>
                      <div>FREQ: {titanData.acousticEvent.frequencyHz}Hz</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 flex items-center h-full justify-center">
                  NO RECENT ACOUSTIC EVENTS. STRUCTURAL INTEGRITY NOMINAL.
                </div>
              )}
            </div>
          </section>

          {/* Drive Integration Panel */}
          <section className="flex-1 bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-widest text-gray-400 flex items-center gap-2 uppercase">
                <Folder className="w-4 h-4 text-blue-500" />
                Encrypted File Store
              </h2>
              
              {!needsAuth && (
                <button
                  onClick={handleExport}
                  disabled={isExporting || !titanData}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300 border border-blue-800 rounded text-xs font-bold tracking-widest uppercase transition-colors disabled:opacity-50"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  {isExporting ? 'EXPORTING...' : 'EXPORT LOGS'}
                </button>
              )}
            </div>
            
            {needsAuth ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-gray-700 rounded-lg bg-[#121212]">
                <p className="text-gray-400 text-sm mb-6">Authentication required for secure file access.</p>
                <button 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="bg-white text-gray-900 font-medium px-4 py-2 rounded shadow-sm hover:bg-gray-100 flex items-center gap-3 transition-colors disabled:opacity-70 text-sm"
                >
                  <span>{isLoggingIn ? 'AUTHENTICATING...' : 'SECURE LOGIN'}</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-auto bg-[#121212] border border-gray-800 rounded-lg">
                {loadingFiles ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm font-mono animate-pulse">DECRYPTING...</div>
                ) : files.length > 0 ? (
                  <ul className="divide-y divide-gray-800">
                    {files.map(file => (
                      <li key={file.id} className="p-3 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors">
                        <span className="text-sm font-medium text-gray-300 truncate mr-4">{file.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono bg-gray-800 px-1.5 py-0.5 rounded uppercase">
                          {file.mimeType.split('.').pop()?.substring(0,4) || 'FILE'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm font-mono">NO SECURE FILES LOCATED.</div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
