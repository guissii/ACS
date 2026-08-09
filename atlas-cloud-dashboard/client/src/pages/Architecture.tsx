import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Router,
  Shield,
  Database,
  Network,
  Cloud,
  HardDrive,
  Info,
  Cable,
  Play,
  RefreshCcw,
  Activity,
  Power,
  Terminal,
  FileText,
  Download,
  Copy,
  X,
  Check
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type NodeStatus = "active" | "standby" | "down";
type NodeType = "cloud" | "router" | "switch" | "firewall" | "server";
type Site = "shared" | "benguerir" | "backup";

interface NodeData {
  id: string;
  name: string;
  type: NodeType;
  layer: number;
  site: Site;
  status: NodeStatus;
  ip?: string;
  model?: string;
  x: number;
  y: number;
  details?: Record<string, string>;
}

interface LinkData {
  id: string;
  source: string;
  target: string;
  sourcePort: string;
  targetPort: string;
  type?: "active" | "standby" | "vpn" | "vrrp";
  offset?: number;
  details?: Record<string, string>;
}

// Les coordonnées X et Y sont maintenant des pourcentages qui seront projetés
// sur un Canvas fixe de 1200px de large par 1600px de haut.
const nodes: NodeData[] = [
  // COUCHE 1 : OPÉRATEURS
  { id: "inw", name: "Inw", type: "cloud", layer: 1, site: "shared", status: "active", x: 20, y: 4 },
  { id: "ora", name: "Ora", type: "cloud", layer: 1, site: "shared", status: "active", x: 50, y: 4 },
  { id: "iam", name: "IAM", type: "cloud", layer: 1, site: "shared", status: "active", x: 80, y: 4 },

  // COUCHE 2 : BORDER ROUTERS
  { id: "r-bgr-1", name: "R-BGR-1", type: "router", layer: 2, site: "benguerir", status: "active", x: 18, y: 16, details: { "e0/1 → Inw": "10.100.1.1", "e0/1 → Ora": "10.100.3.1", "e0/1 → IAM": "10.100.5.1", "BGP": "Pref Inw=200 > Ora=150 > IAM=100" } },
  { id: "r-bgr-2", name: "R-BGR-2", type: "router", layer: 2, site: "benguerir", status: "active", x: 38, y: 16, details: { "e0/1 → Inw": "10.100.2.1", "e0/1 → Ora": "10.100.4.1", "e0/1 → IAM": "10.100.6.1" } },
  { id: "r-bkp-3", name: "R-BGR-3", type: "router", layer: 2, site: "backup", status: "standby", x: 62, y: 16 },
  { id: "r-bkp-4", name: "R-BGR-4", type: "router", layer: 2, site: "backup", status: "standby", x: 82, y: 16 },

  // COUCHE 3 : SWITCHES DISTRIBUTION
  { id: "sw-bgr-1", name: "SW-BGR-1", type: "switch", layer: 3, site: "benguerir", status: "active", x: 18, y: 28 },
  { id: "sw-bgr-2", name: "SW-BGR-2", type: "switch", layer: 3, site: "benguerir", status: "active", x: 38, y: 28 },
  { id: "sw-bkp-1", name: "SW-BKP-BGR-1", type: "switch", layer: 3, site: "backup", status: "standby", x: 62, y: 28 },
  { id: "sw-bkp-2", name: "SW-BKP-BGR-2", type: "switch", layer: 3, site: "backup", status: "standby", x: 82, y: 28 },

  // COUCHE 4 : FORTIGATE (Cluster FGCP)
  { id: "fgt-bgr-1", name: "FGT-BGR-1-1", type: "firewall", layer: 4, site: "benguerir", status: "active", x: 18, y: 42, details: { "Role": "Primary", "Heartbeat": "e4, e5", "Tunnel ADVPN 1": "172.16.1.1 (vpn1)", "Tunnel ADVPN 2": "172.17.1.1 (vpn2)", "BGP": "AS 65100, voisin 172.16.1.2", "SD-WAN": "web-critical, db-standard, default" } },
  { id: "fgt-bgr-2", name: "FGT-BGR-1-2", type: "firewall", layer: 4, site: "benguerir", status: "standby", x: 38, y: 42, details: { "Role": "Secondary", "Heartbeat": "e4, e5" } },
  { id: "fgt-bkp-1", name: "FGT-BKP-1-1", type: "firewall", layer: 4, site: "backup", status: "standby", x: 62, y: 42, details: { "Role": "Primary", "ADVPN": "172.16.1.2", "BGP": "AS 65200", "Heartbeat": "e4, e5" } },
  { id: "fgt-bkp-2", name: "FGT-BKP-1-2", type: "firewall", layer: 4, site: "backup", status: "standby", x: 82, y: 42, details: { "Role": "Secondary", "Heartbeat": "e4, e5" } },

  // COUCHE 5 : SWITCHES VERS CSR
  { id: "sw-bgr-3", name: "SW-BGR-3", type: "switch", layer: 5, site: "benguerir", status: "active", x: 18, y: 56 },
  { id: "sw-bgr-4", name: "SW-BGR-4", type: "switch", layer: 5, site: "benguerir", status: "active", x: 38, y: 56 },
  { id: "sw-bkp-3", name: "SW-BKP-CSR-1", type: "switch", layer: 5, site: "backup", status: "standby", x: 62, y: 56 },
  { id: "sw-bkp-4", name: "SW-BKP-CSR-3", type: "switch", layer: 5, site: "backup", status: "standby", x: 82, y: 56 },

  // COUCHE 6 : CSR (Cœur routage + VRRP)
  { id: "csr-bgr-1", name: "CSR-BGR-1", type: "router", layer: 6, site: "benguerir", status: "active", x: 18, y: 70, details: { "VRRP": "Master", "Po10": "Gi5, Gi6 (10.10.10.1)", "Vers IOU1": "Gi8 (trunk 101,103)", "Vers IOU2": "Gi7 (trunk 199)" } },
  { id: "csr-bgr-2", name: "CSR-BGR-2", type: "router", layer: 6, site: "benguerir", status: "standby", x: 38, y: 70, details: { "VRRP": "Backup", "Po10": "Gi3, Gi6 (10.10.10.2)", "Vers IOU1": "Gi5 (trunk 101,103)", "Vers IOU2": "Gi7 (trunk 199)" } },
  { id: "csr-bkp-1", name: "CSR-BKP-1", type: "router", layer: 6, site: "backup", status: "standby", x: 62, y: 70, details: { "VRRP": "Master", "Po10": "Gi4 (10.20.20.1)", "Vers IOU3": "Gi2 (trunk 111)", "Vers IOU4": "Gi3 (trunk 113)" } },
  { id: "csr-bkp-2", name: "CSR-BKP-2", type: "router", layer: 6, site: "backup", status: "standby", x: 82, y: 70, details: { "VRRP": "Backup", "Po10": "Gi2 (10.20.20.2)", "Vers IOU3": "Gi5 (trunk 111)", "Vers IOU4": "Gi7 (trunk 113)" } },

  // COUCHE 7 : SWITCHES SERVEURS (IOU)
  { id: "iou-1", name: "IOU1", type: "switch", layer: 7, site: "benguerir", status: "active", x: 18, y: 84, details: { "VLANs": "101, 103" } },
  { id: "iou-2", name: "IOU2", type: "switch", layer: 7, site: "benguerir", status: "active", x: 38, y: 84, details: { "VLANs": "199" } },
  { id: "iou-3", name: "IOU3", type: "switch", layer: 7, site: "backup", status: "standby", x: 62, y: 84, details: { "VLANs": "111" } },
  { id: "iou-4", name: "IOU4", type: "switch", layer: 7, site: "backup", status: "standby", x: 82, y: 84, details: { "VLANs": "113" } },

  // COUCHE 8 : SERVEURS
  { id: "srv-web", name: "srv-web", type: "server", layer: 8, site: "benguerir", status: "active", x: 10, y: 96, ip: "192.168.101.4/29", details: { "Gateway": ".1", "Port": "IOU1(Et0/1)" } },
  { id: "srv-db", name: "srv-db", type: "server", layer: 8, site: "benguerir", status: "active", x: 26, y: 96, ip: "192.168.103.4/29", details: { "Gateway": ".1", "Port": "IOU1(Et0/2)" } },
  { id: "srv-admin", name: "alpine-admin", type: "server", layer: 8, site: "benguerir", status: "active", x: 38, y: 96, ip: "192.168.199.4/29", details: { "Gateway": ".2", "Port": "IOU2(Et0/2)" } },
  { id: "srv-web-bkp", name: "srv-web-bkp", type: "server", layer: 8, site: "backup", status: "standby", x: 62, y: 96, ip: "192.168.111.4/29", details: { "Gateway": ".1", "Port": "IOU3(Et0/3)" } },
  { id: "srv-db-bkp", name: "srv-db-bkp", type: "server", layer: 8, site: "backup", status: "standby", x: 82, y: 96, ip: "192.168.113.4/29", details: { "Gateway": ".1", "Port": "IOU4(Et0/2)" } }
];

const links: LinkData[] = [
  // --- OPÉRATEURS ↔ BORDER ROUTERS (Benguerir) ---
  { id: "l1", source: "inw", target: "r-bgr-1", sourcePort: "e0/0", targetPort: "e0/0" },
  { id: "l2", source: "inw", target: "r-bgr-2", sourcePort: "e0/1", targetPort: "e0/0" },
  { id: "l3", source: "ora", target: "r-bgr-1", sourcePort: "e0/0", targetPort: "e0/1" },
  { id: "l4", source: "ora", target: "r-bgr-2", sourcePort: "e0/1", targetPort: "e0/1" },
  { id: "l5", source: "iam", target: "r-bgr-1", sourcePort: "e0/0", targetPort: "e0/2" },
  { id: "l6", source: "iam", target: "r-bgr-2", sourcePort: "e0/1", targetPort: "e0/2" },

  // --- OPÉRATEURS ↔ BORDER ROUTERS (Backup) ---
  { id: "l7", source: "inw", target: "r-bkp-3", sourcePort: "e0/2", targetPort: "e0/1", type: "standby" },
  { id: "l8", source: "inw", target: "r-bkp-4", sourcePort: "e0/3", targetPort: "e0/0", type: "standby" },
  { id: "l9", source: "ora", target: "r-bkp-3", sourcePort: "e0/2", targetPort: "e0/2", type: "standby" },
  { id: "l10", source: "ora", target: "r-bkp-4", sourcePort: "e0/3", targetPort: "e0/1", type: "standby" },
  { id: "l11", source: "iam", target: "r-bkp-3", sourcePort: "e0/2", targetPort: "e0/0", type: "standby" },
  { id: "l12", source: "iam", target: "r-bkp-4", sourcePort: "e0/3", targetPort: "e0/2", type: "standby" },

  // --- BORDER ROUTERS ↔ SWITCHES (Benguerir) ---
  { id: "l13", source: "r-bgr-1", target: "sw-bgr-1", sourcePort: "e0/3", targetPort: "e0" },
  { id: "l14", source: "r-bgr-2", target: "sw-bgr-2", sourcePort: "e0/3", targetPort: "e1" },
  // Liens directs entre Border Routers
  { id: "l15", source: "r-bgr-1", target: "r-bgr-2", sourcePort: "e1/1", targetPort: "e1/0", offset: -1.2 },
  { id: "l16", source: "r-bgr-1", target: "r-bgr-2", sourcePort: "e1/2", targetPort: "e1/3", offset: 1.2, details: { "Note": "Lien direct DUPLIQUÉ" } },

  // --- BORDER ROUTERS ↔ SWITCHES (Backup) ---
  { id: "l17", source: "r-bkp-3", target: "sw-bkp-1", sourcePort: "e1/1", targetPort: "e0", type: "standby" },
  { id: "l18", source: "r-bkp-4", target: "sw-bkp-2", sourcePort: "e1/1", targetPort: "e1", type: "standby" },
  { id: "l19", source: "r-bkp-3", target: "r-bkp-4", sourcePort: "e0/3", targetPort: "e1/0", type: "standby", offset: -1.2 },
  { id: "l20", source: "r-bkp-3", target: "r-bkp-4", sourcePort: "e0/1", targetPort: "e0/3", type: "standby", offset: 1.2, details: { "Note": "Lien direct DUPLIQUÉ" } },

  // --- SWITCHES ↔ FORTIGATE (Benguerir) ---
  { id: "l21", source: "sw-bgr-1", target: "fgt-bgr-1", sourcePort: "e1", targetPort: "e0" },
  { id: "l22", source: "sw-bgr-1", target: "fgt-bgr-2", sourcePort: "e2", targetPort: "e0" },
  { id: "l23", source: "sw-bgr-2", target: "fgt-bgr-1", sourcePort: "e1", targetPort: "e1" },
  { id: "l24", source: "sw-bgr-2", target: "fgt-bgr-2", sourcePort: "e2", targetPort: "e1" },

  // --- SWITCHES ↔ FORTIGATE (Backup) ---
  { id: "l25", source: "sw-bkp-1", target: "fgt-bkp-1", sourcePort: "e1", targetPort: "e0", type: "standby" },
  { id: "l26", source: "sw-bkp-1", target: "fgt-bkp-2", sourcePort: "e2", targetPort: "e0", type: "standby" },
  { id: "l27", source: "sw-bkp-2", target: "fgt-bkp-1", sourcePort: "e1", targetPort: "e1", type: "standby" },
  { id: "l28", source: "sw-bkp-2", target: "fgt-bkp-2", sourcePort: "e2", targetPort: "e1", type: "standby" },

  // --- FORTIGATE ↔ FORTIGATE (Heartbeat FGCP & Liens directs) ---
  { id: "l31", source: "fgt-bgr-1", target: "fgt-bgr-2", sourcePort: "e4", targetPort: "e4", type: "vrrp", offset: -1.0, details: { "Usage": "Heartbeat FGCP 1" } },
  { id: "l32", source: "fgt-bgr-1", target: "fgt-bgr-2", sourcePort: "e5", targetPort: "e5", type: "vrrp", offset: 1.0, details: { "Usage": "Heartbeat FGCP 2" } },
  { id: "l35", source: "fgt-bkp-1", target: "fgt-bkp-2", sourcePort: "e4", targetPort: "e4", type: "vrrp", offset: -1.0, details: { "Usage": "Heartbeat FGCP 1" } },
  { id: "l36", source: "fgt-bkp-1", target: "fgt-bkp-2", sourcePort: "e5", targetPort: "e5", type: "vrrp", offset: 1.0, details: { "Usage": "Heartbeat FGCP 2" } },

  // --- LIAISON INTER-SITES (ADVPN & BGP Overlay) ---
  { id: "l37", source: "fgt-bgr-1", target: "fgt-bkp-1", sourcePort: "port1", targetPort: "port1", type: "vpn", offset: -0.6, details: { "Usage": "Tunnel IPsec ADVPN", "IPs": "172.16.1.1 ↔ 172.16.1.2 (IKEv2 UDP500 + ESP)", "BGP": "AS 65100 ↔ AS 65200 (TCP 179)" } },
  { id: "l38", source: "fgt-bgr-1", target: "fgt-bkp-1", sourcePort: "port2", targetPort: "port2", type: "vpn", offset: 0.6, details: { "Usage": "Tunnel IPsec ADVPN-2 (secours)", "IPs": "172.17.1.1 ↔ 172.17.1.2" } },

  // --- FORTIGATE ↔ SWITCHES INTERNES (Benguerir) ---
  { id: "l39", source: "fgt-bgr-1", target: "sw-bgr-3", sourcePort: "e2", targetPort: "e0" },
  { id: "l40", source: "fgt-bgr-1", target: "sw-bgr-4", sourcePort: "e3", targetPort: "e1" },
  { id: "l41", source: "fgt-bgr-2", target: "sw-bgr-3", sourcePort: "e2", targetPort: "e1" },
  { id: "l42", source: "fgt-bgr-2", target: "sw-bgr-4", sourcePort: "e3", targetPort: "e0" },

  // --- FORTIGATE ↔ SWITCHES INTERNES (Backup) ---
  { id: "l43", source: "fgt-bkp-1", target: "sw-bkp-3", sourcePort: "e2", targetPort: "e0", type: "standby" },
  { id: "l44", source: "fgt-bkp-1", target: "sw-bkp-4", sourcePort: "e3", targetPort: "e1", type: "standby" },
  { id: "l45", source: "fgt-bkp-2", target: "sw-bkp-3", sourcePort: "e2", targetPort: "e1", type: "standby" },
  { id: "l46", source: "fgt-bkp-2", target: "sw-bkp-4", sourcePort: "e3", targetPort: "e0", type: "standby" },

  // --- SWITCHES ↔ CSR (Benguerir) ---
  { id: "l47", source: "sw-bgr-3", target: "csr-bgr-1", sourcePort: "e0", targetPort: "Gi1" },
  { id: "l48", source: "sw-bgr-4", target: "csr-bgr-2", sourcePort: "e0", targetPort: "Gi1" },

  // --- SWITCHES ↔ CSR (Backup) ---
  { id: "l49", source: "sw-bkp-3", target: "csr-bkp-1", sourcePort: "e0", targetPort: "Gi1", type: "standby" },
  { id: "l50", source: "sw-bkp-4", target: "csr-bkp-2", sourcePort: "e0", targetPort: "Gi1", type: "standby" },

  // --- CSR ↔ CSR (Port-Channel) ---
  { id: "l51", source: "csr-bgr-1", target: "csr-bgr-2", sourcePort: "Gi5", targetPort: "Gi3", type: "vrrp", offset: -1.0, details: { "Usage": "Port-channel10", "IPs": "10.10.10.1 ↔ 10.10.10.2" } },
  { id: "l52", source: "csr-bgr-1", target: "csr-bgr-2", sourcePort: "Gi6", targetPort: "Gi6", type: "vrrp", offset: 1.0, details: { "Usage": "Port-channel10 (DUPLIQUÉ LACP)" } },
  { id: "l53", source: "csr-bkp-1", target: "csr-bkp-2", sourcePort: "Gi4", targetPort: "Gi2", type: "vrrp", details: { "Usage": "Port-channel10", "IPs": "10.20.20.1 ↔ 10.20.20.2" } },

  // --- CSR ↔ SWITCHES SERVEURS (Benguerir) ---
  { id: "l54", source: "csr-bgr-1", target: "iou-1", sourcePort: "Gi8", targetPort: "Et2/0", details: { "Sous-interfaces": "Gi8.101 (VLAN WEB), Gi8.103 (VLAN DB)" } },
  { id: "l55", source: "csr-bgr-2", target: "iou-1", sourcePort: "Gi5", targetPort: "Et2/1", details: { "Sous-interfaces": "Gi5.101 (VLAN WEB), Gi5.103 (VLAN DB)" } },
  { id: "l56", source: "csr-bgr-1", target: "iou-2", sourcePort: "Gi7", targetPort: "Et1/0", details: { "Sous-interfaces": "Gi7.199 (VLAN Management)" } },
  { id: "l57", source: "csr-bgr-2", target: "iou-2", sourcePort: "Gi7", targetPort: "Et1/1", details: { "Sous-interfaces": "Gi7.199 (VLAN Management)" } },

  // --- CSR ↔ SWITCHES SERVEURS (Backup) ---
  { id: "l58", source: "csr-bkp-1", target: "iou-3", sourcePort: "Gi2", targetPort: "Et0/0", type: "standby", details: { "Sous-interfaces": "Gi2.111 (VLAN WEB)" } },
  { id: "l59", source: "csr-bkp-2", target: "iou-3", sourcePort: "Gi5", targetPort: "Et0/1", type: "standby", details: { "Sous-interfaces": "Gi5.111 (VLAN WEB)" } },
  { id: "l60", source: "csr-bkp-1", target: "iou-4", sourcePort: "Gi3", targetPort: "Et0/0", type: "standby", details: { "Sous-interfaces": "Gi3.113 (VLAN DB)" } },
  { id: "l61", source: "csr-bkp-2", target: "iou-4", sourcePort: "Gi7", targetPort: "Et0/1", type: "standby", details: { "Sous-interfaces": "Gi7.113 (VLAN DB)" } },

  // --- SWITCHES SERVEURS ↔ ENDPOINTS (Benguerir) ---
  { id: "l62", source: "iou-1", target: "srv-web", sourcePort: "Et0/1", targetPort: "eth0" },
  { id: "l63", source: "iou-1", target: "srv-db", sourcePort: "Et0/2", targetPort: "eth0" },
  { id: "l64", source: "iou-2", target: "srv-admin", sourcePort: "Et0/2", targetPort: "eth0" },

  // --- SWITCHES SERVEURS ↔ ENDPOINTS (Backup) ---
  { id: "l65", source: "iou-3", target: "srv-web-bkp", sourcePort: "Et0/3", targetPort: "eth0", type: "standby" },
  { id: "l66", source: "iou-4", target: "srv-db-bkp", sourcePort: "Et0/2", targetPort: "eth0", type: "standby" }
];

function getEquipmentIcon(type: NodeType, status: NodeStatus) {
  const baseClass = "transition-colors";
  let colorClass = "text-[#1A1D23]";

  if (status === "active") colorClass = "text-[#1B3A5C]";
  else if (status === "standby") colorClass = "text-[#B45309]";
  else if (status === "down") colorClass = "text-red-600";

  const iconProps = { size: 24, className: `${baseClass} ${colorClass}`, strokeWidth: 1.5 };

  switch (type) {
    case "router": return <Router {...iconProps} />;
    case "firewall": return <Shield {...iconProps} />;
    case "switch": return <Network {...iconProps} />;
    case "server": return <HardDrive {...iconProps} />;
    case "cloud": return <Cloud {...iconProps} />;
    default: return <Database {...iconProps} />;
  }
}

function getLinkColor(type?: string) {
  if (type === "vrrp") return "#1A1D23"; 
  if (type === "vpn") return "#B45309"; 
  if (type === "standby") return "#9CA3AF"; 
  return "#2D6A4F"; 
}

const IOU_CONFIG_DATA: Record<string, any> = {
  "iou-1": {
    "type": "Switch Layer 2 (Cisco IOU)",
    "image": "i86bi-linux-l2-adventerprisek9-15.2d.bin",
    "vlans": [
      {"id": 101, "name": "WEB"},
      {"id": 103, "name": "DB"}
    ],
    "protocols": {
      "spanning_tree": "RSTP",
      "portfast": true,
      "igmp_snooping": false
    },
    "ports": [
      {
        "port": "Et2/0",
        "mode": "trunk",
        "encapsulation": "802.1Q",
        "vlans_allowed": [101, 103],
        "connected_to": "CSR-BGR-1",
        "portfast": "trunk"
      },
      {
        "port": "Et2/1",
        "mode": "trunk",
        "encapsulation": "802.1Q",
        "vlans_allowed": [101, 103],
        "connected_to": "CSR-BGR-2",
        "portfast": "trunk"
      },
      {
        "port": "Et0/1",
        "mode": "access",
        "vlan": 101,
        "connected_to": "srv-web-final-1"
      },
      {
        "port": "Et0/2",
        "mode": "access",
        "vlan": 103,
        "connected_to": "srv-db-final-1"
      }
    ]
  },
  "iou-2": {
    "type": "Switch Layer 2 (Cisco IOU)",
    "image": "i86bi-linux-l2-adventerprisek9-15.2d.bin",
    "vlans": [
      {"id": 199, "name": "MANAGEMENT"}
    ],
    "protocols": {
      "spanning_tree": "RSTP",
      "portfast": true,
      "igmp_snooping": false
    },
    "ports": [
      {
        "port": "Et1/0",
        "mode": "trunk",
        "encapsulation": "802.1Q",
        "vlans_allowed": [199],
        "connected_to": "CSR-BGR-1",
        "portfast": "trunk"
      },
      {
        "port": "Et1/1",
        "mode": "trunk",
        "encapsulation": "802.1Q",
        "vlans_allowed": [199],
        "connected_to": "CSR-BGR-2",
        "portfast": "trunk"
      },
      {
        "port": "Et0/2",
        "mode": "access",
        "vlan": 199,
        "connected_to": "alpine-admin-final-1"
      }
    ]
  }
};

const CSR_CONFIG_DATA: Record<string, any> = {
  "csr-bgr-1": {
    "role": "Master VRRP",
    "loopback": "3.3.3.1/32",
    "interfaces": {
      "GigabitEthernet1": {
        "role": "Uplink FortiGate",
        "ip": "10.100.40.2/30",
        "protocol": "static",
        "verify_cmd": "show interfaces GigabitEthernet1"
      },
      "Port-channel10": {
        "role": "Redondance inter-CSR",
        "protocol": "LACP",
        "mode": "active",
        "members": ["GigabitEthernet5", "GigabitEthernet6"],
        "ip": "10.10.10.1/30",
        "verify_cmd": "show etherchannel summary"
      },
      "GigabitEthernet8.101": {
        "role": "VLAN WEB",
        "encapsulation": "802.1Q",
        "vlan": 101,
        "ip": "192.168.101.2/29",
        "vrrp": {"group": 1, "vip": "192.168.101.1", "priority": 110, "state": "Master"},
        "verify_cmd": "show vrrp brief"
      },
      "GigabitEthernet8.103": {
        "role": "VLAN DB",
        "encapsulation": "802.1Q",
        "vlan": 103,
        "ip": "192.168.103.2/29",
        "vrrp": {"group": 2, "vip": "192.168.103.1", "priority": 110, "state": "Master"}
      },
      "GigabitEthernet7.199": {
        "role": "VLAN Management",
        "encapsulation": "802.1Q",
        "vlan": 199,
        "ip": "192.168.199.2/29",
        "vrrp": {"group": 30, "vip": "192.168.199.1", "priority": 110, "state": "Master"}
      },
      "nve1": {
        "role": "VXLAN",
        "vni": 10030,
        "vtep_source": "Loopback0",
        "peers": ["5.5.5.1", "5.5.5.2"],
        "verify_cmd": "show nve vni"
      }
    },
    "network_driver": "vmxnet3"
  },
  "csr-bgr-2": {
    "role": "Backup VRRP",
    "loopback": "3.3.3.2/32",
    "interfaces": {
      "GigabitEthernet1": {
        "ip": "10.100.41.2/30"
      },
      "Port-channel10": {
        "members": ["GigabitEthernet3", "GigabitEthernet6"],
        "ip": "10.10.10.2/30"
      },
      "GigabitEthernet5.101": {
        "vlan": 101,
        "ip": "192.168.101.3/29",
        "vrrp": {"group": 1, "priority": 100, "state": "Backup"}
      },
      "GigabitEthernet5.103": {
        "vlan": 103,
        "ip": "192.168.103.3/29",
        "vrrp": {"group": 2, "priority": 100, "state": "Backup"}
      },
      "GigabitEthernet7.199": {
        "vlan": 199,
        "ip": "192.168.199.3/29",
        "vrrp": {"group": 30, "priority": 100, "state": "Backup"}
      }
    },
    "network_driver": "vmxnet3"
  }
};

const FGT_CONFIG_DATA: Record<string, any> = {
  "fgt-bgr-1": {
    "role": "Primary FGCP",
    "hostname": "FGT-BGR-1-1",
    "ha": {
      "group_id": 10,
      "priority": 200,
      "mode": "a-p",
      "verify_cmd": "get system ha status"
    },
    "interfaces": {
      "port1": {"ip": "10.100.20.2/30", "role": "SD-WAN member vers R-BGR-1"},
      "port2": {"ip": "10.100.22.2/30", "role": "SD-WAN member vers R-BGR-2"},
      "port3": {"ip": "10.100.40.1/30", "role": "vers CSR-BGR-1"},
      "port4": {"ip": "10.100.41.1/30", "role": "vers CSR-BGR-2"},
      "port5": {"role": "Heartbeat FGCP"},
      "port6": {"role": "Heartbeat FGCP"}
    },
    "ipsec": {
      "ADVPN": {
        "type": "dynamic", "interface": "port1", "ike": "IKEv2",
        "proposal": "des-sha256", "dhgrp": 14, "tunnel_ip": "172.16.1.1",
        "verify_cmd": "diagnose vpn tunnel list"
      },
      "ADVPN-2": {
        "type": "dynamic", "interface": "port2", "tunnel_ip": "172.17.1.1"
      }
    },
    "bgp": {
      "as": 65100, "router_id": "172.16.1.1", "neighbor": "172.16.1.2",
      "remote_as": 65200,
      "networks": ["3.3.3.1/32", "3.3.3.2/32", "192.168.101.0/29", "192.168.103.0/29"],
      "verify_cmd": "get router info bgp summary"
    },
    "sdwan": {
      "zone": "virtual-wan-link",
      "members": ["port1", "port2"],
      "health_checks": [
        {"name": "checkport1", "server": "10.200.20.1", "member": "port1"},
        {"name": "checkport2", "server": "10.200.22.1", "member": "port2"}
      ],
      "services": [
        {"name": "web-critical", "mode": "sla", "src": "WEB-BGR", "dst": "WEB-BKP"},
        {"name": "db-standard", "mode": "load-balance", "src": "DB-BGR", "dst": "DB-BKP"},
        {"name": "default-catch-all", "mode": "load-balance", "src": "all", "dst": "all"}
      ],
      "verify_cmd": "diagnose sys sdwan service"
    },
    "firewall_policies": 6
  },
  "fgt-bgr-2": {
    "role": "Secondary FGCP",
    "priority": 100,
    "sync_status": "auto (in-sync avec Primary)"
  }
};

const RBGR_CONFIG_DATA: Record<string, any> = {
  "r-bgr-1": {
    "role": "Border Router",
    "site": "Benguerir",
    "loopback": "1.1.1.1/32",
    "as": 65100,
    "operators": [
      {"name": "Inw", "interface": "e0/0", "ip": "10.100.1.1", "remote_as": 65001, "local_pref": 200},
      {"name": "Ora", "interface": "e0/1", "ip": "10.100.3.1", "remote_as": 65002, "local_pref": 150},
      {"name": "IAM", "interface": "e0/2", "ip": "10.100.5.1", "remote_as": 65003, "local_pref": 100}
    ],
    "ibgp_neighbor": {"peer": "R-BGR-2", "ip": "1.1.1.2"},
    "internal_links": [
      {"local": "e1/1", "remote": "R-BGR-2:e1/0"},
      {"local": "e1/2", "remote": "R-BGR-2:e1/3", "note": "dupliqué, résilience"}
    ],
    "downstream": {"port": "e0/3", "connected_to": "SW-BGR-1:e0"},
    "route_maps": {
      "PREFER-INW": {"local_preference": 200},
      "PREFER-ORA": {"local_preference": 150},
      "PREFER-IAM": {"local_preference": 100}
    },
    "verify_commands": [
      "show ip bgp summary",
      "show ip bgp",
      "show route-map"
    ],
    "tested_failover": true
  },
  "r-bgr-2": {
    "role": "Border Router",
    "site": "Benguerir",
    "loopback": "1.1.1.2/32",
    "operators": [
      {"name": "Inw", "interface": "e0/0", "ip": "10.100.2.1"},
      {"name": "Ora", "interface": "e0/1", "ip": "10.100.4.1"},
      {"name": "IAM", "interface": "e0/2", "ip": "10.100.6.1"}
    ],
    "downstream": {"port": "e0/3", "connected_to": "SW-BGR-2:e1"}
  },
  "r-bkp-3": {
    "role": "Border Router",
    "site": "Backup",
    "operators": [
      {"name": "Inw", "interface": "e0/1", "ip": "10.200.1.1"},
      {"name": "Ora", "interface": "e0/2", "ip": "10.200.3.1"},
      {"name": "IAM", "interface": "e0/0", "ip": "10.200.5.1"}
    ],
    "downstream": {"port": "e1/1", "connected_to": "SW-BKP-BGR-1"}
  },
  "r-bkp-4": {
    "role": "Border Router",
    "site": "Backup",
    "operators": [
      {"name": "Inw", "interface": "e0/0", "ip": "10.200.2.1"},
      {"name": "Ora", "interface": "e0/1", "ip": "10.200.4.1"},
      {"name": "IAM", "interface": "e0/2", "ip": "10.200.6.1"}
    ],
    "downstream": {"port": "e1/1", "connected_to": "SW-BKP-BGR-2"}
  }
};

export default function Architecture() {
  const [selectedElement, setSelectedElement] = useState<{ type: 'node' | 'link', data: NodeData | LinkData } | null>(null);
  const [isLogicalView, setIsLogicalView] = useState(false);
  
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isDeployingVlan, setIsDeployingVlan] = useState(false);

  // URL du backend Flask sur la VM Ubuntu
  const API_BASE_URL = "http://192.168.48.129:5000/api";

  const [devicesStatus, setDevicesStatus] = useState<Record<string, { online: boolean, status: string, error?: string }>>({});
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  
  // Modal de visualisation de sauvegarde
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [backupContent, setBackupContent] = useState<string | null>(null);
  const [backupTitle, setBackupTitle] = useState<string>("");
  const [isSingleBackingUp, setIsSingleBackingUp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch(`${API_BASE_URL}/devices/status`);
      if (res.ok) {
        const data = await res.json();
        setDevicesStatus(data);
      }
    } catch (e) {
      console.error("Erreur récupération statut temps réel:", e);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleBackupSingleDevice = async (deviceName: string) => {
    setIsSingleBackingUp(deviceName);
    try {
      const res = await fetch(`${API_BASE_URL}/automation/backup/${deviceName}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupTitle(`Sauvegarde Horodatée - ${deviceName}`);
        const stdoutStr = data.stdout || "";
        const fileMatch = stdoutStr.match(/->\s*(.+)/);
        if (fileMatch) {
          const filepath = fileMatch[1].trim();
          const filename = filepath.split('/').pop();
          const contentRes = await fetch(`${API_BASE_URL}/automation/backup-content/${filename}`);
          if (contentRes.ok) {
            const contentData = await contentRes.json();
            setBackupContent(contentData.content);
          } else {
            setBackupContent(data.stdout);
          }
        } else {
          setBackupContent(data.stdout);
        }
        setBackupModalOpen(true);
      } else {
        alert(`❌ Échec de la sauvegarde pour ${deviceName}: ${data.stderr || data.error || 'Équipement hors tension'}`);
      }
    } catch (e) {
      alert(`❌ Impossible de contacter le serveur Flask pour ${deviceName}.`);
    } finally {
      setIsSingleBackingUp(null);
    }
  };

  const handleBackupAll = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch(`${API_BASE_URL}/automation/backup-all-async`, { method: 'POST' });
      if (res.ok) {
        alert("✅ Backup global asynchrone lancé avec succès sur la VM !");
      } else {
        alert("❌ Erreur lors du lancement du backup.");
      }
    } catch (e) {
      alert("❌ Impossible de joindre l'API sur la VM ! Vérifiez que le serveur Flask (app.py) tourne.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDeployVlan = async (site: string) => {
    setIsDeployingVlan(true);
    try {
      const res = await fetch(`${API_BASE_URL}/automation/create-vlan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: site,
          vlan_id: 150,
          vlan_name: "NEW_APP_VLAN",
          subnet_master: "192.168.150.2",
          subnet_backup: "192.168.150.3",
          vip_address: "192.168.150.1"
        })
      });
      if (res.ok) {
        alert(`✅ VLAN 150 (NEW_APP_VLAN) déployé avec VRRP actif sur les CSR du site ${site} !`);
      } else {
        alert("❌ Échec du déploiement Ansible.");
      }
    } catch (e) {
      alert("❌ Impossible de joindre l'API sur la VM ! Vérifiez que le serveur Flask (app.py) tourne.");
    } finally {
      setIsDeployingVlan(false);
    }
  };

  const isNode = selectedElement?.type === 'node';
  const nodeData = isNode && selectedElement ? (selectedElement.data as NodeData) : null;
  const linkData = !isNode && selectedElement ? (selectedElement.data as LinkData) : null;

  // Dimensions absolues du Canvas pour un rendu proportionnel parfait et détection de collisions
  const CANVAS_W = 1200;
  const CANVAS_H = 1600;
  
  const placedLabels: { x: number, y: number }[] = [];

  const renderedLinks = links.map((link) => {
    const sourceNode = nodes.find(n => n.id === link.source);
    const targetNode = nodes.find(n => n.id === link.target);
    if (!sourceNode || !targetNode) return null;

    const isLogicalOnlyLink = link.type === "vpn" || link.source === "inw" || link.source === "ora" || link.source === "iam" || link.details?.BGP;
    const isPhysicalOnlyNode = sourceNode.type === "switch" || targetNode.type === "switch";

    // Filtrage des éléments selon la vue
    if (isLogicalView && isPhysicalOnlyNode && !isLogicalOnlyLink) return null;
    if (isLogicalView && (sourceNode.type === "server" || targetNode.type === "server")) return null;
    
    // SUPPRESSION des lignes ADVPN pointillées transversales en vue PHYSIQUE pure
    if (!isLogicalView && link.type === "vpn") return null;

    // Conversion % -> pixels absolus
    const spx = sourceNode.x * (CANVAS_W / 100);
    const spy = sourceNode.y * (CANVAS_H / 100);
    const tpx = targetNode.x * (CANVAS_W / 100);
    const tpy = targetNode.y * (CANVAS_H / 100);

    const dx = tpx - spx;
    const dy = tpy - spy;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = len === 0 ? 0 : dx / len;
    const ny = len === 0 ? 0 : dy / len;
    
    // Application de l'offset pour câbles parallèles (1 unité = 10px)
    let ox = 0, oy = 0;
    if (link.offset) {
      const pxOffset = link.offset * 10;
      if (Math.abs(dx) > Math.abs(dy)) oy = pxOffset; 
      else ox = pxOffset; 
    }

    const startX = spx + ox;
    const startY = spy + oy;
    const endX = tpx + ox;
    const endY = tpy + oy;

    let forceSourceSide: -1 | 1 | undefined = undefined;
    let forceTargetSide: -1 | 1 | undefined = undefined;

    // --- Équilibrage géométrique strict ---
    // On force l'alignement UNIQUEMENT sur les câbles parfaitement verticaux !
    // Jamais sur les lignes horizontales ou diagonales.
    const leftColumnVerticals = ["l13", "l21", "l39", "l47", "l54", "l17", "l25", "l43", "l49", "l58"];
    if (leftColumnVerticals.includes(link.id)) {
       forceSourceSide = -1;
       forceTargetSide = -1;
    }
    // Ajustements de symétrie spécifiques
    if (link.id === "l64") forceSourceSide = -1; 
    if (link.id === "l65") forceSourceSide = -1;

    const getSafePosition = (cx: number, cy: number, dirX: number, dirY: number, forceSide?: -1 | 1) => {
      let isLeft = dirX < -0.05;
      const isTop = dirY < -0.05;

      // Override manuel autorisé UNIQUEMENT si la ligne est verticale
      if (Math.abs(dirX) <= 0.05) {
         isLeft = forceSide !== undefined ? (forceSide === -1) : false; 
      }

      // Rapproché à 40px pour éviter que le texte flotte trop loin sur les petits écrans
      let lx = cx + (isLeft ? -40 : 40); 
      
      let baseLy = 0;
      if (Math.abs(dirY) <= 0.05) {
         // Lignes parfaitement horizontales (ex: liens dupliqués/vrrp)
         // On remonte le texte de 8px pour qu'il repose SUR le fil et ne soit pas barré
         baseLy = cy - 8;
      } else {
         // Lignes diagonales/verticales
         // En bas, on descend à +46px pour esquiver exactement la boîte de nom
         baseLy = cy + (isTop ? -22 : 46); 
      }
      
      let ly = baseLy;
      
      const W = 32; 
      const H = 14; 
      
      const collision = (x: number, y: number) => 
        placedLabels.some(l => Math.abs(l.x - x) < W && Math.abs(l.y - y) < H);

      if (collision(lx, ly)) {
        let found = false;
        const stepY = 14; 
        const dirStack = isTop ? -1 : 1; 
        
        for (let ring = 1; ring <= 10 && !found; ring++) {
          const options = [
             { tx: lx, ty: ly + ring * stepY * dirStack }, 
             { tx: lx, ty: ly - ring * stepY * dirStack }, 
             { tx: lx + (isLeft ? -10 : 10), ty: ly + ring * stepY * dirStack } 
          ];
          for (const opt of options) {
             if (!collision(opt.tx, opt.ty)) {
                lx = opt.tx; ly = opt.ty;
                found = true;
                break;
             }
          }
        }
      }
      placedLabels.push({ x: lx, y: ly });
      return { x: lx, y: ly };
    };

    let sLabelX = 0, sLabelY = 0, tLabelX = 0, tLabelY = 0;
    if (link.sourcePort) {
       const pos = getSafePosition(startX, startY, nx, ny, forceSourceSide);
       sLabelX = pos.x; sLabelY = pos.y;
    }
    if (link.targetPort) {
       const pos = getSafePosition(endX, endY, -nx, -ny, forceTargetSide);
       tLabelX = pos.x; tLabelY = pos.y;
    }

    return {
      link, sourceNode, targetNode, startX, startY, endX, endY, sLabelX, sLabelY, tLabelX, tLabelY
    };
  }).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1D23] mb-2 font-['Inter']">
            Architecture Réseau Complète
          </h1>
          <p className="text-muted-foreground font-['Inter']">
            Topologie SD-WAN over BGP — Datacenter Benguerir & Backup
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <button 
            onClick={handleBackupAll} 
            disabled={isBackingUp}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3A5C] text-white rounded-lg shadow-sm hover:bg-[#1B3A5C]/90 disabled:opacity-50 transition-colors border border-[#1B3A5C]/20"
          >
            {isBackingUp ? <RefreshCcw size={16} className="animate-spin" /> : <HardDrive size={16} />}
            <span className="text-sm font-semibold">{isBackingUp ? "Backup en cours..." : "Backup Infrastructure"}</span>
          </button>
          
          <div className="flex items-center gap-3 bg-white p-3 border border-border rounded-lg shadow-sm">
            <span className={`text-sm font-medium ${!isLogicalView ? 'text-primary' : 'text-muted-foreground'}`}>
              Vue Physique
            </span>
          <Switch 
            checked={isLogicalView} 
            onCheckedChange={setIsLogicalView} 
          />
          <span className={`text-sm font-medium ${isLogicalView ? 'text-primary' : 'text-muted-foreground'}`}>
            Vue Logique
          </span>
        </div>
      </div>
    </div>

      <div className="w-full overflow-x-auto bg-[#F7F8FA] border border-border rounded-xl shadow-sm">
        {/* Conteneur principal fixe (1200x1600) scrollable sur petits écrans */}
        <div className="relative mx-auto" style={{ width: `${CANVAS_W}px`, height: `${CANVAS_H}px` }}>
          
          {/* Ligne de séparation verticale Datacenters */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-border border-dashed z-0"></div>

          {/* Labels des Datacenters */}
          <div className="absolute top-4 left-6 z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-md border border-border shadow-sm">
            <h2 className="text-lg font-bold text-[#1B3A5C] uppercase tracking-wider">Site Benguerir</h2>
            <p className="text-xs font-medium text-muted-foreground">Datacenter Principal</p>
          </div>
          <div className="absolute top-4 right-6 text-right z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-md border border-border shadow-sm">
            <h2 className="text-lg font-bold text-[#B45309] uppercase tracking-wider">Site Backup</h2>
            <p className="text-xs font-medium text-muted-foreground">Datacenter Secondaire</p>
          </div>

          {/* Calque des liens et labels (SVG Pixel Perfect) */}
          <svg className="absolute inset-0 w-full h-full z-10" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}>
            {renderedLinks.map((line) => {
              if (!line) return null;
              const { link, startX, startY, endX, endY, sLabelX, sLabelY, tLabelX, tLabelY } = line;
              return (
                <g 
                  key={link.id} 
                  className="cursor-pointer group"
                  onClick={() => setSelectedElement({ type: 'link', data: link })}
                >
                  {/* Hitbox invisible et très large pour faciliter le clic */}
                  <line
                    x1={startX} y1={startY}
                    x2={endX} y2={endY}
                    stroke="transparent"
                    strokeWidth="15"
                  />

                  {/* Câble réseau */}
                  <line
                    x1={startX} y1={startY}
                    x2={endX} y2={endY}
                    stroke={getLinkColor(link.type)}
                    strokeWidth={link.type === "vpn" ? "2" : "1.5"}
                    strokeDasharray={link.type === "vpn" || link.type === "vrrp" ? "5,5" : "none"}
                    className="transition-all group-hover:stroke-[3px] group-hover:stroke-[#1B3A5C]"
                  />

                  {/* Textes de ports avec anti-collision dynamique */}
                  {link.sourcePort && (
                    <text 
                      x={sLabelX} 
                      y={sLabelY} 
                      fontSize="10" 
                      fill="#6B7280"
                      className="font-mono font-normal pointer-events-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {link.sourcePort}
                    </text>
                  )}
                  {link.targetPort && (
                    <text 
                      x={tLabelX} 
                      y={tLabelY} 
                      fontSize="10" 
                      fill="#6B7280"
                      className="font-mono font-normal pointer-events-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {link.targetPort}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Calque des Équipements */}
          <div className="absolute inset-0 z-30 pointer-events-none">
            {nodes.map((node) => {
              if (isLogicalView && (node.type === "switch" || node.type === "server")) return null;
              
              const px = node.x * (CANVAS_W / 100);
              const py = node.y * (CANVAS_H / 100);

              const devStatus = devicesStatus[node.name];
              const isOnline = devStatus ? devStatus.online : (node.status === 'active');

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedElement({ type: 'node', data: node })}
                  className="absolute flex flex-col items-center gap-1.5 transition-all -translate-x-1/2 -translate-y-1/2 group pointer-events-auto"
                  style={{ left: `${px}px`, top: `${py}px` }}
                >
                  <div className={`bg-white rounded-[6px] p-2 border ${devStatus ? (devStatus.online ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-red-400') : (node.status === 'active' ? 'border-[#1B3A5C]/20' : 'border-gray-200')} shadow-sm group-hover:shadow-md transition-all`}>
                    {getEquipmentIcon(node.type, node.status)}
                  </div>
                  <div className="bg-white/90 backdrop-blur px-2 py-0.5 rounded-[4px] border border-border text-[10px] font-semibold text-[#1A1D23] whitespace-nowrap shadow-sm flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${devStatus ? (devStatus.online ? 'bg-emerald-500 shadow-[0_0_6px_#10B981]' : 'bg-red-500 shadow-[0_0_6px_#EF4444]') : 'bg-gray-400'}`} />
                    {node.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Légendes & IP Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 border border-border col-span-1 lg:col-span-2 shadow-sm">
          <h3 className="text-sm font-bold text-[#1A1D23] mb-3">Adressage VLAN / VIP</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div><span className="font-semibold text-[#1B3A5C]">WEB Benguerir:</span> 192.168.101.0/29 (VIP .1)</div>
            <div><span className="font-semibold text-[#1B3A5C]">DB Benguerir:</span> 192.168.103.0/29 (VIP .1)</div>
            <div><span className="font-semibold text-[#1B3A5C]">Management:</span> 192.168.199.0/29 (VIP .1)</div>
            <div><span className="font-semibold text-[#B45309]">WEB Backup:</span> 192.168.111.0/29 (VIP .1)</div>
            <div><span className="font-semibold text-[#B45309]">DB Backup:</span> 192.168.113.0/29 (VIP .1)</div>
            <div><span className="font-semibold text-[#1A1D23]">Port-Channel:</span> 10.10.10.0/30 (BGR) | 10.20.20.0/30 (BKP)</div>
          </div>
        </Card>
        
        <Card className="p-4 border border-border col-span-1 shadow-sm">
          <h3 className="text-sm font-bold text-[#1A1D23] mb-3">Légende des Liens</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-[2px] bg-[#2D6A4F]"></div>
              <span className="font-medium text-[#1A1D23]">Actif (Underlay/Direct)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[2px] bg-[#9CA3AF]"></div>
              <span className="font-medium text-[#1A1D23]">Secondaire / Standby</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[2px] bg-[#B45309] border-dashed border-b-2"></div>
              <span className="font-medium text-[#1A1D23]">Tunnel VPN IPsec (ADVPN)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-[2px] bg-[#1A1D23] border-dashed border-b-2"></div>
              <span className="font-medium text-[#1A1D23]">VRRP / Heartbeat (L2)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Drawer : Détails (Nœud ou Lien) */}
      <Sheet open={!!selectedElement} onOpenChange={(open) => !open && setSelectedElement(null)}>
        <SheetContent side="right" className="w-[400px] sm:max-w-md bg-white border-l border-border shadow-2xl p-0 flex flex-col">
          {selectedElement && (
            <>
              <SheetHeader className="p-6 border-b border-border bg-[#F7F8FA]">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-[8px] border border-border shadow-sm">
                    {isNode ? getEquipmentIcon((nodeData as NodeData).type, (nodeData as NodeData).status) : <Cable size={24} className="text-[#1A1D23]" strokeWidth={1.5} />}
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-bold text-[#1A1D23]">
                      {isNode ? nodeData?.name : `Liaison réseau`}
                    </SheetTitle>
                    <SheetDescription className="text-xs font-semibold uppercase tracking-wider mt-1 text-muted-foreground">
                      {isNode ? `${nodeData?.type} • ${nodeData?.site}` : `Câble ${linkData?.type || 'direct'}`}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isNode ? (
                  // CONTENU DU DRAWER POUR UN NŒUD
                  <>
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-border shadow-sm">
                      <span className="text-sm font-semibold text-muted-foreground">Statut Opérationnel</span>
                      <Badge className={
                        nodeData?.status === 'active' ? 'bg-[#2D6A4F] hover:bg-[#2D6A4F] text-white' :
                        nodeData?.status === 'standby' ? 'bg-[#B45309] hover:bg-[#B45309] text-white' : 'bg-red-600 text-white'
                      }>
                        {nodeData?.status.toUpperCase()}
                      </Badge>
                    </div>

                    {nodeData?.ip && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Adresse IP / Réseau</h4>
                        <div className="bg-[#F7F8FA] p-3 rounded border border-border font-mono text-sm text-[#1B3A5C] font-semibold">
                          {nodeData.ip}
                        </div>
                      </div>
                    )}

                    {nodeData?.id && IOU_CONFIG_DATA[nodeData.id] ? (
                      <div className="space-y-4">
                        {/* Equipment Type & Image */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Router size={14} className="text-[#1A1D23]" /> Spécifications Matérielles
                           </h4>
                           <div className="bg-white p-3 rounded-lg border border-border shadow-sm text-sm">
                              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Type:</span> <span className="font-semibold text-[#1B3A5C]">{IOU_CONFIG_DATA[nodeData.id].type}</span></div>
                              <div className="flex justify-between"><span className="text-muted-foreground">Image:</span> <span className="font-mono text-xs">{IOU_CONFIG_DATA[nodeData.id].image}</span></div>
                           </div>
                        </div>

                        {/* VLANs */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Network size={14} className="text-[#1A1D23]" /> VLANs Configurés
                           </h4>
                           <div className="flex flex-wrap gap-2">
                             {IOU_CONFIG_DATA[nodeData.id].vlans.map((v: any) => (
                               <Badge key={v.id} variant="outline" className="bg-[#F7F8FA] text-[#1B3A5C] font-mono border-border">
                                 VLAN {v.id} - {v.name}
                               </Badge>
                             ))}
                           </div>
                        </div>

                        {/* Ports configuration */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Cable size={14} className="text-[#1A1D23]" /> Configuration des Ports
                           </h4>
                           <div className="space-y-2">
                             {IOU_CONFIG_DATA[nodeData.id].ports.map((p: any, idx: number) => (
                               <div key={idx} className="bg-white p-3 rounded-lg border border-border shadow-sm text-[13px]">
                                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                                    <span className="font-bold text-[#1A1D23]">{p.port}</span>
                                    <Badge variant="secondary" className="text-[10px] uppercase">{p.mode}</Badge>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Connecté à:</span> <span className="font-semibold">{p.connected_to}</span></div>
                                    {p.mode === 'trunk' ? (
                                      <>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Encapsulation:</span> <span>{p.encapsulation}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">VLANs autorisés:</span> <span>{p.vlans_allowed.join(', ')}</span></div>
                                      </>
                                    ) : (
                                      <div className="flex justify-between"><span className="text-muted-foreground">VLAN Access:</span> <span>{p.vlan}</span></div>
                                    )}
                                    <div className="flex justify-between"><span className="text-muted-foreground">PortFast:</span> <span>{p.portfast ? (p.portfast === true ? "Oui" : "Oui (" + p.portfast + ")") : "Non"}</span></div>
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Protocoles Système */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Shield size={14} className="text-[#1A1D23]" /> Protocoles Système
                           </h4>
                           <div className="bg-white p-3 rounded-lg border border-border shadow-sm text-[13px] space-y-3">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-[#1A1D23]">Spanning-Tree (STP)</span>
                                  <Badge className="bg-[#2D6A4F] text-white hover:bg-[#2D6A4F]">{IOU_CONFIG_DATA[nodeData.id].protocols.spanning_tree}</Badge>
                                </div>
                                <p className="text-muted-foreground text-[11px] leading-tight">
                                  PortFast activé: <strong className="text-[#1B3A5C]">Oui</strong>. Évite l'état BLOCKING prolongé au démarrage pour une convergence immédiate.
                                </p>
                              </div>
                              <div className="h-[1px] bg-border/50 w-full"></div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-[#1A1D23]">IGMP Snooping</span>
                                  <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50">Désactivé</Badge>
                                </div>
                                <p className="text-muted-foreground text-[11px] leading-tight">
                                  Désactivé volontairement pour éviter l'interférence avec le trafic multicast VRRP (adresse 224.0.0.18).
                                </p>
                              </div>
                           </div>
                        </div>
                      </div>
                    ) : nodeData?.id && CSR_CONFIG_DATA[nodeData.id] ? (
                      <div className="space-y-4">
                        {/* Action : Déployer VLAN */}
                        <div className="bg-[#E6F4EA] p-4 rounded-lg border border-[#2D6A4F]/30 shadow-sm">
                           <h4 className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider mb-3 flex items-center gap-1">
                             <Play size={14} /> Déploiement Automatisé Ansible
                           </h4>
                           <button 
                             onClick={() => handleDeployVlan(nodeData.site)}
                             disabled={isDeployingVlan}
                             className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#2D6A4F] text-white rounded-md shadow-sm hover:bg-[#2D6A4F]/90 disabled:opacity-50 transition-colors"
                           >
                             {isDeployingVlan ? <RefreshCcw size={16} className="animate-spin" /> : <Network size={16} />}
                             <span className="text-sm font-medium">{isDeployingVlan ? "Déploiement..." : "Créer VLAN 150 (VRRP)"}</span>
                           </button>
                        </div>

                        {/* Summary & Identity */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Router size={14} className="text-[#1A1D23]" /> Identité & Rôle
                           </h4>
                           <div className="bg-white p-3 rounded-lg border border-border shadow-sm text-sm">
                              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Rôle:</span> <span className="font-bold text-[#1B3A5C]">{CSR_CONFIG_DATA[nodeData.id].role}</span></div>
                              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Loopback0:</span> <span className="font-mono text-xs">{CSR_CONFIG_DATA[nodeData.id].loopback}</span></div>
                              <div className="flex justify-between"><span className="text-muted-foreground">Pilote réseau:</span> <span className="font-semibold">{CSR_CONFIG_DATA[nodeData.id].network_driver}</span></div>
                           </div>
                        </div>

                        {/* Interfaces */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Network size={14} className="text-[#1A1D23]" /> Interfaces & Sous-interfaces
                           </h4>
                           <div className="space-y-2">
                             {Object.entries(CSR_CONFIG_DATA[nodeData.id].interfaces).map(([intfName, intfData]: [string, any], idx: number) => (
                               <div key={idx} className="bg-white p-3 rounded-lg border border-border shadow-sm text-[13px]">
                                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                                    <span className="font-bold text-[#1A1D23]">{intfName}</span>
                                    {intfData.vrrp?.state && (
                                      <Badge className={intfData.vrrp.state === 'Master' ? 'bg-[#2D6A4F] text-white hover:bg-[#2D6A4F]' : 'bg-[#B45309] text-white hover:bg-[#B45309]'}>
                                        {intfData.vrrp.state}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    {intfData.role && <div className="flex justify-between"><span className="text-muted-foreground">Rôle:</span> <span className="font-medium text-[#1A1D23]">{intfData.role}</span></div>}
                                    {intfData.ip && <div className="flex justify-between"><span className="text-muted-foreground">IP:</span> <span className="font-mono">{intfData.ip}</span></div>}
                                    {intfData.vlan && <div className="flex justify-between"><span className="text-muted-foreground">VLAN:</span> <span>{intfData.vlan} ({intfData.encapsulation || '802.1Q'})</span></div>}
                                    
                                    {intfData.vrrp && (
                                      <div className="mt-2 pt-2 border-t border-border/30">
                                        <div className="flex justify-between"><span className="text-muted-foreground">VRRP Group:</span> <span>{intfData.vrrp.group}</span></div>
                                        {intfData.vrrp.vip && <div className="flex justify-between"><span className="text-muted-foreground">VRRP VIP:</span> <span className="font-mono text-[#B45309]">{intfData.vrrp.vip}</span></div>}
                                        <div className="flex justify-between"><span className="text-muted-foreground">Priorité:</span> <span>{intfData.vrrp.priority}</span></div>
                                      </div>
                                    )}

                                    {intfData.members && (
                                      <div className="flex justify-between mt-1"><span className="text-muted-foreground">Membres:</span> <span className="text-xs">{intfData.members.join(', ')}</span></div>
                                    )}

                                    {intfData.vni && (
                                      <div className="mt-2 pt-2 border-t border-border/30">
                                        <div className="flex justify-between"><span className="text-muted-foreground">VNI:</span> <span>{intfData.vni}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">Source:</span> <span>{intfData.vtep_source}</span></div>
                                        <div className="flex justify-between mt-1"><span className="text-muted-foreground">Peers:</span> <span className="text-xs">{intfData.peers?.join(', ')}</span></div>
                                      </div>
                                    )}
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Verification Commands Table */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Shield size={14} className="text-[#1A1D23]" /> Commandes de Vérification
                           </h4>
                           <div className="bg-[#F7F8FA] p-3 rounded-lg border border-border shadow-sm text-[11px] overflow-hidden">
                             <table className="w-full text-left border-collapse">
                               <thead>
                                 <tr className="border-b border-border/80">
                                   <th className="py-2 px-1 font-bold text-muted-foreground w-1/4">Protocole</th>
                                   <th className="py-2 px-1 font-bold text-muted-foreground w-[45%]">Commande</th>
                                   <th className="py-2 px-1 font-bold text-muted-foreground">Confirme</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-border/50">
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">VRRP</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show vrrp brief</td>
                                   <td className="py-2 px-1 text-muted-foreground">Master/Backup</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">VRRP dét.</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show vrrp</td>
                                   <td className="py-2 px-1 text-muted-foreground">Timers, MAC virt.</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">LACP / Po</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show etherchannel summary</td>
                                   <td className="py-2 px-1 text-muted-foreground">Membres bundled</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">LACP dét.</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show lacp neighbor</td>
                                   <td className="py-2 px-1 text-muted-foreground">Négociation</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">Interfaces</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show ip int brief</td>
                                   <td className="py-2 px-1 text-muted-foreground">État up/down</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">Sous-intf.</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show int Gi8.101</td>
                                   <td className="py-2 px-1 text-muted-foreground">Compteurs, erreurs</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">VXLAN</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show nve peers</td>
                                   <td className="py-2 px-1 text-muted-foreground">Tunnel VXLAN</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">Routage</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show ip route</td>
                                   <td className="py-2 px-1 text-muted-foreground">Table de routage</td>
                                 </tr>
                               </tbody>
                             </table>
                           </div>
                        </div>
                      </div>
                    ) : nodeData?.id && FGT_CONFIG_DATA[nodeData.id] ? (
                      <div className="space-y-4">
                        {/* Summary & Identity */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Shield size={14} className="text-[#1A1D23]" /> Identité & Haute Disponibilité
                           </h4>
                           <div className="bg-white p-3 rounded-lg border border-border shadow-sm text-sm">
                              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Hostname:</span> <span className="font-bold text-[#1B3A5C]">{FGT_CONFIG_DATA[nodeData.id].hostname || nodeData.id.toUpperCase()}</span></div>
                              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Rôle FGCP:</span> <span className="font-semibold">{FGT_CONFIG_DATA[nodeData.id].role}</span></div>
                              {FGT_CONFIG_DATA[nodeData.id].ha && (
                                <>
                                  <div className="flex justify-between mb-1"><span className="text-muted-foreground">HA Mode:</span> <span>{FGT_CONFIG_DATA[nodeData.id].ha.mode}</span></div>
                                  <div className="flex justify-between"><span className="text-muted-foreground">Priorité:</span> <span>{FGT_CONFIG_DATA[nodeData.id].ha.priority}</span></div>
                                </>
                              )}
                              {FGT_CONFIG_DATA[nodeData.id].sync_status && (
                                <div className="flex justify-between"><span className="text-muted-foreground">Synchro:</span> <span className="text-[#2D6A4F]">{FGT_CONFIG_DATA[nodeData.id].sync_status}</span></div>
                              )}
                           </div>
                        </div>

                        {/* Interfaces */}
                        {FGT_CONFIG_DATA[nodeData.id].interfaces && (
                          <div className="space-y-2">
                             <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                               <Cable size={14} className="text-[#1A1D23]" /> Interfaces Physiques
                             </h4>
                             <div className="bg-white p-3 rounded-lg border border-border shadow-sm text-[13px] space-y-2">
                               {Object.entries(FGT_CONFIG_DATA[nodeData.id].interfaces).map(([intfName, intfData]: [string, any], idx: number) => (
                                 <div key={idx} className="flex flex-col border-b border-border/50 pb-2 last:border-0 last:pb-0">
                                   <div className="flex justify-between items-center mb-1">
                                     <span className="font-bold text-[#1A1D23]">{intfName}</span>
                                     {intfData.ip && <span className="font-mono text-xs">{intfData.ip}</span>}
                                   </div>
                                   <span className="text-muted-foreground text-[11px]">{intfData.role}</span>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}

                        {/* SD-WAN */}
                        {FGT_CONFIG_DATA[nodeData.id].sdwan && (
                          <div className="space-y-2">
                             <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                               <Network size={14} className="text-[#1A1D23]" /> Routage SD-WAN
                             </h4>
                             <div className="bg-white p-3 rounded-lg border border-border shadow-sm text-[13px]">
                                <div className="flex justify-between mb-2 pb-2 border-b border-border/50">
                                  <span className="text-muted-foreground">Zone:</span> <span className="font-semibold">{FGT_CONFIG_DATA[nodeData.id].sdwan.zone}</span>
                                </div>
                                <div className="mb-2 pb-2 border-b border-border/50">
                                  <span className="text-muted-foreground block mb-1">Health Checks:</span>
                                  {FGT_CONFIG_DATA[nodeData.id].sdwan.health_checks.map((hc: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-[11px] ml-2">
                                      <span>{hc.name} ({hc.member})</span>
                                      <span className="font-mono">{hc.server}</span>
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <span className="text-muted-foreground block mb-1">Services (Règles):</span>
                                  {FGT_CONFIG_DATA[nodeData.id].sdwan.services.map((svc: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-[11px] ml-2 mb-1 last:mb-0">
                                      <span className="font-semibold">{svc.name}</span>
                                      <span className="uppercase">{svc.mode}</span>
                                    </div>
                                  ))}
                                </div>
                             </div>
                          </div>
                        )}

                        {/* Overlay: VPN & BGP */}
                        {FGT_CONFIG_DATA[nodeData.id].ipsec && (
                          <div className="space-y-2">
                             <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                               <Cloud size={14} className="text-[#1A1D23]" /> Overlay (ADVPN & BGP)
                             </h4>
                             <div className="bg-white p-3 rounded-lg border border-border shadow-sm text-[13px]">
                               {Object.entries(FGT_CONFIG_DATA[nodeData.id].ipsec).map(([vpnName, vpnData]: [string, any], idx: number) => (
                                 <div key={idx} className="mb-2 pb-2 border-b border-border/50 last:border-0 last:pb-0">
                                   <div className="flex justify-between font-bold text-[#1A1D23] mb-1"><span>{vpnName}</span> <span className="font-mono text-xs text-[#B45309]">{vpnData.tunnel_ip}</span></div>
                                   <div className="text-[11px] text-muted-foreground">
                                     Type: {vpnData.type} | Port: {vpnData.interface} {vpnData.proposal ? `| Proposal: ${vpnData.proposal}` : ''}
                                   </div>
                                 </div>
                               ))}
                               {FGT_CONFIG_DATA[nodeData.id].bgp && (
                                 <div className="mt-2 pt-2 border-t border-border/50">
                                   <div className="flex justify-between mb-1"><span className="text-muted-foreground">BGP Local AS:</span> <span className="font-bold">{FGT_CONFIG_DATA[nodeData.id].bgp.as}</span></div>
                                   <div className="flex justify-between mb-1"><span className="text-muted-foreground">Router ID:</span> <span className="font-mono">{FGT_CONFIG_DATA[nodeData.id].bgp.router_id}</span></div>
                                   <div className="flex justify-between"><span className="text-muted-foreground">Voisin:</span> <span>{FGT_CONFIG_DATA[nodeData.id].bgp.neighbor} (AS {FGT_CONFIG_DATA[nodeData.id].bgp.remote_as})</span></div>
                                 </div>
                               )}
                             </div>
                          </div>
                        )}

                        {/* Verification Commands Table */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Database size={14} className="text-[#1A1D23]" /> Commandes de Vérification
                           </h4>
                           <div className="bg-[#F7F8FA] p-3 rounded-lg border border-border shadow-sm text-[11px] overflow-hidden">
                             <table className="w-full text-left border-collapse">
                               <thead>
                                 <tr className="border-b border-border/80">
                                   <th className="py-2 px-1 font-bold text-muted-foreground w-1/4"># Protocole</th>
                                   <th className="py-2 px-1 font-bold text-muted-foreground w-[45%]">Commande (FortiOS)</th>
                                   <th className="py-2 px-1 font-bold text-muted-foreground">Rôle</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-border/50">
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">1. Système</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">get system status</td>
                                   <td className="py-2 px-1 text-muted-foreground">Identité, HA mode</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">2. Interfaces</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">get sys intf phys</td>
                                   <td className="py-2 px-1 text-muted-foreground">État des ports</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">3. FGCP</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">get sys ha status</td>
                                   <td className="py-2 px-1 text-muted-foreground">Primary/Sec, sync</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">4. Routage</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show router static</td>
                                   <td className="py-2 px-1 text-muted-foreground">Routes underlay</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">5. IKEv2</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">dia vpn ike gw list</td>
                                   <td className="py-2 px-1 text-muted-foreground">Négociation sécu</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">6. IPsec/ESP</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">dia vpn tunnel list</td>
                                   <td className="py-2 px-1 text-muted-foreground">Tunnel actif (sa=1)</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">7. BGP</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">get router info bgp sum</td>
                                   <td className="py-2 px-1 text-muted-foreground">Session overlay</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">8. SD-WAN S.</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">dia sys sdwan health</td>
                                   <td className="py-2 px-1 text-muted-foreground">Latence/perte</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">9. SD-WAN D.</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">dia sys sdwan service</td>
                                   <td className="py-2 px-1 text-muted-foreground">Membre sélec.</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">10. Firewall</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show firewall policy</td>
                                   <td className="py-2 px-1 text-muted-foreground">Règles actives</td>
                                 </tr>
                               </tbody>
                             </table>
                           </div>
                        </div>
                      </div>
                    ) : nodeData?.id && RBGR_CONFIG_DATA[nodeData.id] ? (
                      <div className="space-y-4">
                        {/* Status Temps Réel & Sauvegarde Ciblée */}
                        {nodeData && (
                          <div className="p-3 bg-[#F7F8FA] border border-border rounded-lg shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${devicesStatus[nodeData.name]?.online ? 'bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_#EF4444]'}`} />
                                <span className="font-bold text-xs">
                                  {devicesStatus[nodeData.name]?.online ? 'Équipement Allumé & En Ligne' : 'Équipement Éteint / Inaccessible'}
                                </span>
                              </div>
                              <Badge className={devicesStatus[nodeData.name]?.online ? 'bg-emerald-600' : 'bg-red-600'}>
                                {devicesStatus[nodeData.name]?.online ? 'EN LIGNE' : 'HORS TENSION'}
                              </Badge>
                            </div>

                            <button
                              onClick={() => handleBackupSingleDevice(nodeData.name)}
                              disabled={isSingleBackingUp === nodeData.name || !devicesStatus[nodeData.name]?.online}
                              className="w-full flex items-center justify-center gap-2 py-2 bg-[#1B3A5C] text-white text-xs font-semibold rounded-md hover:bg-[#1B3A5C]/90 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              {isSingleBackingUp === nodeData.name ? (
                                <>
                                  <RefreshCcw size={14} className="animate-spin" />
                                  <span>Sauvegarde de {nodeData.name}...</span>
                                </>
                              ) : (
                                <>
                                  <HardDrive size={14} />
                                  <span>Sauvegarder {nodeData.name}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Summary & Identity */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Router size={14} className="text-[#1A1D23]" /> Identité & Rôle
                           </h4>
                           <div className="bg-white p-3 rounded-lg border border-border shadow-sm text-sm">
                              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Rôle:</span> <span className="font-bold text-[#1B3A5C]">{RBGR_CONFIG_DATA[nodeData.id].role}</span></div>
                              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Site:</span> <span className="font-semibold">{RBGR_CONFIG_DATA[nodeData.id].site}</span></div>
                              {RBGR_CONFIG_DATA[nodeData.id].loopback && (
                                <div className="flex justify-between mb-1"><span className="text-muted-foreground">Loopback0:</span> <span className="font-mono text-xs">{RBGR_CONFIG_DATA[nodeData.id].loopback}</span></div>
                              )}
                              {RBGR_CONFIG_DATA[nodeData.id].as && (
                                <div className="flex justify-between"><span className="text-muted-foreground">AS Local BGP:</span> <span className="font-bold">{RBGR_CONFIG_DATA[nodeData.id].as}</span></div>
                              )}
                           </div>
                        </div>

                        {/* Connectivity Operators */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Globe size={14} className="text-[#1A1D23]" /> Opérateurs (eBGP)
                           </h4>
                           <div className="space-y-2">
                             {RBGR_CONFIG_DATA[nodeData.id].operators.map((op: any, idx: number) => (
                               <div key={idx} className="bg-white p-3 rounded-lg border border-border shadow-sm text-[13px]">
                                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
                                    <span className="font-bold text-[#1A1D23]">{op.name}</span>
                                    <span className="font-mono text-xs font-semibold">{op.interface}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between"><span className="text-muted-foreground">IP BGP:</span> <span className="font-mono text-xs">{op.ip}</span></div>
                                    {op.remote_as && <div className="flex justify-between"><span className="text-muted-foreground">AS Distant:</span> <span>{op.remote_as}</span></div>}
                                    {op.local_pref && (
                                      <div className="flex justify-between mt-1 pt-1 border-t border-border/30">
                                        <span className="text-muted-foreground">Local Preference:</span>
                                        <Badge variant="secondary" className={op.local_pref === 200 ? 'bg-[#2D6A4F] text-white hover:bg-[#2D6A4F]' : op.local_pref === 150 ? 'bg-[#B45309] text-white hover:bg-[#B45309]' : 'bg-gray-200'}>
                                          {op.local_pref}
                                        </Badge>
                                      </div>
                                    )}
                                  </div>
                               </div>
                             ))}
                           </div>
                        </div>

                        {/* Internal Architecture */}
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Network size={14} className="text-[#1A1D23]" /> Architecture Interne
                           </h4>
                           <div className="bg-white p-3 rounded-lg border border-border shadow-sm text-[13px]">
                              {RBGR_CONFIG_DATA[nodeData.id].ibgp_neighbor && (
                                <div className="mb-2 pb-2 border-b border-border/50">
                                  <span className="text-muted-foreground block mb-1">Voisin iBGP:</span>
                                  <div className="flex justify-between ml-2 text-[11px]">
                                    <span className="font-semibold">{RBGR_CONFIG_DATA[nodeData.id].ibgp_neighbor.peer}</span>
                                    <span className="font-mono">{RBGR_CONFIG_DATA[nodeData.id].ibgp_neighbor.ip}</span>
                                  </div>
                                </div>
                              )}
                              
                              {RBGR_CONFIG_DATA[nodeData.id].internal_links && (
                                <div className="mb-2 pb-2 border-b border-border/50">
                                  <span className="text-muted-foreground block mb-1">Liens Directs:</span>
                                  {RBGR_CONFIG_DATA[nodeData.id].internal_links.map((link: any, idx: number) => (
                                    <div key={idx} className="flex justify-between ml-2 text-[11px] mb-1 last:mb-0">
                                      <span className="font-mono">{link.local} ↔ {link.remote}</span>
                                      {link.note && <span className="italic text-muted-foreground">{link.note}</span>}
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div>
                                <span className="text-muted-foreground block mb-1">Vers Distribution (Downstream):</span>
                                <div className="flex justify-between ml-2 text-[11px]">
                                  <span className="font-mono font-semibold">{RBGR_CONFIG_DATA[nodeData.id].downstream.port}</span>
                                  <span>→ {RBGR_CONFIG_DATA[nodeData.id].downstream.connected_to}</span>
                                </div>
                              </div>
                           </div>
                        </div>

                        {/* Route Maps */}
                        {RBGR_CONFIG_DATA[nodeData.id].route_maps && (
                          <div className="space-y-2">
                             <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                               <Shield size={14} className="text-[#1A1D23]" /> Route-Maps (Priorité)
                             </h4>
                             <div className="bg-[#F7F8FA] p-3 rounded-lg border border-border shadow-sm text-[11px]">
                               {Object.entries(RBGR_CONFIG_DATA[nodeData.id].route_maps).map(([rmName, rmData]: [string, any], idx: number) => (
                                 <div key={idx} className="flex justify-between items-center mb-1 pb-1 border-b border-border/50 last:border-0 last:pb-0 last:mb-0">
                                   <span className="font-bold text-[#1B3A5C]">{rmName}</span>
                                   <span>Local-Pref: <strong className="font-mono">{rmData.local_preference}</strong></span>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}

                        {/* Verification Commands */}
                        {RBGR_CONFIG_DATA[nodeData.id].verify_commands && (
                          <div className="space-y-2">
                             <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                               <Database size={14} className="text-[#1A1D23]" /> Commandes
                             </h4>
                             <div className="bg-[#1B3A5C] text-white p-3 rounded-lg shadow-sm font-mono text-[11px] space-y-1">
                               {RBGR_CONFIG_DATA[nodeData.id].verify_commands.map((cmd: string, idx: number) => (
                                 <div key={idx} className="flex items-center gap-2">
                                   <span className="text-[#A5B4FC]">Router#</span>
                                   <span>{cmd}</span>
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}
                        
                        {RBGR_CONFIG_DATA[nodeData.id].tested_failover && (
                          <div className="bg-[#E6F4EA] border border-[#2D6A4F] text-[#1B3A5C] p-3 mt-4 rounded-lg text-[11px] font-semibold flex items-start gap-2 shadow-sm">
                             <Shield size={16} className="text-[#2D6A4F] flex-shrink-0 mt-0.5" /> 
                             <span>Bascule automatique Inw → Ora → IAM testée et validée (Failover & Failback)</span>
                          </div>
                        )}

                        {/* General Verification Commands Table */}
                        <div className="space-y-2 mt-4">
                           <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                             <Info size={14} className="text-[#1A1D23]" /> Tableau de Bord Global
                           </h4>
                           <div className="bg-[#F7F8FA] p-3 rounded-lg border border-border shadow-sm text-[11px] overflow-hidden">
                             <table className="w-full text-left border-collapse">
                               <thead>
                                 <tr className="border-b border-border/80">
                                   <th className="py-2 px-1 font-bold text-muted-foreground w-1/4">Protocole</th>
                                   <th className="py-2 px-1 font-bold text-muted-foreground w-[45%]">Commande</th>
                                   <th className="py-2 px-1 font-bold text-muted-foreground">Rôle</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-border/50">
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">Interfaces</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show ip interface brief</td>
                                   <td className="py-2 px-1 text-muted-foreground">État des ports</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">Voisinage</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show cdp neighbor</td>
                                   <td className="py-2 px-1 text-muted-foreground">Liens physiques</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">BGP session</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show ip bgp summary</td>
                                   <td className="py-2 px-1 text-muted-foreground">Established/Idle</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">BGP table</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show ip bgp</td>
                                   <td className="py-2 px-1 text-muted-foreground">Routes, LocPrf</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">Route-Map</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">show route-map [nom]</td>
                                   <td className="py-2 px-1 text-muted-foreground">Règles priorité</td>
                                 </tr>
                                 <tr>
                                   <td className="py-2 px-1 font-semibold">Test panne</td>
                                   <td className="py-2 px-1 font-mono text-[#1B3A5C]">shut / no shut (intf)</td>
                                   <td className="py-2 px-1 text-muted-foreground">Simule résilience</td>
                                 </tr>
                               </tbody>
                             </table>
                           </div>
                        </div>

                      </div>
                    ) : (
                      // Rendu générique existant pour les autres nœuds
                      nodeData?.details && Object.keys(nodeData.details).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <Info size={14} className="text-[#1A1D23]" /> Détails & Connectivité
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {Object.entries(nodeData.details).map(([key, value]) => (
                              <div key={key} className="bg-white p-3 rounded-lg border border-border shadow-sm flex flex-col gap-1">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{key}</span>
                                <span className="text-sm font-medium text-[#1A1D23]">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </>
                ) : (
                  // CONTENU DU DRAWER POUR UN LIEN
                  <>
                    <div className="bg-[#F7F8FA] p-4 rounded-lg border border-border flex flex-col gap-3">
                       <div className="flex justify-between items-center border-b border-border/50 pb-2">
                         <span className="text-xs font-bold text-muted-foreground uppercase">Source</span>
                         <span className="text-sm font-bold text-[#1B3A5C]">{nodes.find(n => n.id === linkData?.source)?.name} <span className="text-muted-foreground font-normal">({linkData?.sourcePort || "N/A"})</span></span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-muted-foreground uppercase">Destination</span>
                         <span className="text-sm font-bold text-[#B45309]">{nodes.find(n => n.id === linkData?.target)?.name} <span className="text-muted-foreground font-normal">({linkData?.targetPort || "N/A"})</span></span>
                       </div>
                    </div>

                    {linkData?.details && Object.keys(linkData.details).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <Info size={14} className="text-[#1A1D23]" /> Informations Supplémentaires
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {Object.entries(linkData.details).map(([key, value]) => (
                            <div key={key} className="bg-white p-3 rounded-lg border border-border shadow-sm flex flex-col gap-1">
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{key}</span>
                              <span className="text-sm font-medium text-[#1A1D23]">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
      {/* Modal de Sauvegarde Horodatée */}
      {backupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-border w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-[#1B3A5C] text-white">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-emerald-400" />
                <h3 className="font-bold text-base">{backupTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (backupContent) {
                      navigator.clipboard.writeText(backupContent);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }
                  }}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? "Copié !" : "Copier"}</span>
                </button>
                <button
                  onClick={() => {
                    if (backupContent) {
                      const blob = new Blob([backupContent], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${backupTitle.replace(/\s+/g, '_')}.txt`;
                      a.click();
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Download size={14} />
                  <span>Télécharger</span>
                </button>
                <button
                  onClick={() => setBackupModalOpen(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto bg-[#1A1D23] font-mono text-xs text-emerald-400 space-y-1 leading-relaxed">
              <pre className="whitespace-pre-wrap font-mono">{backupContent}</pre>
            </div>
            <div className="px-6 py-3 border-t border-border bg-gray-50 text-right">
              <button
                onClick={() => setBackupModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
