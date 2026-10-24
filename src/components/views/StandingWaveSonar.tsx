import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Waves, Mic, RadioReceiver, Download, Camera } from 'lucide-react';
import { useEntityContext } from '../../context/EntityContext';
import { useNotification } from '../../context/NotificationContext';
import { CanvasSnapshotHelper, CanvasSnapshotRef, CaptureResult } from '../common/CanvasSnapshotHelper';
import { ViewerSnapshotModal } from '../common/ViewerSnapshotModal';

// 3D Standing Wave Mesh
const WaveMesh = React.memo(function WaveMesh({ audioDataRef, triggerPulse }: { audioDataRef: React.MutableRefObject<Uint8Array | null>, triggerPulse: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isLightMode = document.documentElement.classList.contains('dark') === false;

  const geometry = useMemo(() => new THREE.PlaneGeometry(20, 20, 64, 64), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: isLightMode ? '#059669' : '#10b981',
    wireframe: true,
    transparent: true,
    opacity: 0.8,
  }), [isLightMode]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();
    const position = meshRef.current.geometry.attributes.position;
    
    let audioAmplitude = 0;
    const currentAudioData = audioDataRef.current;
    if (currentAudioData && currentAudioData.length > 0) {
      // Get an average amplitude from the audio stream
      let sum = 0;
      for (let i = 0; i < currentAudioData.length; i++) {
        sum += currentAudioData[i];
      }
      audioAmplitude = (sum / currentAudioData.length) / 255.0; 
    }

    // Two sources for the "Seven Titan" and "Pixel 9a"
    const source1 = { x: -5, y: -5 };
    const source2 = { x: 5, y: 5 };

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);

      // Distance to sources
      const d1 = Math.sqrt(Math.pow(x - source1.x, 2) + Math.pow(y - source1.y, 2));
      const d2 = Math.sqrt(Math.pow(x - source2.x, 2) + Math.pow(y - source2.y, 2));

      // Standing wave equations from two points
      const wave1 = Math.sin(d1 * 2 - time * 5) / (d1 + 1);
      const wave2 = Math.sin(d2 * 2 - time * 5) / (d2 + 1);
      
      // Pulse effect logic
      const pulseTime = time - triggerPulse;
      let pulseMultiplier = 1;
      if (triggerPulse > 0 && pulseTime > 0 && pulseTime < 3) {
         // Expanding ring effect
         const ringRadius = pulseTime * 15;
         const thickness = 1.5;
         if (Math.abs(d1 - ringRadius) < thickness || Math.abs(d2 - ringRadius) < thickness) {
            pulseMultiplier = 5 * (1 - pulseTime/3); // Fade out over 3 seconds
         }
      }

      // Combine base standing wave, audio reactivity, and pulses
      const z = (wave1 + wave2) * 2 * (1 + audioAmplitude * 5) * pulseMultiplier;
      
      position.setZ(i, z);
    }
    
    position.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} rotation={[-Math.PI / 2, 0, 0]} />
  );
});

export const StandingWaveSonar = React.memo(function StandingWaveSonar() {
  const { activeEntity } = useEntityContext();
  const { addToast } = useNotification();
  const [isMicActive, setIsMicActive] = useState(false);
  const [triggerPulseTime, setTriggerPulseTime] = useState(0);
  
  // Calibration State
  const [calibrationState, setCalibrationState] = useState<'IDLE' | 'CALIBRATING' | 'READY'>('IDLE');
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [calibrationText, setCalibrationText] = useState('');
  const calibrationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Context State
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const reqIdRef = useRef<number>(0);

  // Track pulse history for export
  const [pulseHistory, setPulseHistory] = useState<{timestamp: string, duration: number, activeEntity: string}[]>([]);

  // High-Resolution Snapshot State
  const snapshotRef = useRef<CanvasSnapshotRef | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSnapshot, setModalSnapshot] = useState<CaptureResult | null>(null);

  const handleQuickSnapshot = useCallback(() => {
    if (!snapshotRef.current) {
      addToast('Sonar canvas initializing, please wait.', 'warning');
      return;
    }
    const res = snapshotRef.current.capture({
      scale: 2,
      includeHud: true,
      viewerTitle: 'TITAN 3D STANDING WAVE SONAR',
      entityName: activeEntity.name,
    });
    if (res) {
      const link = document.createElement('a');
      link.href = res.dataUrl;
      link.download = res.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`High-resolution sonar snapshot saved: ${res.filename} (${res.width}x${res.height})`, 'success');
    } else {
      addToast('Failed to capture sonar canvas.', 'error');
    }
  }, [activeEntity.name, addToast]);

  const handleOpenSnapshotModal = useCallback(() => {
    if (!snapshotRef.current) {
      addToast('Sonar canvas initializing, please wait.', 'warning');
      return;
    }
    const res = snapshotRef.current.capture({
      scale: 2,
      includeHud: true,
      viewerTitle: 'TITAN 3D STANDING WAVE SONAR',
      entityName: activeEntity.name,
    });
    if (res) {
      setModalSnapshot(res);
      setIsModalOpen(true);
    } else {
      addToast('Failed to capture sonar canvas.', 'error');
    }
  }, [activeEntity.name, addToast]);

  const handleRecapture = useCallback((scale: number, includeHud: boolean) => {
    if (!snapshotRef.current) return null;
    return snapshotRef.current.capture({
      scale,
      includeHud,
      viewerTitle: 'TITAN 3D STANDING WAVE SONAR',
      entityName: activeEntity.name,
    });
  }, [activeEntity.name]);

  const exportDataMap = useCallback(() => {
    const exportData = {
      entityContext: activeEntity,
      exportTimestamp: new Date().toISOString(),
      sonarConfig: {
        sensors: ['NONOS_SEVEN_TITAN', 'PIXEL_9A'],
        baselineFreqHz: 8000,
        rampFreqHz: 12000,
      },
      pulseEvents: pulseHistory
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `titan-sonar-telemetry-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addToast('Spatial sonar telemetry exported successfully.', 'success');
  }, [activeEntity, pulseHistory, addToast]);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      setIsMicActive(true);
      setCalibrationState('CALIBRATING');
      setCalibrationProgress(0);
      setCalibrationText('INITIALIZING AUDIO CONTEXT...');

      // Hardware check sequence simulation
      const steps = [
        { progress: 15, text: 'MEASURING NOISE FLOOR...' },
        { progress: 35, text: 'VERIFYING TRANSDUCER RESPONSE...' },
        { progress: 65, text: 'ALIGNING SEVEN TITAN PHASE...' },
        { progress: 90, text: 'ALIGNING PIXEL 9A PHASE...' },
        { progress: 100, text: 'ARRAY SYNCED & LOCKED' }
      ];
      
      let currentStep = 0;
      calibrationTimerRef.current = setInterval(() => {
         if (currentStep < steps.length) {
            setCalibrationProgress(steps[currentStep].progress);
            setCalibrationText(steps[currentStep].text);
            currentStep++;
         } else {
            if (calibrationTimerRef.current) clearInterval(calibrationTimerRef.current);
            setCalibrationState('READY');
            addToast('Dual-Mic Array Calibrated: Seven Titan & Pixel 9a Online.', 'success');
         }
      }, 700);

      const updateData = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        }
        reqIdRef.current = requestAnimationFrame(updateData);
      };
      updateData();

    } catch (err) {
      console.error(err);
      addToast('Microphone access denied or unavailable.', 'error');
    }
  }, [addToast]);

  const stopMic = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
      sourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (reqIdRef.current) {
      cancelAnimationFrame(reqIdRef.current);
    }
    if (calibrationTimerRef.current) {
      clearInterval(calibrationTimerRef.current);
    }
    setIsMicActive(false);
    setCalibrationState('IDLE');
    setCalibrationProgress(0);
    addToast('Sensor array deactivated.', 'info');
  }, [addToast]);

  const emitPulse = useCallback(() => {
    if (!audioContextRef.current) {
      addToast('Activate microphones first to sync pulse timing.', 'warning');
      return;
    }
    
    setTriggerPulseTime(audioContextRef.current.currentTime);
    addToast('High-frequency echo pulse emitted from Titan & 9a.', 'success');
    
    // Log pulse to history
    setPulseHistory(prev => [...prev, {
      timestamp: new Date().toISOString(),
      duration: 0.5,
      activeEntity: activeEntity.name
    }]);
    
    // Play a literal pulse sound
    const osc = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(8000, audioContextRef.current.currentTime); // High freq
    osc.frequency.exponentialRampToValueAtTime(12000, audioContextRef.current.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContextRef.current.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    osc.start();
    osc.stop(audioContextRef.current.currentTime + 0.5);
  }, [activeEntity.name, addToast]);

  useEffect(() => {
    return () => {
      stopMic(); // Cleanup on unmount
    };
  }, []);

  const isLightMode = document.documentElement.classList.contains('dark') === false;

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <h2 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest">3D STANDING WAVE SONAR</h2>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={exportDataMap}
            aria-label="Export spatial sonar telemetry as JSON"
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono bg-white dark:bg-[#050505] border border-gray-200 dark:border-gray-800/50 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm dark:shadow-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT MAP</span>
          </button>

          <button
            onClick={handleQuickSnapshot}
            title="Instant High-Resolution PNG Capture (2x HD)"
            aria-label="Quick capture high-resolution snapshot"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800/60 text-gray-700 dark:text-gray-300 rounded hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 dark:hover:border-emerald-800/50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>QUICK SNAPSHOT</span>
          </button>

          <button
            onClick={handleOpenSnapshotModal}
            title="Open High-Resolution Snapshot Studio with 4K / HUD options"
            aria-label="Open high-resolution snapshot studio"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60 rounded font-bold hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>HIGH-RES SNAPSHOT</span>
          </button>

          <div className="text-[10px] text-gray-600 dark:text-gray-500 font-mono bg-white dark:bg-[#050505] border border-gray-200 dark:border-gray-800/50 px-3 py-1.5 rounded shadow-sm dark:shadow-none transition-colors duration-200">
            OPERATING AS: <span className="text-emerald-600 dark:text-emerald-400">{activeEntity.name}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        
        {/* Controls */}
        <div className="lg:col-span-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-800/50 p-6 rounded-xl space-y-6 shadow-sm dark:shadow-none transition-colors duration-200 flex flex-col z-10">
          <div className="border-b border-gray-200 dark:border-gray-800/50 pb-4">
             <h3 className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400 mb-4">SENSOR SYNC</h3>
             
             {!isMicActive ? (
               <button 
                onClick={startMic}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50 rounded font-mono text-xs hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
               >
                 <Mic className="w-4 h-4" />
                 ACTIVATE DUAL ARRAY
               </button>
             ) : (
               <button 
                onClick={stopMic}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800/50 rounded font-mono text-xs hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
               >
                 <Mic className="w-4 h-4" />
                 DEACTIVATE ARRAY
               </button>
             )}
          </div>

          <div className="space-y-4">
             <h3 className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400">ECHO MAPPING</h3>
             <button
               onClick={emitPulse}
               disabled={calibrationState !== 'READY'}
               className={`w-full py-3 rounded font-mono text-xs transition-colors flex items-center justify-center gap-2 ${
                 calibrationState === 'READY' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-800/50 cursor-pointer' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
               }`}
             >
               <RadioReceiver className="w-4 h-4" />
               EMIT HIGH-FREQ PULSE
             </button>
          </div>

          {/* CALIBRATION UTILITY */}
          {calibrationState !== 'IDLE' && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800/50">
               <h3 className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400">CALIBRATION SEQUENCE</h3>
               
               <div className="bg-gray-50 dark:bg-[#0a0a0a] p-3 rounded border border-gray-200 dark:border-gray-800/50">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[10px] font-mono text-gray-500">{calibrationText}</span>
                   <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{calibrationProgress}%</span>
                 </div>
                 <div className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                   <div 
                     className="h-full bg-emerald-500 transition-all duration-300 ease-out" 
                     style={{ width: `${calibrationProgress}%` }}
                   />
                 </div>
               </div>
            </div>
          )}

          <div className="flex-1"></div>

          <div className="border-t border-gray-200 dark:border-gray-800/50 pt-4 space-y-3">
             <div className="flex justify-between items-center bg-gray-50 dark:bg-[#0a0a0a] p-2 border border-gray-200 dark:border-gray-800/50 rounded">
               <span className="text-[10px] font-mono text-gray-500">NONO'S SEVEN TITAN</span>
               <span className={`text-[10px] font-mono ${calibrationState === 'READY' ? 'text-emerald-500' : calibrationState === 'CALIBRATING' ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`}>
                 {calibrationState === 'READY' ? 'SYNCED' : calibrationState === 'CALIBRATING' ? 'CALIBRATING' : 'OFFLINE'}
               </span>
             </div>
             <div className="flex justify-between items-center bg-gray-50 dark:bg-[#0a0a0a] p-2 border border-gray-200 dark:border-gray-800/50 rounded">
               <span className="text-[10px] font-mono text-gray-500">PIXEL 9A</span>
               <span className={`text-[10px] font-mono ${calibrationState === 'READY' ? 'text-emerald-500' : calibrationState === 'CALIBRATING' ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`}>
                 {calibrationState === 'READY' ? 'SYNCED' : calibrationState === 'CALIBRATING' ? 'CALIBRATING' : 'OFFLINE'}
               </span>
             </div>
          </div>
        </div>

        {/* 3D Viewer */}
        <div className="lg:col-span-3 bg-white dark:bg-[#050505] border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden relative shadow-sm dark:shadow-none transition-colors duration-200">
          <Canvas 
            camera={{ position: [10, 8, 10], fov: 45 }}
            gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }}
          >
            <CanvasSnapshotHelper 
              snapshotRef={snapshotRef} 
              defaultTitle="TITAN 3D STANDING WAVE SONAR" 
              entityName={activeEntity.name} 
            />
            <color attach="background" args={[isLightMode ? '#f9fafb' : '#050505']} />
            <ambientLight intensity={isLightMode ? 0.8 : 0.4} />
            <pointLight position={[10, 10, 10]} intensity={isLightMode ? 1.5 : 1} color="#10b981" />
            
            <WaveMesh audioDataRef={dataArrayRef} triggerPulse={triggerPulseTime} />
            
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={true}
              autoRotateSpeed={0.5}
            />
          </Canvas>

          {/* HUD Overlay */}
          <div className="absolute left-4 bottom-4 pointer-events-none space-y-2">
            <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-3 rounded">
              <div className="text-[10px] text-gray-500 font-mono mb-1">ACOUSTIC RANGING</div>
              <div className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">SPATIAL ECHO MODE</div>
            </div>
          </div>
        </div>

      </div>

      {/* High-Resolution Snapshot Studio Modal */}
      <ViewerSnapshotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialResult={modalSnapshot}
        onRecapture={handleRecapture}
        viewerName="3D Standing Wave Sonar"
      />
    </div>
  );
});
