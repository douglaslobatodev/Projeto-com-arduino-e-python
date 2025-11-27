from flask import Flask, request, redirect, session, jsonify, url_for, send_from_directory
try:
    from flask_cors import CORS
    CORS_AVAILABLE = True
except Exception:
    # If flask-cors is not installed the app will still run, but CORS won't be enabled.
    CORS_AVAILABLE = False
from datetime import datetime, timedelta
import random
import os

# Tentativa de importar e configurar Firebase Admin (Firestore)
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIRESTORE_AVAILABLE = True
except Exception:
    FIRESTORE_AVAILABLE = False
app = Flask(__name__, static_folder='static')
app.secret_key = "chave_secreta_maroni_i40"

# Inicializa o Firebase Admin SDK se disponível. A inicialização
# tenta usar a variável de ambiente FIREBASE_CREDENTIALS apontando
# para um arquivo JSON de service account. Se não definida, tenta
# inicializar com as credenciais padrão da máquina (ADC).
if FIRESTORE_AVAILABLE:
    try:
        # se já inicializado, get_app() não levantará erro
        firebase_admin.get_app()
    except ValueError:
        try:
            cred_path = os.environ.get('FIREBASE_CREDENTIALS')
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # tenta inicializar com credenciais padrão (ADC)
                firebase_admin.initialize_app()
        except Exception as e:
            print("[warning] Não foi possível inicializar Firebase Admin SDK:", e)
            FIRESTORE_AVAILABLE = False
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# Enable CORS for development so the React frontend (served separately) can call the API.
# In production, set specific origins instead of allowing all.
if CORS_AVAILABLE:
    # Allow credentials so session cookie works across requests from the frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}, r"/login": {"origins": "*"}, r"/register_stop": {"origins": "*"}}, supports_credentials=True)
else:
    print("[warning] flask-cors not installed. CORS is disabled. To enable, run: pip install flask-cors")

# --- Simulação de dados em memória (substituir pelo DB real ou Google Sheets) ---
# Ajustado para monitorar apenas uma máquina (conforme solicitado)
machines = ["Máquina 01"]
reasons = ["Setup", "Falta de Material", "Manutenção", "Almoço/Intervalo"] # Adicionei Almoço/Intervalo aqui
HISTORY = []
START_TIME = datetime.now() - timedelta(days=7) # Começa o histórico há 7 dias

# --- Usuários de teste para autenticação simples ---
USERS = {"operador": "12345", "admin": "maroni2025"}

# --- Rotas de autenticação simples ---
@app.route("/api/status")
def api_status():
    return jsonify({"logged_in": bool(session.get("logged_in")), "username": session.get("username")})


@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(force=True) if request.is_json else request.form
    username = data.get("username")
    password = data.get("password")
    if username in USERS and USERS[username] == password:
        session["logged_in"] = True
        session["username"] = username
        return jsonify({"ok": True}), 200
    return jsonify({"error": "invalid_credentials"}), 401


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.pop("logged_in", None)
    session.pop("username", None)
    return jsonify({"ok": True})

def generate_sample_data():
    """Gera dados simulados para cards, pie e bar, e atualiza o histórico se necessário."""
    
    # Histórico: cria 20 eventos históricos se a lista estiver vazia
    if len(HISTORY) < 20:
        for i in range(20):
            ts_start = START_TIME + timedelta(minutes=random.randint(0, 7 * 24 * 60))
            duration = random.randint(1, 60)  # em minutos
            event = {
                "machine": random.choice(machines),
                "reason": random.choice(reasons),
                # padroniza nomes para o frontend React
                "start_time": (ts_start).isoformat(),
                "end_time": (ts_start + timedelta(minutes=duration)).isoformat(),
                "duration_minutes": duration
            }
            HISTORY.append(event)
        # Garante que o histórico está ordenado (para pegar os últimos 15 corretamente)
        HISTORY.sort(key=lambda x: datetime.fromisoformat(x['end_time']), reverse=True)


    # --- Análise dos Dados Atuais ---
    total_stops = len(HISTORY)
    total_minutes = sum(e["duration_minutes"] for e in HISTORY)
    
    # Contagem por motivo
    reason_count = {}
    for r in reasons:
        reason_count[r] = sum(1 for e in HISTORY if e["reason"] == r)
    
    # Motivo mais comum
    top_reason = max(reason_count, key=reason_count.get) if reason_count else "N/A"

    # Dados para pie
    pie_labels = list(reason_count.keys())
    pie_data = [reason_count[k] for k in pie_labels]

    # Dados para bar (tempo por máquina)
    bar_labels = machines
    bar_data = []
    for m in machines:
        total_m = sum(e["duration_minutes"] for e in HISTORY if e["machine"] == m)
        bar_data.append(total_m)

    # Organiza o histórico para exibição (somente os 15 mais recentes)
    latest_history = HISTORY[:15]

    # retornar objeto
    result = {
        "cards": {
            "total_stops": total_stops,
            "total_time_minutes": total_minutes,
            "total_time_human": f"{total_minutes//60}h {total_minutes%60}min",
            "top_reason": top_reason
        },
        "pie": {
            "labels": pie_labels,
            "data": pie_data
        },
        "bar": {
            "labels": bar_labels,
            "data": bar_data
        },
        "history": latest_history
        ,
        # compatibilidade com frontend React: key `stops` contém todas as paradas
        "stops": HISTORY
    }
    return result

# ------------------------------------
# --- Rotas de Autenticação e Visão ---
# ------------------------------------

# NOTE: A rota raiz que serve a aplicação React já está definida mais acima
# em `serve_react_app`. A definição abaixo causava conflito (duas rotas para
# "/"). Mantemos o comportamento de servir os arquivos estáticos e
# desativamos esta rota alternativa que retornava JSON.
# @app.route("/", methods=["GET"])
# def index():
#     if session.get("logged_in"):
#         return redirect(url_for("dashboard"))
#     # Template rendering removed — backend now serves only the API.
#     # If you still need a landing page, serve the React app separately and
#     # configure Flask to not render templates.
#     # return render_template("login.html")
#     return jsonify({"message": "Backend API only. Serve the React frontend separately."})

@app.route("/login", methods=["POST"])
def login():
    usuario = request.form.get("usuario")
    senha = request.form.get("senha")
    # Verificação simples
    if usuario == "admin" and senha == "123":
        session["logged_in"] = True
        session["user"] = usuario
        return jsonify({"ok": True, "message": "logged_in"})
    else:
        return jsonify({"error": "Usuário ou senha incorretos"}), 401

@app.route("/logout")
def logout():
    session.clear()
    return jsonify({"ok": True, "message": "logged_out"})

@app.route("/dashboard")
def dashboard():
    if not session.get("logged_in"):
        return redirect(url_for("index"))
    # Template rendering removed — backend now serves only the API.
    # If you deploy the React build with Flask, change this to serve the static files.
    # return render_template("dashboard.html")
    return jsonify({"message": "Dashboard templates removed. Serve React frontend separately."})

# ------------------------------------
# --- Rotas de API e Ação de Dados ---
# ------------------------------------

@app.route("/api/data")
def api_data():
    """Rota para o JavaScript buscar dados em JSON."""
    payload = generate_sample_data()
    return jsonify(payload)


# ------------------------------------
# --- Rota para recuperar motivos do Firestore ---
# ------------------------------------
@app.route("/api/reasons")
def api_reasons():
    """Retorna a lista de motivos de parada armazenados na coleção
    `motivos_parada` do Firestore.

    Em desenvolvimento, se o Firebase Admin SDK não estiver configurado,
    a rota retorna 503 para indicar que o serviço não está disponível.
    """
    if not FIRESTORE_AVAILABLE:
        return jsonify({"error": "firestore_unavailable", "message": "Firestore não está configurado no servidor."}), 503

    try:
        db = firestore.client()
        coll = db.collection('motivos_parada')
        docs = coll.stream()
        reasons = []
        for d in docs:
            item = d.to_dict() or {}
            # inclui o id do documento para referência no frontend
            item['id'] = d.id
            reasons.append(item)

        return jsonify({"ok": True, "reasons": reasons})
    except Exception as e:
        # Em caso de erro, retornamos detalhe para facilitar o debug local
        return jsonify({"error": "firestore_error", "detail": str(e)}), 500

@app.route("/api/register_stop", methods=["POST"])
def register_stop():
    """Recebe os dados do formulário de parada e insere no HISTORY."""
    if not session.get("logged_in"):
        return jsonify({"error": "not_authenticated"}), 401

    # 1. Capturar dados (espera JSON enviado pelo frontend)
    data = request.get_json(silent=True) or {}
    machine = data.get("machine")
    reason = data.get("reason")
    # aceitar minutos fracionados -> float
    try:
        duration_min = float(data.get("duration", 0))
    except (ValueError, TypeError):
        duration_min = 0.0

    # 2. Criar o novo evento
    now = datetime.now()
    start_time = now - timedelta(minutes=duration_min)
    
    new_event = {
        "machine": machine,
        "reason": reason,
        "start_time": start_time.isoformat(),
        "end_time": now.isoformat(),
        "duration_minutes": duration_min
    }

    # 3. Inserir o novo evento no histórico (GLOBAL)
    global HISTORY 
    HISTORY.insert(0, new_event) # Insere no topo para ser o mais recente
    
    # 4. Retornar JSON com o evento criado
    return jsonify({"ok": True, "event": new_event}), 201

# --- 🔧 NOVA ROTA DE RECUPERAÇÃO DE SENHA ---
# Rota ajustada para `/api/request-recovery` para coincidir com o frontend
@app.route('/api/request-recovery', methods=['POST'])
def request_recovery():
    """Recebe o email do usuário e simula o envio de um código de recuperação.

    O endpoint armazena temporariamente (`session`) o código gerado e o email.
    Em produção esse fluxo deve gravar em um banco e enviar um e-mail real. 
    """
    data = request.get_json(force=True) or {}
    email = data.get("email")

    if not email:
        return jsonify({"error": "email_required"}), 400

    # Gera um código aleatório de 6 dígitos
    recovery_code = random.randint(100000, 999999)

    # Armazena o código na sessão (ou persistência adequada em produção)
    session["recovery_email"] = email
    session["recovery_code"] = recovery_code

    # Simula o envio do email (em dev apenas logamos no console)
    print(f"[INFO] código de recuperação para {email}: {recovery_code}")

    return jsonify({"ok": True, "mensage": f"Código enviado para {email}"})
    

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
