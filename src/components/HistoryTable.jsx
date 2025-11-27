import React from "react";
import styled from "styled-components";
import { getMotivoColor } from "../utils/motivoColors";

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: var(--text-primary);

  th,
  td {
    padding: 6px 10px;
    text-align: left;
    white-space: nowrap;
  }

  thead tr {
    border-bottom: 1px solid #2b2c33;
  }

  tbody tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.02);
  }

  tbody tr:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

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
  const color = getMotivoColor(reasonRaw);

  return {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 600,
    backgroundColor: `${color}22`, // mesma cor com transparência
    color,
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
    <TableWrapper>
      <StyledTable>
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
      </StyledTable>
    </TableWrapper>
  );
}
