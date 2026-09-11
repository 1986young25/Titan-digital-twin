import { CorporateEntity, DaemonProcess, NetworkNode } from '../types/titan';

export const ENTITIES: CorporateEntity[] = [
  { id: 'NYMT', name: 'Nicholas Young Master Trust', ein: '41-6820289', jurisdiction: 'Federal', tokenAllotment: 1000000000, ledgerReserves: 147120000000 },
  { id: 'TGS', name: 'Titan Game Security LLC', ein: '803249289', jurisdiction: 'Michigan', tokenAllotment: 5000000, ledgerReserves: 25000000 },
  { id: 'ANDBA', name: 'A&N DBA', ein: 'PENDING', jurisdiction: 'Delaware', tokenAllotment: 1000000, ledgerReserves: 500000 },
  { id: 'TENT', name: 'Titan Entertainment', ein: 'PENDING', jurisdiction: 'Nevada', tokenAllotment: 2500000, ledgerReserves: 1200000 },
  { id: 'TDEF', name: 'Titan Defense', ein: 'CAGE-PENDING', jurisdiction: 'Federal', tokenAllotment: 15000000, ledgerReserves: 85000000 },
  { id: 'TRC', name: 'Titan Robotics & Compute', ein: 'PENDING', jurisdiction: 'Texas', tokenAllotment: 8000000, ledgerReserves: 42000000 },
  { id: 'TBA', name: 'Titan Bio-Acoustics', ein: 'PENDING', jurisdiction: 'California', tokenAllotment: 3000000, ledgerReserves: 18000000 },
  { id: 'TREH', name: 'Titan Real Estate Holdings', ein: 'PENDING', jurisdiction: 'Wyoming', tokenAllotment: 20000000, ledgerReserves: 150000000 },
  { id: 'TET', name: 'Titan Edge Telemetry', ein: 'PENDING', jurisdiction: 'Delaware', tokenAllotment: 6000000, ledgerReserves: 34000000 },
  { id: 'TLC', name: 'Titan Ledger Corp', ein: 'PENDING', jurisdiction: 'Wyoming', tokenAllotment: 100000000, ledgerReserves: 500000000 },
  { id: 'TAF', name: 'Titan Autonomous Fleet', ein: 'PENDING', jurisdiction: 'Michigan', tokenAllotment: 12000000, ledgerReserves: 76000000 },
  { id: 'TIPV', name: 'Titan IP & Patent Vault', ein: 'USPTO-64/014,873', jurisdiction: 'Federal', tokenAllotment: 50000000, ledgerReserves: 2500000000 }
];

export const INITIAL_DAEMONS: DaemonProcess[] = [
  { id: 'd1', name: 'nymt_udp_streaming_daemon.py', pid: 14022, cpu: 2.4, memory: 145, uptime: 86400, status: 'ACTIVE' },
  { id: 'd2', name: 'nymt_telemetry_forwarder.py', pid: 14023, cpu: 1.1, memory: 89, uptime: 86400, status: 'ACTIVE' },
  { id: 'd3', name: 'nymt_ws_bridge.py', pid: 14024, cpu: 0.5, memory: 112, uptime: 86400, status: 'ACTIVE' },
  { id: 'd4', name: 'TCP Port 5175 Socket Listener', pid: 14025, cpu: 0.1, memory: 45, uptime: 86400, status: 'ACTIVE' },
  { id: 'd5', name: 'HTTP Telemetry Server (8085)', pid: 14026, cpu: 0.8, memory: 256, uptime: 86400, status: 'ACTIVE' },
  { id: 'd6', name: 'TrustCore Telemetry API', pid: 14027, cpu: 3.2, memory: 512, uptime: 86400, status: 'ACTIVE' },
  { id: 'd7', name: 'Vite Frontend Server (5173)', pid: 14028, cpu: 1.5, memory: 384, uptime: 86400, status: 'ACTIVE' },
  { id: 'd8', name: 'Ed25519 Sealing Pipeline', pid: 14029, cpu: 12.4, memory: 1024, uptime: 86400, status: 'ACTIVE' },
  { id: 'd9', name: 'Acoustic NDT Solver', pid: 14030, cpu: 8.9, memory: 2048, uptime: 86400, status: 'ACTIVE' },
];

export const INITIAL_NODES: NetworkNode[] = [
  { id: 'NODE-01', name: 'Termux ARM64 Edge Core', type: 'ARM64_EDGE', status: 'ACTIVE_SEALING', latency: 12, opsPerSec: 145000 },
  { id: 'NODE-07', name: 'Dell x86_64 Workstation', type: 'X86_64_WORKSTATION', status: 'ACTIVE_SEALING', latency: 4, opsPerSec: 5000000 },
  { id: 'NODE-REPLICA-1', name: 'Cloud Replica Alpha', type: 'CLOUD_REPLICA', status: 'HOT_STANDBY', latency: 45, opsPerSec: 0 },
  { id: 'NODE-REPLICA-2', name: 'Cloud Replica Beta', type: 'CLOUD_REPLICA', status: 'HOT_STANDBY', latency: 48, opsPerSec: 0 },
];
