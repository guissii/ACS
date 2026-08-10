import sys
from collectors.ssh_client import get_alpine_container_id, ssh_execute

def test_devices_status():
    print("==================================================")
    print("   VERIFICATION DU STATUT DE TOUS LES EQUIPEMENTS ")
    print("==================================================")

    devices = [
        {"name": "CSR-BGR-1 (R-BGR-1)", "ip": "10.100.40.2", "type": "csr"},
        {"name": "CSR-BGR-2 (R-BGR-2)", "ip": "10.100.41.2", "type": "csr"},
        {"name": "CSR-BKP-1 (R-BKP-1)", "ip": "10.200.40.2", "type": "csr"},
        {"name": "CSR-BKP-2 (R-BKP-2)", "ip": "10.200.41.2", "type": "csr"},
        {"name": "FGT-BGR-1-1", "ip": "10.100.40.1", "type": "fortigate"},
        {"name": "FGT-BKP-1-1", "ip": "10.200.40.1", "type": "fortigate"},
    ]

    try:
        container_id = get_alpine_container_id()
        print(f"\n✅ Relais Alpine en ligne : ID = {container_id}\n")

        for dev in devices:
            cmd = "show ip int brief" if dev["type"] == "csr" else "get system status"
            res = ssh_execute(
                ip=dev["ip"],
                username="admin",
                password="admin",
                command=cmd,
                timeout=10,
                is_fortigate=(dev["type"] == "fortigate")
            )
            if res.get("success"):
                print(f"  🟢 {dev['name']} ({dev['ip']}) : ALLUMÉ & ACCESSIBLE !")
            else:
                print(f"  🔴 {dev['name']} ({dev['ip']}) : ÉTEINT / INACCESSIBLE ({res.get('error')})")

    except Exception as e:
        print(f"❌ Erreur générale : {e}")

if __name__ == "__main__":
    test_devices_status()
