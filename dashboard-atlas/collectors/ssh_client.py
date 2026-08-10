import subprocess
import time

# Cache local pour éviter de re-scanner Docker à chaque requête
_cached_container_id = None


def get_alpine_container_id():
    """
    Récupère dynamiquement l'ID du conteneur alpine-admin actif dans Docker.
    Gère les réinitialisations GNS3 où le nom/ID du conteneur change à chaque démarrage.
    """
    global _cached_container_id

    # Tester le cache d'abord
    if _cached_container_id:
        check = subprocess.run(
            ["docker", "ps", "-q", "--filter", f"id={_cached_container_id}"],
            capture_output=True, text=True
        )
        if check.stdout.strip():
            return _cached_container_id

    # 1. Essai par nom de conteneur direct "alpine"
    res = subprocess.run(
        ["docker", "ps", "--filter", "name=alpine", "--format", "{{.ID}}"],
        capture_output=True, text=True
    )
    container_ids = res.stdout.strip().split('\n')
    if container_ids and container_ids[0]:
        _cached_container_id = container_ids[0]
        return _cached_container_id

    # 2. Essai par nom d'image (ancestor)
    res = subprocess.run(
        ["docker", "ps", "--filter", "ancestor=alpine-admin-final:latest", "--format", "{{.ID}}"],
        capture_output=True, text=True
    )
    container_ids = res.stdout.strip().split('\n')
    if container_ids and container_ids[0]:
        _cached_container_id = container_ids[0]
        return _cached_container_id

    # 3. Dernier fallback : tout conteneur actif contenant 'alpine'
    res = subprocess.run(
        ["docker", "ps", "--format", "{{.ID}} {{.Image}} {{.Names}}"],
        capture_output=True, text=True
    )
    for line in res.stdout.strip().split('\n'):
        if 'alpine' in line.lower():
            cid = line.split()[0]
            _cached_container_id = cid
            return cid

    raise Exception("Conteneur alpine-admin introuvable ou arrêté dans Docker.")


def telnet_execute(ip, username, password, command, timeout=10):
    """
    Exécute une commande via Telnet (port 23) via le conteneur Alpine
    pour les équipements Cisco IOU sans support SSH / Cryptographie.
    """
    try:
        container_id = get_alpine_container_id()
        
        # Script expect/sh basique via netcat / busybox telnet dans Alpine
        telnet_cmd = (
            f"(sleep 1; echo '{username}'; sleep 1; echo '{password}'; sleep 1; echo 'terminal length 0'; sleep 1; echo '{command}'; sleep 2; echo 'exit') | "
            f"docker exec -i {container_id} nc -w 10 {ip} 23"
        )
        
        res = subprocess.run(
            telnet_cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout + 5
        )
        
        output = res.stdout.strip()
        if output and any(kw in output for kw in ["#", ">", "Password:", "User", username]):
            lines = output.splitlines()
            clean_lines = [l for l in lines if not any(kw in l for kw in ["User Access Verification", "Username:", "Password:", "terminal length 0"])]
            return {"success": True, "output": "\n".join(clean_lines).strip()}
        else:
            return {"success": False, "error": res.stderr.strip() or "Telnet injoignable"}
            
    except Exception as e:
        return {"success": False, "error": f"Erreur Telnet : {str(e)}"}


def ssh_execute(ip, username, password, command, timeout=30, is_fortigate=False):
    """
    Exécute une commande SSH sur un équipement GNS3 via 'docker exec'
    dans le conteneur alpine-admin.
    Si SSH échoue (ex: IOU sans crypto / port 22 refusé), bascule automatiquement en Telnet (port 23).
    """
    try:
        container_id = get_alpine_container_id()

        # Allocation d'un pseudo-tty (-tt) requis par Cisco IOS-XE et FortiOS pour les commandes SSH non-interactives
        pty_flag = "-tt "

        # Injection SSH_ASKPASS natif dans le conteneur Alpine
        askpass_setup = f"echo '#!/bin/sh' > /tmp/ap.sh && echo 'echo \"{password}\"' >> /tmp/ap.sh && chmod +x /tmp/ap.sh"

        ssh_cmd = (
            f"{askpass_setup} && "
            f"SSH_ASKPASS=/tmp/ap.sh DISPLAY=:0 SSH_ASKPASS_REQUIRE=force ssh {pty_flag}"
            f"-oStrictHostKeyChecking=no "
            f"-oKexAlgorithms=+diffie-hellman-group14-sha1,diffie-hellman-group-exchange-sha1 "
            f"-oHostKeyAlgorithms=+ssh-rsa "
            f"-oConnectTimeout=6 "
            f"-oServerAliveInterval=5 "
            f"-oServerAliveCountMax=2 "
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
            return {"success": True, "output": result.stdout.strip()}
        else:
            # Fallback automatique Telnet (port 23) pour les IOU sans SSH !
            t_res = telnet_execute(ip, username, password, command, timeout=10)
            if t_res.get("success"):
                return t_res
            return {"success": False, "error": result.stderr.strip() or result.stdout.strip()}

    except subprocess.TimeoutExpired:
        # Fallback automatique Telnet en cas de timeout SSH
        t_res = telnet_execute(ip, username, password, command, timeout=10)
        if t_res.get("success"):
            return t_res
        return {"success": False, "error": "Timeout SSH & Telnet"}
    except Exception as e:
        return {"success": False, "error": str(e)}
