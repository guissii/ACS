from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from automation.ansible_runner import run_playbook
import os
import glob
import datetime
from threading import Thread

app = Flask(__name__)
# Configurations basiques & CORS
app.config['SECRET_KEY'] = 'atlas_secret_key'
CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# --- ROUTES DE MONITORING (Lecture Seule) ---

@app.route('/api/vrrp/all', methods=['GET'])
def get_vrrp_all():
    return jsonify({
        "CSR-BGR-1": {"state": "Master", "priority": 110},
        "CSR-BGR-2": {"state": "Backup", "priority": 100}
    })

@app.route('/api/sdwan/<equipment>', methods=['GET'])
def get_sdwan(equipment):
    return jsonify({"equipment": equipment, "sdwan_health": "ok"})

# --- ROUTES D'AUTOMATISATION (Ansible) ---

@app.route('/api/automation/create-vlan', methods=['POST'])
def create_vlan():
    data = request.json
    if not data:
        return jsonify({"error": "Données JSON manquantes"}), 400
        
    required_keys = ['vlan_id', 'vlan_name', 'subnet_master', 'subnet_backup', 'vip_address']
    if not all(k in data for k in required_keys):
        return jsonify({"error": f"Clés manquantes, requis: {required_keys}"}), 400

    # Déterminer les hosts selon le site
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
    if equipment_type == 'csr':
        result = run_playbook('backup_csr.yml')
    elif equipment_type == 'fortigate':
        result = run_playbook('backup_fortigate.yml')
    elif equipment_type == 'all':
        result = run_playbook('backup_all.yml')
    else:
        return jsonify({"error": "Type invalide (csr, fortigate, all)"}), 400
        
    return jsonify(result), 200 if result['success'] else 500

# --- ROUTES ASYNCHRONES (WebSocket) ---

def run_backup_async():
    socketio.emit('automation_status', {'message': 'Démarrage du backup global...', 'progress': 10})
    result = run_playbook('backup_all.yml')
    if result['success']:
        socketio.emit('automation_status', {'message': 'Backup terminé avec succès !', 'progress': 100})
    else:
        socketio.emit('automation_status', {'message': 'Erreur lors du backup', 'progress': 100, 'error': result.get('stderr', 'Échec du playbook')})

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

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
