from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from automation.ansible_runner import run_playbook, perform_direct_backup
from collectors.ssh_client import ssh_execute
import os
import glob
import datetime
from threading import Thread

app = Flask(__name__)
# Configurations basiques & CORS
app.config['SECRET_KEY'] = 'atlas_secret_key'
CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# --- ROUTES DE MONITORING & STATUT TEMPS RÉEL ---

@app.route('/api/vrrp/all', methods=['GET'])
def get_vrrp_all():
    return jsonify({
        "CSR-BGR-1": {"state": "Master", "priority": 110},
        "CSR-BGR-2": {"state": "Backup", "priority": 100}
    })

@app.route('/api/sdwan/<equipment>', methods=['GET'])
def get_sdwan(equipment):
    return jsonify({"equipment": equipment, "sdwan_health": "ok"})

@app.route('/api/devices/status', methods=['GET'])
def get_devices_status():
    """
    Scanne dynamiquement en temps réel le statut d'alimentation/joignabilité
    de chaque équipement GNS3 via le relais Alpine.
    """
    devices = [
        # Routeurs Cœur CSR (SSH)
        {"id": "csr-bgr-1", "name": "CSR-BGR-1", "alias": "CSR-BGR-1", "ip": "10.100.40.2", "type": "csr"},
        {"id": "csr-bgr-2", "name": "CSR-BGR-2", "alias": "CSR-BGR-2", "ip": "10.100.41.2", "type": "csr"},
        {"id": "csr-bkp-1", "name": "CSR-BKP-1", "alias": "CSR-BKP-1", "ip": "10.200.40.2", "type": "csr"},
        {"id": "csr-bkp-2", "name": "CSR-BKP-2", "alias": "CSR-BKP-2", "ip": "10.200.41.2", "type": "csr"},
        # Pare-feux FortiGate (SSH)
        {"id": "fgt-bgr-1-1", "name": "FGT-BGR-1-1", "alias": "FGT-BGR-1", "ip": "10.100.40.1", "type": "fortigate"},
        {"id": "fgt-bkp-1-1", "name": "FGT-BKP-1-1", "alias": "FGT-BKP-1", "ip": "10.200.40.1", "type": "fortigate"},
        # Routeurs Bordure IOU (Telnet / SSH)
        {"id": "r-bgr-1", "name": "R-BGR-1", "alias": "r-bgr-1", "ip": "10.100.40.3", "type": "csr"},
        {"id": "r-bgr-2", "name": "R-BGR-2", "alias": "r-bgr-2", "ip": "10.100.41.3", "type": "csr"},
        {"id": "r-bkp-3", "name": "R-BGR-3", "alias": "r-bkp-3", "ip": "10.200.40.3", "type": "csr"},
        {"id": "r-bkp-4", "name": "R-BGR-4", "alias": "r-bkp-4", "ip": "10.200.41.3", "type": "csr"},
        # Opérateurs ISP (Inwi, Orange, IAM)
        {"id": "inw", "name": "Inw", "alias": "inw", "ip": "10.100.1.2", "type": "csr"},
        {"id": "ora", "name": "Ora", "alias": "ora", "ip": "10.100.3.2", "type": "csr"},
        {"id": "iam", "name": "IAM", "alias": "iam", "ip": "10.100.5.2", "type": "csr"},
    ]
    status_map = {}
    for dev in devices:
        cmd = "show ip int brief" if dev["type"] == "csr" else "get system status"
        res = ssh_execute(
            ip=dev["ip"],
            username="admin",
            password="admin",
            command=cmd,
            timeout=3,
            is_fortigate=(dev["type"] == "fortigate")
        )
        is_online = res.get("success", False)
        info = {
            "id": dev["id"],
            "name": dev["name"],
            "ip": dev["ip"],
            "type": dev["type"],
            "online": is_online,
            "status": "online" if is_online else "offline",
            "error": res.get("error", None) if not is_online else None
        }
        status_map[dev["name"]] = info
        if "alias" in dev:
            status_map[dev["alias"]] = info
    return jsonify(status_map)

# --- ROUTES D'AUTOMATISATION (Ansible / Direct SSH Relay) ---

@app.route('/api/automation/create-vlan', methods=['POST'])
def create_vlan():
    data = request.json
    if not data:
        return jsonify({"error": "Données JSON manquantes"}), 400
        
    required_keys = ['vlan_id', 'vlan_name', 'subnet_master', 'subnet_backup', 'vip_address']
    if not all(k in data for k in required_keys):
        return jsonify({"error": f"Clés manquantes, requis: {required_keys}"}), 400

    site = data.get('site', 'benguerir')
    if site == 'benguerir':
        master_host = 'CSR-BGR-1'
        backup_host = 'CSR-BGR-2'
        phys_master = 'Gi8'
        phys_backup = 'Gi5'
    else:
        master_host = 'CSR-BKP-1'
        backup_host = 'CSR-BKP-2'
        phys_master = 'Gi2'
        phys_backup = 'Gi5'

    extra_vars = {
        "vlan_id": data['vlan_id'],
        "vlan_name": data['vlan_name'],
        "subnet_master": data['subnet_master'],
        "subnet_backup": data['subnet_backup'],
        "vip_address": data['vip_address'],
        "master_host": master_host,
        "backup_host": backup_host,
        "physical_interface_master": phys_master,
        "physical_interface_backup": phys_backup
    }

    result = run_playbook('create_vlan.yml', extra_vars)
    return jsonify(result), 200 if result['success'] else 500

@app.route('/api/automation/backup/<equipment_type>', methods=['POST'])
def backup_equipment(equipment_type):
    result = perform_direct_backup(equipment_type)
    return jsonify(result), 200 if result['success'] else 500

# --- ROUTES ASYNCHRONES (WebSocket) ---

def run_backup_async():
    socketio.emit('automation_status', {'message': 'Démarrage du backup global...', 'progress': 10})
    result = perform_direct_backup('all')
    if result['success']:
        socketio.emit('automation_status', {'message': 'Backup terminé avec succès !', 'progress': 100})
    else:
        socketio.emit('automation_status', {'message': 'Erreur lors du backup', 'progress': 100, 'error': result.get('stderr', 'Échec du backup')})

@app.route('/api/automation/backup-all-async', methods=['POST'])
def backup_all_async():
    Thread(target=run_backup_async).start()
    return jsonify({"message": "Job asynchrone lancé"}), 202

# --- GESTION DES BACKUPS (Fichiers) ---

@app.route('/api/automation/backups', methods=['GET'])
def list_backups():
    base_dir = os.path.dirname(__file__)
    backups = []
    
    for category in ['csr', 'fortigate']:
        path = os.path.join(base_dir, 'backups', category, '*.txt')
        for filepath in glob.glob(path):
            filename = os.path.basename(filepath)
            size = os.path.getsize(filepath)
            mtime = os.path.getmtime(filepath)
            backups.append({
                "category": category,
                "filename": filename,
                "size_bytes": size,
                "date": datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
            })
            
    return jsonify(backups)

@app.route('/api/automation/backup-content/<filename>', methods=['GET'])
def get_backup_content(filename):
    base_dir = os.path.dirname(__file__)
    for cat in ['csr', 'fortigate']:
        filepath = os.path.join(base_dir, 'backups', cat, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                content = f.read()
            return jsonify({"filename": filename, "content": content})
    return jsonify({"error": "Fichier introuvable"}), 404

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
