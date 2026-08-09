import sys
from collectors.ssh_client import get_alpine_container_id, ssh_execute

def test_alpine():
    print("==================================================")
    print("   TEST D'ACCÈS COMBINÉ (CSR + FORTIGATE)        ")
    print("==================================================")

    try:
        # 1. Test de détection d'ID
        print("\n1. Recherche du conteneur Alpine dans Docker...")
        container_id = get_alpine_container_id()
        print(f"   ✅ Conteneur Alpine trouvé ! ID = {container_id}")

        # 2. Test CSR Routeur (10.100.40.2)
        print("\n2. Test SSH vers CSR-BGR-1 (10.100.40.2)...")
        res_csr = ssh_execute(
            ip="10.100.40.2",
            username="admin",
            password="admin",
            command="show ip int brief",
            timeout=15
        )
        if res_csr.get("success"):
            print("   🎉 CSR-BGR-1 SUCCÈS ! Connexion OK.")
        else:
            print(f"   ⚠️ CSR-BGR-1 État : {res_csr.get('error')}")

        # 3. Test FortiGate Firewall (10.100.40.1) avec flag -tt
        print("\n3. Test SSH vers FortiGate FGT-BGR-1-1 (10.100.40.1)...")
        res_fgt = ssh_execute(
            ip="10.100.40.1",
            username="admin",
            password="admin",
            command="get system status",
            timeout=15,
            is_fortigate=True
        )
        if res_fgt.get("success"):
            print("   🎉 FORTIGATE SUCCÈS ! Connexion OK.")
            print("   --- Extrait FortiOS ---")
            print('\n'.join(res_fgt.get('output').split('\n')[:5]))
        else:
            print(f"   ⚠️ FortiGate État : {res_fgt.get('error')}")

    except Exception as e:
        print(f"   ❌ Erreur : {e}")

if __name__ == "__main__":
    test_alpine()
