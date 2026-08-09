import subprocess
import json
import os
import datetime
from collectors.ssh_client import get_alpine_container_id

LOG_FILE = os.path.join(os.path.dirname(__file__), '..', 'logs', 'automation.log')

def log_action(playbook_name, extra_vars, result):
    """Logue l'exécution de manière sécurisée (masquage de mot de passe)"""
    timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Masquage basique de secrets éventuels (si passés en variables)
    safe_vars = {}
    if extra_vars:
        for k, v in extra_vars.items():
            if 'password' in k.lower() or 'secret' in k.lower():
                safe_vars[k] = '********'
            else:
                safe_vars[k] = v

    log_entry = (
        f"[{timestamp}] PLAYBOOK: {playbook_name} | "
        f"VARS: {json.dumps(safe_vars)} | "
        f"SUCCESS: {result.get('success')} | "
        f"RETURN_CODE: {result.get('return_code')}\n"
    )

    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, 'a') as f:
        f.write(log_entry)

def run_playbook(playbook_name, extra_vars=None):
    """
    Exécute un playbook Ansible localement en injectant dynamiquement
    l'ID du conteneur Alpine dans ProxyCommand.
    """
    playbook_path = os.path.join(os.path.dirname(__file__), '..', 'ansible', 'playbooks', playbook_name)
    inventory_path = os.path.join(os.path.dirname(__file__), '..', 'ansible', 'inventory.yml')

    if extra_vars is None:
        extra_vars = {}

    # Injection dynamique du ProxyCommand Docker avec l'ID réel du conteneur Alpine
    try:
        container_id = get_alpine_container_id()
        ssh_args = (
            "-o StrictHostKeyChecking=no "
            "-o UserKnownHostsFile=/dev/null "
            "-o KexAlgorithms=+diffie-hellman-group14-sha1,diffie-hellman-group-exchange-sha1 "
            "-o HostKeyAlgorithms=+ssh-rsa "
            f'-o ProxyCommand="docker exec -i {container_id} nc %h %p"'
        )
        extra_vars["ansible_ssh_common_args"] = ssh_args
    except Exception as e:
        print(f"Avertissement lors de la récupération du conteneur Alpine: {e}")

    command = ['ansible-playbook', '-i', inventory_path, playbook_path]

    if extra_vars:
        command.extend(['--extra-vars', json.dumps(extra_vars)])

    try:
        env = os.environ.copy()
        if 'ssh_args' in locals():
            env['ANSIBLE_SSH_COMMON_ARGS'] = ssh_args

        # Exécution avec capture des sorties
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            cwd=os.path.join(os.path.dirname(__file__), '..', 'ansible'),
            env=env
        )
        
        success = process.returncode == 0
        result = {
            "success": success,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "return_code": process.returncode
        }
    except Exception as e:
        result = {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "return_code": -1
        }

    log_action(playbook_name, extra_vars, result)
    return result
