import { bgpData } from "@/lib/mockData";
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
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function BGP() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          BGP — Détail des Voisins
        </h1>
        <p className="text-muted-foreground">
          Équipement: {bgpData.equipment}
        </p>
      </div>

      {/* Active Operator Badge */}
      {bgpData.activeOperator && (
        <Card className="p-4 border border-border bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-foreground">
                Opérateur Actif: AS{bgpData.activeOperator}
              </p>
              <p className="text-sm text-muted-foreground">
                Meilleur Local Preference
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* BGP Neighbors Table */}
      <Card className="border border-border p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-foreground font-semibold">
                Voisin
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                AS
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                État
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Préfixes Reçus
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Local Pref
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bgpData.neighbors.map((neighbor, idx) => (
              <TableRow
                key={neighbor.neighbor}
                className={`border-b border-border hover:bg-muted/50 transition-colors ${
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                }`}
              >
                <TableCell className="font-mono text-sm text-foreground">
                  {neighbor.neighbor}
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">
                  {neighbor.asn}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {neighbor.state === "Established" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <Badge variant="default" className="bg-green-600">
                          Établi
                        </Badge>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <Badge variant="secondary">{neighbor.state}</Badge>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-foreground">
                  {neighbor.prefixesReceived.toLocaleString("fr-FR")}
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">
                  {neighbor.localPref || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* BGP Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Voisins Établis</p>
          <p className="text-3xl font-bold text-primary">
            {bgpData.neighbors.filter((n) => n.state === "Established").length}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            sur {bgpData.neighbors.length} total
          </p>
        </Card>

        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">
            Total Préfixes
          </p>
          <p className="text-3xl font-bold text-primary">
            {bgpData.neighbors
              .reduce((sum, n) => sum + n.prefixesReceived, 0)
              .toLocaleString("fr-FR")}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            routes annoncées
          </p>
        </Card>

        <Card className="p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">
            Opérateur Actif
          </p>
          <p className="text-3xl font-bold text-primary">
            AS{bgpData.activeOperator}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            meilleur chemin
          </p>
        </Card>
      </div>
    </div>
  );
}
