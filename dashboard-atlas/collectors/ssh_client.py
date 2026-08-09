import subprocess

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


def ssh_execute(ip, username, password, command, timeout=30, is_fortigate=False):
    """
    Exécute une commande SSH sur un équipement GNS3 via 'docker exec'
    dans le conteneur alpine-admin.

    Utilise SSH_ASKPASS natif OpenSSH (aucun besoin de sshpass).
    - Support du flag pseudo-terminal -tt requis par FortiOS (FortiGate)
    - Détection dynamique de l'ID du conteneur (anti-reset GNS3)
    - Syntaxe exacte sans espaces pour -oKexAlgorithms et -oHostKeyAlgorithms
    - Guard anti-replay / anti-deadlock avec ServerAliveInterval=5 et ServerAliveCountMax=2
    """
    try:
        container_id = get_alpine_container_id()

        # FortiGate (FortiOS) exige l'allocation d'un pseudo-tty (-tt) pour accepter les commandes non-interactives
        if is_fortigate or ip.endswith(".1"):
            pty_flag = "-tt "
        else:
            pty_flag = ""

        # Injection SSH_ASKPASS natif dans le conteneur Alpine
        askpass_setup = f"echo '#!/bin/sh' > /tmp/ap.sh && echo 'echo \"{password}\"' >> /tmp/ap.sh && chmod +x /tmp/ap.sh"

        ssh_cmd = (
            f"{askpass_setup} && "
            f"SSH_ASKPASS=/tmp/ap.sh DISPLAY=:0 SSH_ASKPASS_REQUIRE=force ssh {pty_flag}"
            f"-oStrictHostKeyChecking=no "
            f"-oKexAlgorithms=+diffie-hellman-group14-sha1,diffie-hellman-group-exchange-sha1 "
            f"-oHostKeyAlgorithms=+ssh-rsa "
            f"-oConnectTimeout=10 "
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
            return {"success": False, "error": result.stderr.strip() or result.stdout.strip()}

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout - équipement injoignable ou bloqué (anti-replay)"}
    except Exception as e:
        return {"success": False, "error": str(e)}
