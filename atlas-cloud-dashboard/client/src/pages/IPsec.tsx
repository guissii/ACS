import { ipsecData } from "@/lib/mockData";
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
import { Lock, LockOpen } from "lucide-react";

export default function IPsec() {
  const activeTunnels = ipsecData.tunnels.filter((t) => t.status === "active");
  const downTunnels = ipsecData.tunnels.filter((t) => t.status === "down");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          IPsec — Détail des Tunnels
        </h1>
        <p className="text-muted-foreground">
          Équipement: {ipsecData.equipment}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Tunnels Actifs</p>
          <p className="text-3xl font-bold text-green-600">{activeTunnels.length}</p>
          <p className="text-xs text-muted-foreground mt-2">
            sur {ipsecData.tunnels.length} total
          </p>
        </Card>

        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">
            Paquets Chiffrés
          </p>
          <p className="text-3xl font-bold text-primary">
            {(
              ipsecData.tunnels.reduce((sum, t) => sum + t.packetsEncrypted, 0) /
              1000000
            ).toFixed(1)}
            M
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            preuve de trafic réel
          </p>
        </Card>

        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">
            Données Chiffrées
          </p>
          <p className="text-3xl font-bold text-primary">
            {(
              ipsecData.tunnels.reduce((sum, t) => sum + t.bytesEncrypted, 0) /
              1000000000
            ).toFixed(1)}
            GB
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            volume total
          </p>
        </Card>
      </div>

      {/* Tunnels Table */}
      <Card className="border border-border p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-foreground font-semibold">
                Tunnel
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Adresse Locale
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Adresse Distante
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                État
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Paquets Chiffrés
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Données Chiffrées
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ipsecData.tunnels.map((tunnel, idx) => (
              <TableRow
                key={tunnel.name}
                className={`border-b border-border hover:bg-muted/50 transition-colors ${
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                }`}
              >
                <TableCell className="font-semibold text-foreground">
                  {tunnel.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {tunnel.localAddress}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {tunnel.remoteAddress}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {tunnel.status === "active" ? (
                      <>
                        <Lock className="w-4 h-4 text-green-600" />
                        <Badge variant="default" className="bg-green-600">
                          Actif
                        </Badge>
                      </>
                    ) : (
                      <>
                        <LockOpen className="w-4 h-4 text-red-600" />
                        <Badge variant="destructive">Down</Badge>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground">
                  {tunnel.packetsEncrypted.toLocaleString("fr-FR")}
                </TableCell>
                <TableCell className="font-mono text-xs text-foreground">
                  {(tunnel.bytesEncrypted / 1000000).toFixed(1)} MB
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Tunnel Details */}
      {downTunnels.length > 0 && (
        <Card className="p-4 border border-red-200 bg-red-50">
          <p className="font-semibold text-red-900 mb-2">
            ⚠️ Tunnels Inactifs
          </p>
          <ul className="space-y-1">
            {downTunnels.map((t) => (
              <li key={t.name} className="text-sm text-red-800">
                {t.name} ({t.localAddress} → {t.remoteAddress})
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
