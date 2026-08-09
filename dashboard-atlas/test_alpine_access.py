import sys
from collectors.ssh_client import get_alpine_container_id, ssh_execute

def test_alpine():
    print("==================================================")
    print("   TEST D'ACCÈS AU CONTENEUR ALPINE MANAGEMENT    ")
    print("==================================================")

    try:
        # 1. Test de détection d'ID
        print("\n1. Recherche du conteneur Alpine dans Docker...")
        container_id = get_alpine_container_id()
        print(f"   ✅ Conteneur Alpine trouvé ! ID = {container_id}")

        # 2. Test de connectivité SSH vers l'équipement via Docker exec (SSH_ASKPASS natif)
        print("\n2. Test d'exécution SSH vers le routeur (CSR-BGR-1)...")
        res = ssh_execute(
            ip="10.100.40.2",
            username="admin",
            password="adminpassword",
            command="show ip int brief",
            timeout=15
        )

        if res.get("success"):
            print("   🎉 SUCCÈS TOTAL ! Connexion SSH via Alpine établie avec succès.")
            print("   --- Sortie de la commande ---")
            print(res.get("output"))
        else:
            print(f"   ⚠️ Test SSH terminé avec l'état : {res.get('error')}")

    except Exception as e:
        print(f"   ❌ Erreur : {e}")

if __name__ == "__main__":
    test_alpine()
