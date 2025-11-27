import json
import urllib.request

# URL do seu backend
url = "http://localhost:5000/api/reprocess_paradas"

# Dados para enviar (regra de 0.5 minutos = 30 segundos)
payload = {"threshold_minutos": 0.5}
data = json.dumps(payload).encode("utf-8")

# Preparar a requisição
req = urllib.request.Request(
    url, 
    data=data, 
    headers={'Content-Type': 'application/json'}
)

try:
    print(f"Enviando comando para {url}...")
    with urllib.request.urlopen(req) as response:
        resultado = response.read().decode("utf-8")
        print("\nSUCESSO! O servidor respondeu:")
        print(resultado)
except Exception as e:
    print(f"\nERRO: Não foi possível conectar ao servidor.")
    print(f"Detalhe: {e}")
    print("\nDICA: Verifique se o arquivo 'app.py' está rodando na porta 5000.")