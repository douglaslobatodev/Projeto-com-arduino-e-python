📊 Maroni IoT – Sistema de Monitoramento Industrial em Tempo Real

Sistema completo que integra Arduino + Flask + PostgreSQL + React Dashboard para monitorar funcionamento das máquinas, paradas automáticas/manuais e indicadores industriais.

🏗 Arquitetura do Sistema
┌───────────────────────────┐      HTTP POST       ┌──────────────────────────┐
│      Arduino + W5100      │ ───────────────────→ │        Flask API         │
│  NTP • Botões • LEDs RUN  │                      │   /log • /api/data       │
└───────────────────────────┘                      └─────────────┬────────────┘
                                                                │ SQL
                                                                ▼
                                                    ┌──────────────────────────┐
                                                    │       PostgreSQL         │
                                                    │     Tabela: paradas      │
                                                    └─────────────┬────────────┘
                                                                │ GET API
                                                                ▼
                                            ┌─────────────────────────────────────────┐
                                            │          Dashboard React + Vite         │
                                            │  Gráficos • Status • Histórico • Login  │
                                            └─────────────────────────────────────────┘

✨ Funcionalidades Principais
🟢 Arduino (Automação)

Controle de LEDs:

Verde → máquina em funcionamento

Vermelho → parada

Cinza/Off → desligada

Botões de motivo:

Setup

Falta de Material

Manutenção

Almoço/Intervalo

Sem motivo

Envio de logs para API

Sincronização NTP (horário real)

🔥 Flask Backend

Registro automático de paradas

Fechamento automático quando máquina volta a rodar

Atualização de motivo em tempo real

Paradas manuais com duração

Login, sessão e cadastro de usuários

Endpoint universal /api/data para o dashboard

📈 Dashboard React (Vite)

Visual profissional modo escuro

Cards:

Máquinas Ativas

Máquinas Inativas

Tempo total de parada

Motivo mais recorrente

Gráficos:

Pizza (motivos)

Barras (downtime por máquina)

Histórico das últimas paradas

Tela de login integrada

🗄 Estrutura de Diretórios
react-dashboard/
│
├── app.py
├── criar_admin.py
├── requirements.txt
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── utils/
│   │      └── api.js
│   ├── components/
│   │      ├── Login.jsx
│   │      ├── Header.jsx
│   │      ├── Cards.jsx
│   │      ├── Charts.jsx
│   │      ├── HistoryTable.jsx
│   │      ├── StopForm.jsx
│   │      └── Footer.jsx
│   └── assets/
│
├── cod arduino/
│      └── projetoarduino.ino
│
└── README.md

🧰 Instalação e Execução
1️⃣ Instalar dependências do React
npm install

2️⃣ Iniciar o backend Flask
py app.py


Backend rodará em:

http://localhost:5000

3️⃣ Iniciar o frontend React
npm run dev


Dashboard disponível em:

http://localhost:5174

🛠 Configuração do Arduino

O Arduino envia logs neste formato:

{
  "machine": "Máquina 01",
  "estadoLed": 1,
  "tipo": "MOTIVO",
  "motivo": "MANUTENCAO",
  "data_hora": "2025-11-27 15:22:41"
}

Campo	Descrição
estadoLed	0=Funcionando, 1=Parada, 2=Desligada
motivo	Setup, Material, Manutencao, Almoco, Sem_Motivo
tipo	MOTIVO / ESTADO
📡 Principais Endpoints
POST /log

Recebe logs do Arduino.

GET /api/data

Retorna todas as informações para o dashboard (status, gráficos, histórico).

GET /ultimos?limit=20

Retorna últimas paradas.

POST /api/register_stop

Registra parada manual.

POST /api/login

Autentica usuário.

🧪 Tecnologias Utilizadas
Área	Tecnologia
Backend	Python, Flask, psycopg2
Frontend	React, Vite, Styled-components
Banco	PostgreSQL
Hardware	Arduino UNO + Shield W5100
Infra	HTTP REST, JSON, CORS
👨‍💻 Autor
Douglas da Silva Lobato

Analista de TI • Full-Stack Developer • IoT Industrial

⭐ Gostou do projeto?

Deixe uma ⭐ no repositório para fortalecer o projeto!