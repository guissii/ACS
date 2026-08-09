import paramiko
import subprocess

# ============================================================
# CONFIGURATION JUMP HOST
# alpine-admin est le seul conteneur avec accès direct au
# réseau de management interne GNS3 (10.100.x.x).
# Le backend Flask NE se connecte PAS directement aux CSR/FGT.
# ============================================================
JUMP_HOST_IP       = "192.168.199.4"   # alpine-admin (VLAN Management 199)
JUMP_HOST_USER     = "root"
JUMP_HOST_PASSWORD = "alpine"          # Mot de passe par défaut de l'image

# Algorithmes SSH acceptés par les vieux IOS-XE (CSR1000V)
OLD_KEX_ALGO  = "diffie-hellman-group14-sha1,diffie-hellman-group-exchange-sha1"
OLD_HOST_KEY  = "ssh-rsa"


def ssh_execute(ip, username, password, command, is_fortigate=False):
    """
    Exécute une commande SSH sur un équipement réseau GNS3
    via le jump host alpine-admin (192.168.199.4).

    Architecture :
        VM Ubuntu (Flask) → alpine-admin → CSR/FortiGate

    Les CSR1000V nécessitent d'accepter les anciens algorithmes crypto
    (diffie-hellman-group14-sha1, ssh-rsa) refusés par défaut par
    OpenSSH moderne.
    """
    try:
        # --- Étape 1 : Connexion au jump host alpine-admin ---
        jump = paramiko.SSHClient()
        jump.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        jump.connect(
            hostname=JUMP_HOST_IP,
            username=JUMP_HOST_USER,
            password=JUMP_HOST_PASSWORD,
            look_for_keys=False,
            allow_agent=False,
            timeout=10
        )

        # --- Étape 2 : Ouvrir un canal vers l'équipement cible ---
        jump_transport = jump.get_transport()
        dest_addr  = (ip, 22)
        local_addr = (JUMP_HOST_IP, 0)
        channel = jump_transport.open_channel("direct-tcpip", dest_addr, local_addr)

        # --- Étape 3 : Connexion SSH sur l'équipement via le canal ---
        target = paramiko.SSHClient()
        target.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        # Accepter les anciens algorithmes des IOS-XE (CSR1000V)
        transport = paramiko.Transport(channel)
        transport.connect(
            username=username,
            password=password,
            gss_auth=False,
        )
        # Forcer les algorithmes legacy nécessaires pour IOS-XE
        transport._preferred_kex = (
            'diffie-hellman-group14-sha1',
            'diffie-hellman-group-exchange-sha1',
            'diffie-hellman-group1-sha1',
        )

        target._transport = transport
        target.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        stdin, stdout, stderr = target.exec_command(command)
        output = stdout.read().decode('utf-8', errors='ignore').strip()
        error  = stderr.read().decode('utf-8', errors='ignore').strip()

        if error and not output:
            return {"success": False, "error": error}

        return {"success": True, "output": output}

    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        try: target.close()
        except: pass
        try: jump.close()
        except: pass


def ssh_execute_via_subprocess(ip, username, password, command):
    """
    Fallback : exécute une commande SSH sur un équipement GNS3 via
    le binaire ssh système depuis la VM Ubuntu.
    Passe DIRECTEMENT par les flags -oKexAlgorithms et -oHostKeyAlgorithms
    prouvés fonctionnels lors du diagnostic manuel.

    Commande équivalente (prouvée) :
        ssh -oKexAlgorithms=+diffie-hellman-group14-sha1 \
            -oHostKeyAlgorithms=+ssh-rsa \
            -J root@192.168.199.4 admin@10.100.40.2
    """
    ssh_cmd = [
        "ssh",
        f"-oKexAlgorithms=+{OLD_KEX_ALGO}",
        f"-oHostKeyAlgorithms=+{OLD_HOST_KEY}",
        "-oStrictHostKeyChecking=no",
        "-oConnectTimeout=10",
        f"-J", f"{JUMP_HOST_USER}@{JUMP_HOST_IP}",
        f"{username}@{ip}",
        command
    ]
    try:
        result = subprocess.run(
            ssh_cmd,
            capture_output=True,
            text=True,
            timeout=30,
            input=f"{JUMP_HOST_PASSWORD}\n{password}\n"
        )
        if result.returncode == 0:
            return {"success": True, "output": result.stdout.strip()}
        else:
            return {"success": False, "error": result.stderr.strip()}
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Timeout de connexion SSH dépassé."}
    except Exception as e:
        return {"success": False, "error": str(e)}
