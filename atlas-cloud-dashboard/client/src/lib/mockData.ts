import {
  Equipment,
  VRRPData,
  SDWANData,
  BGPData,
  IPsecData,
  FGCPData,
} from "./types";

// Equipment list
export const equipmentList: Equipment[] = [
  {
    id: "csr-bgr-1",
    name: "CSR-BGR-1",
    type: "csr",
    site: "Benguerir",
    status: "active",
    ip: "192.168.1.1",
    model: "Cisco CSR 1000v",
  },
  {
    id: "csr-bgr-2",
    name: "CSR-BGR-2",
    type: "csr",
    site: "Benguerir",
    status: "active",
    ip: "192.168.1.2",
    model: "Cisco CSR 1000v",
  },
  {
    id: "fgt-bgr-1-1",
    name: "FGT-BGR-1-1",
    type: "fortigate",
    site: "Benguerir",
    status: "active",
    ip: "192.168.1.10",
    model: "FortiGate 3100D",
  },
  {
    id: "csr-bkp-1",
    name: "CSR-BKP-1",
    type: "csr",
    site: "Backup",
    status: "standby",
    ip: "192.168.2.1",
    model: "Cisco CSR 1000v",
  },
  {
    id: "csr-bkp-2",
    name: "CSR-BKP-2",
    type: "csr",
    site: "Backup",
    status: "standby",
    ip: "192.168.2.2",
    model: "Cisco CSR 1000v",
  },
  {
    id: "fgt-bkp-1-1",
    name: "FGT-BKP-1-1",
    type: "fortigate",
    site: "Backup",
    status: "standby",
    ip: "192.168.2.10",
    model: "FortiGate 3100D",
  },
];

// VRRP Data
export const vrrpData: VRRPData = {
  site: "Benguerir",
  vlans: [
    {
      name: "WEB",
      vlan_id: 101,
      master: "CSR-BGR-1",
      backup: "CSR-BGR-2",
      status: "ok",
      subnet: "10.1.0.0/24",
      group: 1,
    },
    {
      name: "DB",
      vlan_id: 103,
      master: "CSR-BGR-1",
      backup: "CSR-BGR-2",
      status: "ok",
      subnet: "10.2.0.0/24",
      group: 2,
    },
    {
      name: "MGMT",
      vlan_id: 100,
      master: "CSR-BGR-1",
      backup: "CSR-BGR-2",
      status: "ok",
      subnet: "10.0.0.0/24",
      group: 3,
    },
    {
      name: "DMZ",
      vlan_id: 200,
      master: "CSR-BGR-2",
      backup: "CSR-BGR-1",
      status: "ok",
      subnet: "10.3.0.0/24",
      group: 4,
    },
  ],
};

// SD-WAN Data
export const sdwanData: SDWANData = {
  equipment: "FGT-BGR-1-1",
  metrics: [
    {
      port: "port1",
      latency: 12,
      packetLoss: 0.1,
      status: "active",
    },
    {
      port: "port2",
      latency: 45,
      packetLoss: 0.5,
      status: "standby",
    },
  ],
  activePort: "port1",
  historicalData: [
    {
      timestamp: "2026-08-09T02:00:00Z",
      port1Latency: 10,
      port2Latency: 48,
      port1Loss: 0.0,
      port2Loss: 0.8,
    },
    {
      timestamp: "2026-08-09T02:10:00Z",
      port1Latency: 12,
      port2Latency: 46,
      port1Loss: 0.1,
      port2Loss: 0.6,
    },
    {
      timestamp: "2026-08-09T02:20:00Z",
      port1Latency: 11,
      port2Latency: 44,
      port1Loss: 0.0,
      port2Loss: 0.4,
    },
    {
      timestamp: "2026-08-09T02:30:00Z",
      port1Latency: 13,
      port2Latency: 45,
      port1Loss: 0.2,
      port2Loss: 0.5,
    },
  ],
};

// BGP Data
export const bgpData: BGPData = {
  equipment: "FGT-BGR-1-1",
  neighbors: [
    {
      neighbor: "192.168.1.254",
      asn: "65001",
      state: "Established",
      prefixesReceived: 1250,
      localPref: 200,
    },
    {
      neighbor: "192.168.1.253",
      asn: "65002",
      state: "Established",
      prefixesReceived: 890,
      localPref: 150,
    },
    {
      neighbor: "192.168.2.254",
      asn: "65003",
      state: "Established",
      prefixesReceived: 450,
      localPref: 100,
    },
  ],
  activeOperator: "65001",
};

// IPsec Data
export const ipsecData: IPsecData = {
  equipment: "FGT-BGR-1-1",
  tunnels: [
    {
      name: "IPSEC-BENGUERIR-BACKUP",
      localAddress: "192.168.1.10",
      remoteAddress: "192.168.2.10",
      status: "active",
      packetsEncrypted: 1250000,
      bytesEncrypted: 850000000,
      packetsDecrypted: 1240000,
      bytesDecrypted: 840000000,
    },
    {
      name: "IPSEC-BENGUERIR-CLOUD",
      localAddress: "192.168.1.10",
      remoteAddress: "10.0.0.1",
      status: "active",
      packetsEncrypted: 890000,
      bytesEncrypted: 620000000,
      packetsDecrypted: 880000,
      bytesDecrypted: 610000000,
    },
    {
      name: "IPSEC-BACKUP-CLOUD",
      localAddress: "192.168.2.10",
      remoteAddress: "10.0.0.1",
      status: "down",
      packetsEncrypted: 0,
      bytesEncrypted: 0,
      packetsDecrypted: 0,
      bytesDecrypted: 0,
    },
  ],
};

// FGCP Data
export const fgcpData: FGCPData = {
  equipment: "FGT-BGR-1-1",
  nodes: [
    {
      name: "FGT-BGR-1-1",
      role: "Primary",
      syncStatus: "in-sync",
      uptime: "45 days 12h 34m",
      cpuUsage: 28,
      memoryUsage: 62,
    },
    {
      name: "FGT-BGR-1-2",
      role: "Secondary",
      syncStatus: "in-sync",
      uptime: "45 days 12h 32m",
      cpuUsage: 25,
      memoryUsage: 59,
    },
  ],
  clusterStatus: "healthy",
};

// Backup history
export const backupHistory = [
  {
    id: "backup-001",
    timestamp: "2026-08-09T01:00:00Z",
    equipment: ["CSR-BGR-1", "CSR-BGR-2", "FGT-BGR-1-1", "CSR-BKP-1", "CSR-BKP-2", "FGT-BKP-1-1"],
    status: "success",
    duration: 45, // seconds
  },
  {
    id: "backup-002",
    timestamp: "2026-08-08T01:00:00Z",
    equipment: ["CSR-BGR-1", "CSR-BGR-2", "FGT-BGR-1-1", "CSR-BKP-1", "CSR-BKP-2", "FGT-BKP-1-1"],
    status: "success",
    duration: 42,
  },
  {
    id: "backup-003",
    timestamp: "2026-08-07T01:00:00Z",
    equipment: ["CSR-BGR-1", "CSR-BGR-2", "FGT-BGR-1-1", "CSR-BKP-1", "CSR-BKP-2", "FGT-BKP-1-1"],
    status: "success",
    duration: 48,
  },
];
