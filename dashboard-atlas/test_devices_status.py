import sys
import os

# Configurer l'encodage stdout pour éviter les erreurs Unicode sous Windows CMD/PowerShell
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from collectors.ssh_client import get_alpine_container_id, ssh_execute

def test_devices_status():
    print("==================================================")
    print("   VERIFICATION DU STATUT DE TOUS LES EQUIPEMENTS ")
    print("==================================================")

    devices = [
        # Routeurs Cœur CSR (SSH)
        {"name": "CSR-BGR-1", "ip": "10.100.40.2", "type": "csr", "protocol": "SSH"},
        {"name": "CSR-BGR-2", "ip": "10.100.41.2", "type": "csr", "protocol": "SSH"},
        {"name": "CSR-BKP-1", "ip": "10.200.40.2", "type": "csr", "protocol": "SSH"},
        {"name": "CSR-BKP-2", "ip": "10.200.41.2", "type": "csr", "protocol": "SSH"},
        # Pare-feux FortiGate (SSH)
        {"name": "FGT-BGR-1-1", "ip": "10.100.40.1", "type": "fortigate", "protocol": "SSH"},
        {"name": "FGT-BKP-1-1", "ip": "10.200.40.1", "type": "fortigate", "protocol": "SSH"},
        # Routeurs Bordure IOU (Telnet direct)
        {"name": "R-BGR-1", "ip": "1.1.1.1", "type": "csr", "protocol": "Telnet"},
        {"name": "R-BGR-2", "ip": "1.1.1.2", "type": "csr", "protocol": "Telnet"},
        {"name": "R-BGR-3", "ip": "4.4.4.1", "type": "csr", "protocol": "Telnet"},
        {"name": "R-BGR-4", "ip": "4.4.4.2", "type": "csr", "protocol": "Telnet"},
    ]

    container_id = get_alpine_container_id()
    if container_id:
        print(f"\n[DOCKER] Relais Alpine en ligne : ID = {container_id}\n")
    else:
        print("\n[DIRECT] Docker non detecte localement -> Mode Direct Network Socket\n")

    online_count = 0
    total_count = len(devices)

    for dev in devices:
        cmd = "show ip int brief" if dev["type"] == "csr" else "get system status"
        res = ssh_execute(
            ip=dev["ip"],
            username="admin",
            password="admin",
            command=cmd,
            timeout=5,
            is_fortigate=(dev["type"] == "fortigate"),
            protocol=dev.get("protocol", "auto")
        )
        
        if res.get("success"):
            online_count += 1
            method = res.get("method", dev["protocol"])
            print(f"  🟢 {dev['name']:<25} ({dev['ip']:<12}) : ALLUMÉ & ACCESSIBLE ! [{method}]")
        else:
            err = res.get("error", "Inaccessible")
            print(f"  🔴 {dev['name']:<25} ({dev['ip']:<12}) : ÉTEINT / INACCESSIBLE ({err})")

    print("\n==================================================")
    print(f"   BILAN STATUT : {online_count}/{total_count} équipements ALLUMÉS")
    print("==================================================")

if __name__ == "__main__":
    test_devices_status()

