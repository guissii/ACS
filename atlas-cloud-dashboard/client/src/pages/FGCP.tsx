import { fgcpData } from "@/lib/mockData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function FGCP() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          FGCP — Détail du Cluster
        </h1>
        <p className="text-muted-foreground">
          Équipement: {fgcpData.equipment}
        </p>
      </div>

      {/* Cluster Status */}
      <Card className="p-4 border border-border bg-green-50 border-green-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-foreground">
              État du Cluster: {fgcpData.clusterStatus.charAt(0).toUpperCase() + fgcpData.clusterStatus.slice(1)}
            </p>
            <p className="text-sm text-muted-foreground">
              Tous les nœuds sont synchronisés
            </p>
          </div>
        </div>
      </Card>

      {/* Cluster Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fgcpData.nodes.map((node) => (
          <Card key={node.name} className="p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">{node.name}</h3>
                <p className="text-sm text-muted-foreground">{node.role}</p>
              </div>
              <Badge
                variant={node.role === "Primary" ? "default" : "secondary"}
                className={
                  node.role === "Primary"
                    ? "bg-primary"
                    : "bg-secondary"
                }
              >
                {node.role}
              </Badge>
            </div>

            {/* Sync Status */}
            <div className="mb-4 p-3 rounded-sm bg-muted/50 border border-border">
              <div className="flex items-center gap-2">
                {node.syncStatus === "in-sync" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium text-foreground">
                  Sync: {node.syncStatus === "in-sync" ? "Synchronisé" : "Désynchronisé"}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    Utilisation CPU
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {node.cpuUsage}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      node.cpuUsage > 80
                        ? "bg-red-600"
                        : node.cpuUsage > 60
                          ? "bg-yellow-600"
                          : "bg-green-600"
                    }`}
                    style={{ width: `${node.cpuUsage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    Utilisation Mémoire
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {node.memoryUsage}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      node.memoryUsage > 80
                        ? "bg-red-600"
                        : node.memoryUsage > 60
                          ? "bg-yellow-600"
                          : "bg-green-600"
                    }`}
                    style={{ width: `${node.memoryUsage}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                Uptime: {node.uptime}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Cluster Info */}
      <Card className="p-4 border border-border">
        <h3 className="font-semibold text-foreground mb-3">
          Informations du Cluster
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nombre de nœuds:</span>
            <span className="text-foreground font-medium">
              {fgcpData.nodes.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nœud primaire:</span>
            <span className="text-foreground font-medium">
              {fgcpData.nodes.find((n) => n.role === "Primary")?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">État de synchronisation:</span>
            <span className="text-green-600 font-medium">
              Tous synchronisés
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mode de cluster:</span>
            <span className="text-foreground font-medium">Active-Passive</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
