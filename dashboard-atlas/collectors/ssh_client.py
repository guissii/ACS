import subprocess

# ============================================================
# CONFIGURATION DOCKER EXEC (JUMP HOST ALPINE)
# Le backend Flask utilise 'docker exec' pour exécuter les commandes
# directement depuis l'intérieur du conteneur alpine-admin.
# ============================================================
CONTAINER_NAME = "alpine-admin"  # ou ID du conteneur Docker dans GNS3

# Algorithmes SSH acceptés par les vieux IOS-XE (CSR1000V)
OLD_KEX_ALGO = "diffie-hellman-group14-sha1,diffie-hellman-group-exchange-sha1"
OLD_HOST_KEY = "ssh-rsa"


def ssh_execute(ip, username, password, command, is_fortigate=False):
    """
    Exécute une commande SSH sur un équipement GNS3 via 'docker exec'
    dans le conteneur alpine-admin.

    Architecture :
        VM Ubuntu (Flask) ──[docker exec]──► alpine-admin ──[SSH]──► CSR / FortiGate
    """
    ssh_cmd = (
        f"sshpass -p '{password}' ssh "
        f"-o StrictHostKeyChecking=no "
        f"-o KexAlgorithms=+{OLD_KEX_ALGO} "
        f"-o HostKeyAlgorithms=+{OLD_HOST_KEY} "
        f"-o ConnectTimeout=10 "
        f"{username}@{ip} '{command}'"
    )

    docker_cmd = [
        "docker", "exec", CONTAINER_NAME,
        "sh", "-c", ssh_cmd
    ]

    try:
        result = subprocess.run(
            docker_cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            return {"success": True, "output": result.stdout.strip()}
        else:
            # Fallback en cherchant le conteneur par image si le nom exact diffère
            return {"success": False, "error": result.stderr.strip() or result.stdout.strip()}

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout de la commande SSH via Docker."}
    except Exception as e:
        return {"success": False, "error": str(e)}


def ssh_execute_via_docker_id(container_id, ip, username, password, command):
    """
    Variante avec l'ID spécifique du conteneur Docker.
    """
    ssh_cmd = (
        f"sshpass -p '{password}' ssh "
        f"-o StrictHostKeyChecking=no "
        f"-o KexAlgorithms=+{OLD_KEX_ALGO} "
        f"-o HostKeyAlgorithms=+{OLD_HOST_KEY} "
        f"-o ConnectTimeout=10 "
        f"{username}@{ip} '{command}'"
    )

    docker_cmd = [
        "docker", "exec", container_id,
        "sh", "-c", ssh_cmd
    ]

    try:
        result = subprocess.run(
            docker_cmd,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            return {"success": True, "output": result.stdout.strip()}
        else:
            return {"success": False, "error": result.stderr.strip()}
    except Exception as e:
        return {"success": False, "error": str(e)}
