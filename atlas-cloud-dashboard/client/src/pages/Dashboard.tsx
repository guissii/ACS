import { Equipment, EquipmentStatus } from "@/lib/types";
import { equipmentList } from "@/lib/mockData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, Radio, Zap } from "lucide-react";

const statusColors: Record<EquipmentStatus, string> = {
  active: "bg-green-600",
  standby: "bg-yellow-600",
  down: "bg-red-600",
  warning: "bg-orange-600",
};

const statusLabels: Record<EquipmentStatus, string> = {
  active: "Actif",
  standby: "Standby",
  down: "Inactif",
  warning: "Alerte",
};

const typeIcons: Record<string, React.ReactNode> = {
  csr: <Zap className="w-5 h-5" />,
  fortigate: <Radio className="w-5 h-5" />,
  switch: <Cpu className="w-5 h-5" />,
  server: <Server className="w-5 h-5" />,
};

const typeLabels: Record<string, string> = {
  csr: "Routeur",
  fortigate: "Firewall",
  switch: "Switch",
  server: "Serveur",
};

interface EquipmentCardProps {
  equipment: Equipment;
}

function EquipmentCard({ equipment }: EquipmentCardProps) {
  return (
    <Card className="p-4 border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-primary">{typeIcons[equipment.type]}</div>
          <div>
            <h3 className="font-semibold text-foreground">{equipment.name}</h3>
            <p className="text-xs text-muted-foreground">
              {typeLabels[equipment.type]}
            </p>
          </div>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${statusColors[equipment.status]}`}
        ></div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Site:</span>
          <span className="text-foreground font-medium">{equipment.site}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">IP:</span>
          <span className="font-mono text-foreground text-xs">
            {equipment.ip}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Modèle:</span>
          <span className="text-foreground">{equipment.model}</span>
        </div>
      </div>

      <Badge
        variant={
          equipment.status === "active"
            ? "default"
            : equipment.status === "standby"
              ? "secondary"
              : "destructive"
        }
        className="text-xs"
      >
        {statusLabels[equipment.status]}
      </Badge>
    </Card>
  );
}

export default function Dashboard() {
  const benguerirEquipment = equipmentList.filter(
    (e) => e.site === "Benguerir"
  );
  const backupEquipment = equipmentList.filter((e) => e.site === "Backup");

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Équipements Actifs</p>
          <p className="text-3xl font-bold text-primary">6</p>
          <p className="text-xs text-muted-foreground mt-2">Tous opérationnels</p>
        </Card>
        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">VRRP Groups</p>
          <p className="text-3xl font-bold text-primary">4</p>
          <p className="text-xs text-muted-foreground mt-2">Tous synchronisés</p>
        </Card>
        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Tunnels IPsec</p>
          <p className="text-3xl font-bold text-primary">3</p>
          <p className="text-xs text-muted-foreground mt-2">2 actifs, 1 down</p>
        </Card>
        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Uptime Moyen</p>
          <p className="text-3xl font-bold text-primary">99.8%</p>
          <p className="text-xs text-muted-foreground mt-2">Derniers 30 jours</p>
        </Card>
      </div>

      {/* Benguerir Site */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">
            Site Benguerir
          </h2>
          <p className="text-sm text-muted-foreground">
            Datacenter principal — 3 équipements
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {benguerirEquipment.map((equipment) => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
        </div>
      </div>

      {/* Backup Site */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">
            Site Backup
          </h2>
          <p className="text-sm text-muted-foreground">
            Datacenter secondaire — 3 équipements
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {backupEquipment.map((equipment) => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
        </div>
      </div>
    </div>
  );
}
