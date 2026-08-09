import { sdwanData } from "@/lib/mockData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "lucide-react";

export default function SDWAN() {
  const port1 = sdwanData.metrics[0];
  const port2 = sdwanData.metrics[1];

  // Format historical data for chart
  const chartData = sdwanData.historicalData.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    "Port1 Latence (ms)": d.port1Latency,
    "Port2 Latence (ms)": d.port2Latency,
    "Port1 Perte (%)": d.port1Loss,
    "Port2 Perte (%)": d.port2Loss,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          SD-WAN — Détail de Santé
        </h1>
        <p className="text-muted-foreground">
          Équipement: {sdwanData.equipment}
        </p>
      </div>

      {/* Active Port Badge */}
      <Card className="p-4 border border-border bg-green-50 border-green-200">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-semibold text-foreground">
              Membre Actif: {sdwanData.activePort.toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              Latence: {port1.latency}ms | Perte: {port1.packetLoss}%
            </p>
          </div>
        </div>
      </Card>

      {/* Port Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Port 1 */}
        <Card className="p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">
            Port 1 (Primaire)
          </h3>
          <div className="space-y-4">
            {/* Latency Gauge */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Latence</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {port1.latency}ms
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-600 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((port1.latency / 100) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Packet Loss Gauge */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Perte de Paquets
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {port1.packetLoss}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-600 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(port1.packetLoss * 10, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <Badge variant="default" className="bg-green-600 w-fit">
              Actif
            </Badge>
          </div>
        </Card>

        {/* Port 2 */}
        <Card className="p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">
            Port 2 (Secondaire)
          </h3>
          <div className="space-y-4">
            {/* Latency Gauge */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Latence</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {port2.latency}ms
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-600 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((port2.latency / 100) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Packet Loss Gauge */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Perte de Paquets
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {port2.packetLoss}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-600 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(port2.packetLoss * 10, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <Badge variant="secondary">Standby</Badge>
          </div>
        </Card>
      </div>

      {/* Historical Chart */}
      <Card className="p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4">
          Historique (30 min)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="time" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #D1D5DB",
                borderRadius: "4px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Port1 Latence (ms)"
              stroke="#2D6A4F"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Port2 Latence (ms)"
              stroke="#B45309"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
