import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import * as THREE from 'three';
import { Box as BoxIcon, Camera, Download, Sparkles } from 'lucide-react';
import { useEntityContext } from '../../context/EntityContext';
import { useNotification } from '../../context/NotificationContext';
import { CanvasSnapshotHelper, CanvasSnapshotRef, CaptureResult } from '../common/CanvasSnapshotHelper';
import { ViewerSnapshotModal } from '../common/ViewerSnapshotModal';

function ServerRacks() {
  const rackCount = 20;
  
  return (
    <group position={[0, -2, 0]}>
      {Array.from({ length: rackCount }).map((_, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const x = (col - 2) * 3;
        const z = (row - 1) * 4;
        
        // Simulating active lights on racks
        const activeOpacity = 0.5 + Math.random() * 0.5;
        
        return (
          <group key={i} position={[x, 2, z]}>
            {/* Rack Body */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.2, 4, 1.8]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
            </mesh>
            {/* Server Blinkenlights */}
            <mesh position={[0, 0, 0.91]}>
              <planeGeometry args={[1, 3.8]} />
              <meshBasicMaterial color="#00ff00" wireframe opacity={activeOpacity} transparent />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function DataParticles() {
  const count = 5000;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = Math.random() * 8;
      const z = (Math.random() - 0.5) * 20;
      const speed = 0.01 + Math.random() * 0.05;
      temp.push({ x, y, z, speed });
    }
    return temp;
  }, []);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((particle, i) => {
      particle.y += particle.speed;
      if (particle.y > 8) particle.y = 0;
      
      dummy.position.set(particle.x, particle.y, particle.z);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.02, 4, 4]} />
      <meshBasicMaterial color="#10b981" transparent opacity={0.6} />
    </instancedMesh>
  );
}

export function DigitalTwinViewer() {
  const { activeEntity } = useEntityContext();
  const { addToast } = useNotification();
  const snapshotRef = useRef<CanvasSnapshotRef | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSnapshot, setModalSnapshot] = useState<CaptureResult | null>(null);

  // Quick 1-click snapshot at high-res 2x
  const handleQuickSnapshot = useCallback(() => {
    if (!snapshotRef.current) {
      addToast('Viewer canvas initializing, please try again.', 'warning');
      return;
    }
    const result = snapshotRef.current.capture({
      scale: 2,
      includeHud: true,
      viewerTitle: 'TITAN 4D SPATIAL DIGITAL TWIN',
      entityName: activeEntity.name,
    });

    if (result) {
      const link = document.createElement('a');
      link.href = result.dataUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast(`High-resolution snapshot saved: ${result.filename} (${result.width}x${result.height})`, 'success');
    } else {
      addToast('Failed to capture viewer canvas.', 'error');
    }
  }, [activeEntity.name, addToast]);

  // Open modal with preview & customization
  const handleOpenSnapshotModal = useCallback(() => {
    if (!snapshotRef.current) {
      addToast('Viewer canvas initializing, please try again.', 'warning');
      return;
    }
    const result = snapshotRef.current.capture({
      scale: 2,
      includeHud: true,
      viewerTitle: 'TITAN 4D SPATIAL DIGITAL TWIN',
      entityName: activeEntity.name,
    });

    if (result) {
      setModalSnapshot(result);
      setIsModalOpen(true);
    } else {
      addToast('Failed to capture viewer canvas.', 'error');
    }
  }, [activeEntity.name, addToast]);

  // Modal recapture callback
  const handleRecapture = useCallback((scale: number, includeHud: boolean) => {
    if (!snapshotRef.current) return null;
    return snapshotRef.current.capture({
      scale,
      includeHud,
      viewerTitle: 'TITAN 4D SPATIAL DIGITAL TWIN',
      entityName: activeEntity.name,
    });
  }, [activeEntity.name]);

  // A quick way to hook into theme for three.js canvas color
  const isLightMode = document.documentElement.classList.contains('dark') === false;

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          <BoxIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <h2 className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest">
            4D SPATIAL DIGITAL TWIN
          </h2>
        </div>

        {/* Snapshot & Telemetry Actions */}
        <div className="flex items-center gap-2.5">
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
            FACILITY ASSIGNED TO: <span className="text-emerald-600 dark:text-emerald-400">{activeEntity.name}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#050505] border border-gray-200 dark:border-gray-800/50 rounded-xl overflow-hidden relative shadow-sm dark:shadow-none transition-colors duration-200">
        <Canvas 
          camera={{ position: [15, 10, 15], fov: 45 }} 
          shadows
          gl={{ preserveDrawingBuffer: true, antialias: true, powerPreference: 'high-performance' }}
        >
          <CanvasSnapshotHelper 
            snapshotRef={snapshotRef} 
            defaultTitle="TITAN 4D SPATIAL DIGITAL TWIN" 
            entityName={activeEntity.name} 
          />
          <color attach="background" args={[isLightMode ? '#f9fafb' : '#050505']} />
          <fog attach="fog" args={[isLightMode ? '#f9fafb' : '#050505', 10, 50]} />
          
          <ambientLight intensity={isLightMode ? 0.6 : 0.2} />
          <spotLight position={[0, 15, 0]} angle={0.6} penumbra={1} intensity={isLightMode ? 3 : 2} castShadow color="#10b981" />
          <pointLight position={[-10, 5, -10]} intensity={isLightMode ? 1.5 : 1} color="#3b82f6" />
          
          <ServerRacks />
          <DataParticles />
          
          {/* Floor grid */}
          <gridHelper args={[50, 50, isLightMode ? '#059669' : '#10b981', isLightMode ? '#e5e7eb' : '#1a1a1a']} position={[0, -2, 0]} />
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={true}
            autoRotateSpeed={0.5}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
        </Canvas>

        {/* HUD Overlay */}
        <div className="absolute left-4 bottom-4 w-64 space-y-2 pointer-events-none">
          <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-3 rounded shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="text-[10px] text-gray-500 font-mono mb-1">FACILITY THERMALS</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-lg">22.4°C (NOMINAL)</div>
          </div>
          <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-3 rounded shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="text-[10px] text-gray-500 font-mono mb-1">RACK POWER DRAW</div>
            <div className="text-blue-600 dark:text-blue-400 font-mono font-bold text-lg">1.4 MW</div>
          </div>
          <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-3 rounded shadow-sm dark:shadow-none transition-colors duration-200">
            <div className="text-[10px] text-gray-500 font-mono mb-1">TENSOR OPS (ACTIVE)</div>
            <div className="text-purple-600 dark:text-purple-400 font-mono font-bold text-lg">84 PFLOPS</div>
          </div>
        </div>
      </div>

      {/* High-Resolution Snapshot Studio Modal */}
      <ViewerSnapshotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialResult={modalSnapshot}
        onRecapture={handleRecapture}
        viewerName="4D Spatial Digital Twin"
      />
    </div>
  );
}
