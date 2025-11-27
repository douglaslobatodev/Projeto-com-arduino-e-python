import React from "react";

function formatDate(dateStr) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  if (!dateStr) return "--";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDateTime(s) {
  if (!s) return "--";
  return `${formatDate(s)} ${formatTime(s)}`;
}

function formatDuration(min) {
  const totalMin = Math.round(min || 0);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  if (h <= 0) return `${m} min`;
  return `${h}h ${m}min`;
}

function motivoBadgeStyle(reasonRaw) {
  const r = (reasonRaw || "").toLowerCase();

  const base = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 500,
  };

  if (r.includes("setup")) {
    return {
      ...base,
      backgroundColor: "rgba(254, 196, 0, 0.12)",
      color: "#fec400",
    };
  }
  if (r.includes("material")) {
    return {
      ...base,
      backgroundColor: "rgba(55, 81, 255, 0.12)",
      color: "#3751ff",
    };
  }
  if (r.includes("manuten")) {
    return {
      ...base,
      backgroundColor: "rgba(241, 43, 44, 0.12)",
      color: "#f12b2c",
    };
  }
  return {
    ...base,
    backgroundColor: "rgba(164, 166, 179, 0.15)",
    color: "#a4a6b3",
  };
}

export default function HistoryTable({ stops }) {
  const rows = [...stops].slice(-20).reverse();

  if (!rows.length) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0", color: "#a4a6b3" }}>
        Nenhuma parada registrada ainda.
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Máquina</th>
          <th>Motivo</th>
          <th>Início</th>
          <th>Fim</th>
          <th>Duração</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={r.id ?? idx}>
            <td>{r.machine || "—"}</td>
            <td>
              <span style={motivoBadgeStyle(r.reason)}>
                {r.reason || "—"}
              </span>
            </td>
            <td>{formatDateTime(r.start_time || r.start || r.timestamp)}</td>
            <td>{r.end_time ? formatDateTime(r.end_time) : "—"}</td>
            <td>{formatDuration(r.duration_minutes ?? r.duration ?? 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
