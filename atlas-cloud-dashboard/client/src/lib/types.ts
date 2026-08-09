// Equipment types
export type EquipmentType = "csr" | "fortigate" | "switch" | "server";
export type EquipmentStatus = "active" | "standby" | "down" | "warning";

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  site: "Benguerir" | "Backup";
  status: EquipmentStatus;
  ip: string;
  model: string;
}

// VRRP types
export interface VLANInfo {
  name: string;
  vlan_id: number;
  master: string;
  backup: string;
  status: "ok" | "error" | "warning";
  subnet: string;
  group: number;
}

export interface VRRPData {
  site: string;
  vlans: VLANInfo[];
}

// SD-WAN types
export interface HealthMetric {
  port: string;
  latency: number; // ms
  packetLoss: number; // %
  status: "active" | "standby" | "down";
}

export interface SDWANData {
  equipment: string;
  metrics: HealthMetric[];
  activePort: string;
  historicalData: Array<{
    timestamp: string;
    port1Latency: number;
    port2Latency: number;
    port1Loss: number;
    port2Loss: number;
  }>;
}

// BGP types
export interface BGPNeighbor {
  neighbor: string;
  asn: string;
  state: "Established" | "Connect" | "Active" | "OpenSent" | "OpenConfirm" | "Idle";
  prefixesReceived: number;
  localPref?: number;
}

export interface BGPData {
  equipment: string;
  neighbors: BGPNeighbor[];
  activeOperator?: string;
}

// IPsec types
export interface IPsecTunnel {
  name: string;
  localAddress: string;
  remoteAddress: string;
  status: "active" | "down";
  packetsEncrypted: number;
  bytesEncrypted: number;
  packetsDecrypted: number;
  bytesDecrypted: number;
}

export interface IPsecData {
  equipment: string;
  tunnels: IPsecTunnel[];
}

// FGCP types
export interface ClusterNode {
  name: string;
  role: "Primary" | "Secondary";
  syncStatus: "in-sync" | "out-of-sync";
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
}

export interface FGCPData {
  equipment: string;
  nodes: ClusterNode[];
  clusterStatus: "healthy" | "degraded" | "critical";
}

// Automation types
export type AutomationTaskStatus = "pending" | "running" | "success" | "error";

export interface AutomationTask {
  id: string;
  name: string;
  description: string;
  status: AutomationTaskStatus;
  progress: number; // 0-100
  startTime: string;
  endTime?: string;
  error?: string;
}

export interface VLANCreationRequest {
  name: string;
  vlanId: number;
  subnet: string;
  site: "Benguerir" | "Backup";
  parentInterface: string;
}

export interface FailureSimulation {
  equipment: string;
  interfaceOrLink: string;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  recoveryTime: number; // seconds
}

// Connectivity test types
export interface ConnectivityTestStep {
  name: string;
  status: "pending" | "running" | "success" | "error";
  result?: string;
  duration?: number; // ms
}

export interface ConnectivityTestResult {
  id: string;
  startTime: string;
  endTime?: string;
  steps: ConnectivityTestStep[];
  overallStatus: "pending" | "running" | "success" | "error";
}
