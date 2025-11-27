# React Dashboard (Máquina 01)

Este projeto é uma conversão do seu dashboard atual (HTML/CSS/JS) para React usando Vite.

Principais pontos:

- Monitora somente uma máquina (por padrão: `Máquina 01`).
- Consulta a API Flask em `/api/data` a cada 5 segundos.
- Mantém o tema escuro e o estilo do `static/style.css` original (copiado em `src/styles.css`).

Assunções sobre a API `/api/data`:

- Pode retornar um array de paradas ou um objeto `{ stops: [...] }`.
- Cada parada é um objeto com pelo menos: `{ id?, machine, reason, duration_minutes? | duration?, start_time? | start?, end_time? }`.

Como rodar (Windows PowerShell):

1. Instale dependências

```powershell
cd "c:\Users\wilso\Desktop\front_end\react-dashboard"
npm install
```

2. Execute o servidor de desenvolvimento (Vite):

```powershell
npm run dev
```

O `vite` está configurado para fazer proxy de `/api` para `http://localhost:5000` (Flask padrão). Se seu Flask roda em outra porta, atualize `vite.config.js`.

Notas e próximos passos:

- Se sua API usar outro formato de campo (por exemplo `duration` em segundos), ajuste `Cards.jsx`, `HistoryTable.jsx` e `Charts.jsx` para converter corretamente.
- Podemos adicionar testes e tipagem (TypeScript) se desejar.
