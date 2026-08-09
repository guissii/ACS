import { vrrpData } from "@/lib/mockData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function VRRP() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          VRRP — Détail par VLAN
        </h1>
        <p className="text-muted-foreground">
          État des groupes de redondance virtuelle sur le site {vrrpData.site}
        </p>
      </div>

      <Card className="border border-border p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-foreground font-semibold">
                VLAN
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                ID
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Groupe
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Master
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Backup
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Sous-réseau
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                État
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vrrpData.vlans.map((vlan, idx) => (
              <TableRow
                key={vlan.vlan_id}
                className={`border-b border-border hover:bg-muted/50 transition-colors ${
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                }`}
              >
                <TableCell className="font-semibold text-foreground">
                  {vlan.name}
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">
                  {vlan.vlan_id}
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">
                  {vlan.group}
                </TableCell>
                <TableCell className="text-foreground">{vlan.master}</TableCell>
                <TableCell className="text-foreground">{vlan.backup}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {vlan.subnet}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {vlan.status === "ok" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <Badge variant="default" className="bg-green-600">
                          OK
                        </Badge>
                      </>
                    ) : vlan.status === "warning" ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <Badge variant="secondary">Alerte</Badge>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <Badge variant="destructive">Erreur</Badge>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-3">Statistiques</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total VLANs:</span>
              <span className="text-foreground font-medium">
                {vrrpData.vlans.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Groupes VRRP:</span>
              <span className="text-foreground font-medium">
                {Math.max(...vrrpData.vlans.map((v) => v.group))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">État global:</span>
              <span className="text-green-600 font-medium">Opérationnel</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border">
          <h3 className="font-semibold text-foreground mb-3">
            Redondance
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Master actif:</span>
              <span className="text-foreground font-medium">CSR-BGR-1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Backup disponible:</span>
              <span className="text-foreground font-medium">CSR-BGR-2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dernière bascule:</span>
              <span className="text-muted-foreground text-xs">
                Jamais
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
