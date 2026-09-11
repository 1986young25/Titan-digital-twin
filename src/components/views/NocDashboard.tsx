import { useState, useEffect, useRef } from 'react';
import { INITIAL_DAEMONS, INITIAL_NODES } from '../../data/mockTitanData';
import { Network, Terminal, Cpu, Activity, Database, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { useEntityContext } from '../../context/EntityContext';
import { useNotification } from '../../context/NotificationContext';

export function NocDashboard() {
  const { activeEntity } = useEntityContext();
  const { addToast } = useNotification();
  const [engineState, setEngineState] = useState<'IDLE' | 'CONTINUOUS SEALING' | 'DIAGNOSTIC BENCHMARK' | 'SHUTDOWN'>('CONTINUOUS SEALING');
  const [logs, setLogs] = useState<{ id: string, time: string, msg: string }[]>([]);
  const prevEngineState = useRef(engineState);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Engine state change notifications
  useEffect(() => {
    if (prevEngineState.current !== engineState) {
      addToast(`AURA ENGINE SHIFT: Operating state changed to ${engineState}`, 'info');
      prevEngineState.current = engineState;
    }
  }, [engineState, addToast]);

  // High-latency anomaly simulator
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.05) { // 5% chance every 4 seconds
        addToast(`NETWORK ANOMALY: Node-01 experiencing high latency (> 145ms RTT)`, 'warning');
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [addToast]);

  // Simulated high-frequency logs
  useEffect(() => {
    if (engineState !== 'CONTINUOUS SEALING' && engineState !== 'DIAGNOSTIC BENCHMARK') return;
    
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = {
          id: crypto.randomUUID(),
          time: new Date().toISOString().substring(11, 23),
          msg: `[WAL] Ed25519 Seal Verified | Node-07 | ${(Math.random() * 5).toFixed(2)}ms | ${Math.floor(Math.random() * 1024 + 256)}B`
        };
        return [newLog, ...prev].slice(0, 50);
      });
    }, 300);
    return () => clearInterval(interval);
  }, [engineState]);

  // Topology Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check if we are in light mode for canvas background
    const isLightMode = document.documentElement.classList.contains('dark') === false;

    let animId: number;
    let t = 0;
    
    const render = () => {
      ctx.fillStyle = isLightMode ? '#ffffff' : '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      t += 0.05;

      const nodes = [
        { x: 50, y: 50, color: '#10b981', label: 'NODE-01' },
        { x: 250, y: 150, color: '#10b981', label: 'NODE-07' },
        { x: 50, y: 250, color: '#3b82f6', label: 'REP-1' },
        { x: 250, y: 250, color: '#3b82f6', label: 'REP-2' },
      ];

      // Draw lines
      ctx.strokeStyle = isLightMode ? '#e5e7eb' : '#333';
      ctx.lineWidth = 1;
      nodes.forEach((n1, i) => {
        nodes.slice(i + 1).forEach(n2 => {
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();

          // Active pulse on links
          if (engineState === 'CONTINUOUS SEALING' || engineState === 'DIAGNOSTIC BENCHMARK') {
             const pulsePos = (Math.sin(t + i * 2) + 1) / 2;
             ctx.fillStyle = '#10b981';
             ctx.beginPath();
             ctx.arc(n1.x + (n2.x - n1.x) * pulsePos, n1.y + (n2.y - n1.y) * pulsePos, 2, 0, Math.PI*2);
             ctx.fill();
          }
        });
      });

      // Draw nodes
      nodes.forEach(n => {
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = isLightMode ? '#4b5563' : '#666';
        ctx.font = '10px monospace';
        ctx.fillText(n.label, n.x + 10, n.y + 3);
      });

      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [engineState]); // Adding dependency on theme class is tricky without mutation observer, but let's keep it simple.


  return (
    <div className="p-6 h-[calc(100vh-4rem)] overflow-y-auto space-y-6">
      
      {/* Top Row: Engine & Swarm */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Aura Engine Control Plane */}
        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 p-6 rounded-xl flex flex-col transition-colors duration-200 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-800/50 pb-4 justify-between transition-colors duration-200">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-600 dark:text-purple-500" />
              <h2 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest">AURA ENGINE CONTROL PLANE</h2>
            </div>
            <div className="text-[10px] text-gray-500 font-mono bg-gray-100 dark:bg-[#0a0a0a] px-2 py-1 rounded transition-colors duration-200">
              CONTEXT: <span className="text-purple-600 dark:text-purple-400">{activeEntity.ein}</span>
            </div>
          </div>
          
          <div className="flex gap-4 mb-6">
            {['IDLE', 'CONTINUOUS SEALING', 'DIAGNOSTIC BENCHMARK', 'SHUTDOWN'].map(state => (
              <button 
                key={state}
                onClick={() => setEngineState(state as any)}
                className={`flex-1 py-2 text-[10px] font-mono border rounded transition-colors ${
                  engineState === state 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800/50' 
                    : 'bg-gray-50 dark:bg-black/40 text-gray-600 dark:text-gray-500 border-gray-200 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-900/50 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
              >
                {state}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-[#0a0a0a] p-3 rounded border border-gray-200 dark:border-gray-800/50 transition-colors duration-200">
              <div className="text-[10px] text-gray-500 font-mono mb-1">PASS RATE</div>
              <div className="text-lg text-emerald-600 dark:text-emerald-400 font-mono">
                {engineState === 'SHUTDOWN' ? '0' : engineState === 'IDLE' ? '12' : '4,982,105'} <span className="text-[10px] text-gray-400 dark:text-gray-600">ops/s</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-[#0a0a0a] p-3 rounded border border-gray-200 dark:border-gray-800/50 transition-colors duration-200">
              <div className="text-[10px] text-gray-500 font-mono mb-1">THREAD ALLOC</div>
              <div className="text-lg text-blue-600 dark:text-blue-400 font-mono">
                {engineState === 'SHUTDOWN' ? '0/64' : '64/64'} <span className="text-[10px] text-gray-400 dark:text-gray-600">OpenMP</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-[#0a0a0a] p-3 rounded border border-gray-200 dark:border-gray-800/50 transition-colors duration-200">
              <div className="text-[10px] text-gray-500 font-mono mb-1">SIGNATURES</div>
              <div className="text-lg text-purple-600 dark:text-purple-400 font-mono">
                {engineState === 'SHUTDOWN' ? '0' : '12,450'} <span className="text-[10px] text-gray-400 dark:text-gray-600">Ed25519/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Swarm Mesh Controller */}
        <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 p-6 rounded-xl transition-colors duration-200 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-800/50 pb-4 transition-colors duration-200">
            <Network className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <h2 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest">SWARM MESH CONTROLLER</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {INITIAL_NODES.map(node => (
              <div key={node.id} className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800/50 p-3 rounded flex justify-between items-center transition-colors duration-200">
                <div>
                  <div className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">{node.id}</div>
                  <div className="text-[10px] text-gray-500 font-mono">{node.name}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    node.status === 'ACTIVE_SEALING' ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50' : 
                    'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                  }`}>
                    {node.status}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-600 font-mono mt-1">{node.latency}ms RTT</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Daemons & Topology */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-64">
        
        {/* Topology */}
        <div className="xl:col-span-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 rounded-xl relative overflow-hidden flex flex-col transition-colors duration-200 shadow-sm dark:shadow-none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-[#0a0a0a] shrink-0 transition-colors duration-200">
             <h2 className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400 tracking-widest">NETWORK TOPOLOGY</h2>
          </div>
          <canvas ref={canvasRef} width={300} height={300} className="w-full flex-1 object-cover opacity-80" />
        </div>

        {/* Daemon Fleet */}
        <div className="xl:col-span-2 bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 rounded-xl flex flex-col overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-[#0a0a0a] flex justify-between items-center transition-colors duration-200">
             <h2 className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400 tracking-widest flex items-center gap-2"><Activity className="w-4 h-4"/> LIVE DAEMON SUPERVISOR</h2>
             <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-mono border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-transparent px-2 py-0.5 rounded transition-colors duration-200">9 PROCESSES ALIVE</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 dark:bg-[#050505] sticky top-0 transition-colors duration-200">
                <tr>
                  <th className="p-2 pl-4 text-[10px] font-mono text-gray-600 dark:text-gray-500 font-normal">PID</th>
                  <th className="p-2 text-[10px] font-mono text-gray-600 dark:text-gray-500 font-normal">PROCESS NAME</th>
                  <th className="p-2 text-[10px] font-mono text-gray-600 dark:text-gray-500 font-normal">CPU %</th>
                  <th className="p-2 text-[10px] font-mono text-gray-600 dark:text-gray-500 font-normal">MEM (MB)</th>
                  <th className="p-2 pr-4 text-[10px] font-mono text-gray-600 dark:text-gray-500 font-normal text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/30 transition-colors duration-200">
                {INITIAL_DAEMONS.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors duration-200">
                    <td className="p-2 pl-4 text-xs font-mono text-gray-600 dark:text-gray-400">{d.pid}</td>
                    <td className="p-2 text-xs font-mono text-gray-800 dark:text-gray-200">{d.name}</td>
                    <td className="p-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                           <div className="h-full bg-emerald-500" style={{width: `${Math.min(100, d.cpu * 5)}%`}}></div>
                        </div>
                        {d.cpu}%
                      </div>
                    </td>
                    <td className="p-2 text-xs font-mono text-gray-600 dark:text-gray-400">{d.memory}</td>
                    <td className="p-2 pr-4 text-[10px] font-mono text-emerald-600 dark:text-emerald-500 text-right">● {d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Bottom: Ingress Log */}
      <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 rounded-xl h-48 flex flex-col overflow-hidden transition-colors duration-200 shadow-sm dark:shadow-none">
         <div className="p-3 border-b border-gray-200 dark:border-gray-800/50 bg-gray-50 dark:bg-[#0a0a0a] flex justify-between items-center shrink-0 transition-colors duration-200">
            <h2 className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400 tracking-widest flex items-center gap-2"><Terminal className="w-4 h-4"/> TRAFFIC & QUERY STREAM</h2>
            <div className="flex gap-2">
              <span className="text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 rounded font-mono cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors">ALL</span>
              <span className="text-[10px] bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 rounded font-mono cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors">TELEMETRY</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-2 rounded font-mono cursor-pointer transition-colors">LEDGER SEAL</span>
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#050505] font-mono text-xs space-y-1 transition-colors duration-200">
           {logs.map(log => (
             <div key={log.id} className="text-gray-600 dark:text-gray-400 flex gap-4 hover:bg-gray-100 dark:hover:bg-gray-900/50 px-2 py-0.5 rounded transition-colors">
               <span className="text-gray-500 dark:text-gray-600 shrink-0">[{log.time}]</span>
               <span className="text-emerald-600 dark:text-emerald-400/80">{log.msg}</span>
             </div>
           ))}
           {logs.length === 0 && <div className="text-gray-500 dark:text-gray-600">STREAM PAUSED. AWAITING ENGINE STATE CHANGE...</div>}
         </div>
      </div>

    </div>
  );
}
