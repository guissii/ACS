import subprocess
import json
import os
import datetime

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

    with open(LOG_FILE, 'a') as f:
        f.write(log_entry)

def run_playbook(playbook_name, extra_vars=None):
    """
    Exécute un playbook Ansible localement.
    """
    playbook_path = os.path.join(os.path.dirname(__file__), '..', 'ansible', 'playbooks', playbook_name)
    inventory_path = os.path.join(os.path.dirname(__file__), '..', 'ansible', 'inventory.yml')

    command = ['ansible-playbook', '-i', inventory_path, playbook_path]

    if extra_vars:
        command.extend(['--extra-vars', json.dumps(extra_vars)])

    try:
        # Exécution avec capture des sorties
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            # Définir le CWD pour que ansible.cfg soit pris en compte
            cwd=os.path.join(os.path.dirname(__file__), '..', 'ansible')
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
