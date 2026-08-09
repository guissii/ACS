import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Play } from "lucide-react";

export default function ConnectivityTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<
    Array<{
      name: string;
      status: "pending" | "running" | "success" | "error";
      duration?: number;
      result?: string;
    }>
  >([
    {
      name: "Ping Serveur → Passerelle Benguerir",
      status: "pending",
    },
    {
      name: "Ping Serveur → Passerelle Backup",
      status: "pending",
    },
    {
      name: "Vérification VRRP Benguerir",
      status: "pending",
    },
    {
      name: "Vérification VRRP Backup",
      status: "pending",
    },
    {
      name: "Test BGP Voisins",
      status: "pending",
    },
    {
      name: "Vérification Tunnels IPsec",
      status: "pending",
    },
    {
      name: "Test SD-WAN Health-Check",
      status: "pending",
    },
    {
      name: "Vérification Cluster FGCP",
      status: "pending",
    },
  ]);

  const handleRunTest = async () => {
    setIsRunning(true);
    setTestResults((prev) =>
      prev.map((test) => ({ ...test, status: "pending" }))
    );

    // Simulate running tests sequentially
    for (let i = 0; i < testResults.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      setTestResults((prev) => {
        const updated = [...prev];
        updated[i] = {
          ...updated[i],
          status: "running",
        };
        return updated;
      });

      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Simulate success/error (90% success rate)
      const isSuccess = Math.random() > 0.1;
      const duration = Math.floor(Math.random() * 500) + 100;

      setTestResults((prev) => {
        const updated = [...prev];
        updated[i] = {
          ...updated[i],
          status: isSuccess ? "success" : "error",
          duration,
          result: isSuccess
            ? "Réponse reçue"
            : "Timeout ou erreur de connexion",
        };
        return updated;
      });
    }

    setIsRunning(false);
  };

  const successCount = testResults.filter((t) => t.status === "success").length;
  const errorCount = testResults.filter((t) => t.status === "error").length;
  const isComplete = testResults.every((t) => t.status !== "pending" && t.status !== "running");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Test de Connectivité
        </h1>
        <p className="text-muted-foreground">
          Vérification complète de la connectivité inter-sites
        </p>
      </div>

      {/* Control */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Lancer le Test Complet
            </h3>
            <p className="text-sm text-muted-foreground">
              Vérification de {testResults.length} étapes
            </p>
          </div>
          <Button
            onClick={handleRunTest}
            disabled={isRunning}
            size="lg"
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Démarrer
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results Summary */}
      {isComplete && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Tests Réussis</p>
            <p className="text-3xl font-bold text-green-600">{successCount}</p>
            <p className="text-xs text-muted-foreground mt-2">
              sur {testResults.length}
            </p>
          </Card>

          <Card className="p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Tests Échoués</p>
            <p className="text-3xl font-bold text-red-600">{errorCount}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {errorCount === 0 ? "Aucun problème détecté" : "Vérifier les détails"}
            </p>
          </Card>

          <Card className="p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Taux de Succès</p>
            <p className="text-3xl font-bold text-primary">
              {((successCount / testResults.length) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {successCount === testResults.length
                ? "Tous les services opérationnels"
                : "Certains services dégradés"}
            </p>
          </Card>
        </div>
      )}

      {/* Test Steps */}
      <Card className="p-6 border border-border">
        <h3 className="font-semibold text-foreground mb-4">Détail des Étapes</h3>
        <div className="space-y-3">
          {testResults.map((test, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-sm border border-border hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {test.status === "pending" && (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground"></div>
                )}
                {test.status === "running" && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                {test.status === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
                {test.status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}

                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {test.name}
                  </p>
                  {test.result && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {test.result}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {test.duration && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {test.duration}ms
                  </span>
                )}
                <Badge
                  variant={
                    test.status === "success"
                      ? "default"
                      : test.status === "error"
                        ? "destructive"
                        : "secondary"
                  }
                  className={
                    test.status === "success" ? "bg-green-600" : ""
                  }
                >
                  {test.status === "pending"
                    ? "En attente"
                    : test.status === "running"
                      ? "En cours"
                      : test.status === "success"
                        ? "OK"
                        : "Erreur"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      {isComplete && errorCount > 0 && (
        <Card className="p-4 border border-yellow-200 bg-yellow-50">
          <p className="font-semibold text-yellow-900 mb-2">
            ⚠️ Recommandations
          </p>
          <ul className="space-y-1 text-sm text-yellow-800">
            <li>
              • Vérifier la connectivité réseau entre les deux sites
            </li>
            <li>• Vérifier les configurations BGP et VRRP</li>
            <li>• Consulter les logs des équipements pour plus de détails</li>
          </ul>
        </Card>
      )}
    </div>
  );
}
