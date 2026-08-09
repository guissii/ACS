import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Loader2, Plus, Zap } from "lucide-react";
import { backupHistory } from "@/lib/mockData";

export default function Automation() {
  const [activeTab, setActiveTab] = useState<
    "vlan" | "failure" | "backup"
  >("vlan");
  const [vlanForm, setVlanForm] = useState({
    name: "",
    vlanId: "",
    subnet: "",
    site: "",
    interface: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [taskStatus, setTaskStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");

  const handleVlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTaskStatus("running");

    // Simulate API call
    setTimeout(() => {
      setTaskStatus("success");
      setIsLoading(false);
      setVlanForm({ name: "", vlanId: "", subnet: "", site: "", interface: "" });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Automatisation
        </h1>
        <p className="text-muted-foreground">
          Gestion des configurations et tests de résilience
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { id: "vlan", label: "Créer VLAN" },
          { id: "failure", label: "Simuler Panne" },
          { id: "backup", label: "Sauvegarde" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VLAN Creation Tab */}
      {activeTab === "vlan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="p-6 border border-border">
            <h3 className="font-semibold text-foreground mb-4">
              Créer un nouveau VLAN
            </h3>
            <form onSubmit={handleVlanSubmit} className="space-y-4">
              <div>
                <Label className="text-sm text-foreground">Nom VLAN</Label>
                <Input
                  placeholder="ex: VLAN-PROD"
                  value={vlanForm.name}
                  onChange={(e) =>
                    setVlanForm({ ...vlanForm, name: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label className="text-sm text-foreground">ID VLAN (1-4094)</Label>
                <Input
                  type="number"
                  placeholder="ex: 101"
                  min="1"
                  max="4094"
                  value={vlanForm.vlanId}
                  onChange={(e) =>
                    setVlanForm({ ...vlanForm, vlanId: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label className="text-sm text-foreground">Sous-réseau</Label>
                <Input
                  placeholder="ex: 10.1.0.0/24"
                  value={vlanForm.subnet}
                  onChange={(e) =>
                    setVlanForm({ ...vlanForm, subnet: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label className="text-sm text-foreground">Site</Label>
                <Select
                  value={vlanForm.site}
                  onValueChange={(value) =>
                    setVlanForm({ ...vlanForm, site: value })
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="benguerir">Benguerir</SelectItem>
                    <SelectItem value="backup">Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-foreground">
                  Interface Parente
                </Label>
                <Input
                  placeholder="ex: eth0"
                  value={vlanForm.interface}
                  onChange={(e) =>
                    setVlanForm({ ...vlanForm, interface: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !vlanForm.name}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      En cours...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Appliquer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* Preview & Status */}
          <div className="space-y-4">
            {vlanForm.name && (
              <Card className="p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-4">
                  Aperçu de la Configuration
                </h3>
                <div className="space-y-2 font-mono text-xs bg-muted p-3 rounded-sm">
                  <p className="text-muted-foreground">
                    # Configuration VLAN
                  </p>
                  <p className="text-foreground">
                    interface vlan {vlanForm.vlanId}
                  </p>
                  <p className="text-foreground">
                    name {vlanForm.name}
                  </p>
                  <p className="text-foreground">
                    ip address {vlanForm.subnet}
                  </p>
                  <p className="text-muted-foreground">
                    # Sera appliquée sur {vlanForm.site}
                  </p>
                </div>
              </Card>
            )}

            {taskStatus !== "idle" && (
              <Card
                className={`p-4 border ${
                  taskStatus === "success"
                    ? "border-green-200 bg-green-50"
                    : taskStatus === "error"
                      ? "border-red-200 bg-red-50"
                      : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {taskStatus === "running" && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                  )}
                  {taskStatus === "success" && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  {taskStatus === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-semibold ${
                        taskStatus === "success"
                          ? "text-green-900"
                          : taskStatus === "error"
                            ? "text-red-900"
                            : "text-blue-900"
                      }`}
                    >
                      {taskStatus === "running"
                        ? "Configuration en cours..."
                        : taskStatus === "success"
                          ? "VLAN créé avec succès!"
                          : "Erreur lors de la création"}
                    </p>
                    {taskStatus === "success" && (
                      <p className="text-sm text-green-800 mt-1">
                        Le VLAN {vlanForm.name} a été appliqué sur tous les
                        équipements du site {vlanForm.site}.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Failure Simulation Tab */}
      {activeTab === "failure" && (
        <Card className="p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">
            Simuler une Panne
          </h3>
          <p className="text-muted-foreground mb-4">
            Testez la résilience de votre infrastructure en simulant une panne.
          </p>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-foreground">
                Équipement / Lien à couper
              </Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un équipement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csr-bgr-1">CSR-BGR-1</SelectItem>
                  <SelectItem value="csr-bgr-2">CSR-BGR-2</SelectItem>
                  <SelectItem value="port1-sdwan">Port1 SD-WAN</SelectItem>
                  <SelectItem value="ipsec-tunnel">Tunnel IPsec</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-sm">
              <p className="text-sm text-yellow-900">
                ⚠️ Cette action va simuler une panne. Les services vont basculer
                sur les équipements de secours.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1">
                <Zap className="w-4 h-4 mr-2" />
                Simuler la Panne
              </Button>
              <Button variant="outline" className="flex-1">
                Rétablir
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Backup Tab */}
      {activeTab === "backup" && (
        <div className="space-y-4">
          <Card className="p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Sauvegarder l'Architecture
              </h3>
              <Button>
                <Loader2 className="w-4 h-4 mr-2" />
                Sauvegarder Maintenant
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Sauvegarde complète de tous les équipements (4 CSR + 4 FortiGate)
            </p>
          </Card>

          {/* Backup History */}
          <Card className="p-6 border border-border">
            <h3 className="font-semibold text-foreground mb-4">
              Historique des Sauvegardes
            </h3>
            <div className="space-y-3">
              {backupHistory.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-sm border border-border"
                >
                  <div className="flex items-center gap-3">
                    {backup.status === "success" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(backup.timestamp).toLocaleString("fr-FR")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {backup.equipment.length} équipements • {backup.duration}s
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      backup.status === "success" ? "default" : "destructive"
                    }
                    className={
                      backup.status === "success" ? "bg-green-600" : ""
                    }
                  >
                    {backup.status === "success" ? "Succès" : "Erreur"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
