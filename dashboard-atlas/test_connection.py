import paramiko
import time
import getpass
import sys

# Dictionnaire des équipements à tester
EQUIPMENTS = {
    "CSR-BGR-1": "10.100.40.2",
    "CSR-BGR-2": "10.100.41.2",
    "FGT-BGR-1-1": "10.100.40.1",
    # "CSR-BKP-1": "10.200.40.2",
    # "CSR-BKP-2": "10.200.41.2",
    # "FGT-BKP-1-1": "10.200.40.1",
}

def test_ssh_connection(hostname, ip, username, password):
    print(f"\n[{hostname}] Test de connexion vers {ip}...")
    
    # Création du client SSH
    client = paramiko.SSHClient()
    # Accepter automatiquement les clés SSH inconnues (environnement lab)
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # Tentative de connexion avec timeout de 5 secondes
        client.connect(
            hostname=ip, 
            username=username, 
            password=password, 
            look_for_keys=False, 
            allow_agent=False,
            timeout=5
        )
        print(f"✅ [{hostname}] Succès : Connexion SSH établie avec {ip}.")
        
        # Test d'exécution d'une commande simple
        if "CSR" in hostname:
            stdin, stdout, stderr = client.exec_command("show version | include IOS")
        else:
            stdin, stdout, stderr = client.exec_command("get system status | grep Version")
            
        output = stdout.read().decode('utf-8').strip()
        if output:
            print(f"   ℹ️ Réponse CLI : {output}")
        else:
            print(f"   ⚠️ Connecté mais aucune réponse à la commande texte.")
            
        return True
        
    except paramiko.AuthenticationException:
        print(f"❌ [{hostname}] Échec : Identifiants incorrects.")
    except TimeoutError:
        print(f"❌ [{hostname}] Échec : Timeout, l'équipement est injoignable sur le port 22.")
    except Exception as e:
        print(f"❌ [{hostname}] Échec : Erreur inattendue : {e}")
    finally:
        client.close()
        
    return False

if __name__ == "__main__":
    print("==================================================")
    print("   TEST DE CONNECTIVITÉ GNS3 (PARAMIKO)           ")
    print("==================================================")
    
    print("\nEntrez vos identifiants GNS3 (Cisco/FortiGate).")
    username = input("Utilisateur SSH : ")
    password = getpass.getpass("Mot de passe SSH : ")
    
    success_count = 0
    total_count = len(EQUIPMENTS)
    
    for hostname, ip in EQUIPMENTS.items():
        if test_ssh_connection(hostname, ip, username, password):
            success_count += 1
            
    print("\n==================================================")
    print(f"   RÉSULTAT DU TEST : {success_count}/{total_count} équipements accessibles")
    print("==================================================")
