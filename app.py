import json
from datetime import datetime, timedelta

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash

# =====================================================================
# FLASK / CORS / SESSÃO
# =====================================================================
app = Flask(__name__)
app.secret_key = "troque_esta_chave_por_algo_mais_secreto"
CORS(app, supports_credentials=True)

# =====================================================================
# CONFIG POSTGRES
# =====================================================================

PG_HOST = "localhost"
PG_PORT = "5432"
PG_USER = "postgres"
PG_PASSWORD = "admin"
PG_DB = "arduino_logs"


def conectar_pg():
    return psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        user=PG_USER,
        password=PG_PASSWORD,
        database=PG_DB,
    )


# =====================================================================
# LOG EM ARQUIVO (JSONL) - OPCIONAL, APENAS DEBUG
# =====================================================================

LOG_FILE = "logs.jsonl"


def salvar_log_arquivo(dado: dict):
    dado_enriquecido = {
        "recebido_em": datetime.utcnow().isoformat() + "Z",
        **dado,
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(dado_enriquecido, ensure_ascii=False) + "\n")
    print("[INFO] Log salvo em arquivo:", dado_enriquecido)


# =====================================================================
# MAPA DE MOTIVOS (do Arduino → texto humano)
# =====================================================================

MOTIVO_MAP = {
    "SETUP": "Setup",
    "MATERIAL": "Falta de Material",
    "MANUTENCAO": "Manutenção",
    "SEM_MOTIVO": "Sem motivo",
    "NONE": "Sem motivo",
}


def traduz_motivo_bruto(motivo_bruto: str) -> str:
    if not motivo_bruto:
        return "Sem motivo"
    motivo_bruto = motivo_bruto.upper()
    return MOTIVO_MAP.get(motivo_bruto, motivo_bruto)


# =====================================================================
# FUNÇÕES PARA MANIPULAR A TABELA paradas (AUTO)
# =====================================================================

def obter_parada_aberta(machine: str):
    """
    Retorna (id, reason, start_time) da parada AUTO aberta para a máquina,
    ou None se não houver.
    """
    conn = conectar_pg()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, reason, start_time
        FROM paradas
        WHERE machine = %s
          AND origem = 'AUTO'
          AND end_time IS NULL
        ORDER BY start_time DESC
        LIMIT 1
        """,
        (machine,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row  # (id, reason, start_time) ou None


def abrir_parada_auto(machine: str, motivo_bruto: str, inicio: datetime):
    """
    Abre uma parada AUTO nova para a máquina com o motivo informado.
    """
    reason = traduz_motivo_bruto(motivo_bruto)

    conn = conectar_pg()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO paradas (machine, reason, origem, start_time, end_time, duration_minutes)
        VALUES (%s, %s, %s, %s, NULL, NULL)
        """,
        (machine, reason, "AUTO", inicio),
    )
    conn.commit()
    cur.close()
    conn.close()

    print(f"[INFO] Parada AUTO ABERTA para {machine} em {inicio}, motivo={reason}")


def fechar_parada_auto(machine: str, fim: datetime, threshold_minutos: float = 0.1):
    """
    Fecha a parada AUTO aberta da máquina, se existir.
    Se a duração for menor que threshold_minutos, descarta (deleta).
    """
    conn = conectar_pg()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, reason, start_time
        FROM paradas
        WHERE machine = %s
          AND origem = 'AUTO'
          AND end_time IS NULL
        ORDER BY start_time DESC
        LIMIT 1
        """,
        (machine,),
    )
    row = cur.fetchone()

    if not row:
        cur.close()
        conn.close()
        print(f"[INFO] Nenhuma parada AUTO aberta para {machine} ao fechar.")
        return

    parada_id, reason_open, start_time = row
    duracao_min = (fim - start_time).total_seconds() / 60.0

    if duracao_min < threshold_minutos:
        # descarta parada muito curta
        cur.execute("DELETE FROM paradas WHERE id = %s", (parada_id,))
        print(
            f"[INFO] Parada AUTO id={parada_id} DESCARTADA ({duracao_min:.2f} min) para {machine}"
        )
    else:
        cur.execute(
            """
            UPDATE paradas
            SET end_time = %s,
                duration_minutes = %s
            WHERE id = %s
            """,
            (fim, duracao_min, parada_id),
        )
        print(
            f"[INFO] Parada AUTO id={parada_id} FECHADA para {machine}: {duracao_min:.2f} min ({reason_open})"
        )

    conn.commit()
    cur.close()
    conn.close()

def processar_run_cycle(machine, estado_led, agora):
    THRESHOLD = 0.1

    # LED VERDE → máquina rodando
    if estado_led == 0:
        print("[INFO] Máquina rodando (verde). Fechando qualquer parada automática.")
        fechar_parada_auto(machine, agora, threshold_minutos=THRESHOLD)
        return

    # LED VERMELHO → máquina parada (sem motivo se nenhum botão estiver ligado)
    if estado_led == 1:
        print("[INFO] Máquina parada (vermelho). Abrindo parada automática SEM MOTIVO se não tiver nenhuma.")
        parada = obter_parada_aberta(machine)
        if parada:
            # Já existe parada (talvez de motivo) → não abre outra
            return

        # Abre parada “Sem motivo”
        abrir_parada_auto(machine, "NONE", agora)
        return

    # LED DESLIGADO → máquina desligada (não conta, só fecha)
    if estado_led == 2:
        print("[INFO] Máquina desligada. Fechando QUALQUER parada.")
        fechar_parada_auto(machine, agora, threshold_minutos=THRESHOLD)
        return

    # Qualquer outro valor estranho
    print(f"[INFO] estado_led inválido ou ausente: {estado_led}")


# =====================================================================
# ENDPOINT DO ARDUINO → /log
# =====================================================================

@app.route("/log", methods=["POST"])
def receber_log():
    try:
        dado = request.get_json(force=True)
    except Exception as e:
        print("[ERRO] JSON inválido:", e)
        return jsonify({"status": "erro", "msg": "JSON inválido"}), 400

    print("\n=== LOG RECEBIDO DO ARDUINO ===")
    print(json.dumps(dado, indent=2, ensure_ascii=False))
    print("================================\n")

    machine = dado.get("machine") or "Máquina 01"
    tipo = (dado.get("tipo") or "").upper()
    motivo_bruto = (dado.get("motivo") or "NONE").upper()
    estado_led = dado.get("estadoLed")
    agora = datetime.utcnow()
    THRESHOLD_MINUTOS = 0.1

    # ---------------------------------------------------------
    # 1) RUN_CYCLE → cuida do LED RUN (verde/vermelho/off)
    # ---------------------------------------------------------
    if tipo == "RUN_CYCLE":
        processar_run_cycle(machine, estado_led, agora)
        return jsonify({"status": "ok"}), 200

    # ---------------------------------------------------------
    # 2) MOTIVO → só vale se LED estiver VERMELHO (1)
    # ---------------------------------------------------------
    if tipo == "MOTIVO":
        # Se não estiver vermelho, ignora (máquina rodando ou desligada)
        if estado_led != 1:
            print(
                f"[INFO] MOTIVO recebido ({motivo_bruto}) mas LED_RUN "
                f"não está vermelho (estadoLed={estado_led}). "
                "Ignorando atualização de motivo."
            )
            return jsonify({"status": "ok"}), 200

        # Pega parada AUTO aberta (se tiver)
        parada_aberta = obter_parada_aberta(machine)  # (id, reason, start_time) ou None

        # BOTÃO DESLIGADO → motivo volta para NONE → fecha parada
        if motivo_bruto == "NONE":
            if not parada_aberta:
                print(
                    f"[INFO] MOTIVO=NONE recebido, mas não há parada aberta "
                    f"para {machine}. Nada a fechar."
                )
                return jsonify({"status": "ok"}), 200

            print(f"[INFO] MOTIVO=NONE recebido. Fechando parada aberta de {machine}.")
            fechar_parada_auto(machine, agora, threshold_minutos=THRESHOLD_MINUTOS)
            return jsonify({"status": "ok"}), 200

        # BOTÃO LIGADO (SETUP / MATERIAL / MANUTENCAO)
        motivo_humano_novo = traduz_motivo_bruto(motivo_bruto)

        if not parada_aberta:
            # Não tinha parada aberta → abre com esse motivo
            abrir_parada_auto(machine, motivo_bruto, agora)
            return jsonify({"status": "ok"}), 200

        parada_id, reason_open, start_time = parada_aberta

        if reason_open == motivo_humano_novo:
            # Mesmo motivo já está contando
            print(
                f"[INFO] MOTIVO={motivo_humano_novo} recebido, mas já existe parada "
                f"aberta com o mesmo motivo para {machine}. Mantendo contagem."
            )
            return jsonify({"status": "ok"}), 200

        # Motivo mudou (ex: Setup -> Manutenção)
        print(
            f"[INFO] Mudança de motivo em {machine}: {reason_open} -> {motivo_humano_novo}. "
            "Fechando parada anterior e abrindo nova."
        )
        fechar_parada_auto(machine, agora, threshold_minutos=THRESHOLD_MINUTOS)
        abrir_parada_auto(machine, motivo_bruto, agora)
        return jsonify({"status": "ok"}), 200

    # ---------------------------------------------------------
    # 3) Outros tipos → só loga e ignora para contagem
    # ---------------------------------------------------------
    print(f"[INFO] Log tipo={tipo} ignorado para contagem de paradas.")
    return jsonify({"status": "ok"}), 200

# =====================================================================
# CONSULTAR ÚLTIMAS PARADAS (/ultimos) - agora em cima de paradas
# =====================================================================

@app.route("/ultimos", methods=["GET"])
def ultimos_logs():
    limit = int(request.args.get("limit", 20))

    conn = conectar_pg()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, machine, reason, origem, start_time, end_time, duration_minutes
        FROM paradas
        ORDER BY start_time DESC
        LIMIT %s
        """,
        (limit,),
    )
    linhas = cur.fetchall()
    cur.close()
    conn.close()

    resultado = []
    for pid, machine, reason, origem, start_time, end_time, duration in linhas:
        status = "Aberta" if end_time is None else "Fechada"

        resultado.append(
            {
                "id": pid,
                "machine": machine,
                "reason": reason,
                "origem": origem,  # AUTO / MANUAL
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat() if end_time else None,
                "duration_minutes": float(duration) if duration is not None else None,
                "status": status,
            }
        )

    return jsonify(resultado)


# =====================================================================
# ENDPOINT PARA REPROCESSAR PARADAS MANUALMENTE (AGORA NO-OP)
# =====================================================================

@app.route("/api/reprocess_paradas", methods=["POST"])
def api_reprocess_paradas():
    """
    No novo modelo, não há mais logs brutos a reprocessar.
    As paradas são abertas/fechadas em tempo real.
    Mantemos o endpoint só para não quebrar o front.
    """
    return jsonify(
        {
            "ok": True,
            "message": "Modelo novo: nada a reprocessar. As paradas já são calculadas em tempo real.",
            "total_paradas": 0,
        }
    )


# =====================================================================
# DASHBOARD: FUNÇÕES PARA LER paradas (tabela única)
# =====================================================================

machines = ["Máquina 01"]
reasons = ["Setup", "Falta de Material", "Manutenção", "Almoço/Intervalo", "Sem motivo"]


def gerar_payload_dashboard():
    conn = conectar_pg()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT machine, reason, start_time, end_time, duration_minutes, origem
        FROM paradas
        WHERE end_time IS NOT NULL        -- só paradas fechadas
        ORDER BY start_time DESC
        LIMIT 200
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    history = []
    for machine, reason, start_time, end_time, duration, origem in rows:
        history.append(
            {
                "machine": machine,
                "reason": reason,
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_minutes": float(duration) if duration is not None else 0.0,
                "origem": origem,  # AUTO / MANUAL
            }
        )

    if not history:
        return {
            "cards": {
                "totalStops": 0,
                "totalDowntime": 0,
                "avgDowntime": 0,
                "mostCommonReason": "N/A",
            },
            "pie": {"labels": [], "data": []},
            "bar": {"labels": machines, "data": [0 for _ in machines]},
            "history": [],
            "stops": [],
        }

    total_stops = len(history)
    total_downtime = sum(h["duration_minutes"] for h in history)
    avg_downtime = total_downtime / total_stops if total_stops else 0

    # Contagem por motivo
    reason_count = {}
    for h in history:
        r = h["reason"]
        reason_count[r] = reason_count.get(r, 0) + 1

    top_reason = max(reason_count, key=reason_count.get) if reason_count else "N/A"

    pie_labels = list(reason_count.keys())
    pie_data = [reason_count[k] for k in pie_labels]

    # Downtime por máquina
    machine_downtime = {}
    for h in history:
        m = h["machine"]
        machine_downtime[m] = machine_downtime.get(m, 0) + h["duration_minutes"]

    bar_labels = list(machine_downtime.keys())
    bar_data = [machine_downtime[m] for m in bar_labels]

    latest_history = history[:10]

    return {
        "cards": {
            "totalStops": total_stops,
            "totalDowntime": round(total_downtime, 2),
            "avgDowntime": round(avg_downtime, 2),
            "mostCommonReason": top_reason,
        },
        "pie": {"labels": pie_labels, "data": pie_data},
        "bar": {"labels": bar_labels, "data": bar_data},
        "history": latest_history,
        "stops": history,
    }


# =====================================================================
# ENDPOINT DO DASHBOARD → /api/data
# =====================================================================

@app.route("/api/data", methods=["GET"])
def api_data():
    payload = gerar_payload_dashboard()
    return jsonify(payload)


# =====================================================================
# ENDPOINT PARA REGISTRAR PARADA MANUAL → /api/register_stop
# =====================================================================

@app.route("/api/register_stop", methods=["POST"])
def register_stop():
    data = request.get_json(silent=True) or {}

    machine = data.get("machine") or "Máquina 01"
    reason = data.get("reason") or "Setup"

    try:
        duration_min = float(data.get("duration", 0))
    except (ValueError, TypeError):
        duration_min = 0.0

    now = datetime.utcnow()
    start_time = now - timedelta(minutes=duration_min)

    conn = conectar_pg()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO paradas
        (machine, reason, origem, start_time, end_time, duration_minutes)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id;
        """,
        (machine, reason, "MANUAL", start_time, now, duration_min),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    new_event = {
        "id": new_id,
        "machine": machine,
        "reason": reason,
        "start_time": start_time.isoformat(),
        "end_time": now.isoformat(),
        "duration_minutes": duration_min,
        "origem": "MANUAL",
    }

    return jsonify({"ok": True, "event": new_event}), 201


# =====================================================================
# CADASTRO DE USUÁRIO → /api/register_user
# =====================================================================

@app.route("/api/register_user", methods=["POST"])
def register_user():
    data = request.get_json(silent=True) or {}

    username = data.get("username")
    password = data.get("password")
    nome = data.get("nome")
    email = data.get("email")  # opcional

    if not username or not password or not nome:
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "missing_fields",
                    "message": "Preencha usuário, senha e nome.",
                }
            ),
            400,
        )

    if len(password) < 8:
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "weak_password",
                    "message": "A senha deve conter pelo menos 8 caracteres.",
                }
            ),
            400,
        )

    password_hash = generate_password_hash(password)

    try:
        conn = conectar_pg()
        cur = conn.cursor()

        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return (
                jsonify(
                    {
                        "ok": False,
                        "error": "user_exists",
                        "message": "Este nome de usuário já está cadastrado.",
                    }
                ),
                400,
            )

        cur.execute(
            """
            INSERT INTO users (username, password_hash, nome)
            VALUES (%s, %s, %s)
            RETURNING id;
            """,
            (username, password_hash, nome),
        )

        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return (
            jsonify(
                {
                    "ok": True,
                    "message": "Usuário criado com sucesso.",
                    "id": new_id,
                }
            ),
            201,
        )

    except Exception as e:
        print("[ERRO] /api/register_user:", e)
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "server_error",
                    "message": "Erro interno ao registrar usuário.",
                }
            ),
            500,
        )


# =====================================================================
# LOGIN / LOGOUT
# =====================================================================

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"ok": False, "error": "missing_credentials"}), 400

    try:
        conn = conectar_pg()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, username, password_hash, nome FROM users WHERE username = %s",
            (username,),
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return jsonify({"ok": False, "error": "invalid_credentials"}), 401

        user_id, user_name, password_hash, nome = row

        if not check_password_hash(password_hash, password):
            return jsonify({"ok": False, "error": "invalid_credentials"}), 401

        session["logged_in"] = True
        session["user_id"] = user_id
        session["username"] = user_name

        return jsonify({"ok": True, "username": user_name, "nome": nome})

    except Exception as e:
        print("[ERRO] /api/login:", e)
        return jsonify({"ok": False, "error": "server_error"}), 500


@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"ok": True})


# =====================================================================
# RECUPERAÇÃO DE SENHA (STUB)
# =====================================================================

@app.route("/api/request-recovery", methods=["POST"])
def request_recovery():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    print("[INFO] Pedido de recuperação de senha para:", email)
    return jsonify(
        {"ok": True, "message": "Se o e-mail existir, será enviado um link de recuperação."}
    )


# =====================================================================
# SERVER ROOT
# =====================================================================

@app.route("/")
def index():
    return "Backend Maroni – Arduino + Dashboard (Flask) – Modelo paradas única", 200


if __name__ == "__main__":
    print("Servidor unificado iniciado (modelo paradas única)...")
    app.run(host="0.0.0.0", port=5000, debug=True)
