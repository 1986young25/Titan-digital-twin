export interface CorporateEntity {
  id: string;
  name: string;
  ein: string;
  jurisdiction: string;
  tokenAllotment: number;
  ledgerReserves: number;
}

export interface LedgerTransaction {
  id: string;
  timestamp: string;
  fromEntityId: string;
  toEntityId: string;
  amount: number;
  currency: string;
  signature: string;
  type: 'DEBIT' | 'CREDIT';
}

export interface DaemonProcess {
  id: string;
  name: string;
  pid: number;
  cpu: number;
  memory: number; // MB
  uptime: number; // Seconds
  status: 'ACTIVE' | 'STALLED' | 'OFFLINE';
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'ARM64_EDGE' | 'X86_64_WORKSTATION' | 'CLOUD_REPLICA';
  status: 'ACTIVE_SEALING' | 'HOT_STANDBY' | 'OFFLINE';
  latency: number;
  opsPerSec: number;
}
