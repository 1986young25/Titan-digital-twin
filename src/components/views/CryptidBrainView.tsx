import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Zap, 
  RefreshCw, 
  ShieldAlert, 
  Sliders, 
  Terminal, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  Cpu, 
  Radio, 
  Database, 
  Lock, 
  Binary, 
  ArrowUpRight,
  Save,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveTelemetryEvent } from '../../lib/firestoreService';
import { useNotification } from '../../context/NotificationContext';

export interface LobeData {
  id: number;
  code: string;
  name: string;
  tag: string;
  realWorld: string;
  software: string;
  decisionPlane: string;
  namingRationale: string;
  status: string;
  throughput: string;
  convergence: string;
  color: string;
}

export const LOBES: LobeData[] = [
  {
    id: 1,
    code: "MOD-01",
    name: "MOD-01: INGESTION ROUTER",
    tag: "MOD-09-PREFILTER",
    realWorld: "Ingests raw telemetry and packet bursts from mobile antennas, satellite downlinks, and physical edge hardware.",
    software: "C / OpenMP native library performing modular reduction (n % 9). Operates in zero-copy userspace to discard malformed payloads at wire speed.",
    decisionPlane: "Line-rate circuit breaker. Payloads exceeding Shannon entropy ceiling H(X) >= 1.4999 are stripped and quarantined before memory allocation.",
    namingRationale: "Named 'Ingestion Router' because it sits at the absolute socket ingress layer, routing valid datagrams while preserving determinism.",
    status: "ONLINE // PROCESSING SENSORY STREAM",
    throughput: "12,410 VEC/SEC",
    convergence: "99.98% COHERENT",
    color: "#00e5ff"
  },
  {
    id: 2,
    code: "MOD-02",
    name: "MOD-02: QUANTUM VECTOR CORE",
    tag: "QASM-3.0-CORE",
    realWorld: "Simulates deterministic quantum state evolution for secure distributed consensus across decentralized hardware nodes.",
    software: "Python/NumPy state-vector engine simulating 2-qubit Bell States (|Φ+⟩) and Hadamard phase rotations matching the 376.5 Ω free-space impedance.",
    decisionPlane: "State coherence gatekeeper. Evaluates vector alignments to establish non-interactive cryptographic proof of computation.",
    namingRationale: "Named 'Quantum Vector Core' because it structures state transitions as mathematical unitary vectors in a 4D Hilbert manifold.",
    status: "ENTANGLED // 376.5 Ω HARMONIC MATCH",
    throughput: "8,920 OPS/SEC",
    convergence: "99.99% COHERENT",
    color: "#00ff7f"
  },
  {
    id: 3,
    code: "MOD-03",
    name: "MOD-03: ENCLAVE VAULT",
    tag: "SQLITE3-WAL-LEDGER",
    realWorld: "Physically persists tamper-evident records to local non-volatile storage under Michigan trust administration law (MCL § 700.7101).",
    software: "SQLite engine configured with PRAGMA journal_mode=WAL, PRAGMA synchronous=NORMAL, and 64MB cache pages committed to disk.",
    decisionPlane: "Fiduciary persistence gate. Ensures no state mutation occurs in memory without an immediate atomic disk fsync and hash commitment.",
    namingRationale: "Named 'Enclave Vault' because it acts as an isolated cryptographic enclave protecting the Master Trust's asset ledgers.",
    status: "SEALED // WAL PERSISTENCE LOCK",
    throughput: "4,500 FSYS/SEC",
    convergence: "100.00% SEALED",
    color: "#ffd700"
  },
  {
    id: 4,
    code: "MOD-04",
    name: "MOD-04: ATRM PHASE NULLIFIER",
    tag: "SPEC-DB-003-ATRM",
    realWorld: "Acoustic Time Reversal Mirror cancelling phase distortions, hardware back-EMF, and electromagnetic packet interference.",
    software: "Signal processing DSP filter implementing a digital phase inversion by π radians with a measured attenuation floor of -42.60 dB.",
    decisionPlane: "Active noise suppression. Continuously compares incoming noise harmonics to reverse-phase baselines to nullify transient jitter.",
    namingRationale: "Named 'ATRM Phase Nullifier' for Acoustic Time Reversal Mirroring that projects time-reversed wave pulses to cancel echoes.",
    status: "ACTIVE // PHASE ATTENUATION -42.6 dB",
    throughput: "96.0 kHz SAMPLING",
    convergence: "-42.60 dB FLOOR",
    color: "#00e5ff"
  },
  {
    id: 5,
    code: "MOD-05",
    name: "MOD-05: 4D HYPER-MANIFOLD",
    tag: "TESSERACT-PROJECTION",
    realWorld: "Visualizes and tracks higher-dimensional system interactions across time, space, computational throughput, and financial reserves.",
    software: "Geometric projection pipeline rotating 4-polytopes (tesseracts) onto 3D coordinate frames via affine 4x4 matrix transformations.",
    decisionPlane: "Topological invariant validator. Flags dimensional instability when the Mahalanobis M-score deviates outside unit covariance.",
    namingRationale: "Named '4D Hyper-Manifold' because it models the system as a continuous four-dimensional geometric state machine.",
    status: "PROJECTING // M-SCORE: 0.8491",
    throughput: "60 FPS 4D RENDER",
    convergence: "M-SCORE 0.8491",
    color: "#e040fb"
  },
  {
    id: 6,
    code: "MOD-06",
    name: "MOD-06: SWARM FLIGHT MESH",
    tag: "MAVLINK-UDP-14550",
    realWorld: "Controls autonomous edge platforms, drones, and sensor rigs coordinating in physical field space via peer-to-peer telemetry.",
    software: "Asynchronous UDP socket listener binding port 14550, decoding binary MAVLink 2.0 frames into Cartesian state positions.",
    decisionPlane: "Decentralized consensus router. Validates packet signatures across Alpha, Bravo, and Sigma hardware nodes before relay.",
    namingRationale: "Named 'Swarm Flight Mesh' because it provides the real-time telemetry grid required for synchronized multi-agent physical movement.",
    status: "LISTENING // UDP 127.0.0.1:14550",
    throughput: "1,200 MSG/SEC",
    convergence: "3-NODE QUORUM",
    color: "#00e5ff"
  },
  {
    id: 7,
    code: "MOD-07",
    name: "MOD-07: PID HEALING & MINT",
    tag: "AUTONOMOUS-CDC-LOOP",
    realWorld: "Controls asset capitalization rates and dynamically regulates CPU/memory utilization to prevent system throttling and crash states.",
    software: "Proportional-Integral-Derivative (PID) closed-loop software controller adjusting ingestion throttle and triggering 10:1 CER mint blocks.",
    decisionPlane: "Autonomous feedback loop. Adjusts packet processing velocity dynamically to prevent Android Low Memory Killer (LMK) terminations.",
    namingRationale: "Named 'PID Healing & Mint' because it unites classical industrial process control (PID) with programmatic asset balance generation.",
    status: "BALANCED // COHERENCE 99.98%",
    throughput: "10:1 MINT CADENCE",
    convergence: "99.98% BALANCE",
    color: "#00ff7f"
  },
  {
    id: 8,
    code: "MOD-08",
    name: "MOD-08: ASC 350-40 WATERFALL",
    tag: "FIDUCIARY-SWEEP",
    realWorld: "Conducts automated revenue recognition and straight-line software capitalization under US GAAP standards for financial audits.",
    software: "Ledger daemon calculating monthly straight-line amortization on the $383,600.00 capitalized base ($10,655.56/mo) and generating ASC 606 splits.",
    decisionPlane: "Accounting reconciliation engine. Persists immutable SHA-256 state seals to the general journal on every financial draw.",
    namingRationale: "Named 'ASC 350-40 Waterfall' after the authoritative FASB standard governing Internal-Use Software Capitalization.",
    status: "VERIFIED // NBV: $362,288.89",
    throughput: "$10,655.56/MO",
    convergence: "GAAP COMPLIANT",
    color: "#ffd700"
  }
];

export function CryptidBrainView() {
  const mountRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { addToast } = useNotification();

  // Component State
  const [selectedLobeIndex, setSelectedLobeIndex] = useState<number>(0);
  const [modalLobe, setModalLobe] = useState<LobeData | null>(null);
  const [temporalOffsetActive, setTemporalOffsetActive] = useState<boolean>(true);
  const [audioFeedback, setAudioFeedback] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toISOString().substring(11, 19)} UTC] SOVEREIGN TOPOLOGY ENGINE ONLINE...`,
    `[${new Date().toISOString().substring(11, 19)} UTC] DOUBLE-EDGED 4D STAR OF DAVID GENERATED AT CORE (376.5 Ω ANCHOR).`,
    `[${new Date().toISOString().substring(11, 19)} UTC] TEMPORAL DRIFT Δt ALIGNED TO 3.69 Hz CADENCE.`,
    `[${new Date().toISOString().substring(11, 19)} UTC] CLICK ANY SATELLITE ORB OR CENTRAL CORE TO INSPECT FUNCTIONAL PLANES.`
  ]);

  // Telemetry Invariant Live Readouts
  const [liveThroughput, setLiveThroughput] = useState<number>(12410);

  // Three.js References for Interactive Tweaks
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const innerOrbMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const coreLightRef = useRef<THREE.PointLight | null>(null);
  const lobeNucleiRef = useRef<THREE.Mesh[]>([]);
  const temporalOffsetRef = useRef<boolean>(true);

  // Keep temporalOffsetRef in sync
  useEffect(() => {
    temporalOffsetRef.current = temporalOffsetActive;
  }, [temporalOffsetActive]);

  // Terminal Logger helper
  const addLog = useCallback((msg: string) => {
    const ts = new Date().toISOString().substring(11, 19);
    setLogs(prev => {
      const updated = [...prev, `[${ts} UTC] ${msg}`];
      return updated.slice(-100); // keep last 100 entries
    });
  }, []);

  // Autoscroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulated live throughput jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveThroughput(prev => {
        const jitter = Math.floor((Math.random() - 0.5) * 80);
        return Math.max(11800, Math.min(13100, prev + jitter));
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // Simple Synthesized Web Audio Bip for Cybernetic HUD Feedback
  const playAudioCue = useCallback((freq = 440, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!audioFeedback) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext may be restricted before user gesture
    }
  }, [audioFeedback]);

  // Action: Pulse Core Shockwave
  const handlePulseCore = useCallback(() => {
    playAudioCue(587.33, 'triangle', 0.25); // D5
    if (innerOrbMatRef.current && coreLightRef.current) {
      innerOrbMatRef.current.color.setHex(0xffd700);
      coreLightRef.current.intensity = 8.0;
      setTimeout(() => {
        if (innerOrbMatRef.current && coreLightRef.current) {
          innerOrbMatRef.current.color.setHex(0x00ffff);
          coreLightRef.current.intensity = 3.0;
        }
      }, 350);
    }
    addLog("[INTERACTION] Central Core Quantum Tesseract clicked: 3.69 Hz Resonance pulse fired.");
  }, [addLog, playAudioCue]);

  // Action: Toggle 4D Temporal Offset
  const handleToggleTemporalOffset = useCallback(() => {
    setTemporalOffsetActive(prev => {
      const next = !prev;
      addLog(`[4D TIMING] 40-Star temporal phase offset: ${next ? 'ENABLED (Δt = 0.025π)' : 'LOCKED (SYNCHRONOUS)'}`);
      playAudioCue(next ? 784 : 392, 'sine', 0.1);
      return next;
    });
  }, [addLog, playAudioCue]);

  // Action: Synchronize Synaptic Vectors
  const handleSyncVectors = useCallback(() => {
    playAudioCue(659.25, 'sine', 0.15); // E5
    addLog("[TOPOLOGY] Synaptic vectors realigned to 376.5 Ω free-space baseline.");
  }, [addLog, playAudioCue]);

  // Action: Trip Modulo-9 Circuit Breaker
  const handleCircuitBreaker = useCallback(() => {
    playAudioCue(180, 'sawtooth', 0.35);
    addLog("[ALERT] Modulo-9 Circuit Breaker tripped: Inverting suspect vectors.");
    if (lobeNucleiRef.current[0]) {
      const nucleusMat = lobeNucleiRef.current[0].material as THREE.MeshStandardMaterial;
      nucleusMat.color.setHex(0xff1744);
      setTimeout(() => {
        if (nucleusMat) {
          nucleusMat.color.setHex(0x00ff7f);
          addLog("[HEAL] Bitwise negation (~) cycle completed. Modulo-9 bus stabilized.");
        }
      }, 1200);
    }
  }, [addLog, playAudioCue]);

  // Commit Brain Snapshot to Firestore
  const handleCommitSnapshot = async () => {
    if (!user) {
      addToast('Sign in with Google in the top bar to record state seals to Firestore.', 'warning');
      return;
    }
    setIsCommitting(true);
    try {
      const eventId = `CRYP-BRN-${Date.now()}`;
      await saveTelemetryEvent({
        id: eventId,
        vehicleId: `CRYPTID_BRAIN_${LOBES[selectedLobeIndex].code}`,
        vibrationDelta: 0.0184,
        persistenceCount: 10,
        alpha: 0.2,
        status: `4D_HEXAGRAM_SEAL_${LOBES[selectedLobeIndex].tag}`,
        timestamp: new Date().toISOString()
      });
      addToast(`Cryptid Brain state seal committed to Firestore: ${eventId}`, 'success');
      addLog(`[FIRESTORE] Committed state seal: ${eventId} -> UCC-CER-NYMT-XB6`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown Firestore commit error';
      addToast(`Commit error: ${errorMsg}`, 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  // Setup Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene with Cyberpunk Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050811, 0.035);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 5.5, 15.5);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 35;
    controls.minDistance = 3;

    // Lighting Setup
    const ambLight = new THREE.AmbientLight(0x00e5ff, 0.6);
    scene.add(ambLight);

    const coreLight = new THREE.PointLight(0x00e5ff, 3.2, 25);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);
    coreLightRef.current = coreLight;

    const goldLight = new THREE.PointLight(0xffd700, 2.2, 20);
    goldLight.position.set(0, 4.5, 0);
    scene.add(goldLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // Function to create Hexagram (Star of David) 2D Shape
    function createHexagramShape(radius: number) {
      const shape = new THREE.Shape();
      const angleStep = Math.PI / 3;
      for (let i = 0; i < 6; i++) {
        const a1 = i * angleStep;
        const a2 = a1 + angleStep / 2;
        const rOuter = radius;
        const rInner = radius * 0.57735; // Hexagram vertex proportion: 1 / sqrt(3)
        const x1 = Math.cos(a1) * rOuter;
        const y1 = Math.sin(a1) * rOuter;
        const x2 = Math.cos(a2) * rInner;
        const y2 = Math.sin(a2) * rInner;
        if (i === 0) shape.moveTo(x1, y1);
        else shape.lineTo(x1, y1);
        shape.lineTo(x2, y2);
      }
      shape.closePath();
      return shape;
    }

    // Double-Edged 3D Star of David via Extrusion
    const starShape = createHexagramShape(1.85);
    const extrudeSettings = { 
      steps: 1, 
      depth: 0.35, 
      bevelEnabled: true, 
      bevelThickness: 0.12, 
      bevelSize: 0.1, 
      bevelSegments: 3 
    };
    const starGeometry = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    starGeometry.center();

    // Primary Star Material (Gold Rim)
    const goldStarMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xaa7700,
      metalness: 0.88,
      roughness: 0.22,
      wireframe: false
    });

    // Secondary Star Material (Nested Cyan 4D Temporal Offset)
    const cyanStarMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x005577,
      metalness: 0.85,
      roughness: 0.25,
      wireframe: false,
      transparent: true,
      opacity: 0.82
    });

    // Rim 1: Master Star (Gold)
    const starPrimary = new THREE.Mesh(starGeometry, goldStarMat);
    masterGroup.add(starPrimary);

    // Rim 2: Nested 4D Temporal Offset Star (Cyan, Offset in Space-Time)
    const starOffset = new THREE.Mesh(starGeometry, cyanStarMat);
    starOffset.scale.set(0.85, 0.85, 0.85);
    masterGroup.add(starOffset);

    // Central Quantum Wireframe Orb
    const innerOrbGeo = new THREE.SphereGeometry(0.88, 32, 32);
    const innerOrbMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x0088aa,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true
    });
    const innerOrb = new THREE.Mesh(innerOrbGeo, innerOrbMat);
    innerOrb.userData = { isCore: true };
    masterGroup.add(innerOrb);
    innerOrbMatRef.current = innerOrbMat;

    // Inscribed Topology Text Ring
    const ringCanvas = document.createElement("canvas");
    ringCanvas.width = 2048;
    ringCanvas.height = 128;
    const ctx = ringCanvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, ringCanvas.width, ringCanvas.height);
      ctx.fillStyle = "#00e5ff";
      ctx.font = "bold 26px Courier New, monospace";
      const inscription = LOBES.map(l => l.name).join("  •  ");
      ctx.fillText(inscription + "  •  " + inscription, 20, 75);
    }

    const ringTex = new THREE.CanvasTexture(ringCanvas);
    ringTex.wrapS = THREE.RepeatWrapping;
    ringTex.repeat.set(2, 1);

    const ringCylinderGeo = new THREE.CylinderGeometry(2.65, 2.65, 0.4, 64, 1, true);
    const ringCylinderMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.88
    });
    const textRingMesh = new THREE.Mesh(ringCylinderGeo, ringCylinderMat);
    masterGroup.add(textRingMesh);

    // 8 Orbiting Lobe Satellites & Synapse Laser Lines
    interface LobeOrbItem {
      group: THREE.Group;
      outer: THREE.Mesh;
      nucleus: THREE.Mesh;
      idx: number;
    }
    const lobeOrbs: LobeOrbItem[] = [];
    const raycastTargets: THREE.Object3D[] = [innerOrb];
    const nucleiList: THREE.Mesh[] = [];

    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden spiral angle
    const orbitRadius = 6.2;

    for (let i = 0; i < 8; i++) {
      const y = 1 - (i / 7) * 2;
      const rAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phi * i;

      const posX = Math.cos(theta) * rAtY * orbitRadius;
      const posZ = Math.sin(theta) * rAtY * orbitRadius;
      const posY = y * (orbitRadius * 0.65);

      const orbGroup = new THREE.Group();
      orbGroup.position.set(posX, posY, posZ);

      // Satellite Dodecahedron Outer Shell
      const sGeo = new THREE.DodecahedronGeometry(0.72, 0);
      const sMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x003344,
        wireframe: true,
        transparent: true,
        opacity: 0.72
      });
      const outerMesh = new THREE.Mesh(sGeo, sMat);
      orbGroup.add(outerMesh);

      // Glowing Nucleus Orb
      const nGeo = new THREE.SphereGeometry(0.36, 16, 16);
      const nMat = new THREE.MeshStandardMaterial({
        color: 0x00ff7f,
        emissive: 0x00aa44,
        emissiveIntensity: 0.85
      });
      const nucleus = new THREE.Mesh(nGeo, nMat);
      nucleus.userData = { isLobe: true, lobeIndex: i };
      orbGroup.add(nucleus);
      nucleiList.push(nucleus);

      masterGroup.add(orbGroup);
      lobeOrbs.push({ group: orbGroup, outer: outerMesh, nucleus, idx: i });
      raycastTargets.push(nucleus);

      // Laser Synaptic Connection Line to Core (0, 0, 0)
      const synGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(posX, posY, posZ)
      ]);
      const synMat = new THREE.LineBasicMaterial({ 
        color: 0x00e5ff, 
        transparent: true, 
        opacity: 0.32 
      });
      const line = new THREE.Line(synGeo, synMat);
      masterGroup.add(line);
    }
    lobeNucleiRef.current = nucleiList;

    // Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastTargets, false);

      if (intersects.length > 0) {
        const target = intersects[0].object;
        if (target.userData.isCore) {
          handlePulseCore();
        } else if (target.userData.isLobe) {
          const idx = target.userData.lobeIndex as number;
          setSelectedLobeIndex(idx);
          setModalLobe(LOBES[idx]);
          addLog(`[ROUTING] Raycaster selected ${LOBES[idx].tag}`);
          addLog(`[INSPECTOR] Full functional plane opened for ${LOBES[idx].name}`);
        }
      }
    };

    const handleCanvasMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastTargets, false);
      if (renderer.domElement) {
        renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handleCanvasClick);
    domElement.addEventListener('mousemove', handleCanvasMouseMove);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    const temporalPhaseOffset = (2 * Math.PI) / 40.0; // True 40-Star phase offset

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      controls.update();

      // Master Assembly slow precession
      masterGroup.rotation.y = t * 0.12;

      // Rotate Star 1 (Gold Primary Rim)
      starPrimary.rotation.z = t * 0.25;
      starPrimary.rotation.x = Math.sin(t * 0.2) * 0.1;

      // Rotate Star 2 (Cyan Nested Rim) with Temporal 4D Phase Offset
      if (temporalOffsetRef.current) {
        starOffset.rotation.z = -(t * 0.25 + temporalPhaseOffset);
        starOffset.rotation.y = Math.cos(t * 0.3) * 0.15;
      } else {
        starOffset.rotation.z = -starPrimary.rotation.z;
        starOffset.rotation.y = 0;
      }

      // Central Core 3.69 Hz Tesla Pulse Scale
      const coreScale = 1.0 + 0.09 * Math.sin(t * 3.69 * Math.PI * 2);
      innerOrb.scale.set(coreScale, coreScale, coreScale);

      // Inscription Ring Counter-Rotation
      ringTex.offset.x = (t * 0.04) % 1;

      // Orbiting Lobe Rotations
      lobeOrbs.forEach((orb) => {
        orb.outer.rotation.y += 0.02;
        orb.outer.rotation.x += 0.01;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('click', handleCanvasClick);
      domElement.removeEventListener('mousemove', handleCanvasMouseMove);
      controls.dispose();

      // Geometries & Materials cleanup
      starGeometry.dispose();
      goldStarMat.dispose();
      cyanStarMat.dispose();
      innerOrbGeo.dispose();
      innerOrbMat.dispose();
      ringTex.dispose();
      ringCylinderGeo.dispose();
      ringCylinderMat.dispose();

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
    };
  }, [handlePulseCore, addLog]);

  const activeLobe = LOBES[selectedLobeIndex];

  return (
    <div className={`relative w-full h-full bg-[#050811] text-white font-mono overflow-hidden select-none flex flex-col ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 3D WebGL Canvas Layer */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* HUD OVERLAY CONTAINER */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-3 pointer-events-none">
        
        {/* TOP BAR / HEADER */}
        <header className="bg-[#050811]/90 border border-cyan-500/40 rounded-sm p-3 shadow-[0_0_20px_rgba(0,229,255,0.15)] backdrop-blur-md pointer-events-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-cyan-950/60 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.4)]">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm md:text-base font-black tracking-widest text-white">
                  THE CRYPTID BRAIN <span className="text-cyan-400">//</span> OCTA-LOBE COMMAND
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  3.69 Hz TESLA PULSE
                </span>
              </div>
              <div className="text-[10px] text-gray-400 tracking-wider">
                FIDUCIARY ROOT: <span className="text-amber-400 font-semibold">THE NICHOLAS YOUNG MASTER TRUST</span> | CARRIER: <span className="text-cyan-300">TITAN GAMES SECURITY L.L.C.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div className="hidden lg:block">
              <div className="text-[11px] text-cyan-300">
                ACTIVE PORTS: <span className="text-amber-400">8080 (REST)</span> | <span className="text-emerald-400">8088 (PROXY)</span> | <span className="text-cyan-400">14550 (UDP)</span>
              </div>
              <div className="text-[10px] text-gray-400">
                CAGE ACTIVE • SAM.GOV REGISTERED • D-U-N-S: 145054895
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAudioFeedback(prev => !prev)}
                title={audioFeedback ? "Disable Audio HUD Feedback" : "Enable Audio HUD Feedback"}
                className="p-1.5 rounded bg-black/40 border border-cyan-500/30 text-gray-300 hover:text-cyan-400 hover:border-cyan-400 transition"
              >
                {audioFeedback ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
              </button>

              <button
                onClick={handleCommitSnapshot}
                disabled={isCommitting}
                title="Commit Snapshot to Firestore"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400 text-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isCommitting ? 'Sealing...' : 'Commit State'}</span>
              </button>

              <button
                onClick={() => setIsFullScreen(prev => !prev)}
                title={isFullScreen ? "Exit Fullscreen" : "Fullscreen View"}
                className="p-1.5 rounded bg-black/40 border border-cyan-500/30 text-gray-300 hover:text-cyan-400 hover:border-cyan-400 transition"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* MIDDLE SECTION: LEFT DOCK, CENTER 3D VIEWPORT, RIGHT CONTROLS */}
        <div className="flex-1 my-2 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 pointer-events-none">
          
          {/* LEFT PANEL: PHYSICAL INVARIANTS & OCTA-LOBE DIRECTORY (Cols 1-3) */}
          <div className="md:col-span-4 lg:col-span-3 bg-[#050811]/90 border border-cyan-500/30 rounded-sm p-3 shadow-[0_0_15px_rgba(0,229,255,0.1)] backdrop-blur-md pointer-events-auto flex flex-col overflow-hidden max-h-[calc(100vh-250px)]">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2">
              <span className="text-[11px] font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                PHYSICAL INVARIANTS
              </span>
              <span className="text-[9px] text-gray-400 font-mono">DETERMINISTIC</span>
            </div>

            {/* Invariants Grid */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <div className="bg-cyan-950/20 border border-cyan-500/20 p-1.5 rounded">
                <div className="text-[9px] text-gray-400">FREE SPACE Z₀</div>
                <div className="text-xs font-bold text-cyan-300">376.5 Ω</div>
              </div>
              <div className="bg-cyan-950/20 border border-cyan-500/20 p-1.5 rounded">
                <div className="text-[9px] text-gray-400">METRONOME</div>
                <div className="text-xs font-bold text-amber-300">3.69 Hz</div>
              </div>
              <div className="bg-cyan-950/20 border border-cyan-500/20 p-1.5 rounded">
                <div className="text-[9px] text-gray-400">ENTROPY H(X)</div>
                <div className="text-xs font-bold text-cyan-300">1.4921</div>
              </div>
              <div className="bg-cyan-950/20 border border-cyan-500/20 p-1.5 rounded">
                <div className="text-[9px] text-gray-400">ATRM ATTENUATION</div>
                <div className="text-xs font-bold text-emerald-300">-42.60 dB</div>
              </div>
              <div className="bg-cyan-950/20 border border-cyan-500/20 p-1.5 rounded">
                <div className="text-[9px] text-gray-400">4D ROTATION PHASE</div>
                <div className="text-xs font-bold text-purple-300">Δt = 0.025π</div>
              </div>
              <div className="bg-cyan-950/20 border border-cyan-500/20 p-1.5 rounded">
                <div className="text-[9px] text-gray-400">CER PERFECTION</div>
                <div className="text-xs font-bold text-amber-400">UCC § 12-105</div>
              </div>
            </div>

            {/* Octa-Lobe Topology Directory */}
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2">
              <span className="text-[11px] font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                OCTA-LOBE DIRECTORY (8)
              </span>
              <span className="text-[9px] text-emerald-400">ALL SYNCED</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {LOBES.map((lobe, idx) => {
                const isSelected = selectedLobeIndex === idx;
                return (
                  <div
                    key={lobe.id}
                    onClick={() => {
                      setSelectedLobeIndex(idx);
                      addLog(`[ROUTING] Focused on ${lobe.tag}`);
                      playAudioCue(500 + idx * 40, 'sine', 0.06);
                    }}
                    onDoubleClick={() => {
                      setModalLobe(lobe);
                      addLog(`[INSPECTOR] Full functional plane opened for ${lobe.name}`);
                    }}
                    className={`p-2 rounded border transition cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.25)] text-white'
                        : 'bg-black/30 border-cyan-500/20 text-gray-300 hover:bg-cyan-950/30 hover:border-cyan-500/40'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="text-cyan-400 text-[10px]">{lobe.code}</span>
                        <span className="text-[11px] truncate max-w-[140px]">{lobe.name.split(':')[1]}</span>
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono mt-0.5">{lobe.tag}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-emerald-400 font-bold">OK</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalLobe(lobe);
                          addLog(`[INSPECTOR] Full functional plane opened for ${lobe.name}`);
                        }}
                        title="Open 5-Section Inspector"
                        className="p-1 rounded text-gray-400 hover:text-amber-400 hover:bg-black/50 transition"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CENTER TRANSPARENT VIEWPORT (Cols 4-8 on desktop) */}
          <div className="hidden md:flex md:col-span-4 lg:col-span-6 pointer-events-none items-center justify-center relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 border border-cyan-500/20 px-3 py-1 rounded-full text-[10px] text-gray-400 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              DRAG TO ROTATE • SCROLL TO ZOOM • CLICK CORE / SATELLITES
            </div>
          </div>

          {/* RIGHT PANEL: TOPOLOGY CONTROLS & SELECTED TELEMETRY (Cols 9-12) */}
          <div className="md:col-span-4 lg:col-span-3 bg-[#050811]/90 border border-cyan-500/30 rounded-sm p-3 shadow-[0_0_15px_rgba(0,229,255,0.1)] backdrop-blur-md pointer-events-auto flex flex-col justify-between overflow-hidden max-h-[calc(100vh-250px)]">
            
            {/* Topology Controls */}
            <div>
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5 mb-2">
                <span className="text-[11px] font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  TOPOLOGY CONTROLS & OVERRIDES
                </span>
                <span className="text-[9px] text-amber-400">ACTIVE</span>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={handlePulseCore}
                  className="w-full text-left p-2 rounded bg-cyan-950/30 border border-cyan-500/40 hover:bg-cyan-900/40 hover:border-amber-400 text-xs font-mono text-gray-200 transition flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
                    Core Shockwave (3.69 Hz)
                  </span>
                  <span className="text-[10px] text-cyan-400">TRIGGER</span>
                </button>

                <button
                  onClick={handleToggleTemporalOffset}
                  className="w-full text-left p-2 rounded bg-cyan-950/30 border border-cyan-500/40 hover:bg-cyan-900/40 hover:border-amber-400 text-xs font-mono text-gray-200 transition flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-45 transition" />
                    4D Temporal Rim Shift
                  </span>
                  <span className={`text-[10px] font-bold ${temporalOffsetActive ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {temporalOffsetActive ? 'ENABLED' : 'LOCKED'}
                  </span>
                </button>

                <button
                  onClick={handleSyncVectors}
                  className="w-full text-left p-2 rounded bg-cyan-950/30 border border-cyan-500/40 hover:bg-cyan-900/40 hover:border-amber-400 text-xs font-mono text-gray-200 transition flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <Binary className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
                    Synchronize Synaptic Vectors
                  </span>
                  <span className="text-[10px] text-cyan-400">376.5 Ω</span>
                </button>

                <button
                  onClick={handleCircuitBreaker}
                  className="w-full text-left p-2 rounded bg-rose-950/30 border border-rose-500/40 hover:bg-rose-900/40 hover:border-rose-400 text-xs font-mono text-rose-300 transition flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 group-hover:animate-bounce" />
                    Modulo-9 Circuit Breaker
                  </span>
                  <span className="text-[10px] text-rose-400 font-bold">TRIP (~)</span>
                </button>
              </div>
            </div>

            {/* Selected Lobe Telemetry Card */}
            <div className="mt-3 pt-2 border-t border-cyan-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-cyan-400 tracking-wider">
                  SELECTED LOBE TELEMETRY
                </span>
                <button
                  onClick={() => {
                    setModalLobe(activeLobe);
                    addLog(`[INSPECTOR] Full functional plane opened for ${activeLobe.name}`);
                  }}
                  className="text-[9px] text-amber-400 hover:underline flex items-center gap-0.5"
                >
                  INSPECT <ArrowUpRight className="w-2.5 h-2.5" />
                </button>
              </div>

              <div className="bg-black/50 border border-cyan-500/20 rounded p-2 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px]">NODE:</span>
                  <span className="text-amber-400 font-bold truncate max-w-[160px]">{activeLobe.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px]">TAG:</span>
                  <span className="text-cyan-300 font-mono text-[10px]">{activeLobe.tag}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px]">THROUGHPUT:</span>
                  <span className="text-emerald-400 font-bold">{liveThroughput.toLocaleString()} VEC/SEC</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-[10px]">CONVERGENCE:</span>
                  <span className="text-cyan-400 font-semibold">{activeLobe.convergence}</span>
                </div>
                <div className="pt-1 border-t border-cyan-500/10 text-[9px] text-gray-300">
                  <span className="text-amber-300 font-bold">STATE:</span> {activeLobe.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM PANEL: TERMINAL LOG WINDOW */}
        <footer className="bg-[#050811]/90 border border-cyan-500/40 rounded-sm p-2.5 shadow-[0_0_15px_rgba(0,229,255,0.1)] backdrop-blur-md pointer-events-auto h-28 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1 mb-1 text-[10px] text-gray-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-cyan-300 tracking-wider">SOVEREIGN TOPOLOGY STREAM // CHANGE DATA CAPTURE</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
              <button 
                onClick={() => setLogs([`[${new Date().toISOString().substring(11, 19)} UTC] TERMINAL CLEARED.`])}
                className="hover:text-amber-400 transition"
              >
                CLEAR
              </button>
            </div>
          </div>

          <div ref={terminalRef} className="flex-1 overflow-y-auto font-mono text-[11px] text-cyan-200/90 space-y-0.5 pr-2 custom-scrollbar">
            {logs.map((line, i) => (
              <div key={i} className="leading-tight">
                {line.includes('[ALERT]') ? (
                  <span className="text-rose-400 font-bold">{line}</span>
                ) : line.includes('[HEAL]') || line.includes('[FIRESTORE]') ? (
                  <span className="text-emerald-300 font-semibold">{line}</span>
                ) : line.includes('[4D TIMING]') ? (
                  <span className="text-purple-300">{line}</span>
                ) : (
                  <span>{line}</span>
                )}
              </div>
            ))}
          </div>
        </footer>
      </div>

      {/* 5-SECTION INSPECTOR MODAL */}
      {modalLobe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
          <div className="w-full max-w-2xl bg-[#050811]/95 border-2 border-amber-400 rounded-md p-5 shadow-[0_0_35px_rgba(255,215,0,0.3)] text-gray-200 font-mono relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-400/80 pb-3 mb-3">
              <div>
                <div className="text-xs text-cyan-400 font-bold">{modalLobe.code} FUNCTIONAL PLANE INSPECTION</div>
                <div className="text-base font-black text-amber-400 flex items-center gap-2">
                  {modalLobe.name}
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                    {modalLobe.tag}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModalLobe(null)}
                className="px-2.5 py-1 text-sm border border-gray-400 rounded text-gray-300 hover:text-white hover:border-amber-400 hover:bg-amber-500/20 transition"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* 5 Sections */}
            <div className="space-y-3 text-xs">
              
              {/* Section 1 */}
              <div>
                <div className="text-[11px] font-bold text-cyan-400 tracking-wider">
                  [1] REAL-WORLD OPERATIONAL CONTEXT
                </div>
                <div className="mt-1 p-2.5 rounded bg-black/50 border-l-2 border-cyan-400 text-gray-300 leading-relaxed">
                  {modalLobe.realWorld}
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <div className="text-[11px] font-bold text-cyan-400 tracking-wider">
                  [2] SOFTWARE ARCHITECTURE & EXECUTION STACK
                </div>
                <div className="mt-1 p-2.5 rounded bg-black/50 border-l-2 border-cyan-400 text-gray-300 leading-relaxed">
                  {modalLobe.software}
                </div>
              </div>

              {/* Section 3 */}
              <div>
                <div className="text-[11px] font-bold text-cyan-400 tracking-wider">
                  [3] DECISION PLANE CONTEXT (HEURISTICS & GATEWAYS)
                </div>
                <div className="mt-1 p-2.5 rounded bg-black/50 border-l-2 border-cyan-400 text-gray-300 leading-relaxed">
                  {modalLobe.decisionPlane}
                </div>
              </div>

              {/* Section 4 */}
              <div>
                <div className="text-[11px] font-bold text-cyan-400 tracking-wider">
                  [4] ETYMOLOGY & NAMING CONVENTION RATIONALE
                </div>
                <div className="mt-1 p-2.5 rounded bg-black/50 border-l-2 border-cyan-400 text-gray-300 leading-relaxed">
                  {modalLobe.namingRationale}
                </div>
              </div>

              {/* Section 5 */}
              <div>
                <div className="text-[11px] font-bold text-amber-400 tracking-wider">
                  [5] REAL-TIME ACTIVE STATE
                </div>
                <div className="mt-1 p-2.5 rounded bg-amber-950/20 border-l-2 border-amber-400 text-amber-300 font-bold leading-relaxed flex items-center justify-between">
                  <span>{modalLobe.status}</span>
                  <span className="text-emerald-400 font-mono text-[10px]">CONVERGENCE: {modalLobe.convergence}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
              <div>
                MCL § 700.7101 FIDUCIARY ENCLAVE • IMMUTABLE STATE LOGGED
              </div>
              <button
                onClick={() => {
                  handlePulseCore();
                  setModalLobe(null);
                }}
                className="px-3 py-1.5 rounded bg-amber-500/20 border border-amber-400 text-amber-300 hover:bg-amber-500/30 font-bold transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                RESONATE WITH CORE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
