import subprocess
import json
import os
import datetime
from collectors.ssh_client import get_alpine_container_id, ssh_execute

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
        f"[{timestamp}] ACTION: {playbook_name} | "
        f"VARS: {json.dumps(safe_vars)} | "
        f"SUCCESS: {result.get('success')} | "
        f"RETURN_CODE: {result.get('return_code')}\n"
    )

    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, 'a') as f:
        f.write(log_entry)

def perform_direct_backup(equipment_type):
    """
    Exécute le backup ciblé ou global via le relais Alpine natif.
    Supporte les noms d'équipements spécifiques (ex: CSR-BGR-1, CSR-BGR-2).
    """
    base_dir = os.path.dirname(os.path.dirname(__file__))
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    
    all_devices = [
        {'name': 'CSR-BGR-1', 'ip': '10.100.40.2', 'cmd': 'show running-config', 'type': 'csr'},
        {'name': 'CSR-BGR-2', 'ip': '10.100.41.2', 'cmd': 'show running-config', 'type': 'csr'},
        {'name': 'CSR-BKP-1', 'ip': '10.200.40.2', 'cmd': 'show running-config', 'type': 'csr'},
        {'name': 'CSR-BKP-2', 'ip': '10.200.41.2', 'cmd': 'show running-config', 'type': 'csr'},
        {'name': 'FGT-BGR-1-1', 'ip': '10.100.40.1', 'cmd': 'get system status', 'type': 'fortigate', 'is_fgt': True},
        {'name': 'FGT-BKP-1-1', 'ip': '10.200.40.1', 'cmd': 'get system status', 'type': 'fortigate', 'is_fgt': True},
    ]

    target = equipment_type.lower()
    if target == 'all':
        inventory = all_devices
    elif target in ['benguerir', 'csr-benguerir']:
        inventory = [d for d in all_devices if d['name'] in ['CSR-BGR-1', 'CSR-BGR-2']]
    elif target == 'csr':
        inventory = [d for d in all_devices if d['type'] == 'csr']
    elif target == 'fortigate':
        inventory = [d for d in all_devices if d['type'] == 'fortigate']
    else:
        # Filtrer l'équipement spécifique par son nom (ex: CSR-BGR-1)
        inventory = [d for d in all_devices if target in d['name'].lower()]

    if not inventory:
        inventory = [all_devices[0]]  # Fallback CSR-BGR-1 si non trouvé

    results = []
    success_count = 0

    for item in inventory:
        dest_dir = os.path.join(base_dir, 'backups', item['type'])
        os.makedirs(dest_dir, exist_ok=True)
        
        res = ssh_execute(
            ip=item['ip'],
            username='admin',
            password='admin',
            command=item['cmd'],
            is_fortigate=item.get('is_fgt', False)
        )
        
        if res.get('success'):
            file_path = os.path.join(dest_dir, f"{item['name']}_{timestamp}.txt")
            with open(file_path, 'w') as f:
                f.write(res.get('output', ''))
            results.append(f"SUCCESS: {item['name']} -> {file_path}")
            success_count += 1
        else:
            results.append(f"FAILED: {item['name']} -> {res.get('error')}")

    is_overall_success = success_count > 0
    res_dict = {
        "success": is_overall_success,
        "stdout": "\n".join(results),
        "stderr": "" if is_overall_success else "Échec de sauvegarde",
        "return_code": 0 if is_overall_success else 1
    }
    log_action(f"backup_{equipment_type}_direct", {}, res_dict)
    return res_dict

def run_playbook(playbook_name, extra_vars=None):
    """
    Exécute un playbook Ansible localement.
    """
    playbook_path = os.path.join(os.path.dirname(__file__), '..', 'ansible', 'playbooks', playbook_name)
    inventory_path = os.path.join(os.path.dirname(__file__), '..', 'ansible', 'inventory.yml')

    if extra_vars is None:
        extra_vars = {}

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
        print(f"Avertissement conteneur Alpine: {e}")

    command = ['ansible-playbook', '-i', inventory_path, playbook_path]

    if extra_vars:
        command.extend(['--extra-vars', json.dumps(extra_vars)])

    try:
        env = os.environ.copy()
        if 'ssh_args' in locals():
            env['ANSIBLE_SSH_COMMON_ARGS'] = ssh_args

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
