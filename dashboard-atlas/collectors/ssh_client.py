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

    # 1. Essai par nom de conteneur direct "alpine-admin"
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


def ensure_sshpass_installed(container_id):
    """
    S'assure que 'sshpass' est disponible dans le conteneur alpine.
    L'installe automatiquement via 'apk add --no-cache sshpass' si nécessaire.
    """
    check = subprocess.run(
        ["docker", "exec", container_id, "sh", "-c", "which sshpass"],
        capture_output=True, text=True
    )
    if check.returncode != 0:
        # Auto-installation transparente de sshpass dans le conteneur Alpine
        subprocess.run(
            ["docker", "exec", container_id, "sh", "-c", "apk add --no-cache sshpass"],
            capture_output=True, text=True
        )


def ssh_execute(ip, username, password, command, timeout=30, is_fortigate=False):
    """
    Exécute une commande SSH sur un équipement GNS3 via 'docker exec'
    dans le conteneur alpine-admin.

    Points clés de résilience :
    - Détection dynamique de l'ID du conteneur (anti-reset GNS3)
    - Auto-installation de sshpass dans le conteneur si absent
    - Syntax exacte sans espaces pour -oKexAlgorithms et -oHostKeyAlgorithms
    - Guard anti-replay / anti-deadlock avec ServerAliveInterval=5 et ServerAliveCountMax=2
    """
    try:
        container_id = get_alpine_container_id()
        ensure_sshpass_installed(container_id)

        # Syntax exacte sans espace après le -o
        ssh_cmd = (
            f"sshpass -p '{password}' ssh "
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
