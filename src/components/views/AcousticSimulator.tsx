import { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { useEntityContext } from '../../context/EntityContext';

export function AcousticSimulator() {
  const { activeEntity } = useEntityContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frequency, setFrequency] = useState(3.69);
  const [damping, setDamping] = useState(0.98);
  const [amplitude, setAmplitude] = useState(50);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check light mode
    const isLightMode = document.documentElement.classList.contains('dark') === false;

    let animationId: number;
    const width = canvas.width;
    const height = canvas.height;
    
    // Grid settings
    const cols = 50;
    const rows = 50;
    const cellW = width / cols;
    const cellH = height / rows;
    
    // Wave state buffers
    let current = new Float32Array(cols * rows);
    let previous = new Float32Array(cols * rows);

    let time = 0;

    const render = () => {
      // Background
      ctx.fillStyle = isLightMode ? '#ffffff' : '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Inject continuous impulse at center based on frequency
      time += 0.05;
      const centerIdx = Math.floor(rows/2) * cols + Math.floor(cols/2);
      current[centerIdx] = Math.sin(time * frequency) * amplitude;

      // Random structural anomaly impulse (simulating NDT)
      if (Math.random() < 0.02) {
        const rx = Math.floor(Math.random() * cols);
        const ry = Math.floor(Math.random() * rows);
        current[ry * cols + rx] = -amplitude * 1.5; // Negative spike
      }

      // 2D Wave Equation Step
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const idx = y * cols + x;
          current[idx] = (
            previous[(y - 1) * cols + x] +
            previous[(y + 1) * cols + x] +
            previous[y * cols + (x - 1)] +
            previous[y * cols + (x + 1)]
          ) / 2 - current[idx];
          
          current[idx] *= damping;
        }
      }

      // Draw wireframe grid
      ctx.strokeStyle = isLightMode ? '#059669' : '#10b981'; // Emerald
      ctx.lineWidth = 1;

      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
          const idx = y * cols + x;
          const val = current[idx];
          
          // Color based on amplitude (heat)
          const heat = Math.min(255, Math.max(0, 128 + val * 5));
          
          ctx.beginPath();
          ctx.moveTo(x * cellW, y * cellH + val);
          ctx.lineTo((x + 1) * cellW, y * cellH + current[y * cols + x + 1]);
          ctx.lineTo((x + 1) * cellW, (y + 1) * cellH + current[(y + 1) * cols + x + 1]);
          ctx.lineTo(x * cellW, (y + 1) * cellH + current[(y + 1) * cols + x]);
          ctx.closePath();
          
          // Anomaly detection highlight
          if (val < -30) {
            ctx.fillStyle = `rgba(220, 38, 38, ${Math.abs(val)/100})`; // Red for anomaly
            ctx.fill();
            ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)';
          } else {
            ctx.fillStyle = isLightMode ? `rgba(5, 150, 105, ${Math.abs(val)/100})` : `rgba(16, 185, 129, ${Math.abs(val)/100})`;
            ctx.fill();
            ctx.strokeStyle = isLightMode ? `rgba(5, 150, 105, ${0.1 + Math.abs(val)/100})` : `rgba(16, 185, 129, ${0.1 + Math.abs(val)/100})`;
          }
          
          ctx.stroke();
        }
      }

      // Swap buffers
      let temp = previous;
      previous = current;
      current = temp;

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [frequency, damping, amplitude]);

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <h2 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest">ACOUSTIC WAVE PROPAGATION (NDT)</h2>
        </div>
        <div className="text-[10px] text-gray-600 dark:text-gray-500 font-mono bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800/50 px-3 py-1.5 rounded shadow-sm dark:shadow-none">
          OPERATING AS: <span className="text-emerald-600 dark:text-emerald-400">{activeEntity.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Controls */}
        <div className="lg:col-span-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 p-6 rounded-xl space-y-6 shadow-sm dark:shadow-none transition-colors duration-200">
          <div>
            <label className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 font-mono mb-2">
              <span>FREQUENCY (Hz)</span>
              <span className="text-emerald-600 dark:text-emerald-400">{frequency.toFixed(2)}</span>
            </label>
            <input type="range" min="0.1" max="10" step="0.1" value={frequency} onChange={e => setFrequency(Number(e.target.value))} className="w-full accent-emerald-600 dark:accent-emerald-500" />
          </div>
          <div>
            <label className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 font-mono mb-2">
              <span>DAMPING COEFFICIENT</span>
              <span className="text-emerald-600 dark:text-emerald-400">{damping.toFixed(3)}</span>
            </label>
            <input type="range" min="0.8" max="0.999" step="0.001" value={damping} onChange={e => setDamping(Number(e.target.value))} className="w-full accent-emerald-600 dark:accent-emerald-500" />
          </div>
          <div>
            <label className="flex justify-between text-[10px] text-gray-600 dark:text-gray-400 font-mono mb-2">
              <span>IMPULSE AMPLITUDE</span>
              <span className="text-emerald-600 dark:text-emerald-400">{amplitude}</span>
            </label>
            <input type="range" min="10" max="100" step="1" value={amplitude} onChange={e => setAmplitude(Number(e.target.value))} className="w-full accent-emerald-600 dark:accent-emerald-500" />
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-800/50">
            <div className="text-[10px] text-gray-500 font-mono mb-2">DIAGNOSTIC STATUS</div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-3 rounded text-xs font-mono text-red-600 dark:text-red-400 animate-pulse">
              ANOMALIES DETECTED: MICRO-FRACTURE SCATTERING ACTIVE
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden relative shadow-sm dark:shadow-none transition-colors duration-200">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={600} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-gray-800/50 p-2 rounded backdrop-blur-sm pointer-events-none shadow-sm dark:shadow-none">
            <div className="text-[10px] text-emerald-600 dark:text-emerald-500 font-mono">RENDER: CANVAS 2D</div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">EQ: ∂²u/∂t² = c²∇²u</div>
          </div>
        </div>
      </div>
    </div>
  );
}
