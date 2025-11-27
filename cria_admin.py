import psycopg2
from werkzeug.security import generate_password_hash

# =====================================================================
# CONFIG POSTGRES
# =====================================================================
PG_HOST = "localhost"
PG_PORT = "5432"
PG_USER = "postgres"
PG_PASSWORD = "admin"      # sua senha
PG_DB = "arduino_logs"

# =====================================================================
# CONEXÃO
# =====================================================================
conn = psycopg2.connect(
    host=PG_HOST,
    port=PG_PORT,
    user=PG_USER,
    password=PG_PASSWORD,
    database=PG_DB,
)
cur = conn.cursor()

# =====================================================================
# CRIAÇÃO DAS TABELAS
# =====================================================================

cur.execute("""
CREATE TABLE IF NOT EXISTS paradas (
    id               SERIAL PRIMARY KEY,
    machine          VARCHAR(50) NOT NULL,
    reason           VARCHAR(100) NOT NULL,
    origem           VARCHAR(20) NOT NULL,
    start_time       TIMESTAMP NOT NULL,
    end_time         TIMESTAMP,
    duration_minutes NUMERIC(10,2),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nome          VARCHAR(100),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
""")

conn.commit()
print("Tabelas criadas/validadas com sucesso.")

# =====================================================================
# CRIAÇÃO/ATUALIZAÇÃO DO USUÁRIO ADMIN
# =====================================================================

username = "admin"
senha_plana = "admin123"
hash_senha = generate_password_hash(senha_plana)

cur.execute(
    """
    INSERT INTO users (username, password_hash, nome)
    VALUES (%s, %s, %s)
    ON CONFLICT (username) DO UPDATE
      SET password_hash = EXCLUDED.password_hash;
    """,
    (username, hash_senha, "Administrador"),
)

conn.commit()
cur.close()
conn.close()

print("Usuário admin criado/atualizado com sucesso.")
