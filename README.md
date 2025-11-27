# 📊 Sistema de Monitoramento Industrial -- Maroni S/A

### Arduino + Flask + React Dashboard

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Backend-Flask-red)
![React](https://img.shields.io/badge/Frontend-React-blue)
![Arduino](https://img.shields.io/badge/Arduino-Ethernet%20Shield-orange)
![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-336791)
![License](https://img.shields.io/badge/license-MIT-green)

------------------------------------------------------------------------

## 📌 Sobre o Projeto

Projeto completo utilizado para monitoramento de **paradas de máquinas
industriais** em tempo real na **Indústria Maroni S/A**, integrando:

-   🟦 **Arduino + Ethernet Shield** com envio de logs via HTTP\
-   🐍 **Backend Python/Flask** com lógica de abertura/fechamento
    automático de paradas\
-   🗄️ **Banco PostgreSQL** (tabela única: `paradas`)\
-   ⚛️ **Frontend React Dashboard** com gráficos, histórico e status
    atual

O sistema detecta **paradas automáticas**, registra motivos enviados
pelo Arduino e disponibiliza tudo em um **dashboard em tempo real**.

------------------------------------------------------------------------

## ✨ Funcionalidades

### 🔌 Arduino (Automação)

-   Envio de logs HTTP (`POST /log`)
-   Hora via NTP (sem RTC físico)
-   Estados:
    -   🟢 Rodando\
    -   🔴 Parada\
    -   ⚪ Desligado\
-   Seleção de motivos:
    -   Setup\
    -   Falta de Material\
    -   Manutenção\
    -   Almoço/Intervalo\
    -   Sem motivo

### 🖥️ Backend Flask

-   Registro automático de paradas
-   Fechamento automático ao voltar para RUN
-   API REST para dashboard
-   Cadastro/Login de usuários
-   Registro de paradas manuais

### 💻 React Dashboard

-   Status das máquinas
-   Gráficos (pizza, barras)
-   Histórico de paradas
-   Últimas 10 paradas
-   Registro manual

------------------------------------------------------------------------

## 📂 Estrutura do Projeto

    react-dashboard/
    ├── app.py
    ├── requirements.txt
    ├── cria_admin.py
    ├── atualiza_paradas.py
    ├── src/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── components/
    │        ├── Cards.jsx
    │        ├── Charts.jsx
    │        ├── Footer.jsx
    │        ├── Header.jsx
    │        ├── HistoryTable.jsx
    │        ├── Login.jsx
    │        ├── RecoveryModal.jsx
    │        ├── StopForm.jsx
    └── cod arduino/
         └── projetoarduino/
             └── registro_paradas.ino

------------------------------------------------------------------------

## 🚀 Como Rodar o Sistema

### 1️⃣ Backend -- Instalar dependências

    pip install -r requirements.txt

### 2️⃣ Iniciar o Backend

    py app.py

Servidor Flask rodará em:

    http://127.0.0.1:5000
    http://192.168.1.129:5000

------------------------------------------------------------------------

### 3️⃣ Frontend -- Instalar dependências

    npm install

### 4️⃣ Rodar o Dashboard

    npm run dev

Acesse:

    http://localhost:5174/

------------------------------------------------------------------------

## 🧪 Testando o endpoint do Arduino

``` json
POST http://192.168.1.129:5000/log
{
  "machine": "Máquina 01",
  "data_hora": "2025-11-27 14:15:00",
  "tipo": "MOTIVO",
  "estadoLed": 1,
  "motivo": "MATERIAL"
}
```

------------------------------------------------------------------------

## 🗄️ Estrutura da Tabela PostgreSQL

``` sql
CREATE TABLE paradas (
    id SERIAL PRIMARY KEY,
    machine VARCHAR(50),
    reason VARCHAR(100),
    origem VARCHAR(20),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

------------------------------------------------------------------------

## 👨‍🔧 Autor

**Douglas da Silva Lobato**\
Analista de TI -- Indústria Maroni S/A

------------------------------------------------------------------------

## 📝 Licença

MIT License

------------------------------------------------------------------------

## ⭐ Se este projeto te ajudou, deixe uma estrela!
