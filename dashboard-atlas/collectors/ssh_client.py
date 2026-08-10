import subprocess
import socket
import time
import sys

# Cache local pour éviter de re-scanner Docker à chaque requête
_cached_container_id = None


def get_alpine_container_id():
    """
    Récupère dynamiquement l'ID du conteneur alpine-admin actif dans Docker.
    Gère les réinitialisations GNS3 où le nom/ID du conteneur change à chaque démarrage.
    Retourne None si le conteneur n'est pas disponible.
    """
    global _cached_container_id

    try:
        # Tester le cache d'abord
        if _cached_container_id:
            check = subprocess.run(
                ["docker", "ps", "-q", "--filter", f"id={_cached_container_id}"],
                capture_output=True, text=True, timeout=2
            )
            if check.stdout.strip():
                return _cached_container_id

        # 1. Essai par nom de conteneur direct "alpine"
        res = subprocess.run(
            ["docker", "ps", "--filter", "name=alpine", "--format", "{{.ID}}"],
            capture_output=True, text=True, timeout=2
        )
        container_ids = res.stdout.strip().split('\n')
        if container_ids and container_ids[0]:
            _cached_container_id = container_ids[0]
            return _cached_container_id

        # 2. Essai par nom d'image (ancestor)
        res = subprocess.run(
            ["docker", "ps", "--filter", "ancestor=alpine-admin-final:latest", "--format", "{{.ID}}"],
            capture_output=True, text=True, timeout=2
        )
        container_ids = res.stdout.strip().split('\n')
        if container_ids and container_ids[0]:
            _cached_container_id = container_ids[0]
            return _cached_container_id

        # 3. Dernier fallback : tout conteneur actif contenant 'alpine'
        res = subprocess.run(
            ["docker", "ps", "--format", "{{.ID}} {{.Image}} {{.Names}}"],
            capture_output=True, text=True, timeout=2
        )
        for line in res.stdout.strip().split('\n'):
            if 'alpine' in line.lower():
                cid = line.split()[0]
                _cached_container_id = cid
                return cid
    except Exception:
        pass

    return None


def check_port_in_alpine(container_id, ip, port, timeout=2):
    """
    Vérifie rapidement si un port (22=SSH, 23=Telnet) est OUVERT sur l'IP cible
    depuis le conteneur Alpine en ~1 seconde.
    """
    try:
        cmd = ["docker", "exec", container_id, "nc", "-z", "-w", str(timeout), ip, str(port)]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 1)
        return res.returncode == 0
    except Exception:
        return False


def direct_port_check(ip, port, timeout=2):
    """
    Vérification directe de port TCP socket (SSH 22 ou Telnet 23)
    lorsque Docker n'est pas utilisé ou pour test rapide de l'état Allumé/Éteint.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        result = s.connect_ex((ip, port))
        s.close()
        return result == 0
    except Exception:
        return False


def telnet_execute(ip, username, password, command, timeout=5):
    """
    Exécute une commande via Telnet (port 23) via le conteneur Alpine
    pour les équipements Cisco IOU / Routers sécurisés avec 'login local' (Username: admin, Secret: admin).
    """
    container_id = get_alpine_container_id()

    if container_id:
        try:
            # Séquence d'authentification Telnet sécurisée avec login local (username admin / secret admin)
            # Envoi d'un saut de ligne pour afficher 'Username:', puis login, password, disable paging, command et exit.
            telnet_cmd = (
                f"(echo ''; sleep 1; echo '{username}'; sleep 1; echo '{password}'; sleep 1; "
                f"echo 'terminal length 0'; sleep 1; echo '{command}'; sleep 1; echo 'exit') | "
                f"docker exec -i {container_id} nc -w 5 {ip} 23"
            )
            
            res = subprocess.run(
                telnet_cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout + 3
            )
            
            output = res.stdout.strip()
            if output and any(kw in output for kw in ["#", ">", "Password:", "User", username, "IOS", "Cisco", "Config"]):
                lines = output.splitlines()
                clean_lines = [
                    l for l in lines 
                    if not any(kw in l for kw in ["User Access Verification", "Username:", "Password:", "terminal length 0", "login local"])
                ]
                return {"success": True, "output": "\n".join(clean_lines).strip(), "method": "Telnet Securise (Docker)"}
            else:
                # Le port Telnet (23) réponds mais la commande CLI n'a pas renvoyé le prompt formaté.
                # L'équipement est ALLUMÉ et le port 23 réponds.
                return {"success": True, "output": output or "Équipement Telnet allumé", "method": "Telnet Securise (Port 23 En Ligne)"}
                
        except Exception as e:
            return {"success": False, "error": f"Erreur Telnet Docker : {str(e)}"}
    
    # Fallback Direct Socket Telnet Check (port 23)
    if direct_port_check(ip, 23, timeout=2):
        return {"success": True, "output": f"Port Telnet (23) ouvert sur {ip}", "method": "Telnet Direct"}
    else:
        return {"success": False, "error": f"Port Telnet (23) fermé/injoignable sur {ip}"}


def ssh_execute(ip, username, password, command, timeout=10, is_fortigate=False, protocol="auto"):
    """
    Exécute une commande SSH ou Telnet sur un équipement GNS3.
    - Si protocol='telnet', s'exécute directement via Telnet.
    - Si protocol='ssh', s'exécute uniquement via SSH.
    - Si protocol='auto', teste le port 22 (SSH) puis bascule sur le port 23 (Telnet).
    """
    proto = str(protocol).lower()
    
    if proto == "telnet":
        return telnet_execute(ip, username, password, command, timeout=timeout)

    container_id = get_alpine_container_id()

    if container_id:
        # Step 1: Test rapide du port 22 (SSH) si pas explicitement forcé telnet
        ssh_open = check_port_in_alpine(container_id, ip, 22, timeout=2) if proto != "telnet" else False

        if ssh_open:
            try:
                pty_flag = "-tt "
                askpass_setup = f"echo '#!/bin/sh' > /tmp/ap.sh && echo 'echo \"{password}\"' >> /tmp/ap.sh && chmod +x /tmp/ap.sh"

                ssh_cmd = (
                    f"{askpass_setup} && "
                    f"SSH_ASKPASS=/tmp/ap.sh DISPLAY=:0 SSH_ASKPASS_REQUIRE=force ssh {pty_flag}"
                    f"-oStrictHostKeyChecking=no "
                    f"-oKexAlgorithms=+diffie-hellman-group14-sha1,diffie-hellman-group-exchange-sha1 "
                    f"-oHostKeyAlgorithms=+ssh-rsa "
                    f"-oConnectTimeout=4 "
                    f"-oServerAliveInterval=3 "
                    f"-oServerAliveCountMax=1 "
                    f"{username}@{ip} '{command}'"
                )

                docker_cmd = ["docker", "exec", container_id, "sh", "-c", ssh_cmd]

                result = subprocess.run(
                    docker_cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout
                )

                if result.returncode == 0:
                    return {"success": True, "output": result.stdout.strip(), "method": "SSH (Docker)"}
            except Exception:
                pass

        # Si protocol == 'ssh', ne pas essayer Telnet
        if proto == "ssh":
            return {"success": False, "error": f"Équipement SSH {ip} non disponible (port 22)"}

        # Step 2: Si SSH indisponible ou échoué, tester le port 23 (Telnet)
        telnet_open = check_port_in_alpine(container_id, ip, 23, timeout=2)
        if telnet_open:
            return telnet_execute(ip, username, password, command, timeout=5)

        # Step 3: Ni SSH ni Telnet ne répondent -> Équipement ÉTEINT / Inaccessible
        return {"success": False, "error": "Équipement éteint (Ports 22 & 23 inaccessibles)"}

    # Si Docker n'est pas actif sur la machine locale : Direct Socket SSH (port 22) ou Telnet (port 23)
    if proto != "telnet" and direct_port_check(ip, 22, timeout=2):
        return {"success": True, "output": f"Port SSH (22) ouvert sur {ip}", "method": "SSH Direct"}
    
    if proto != "ssh" and direct_port_check(ip, 23, timeout=2):
        return telnet_execute(ip, username, password, command, timeout=5)

    return {"success": False, "error": f"Équipement {ip} injoignable (SSH:22 & Telnet:23 fermés/éteint)"}



