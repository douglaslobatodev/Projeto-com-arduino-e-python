import React, { useMemo } from "react";

function formatMinutes(totalMinutes) {
  const totalSeconds = Math.round(totalMinutes * 60);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (num) => String(num).padStart(2, "0");

  const hoursPart = h > 0 ? `${h}h ` : "";
  return `${hoursPart}${pad(m)}m ${pad(s)}s`;
}

export default function Cards({ stops, cardsData }) {
  const stats = useMemo(() => {
    if (cardsData && typeof cardsData === "object") {
      return {
        totalStops: cardsData.totalStops ?? 0,
        totalMinutes: cardsData.totalDowntime ?? 0,
        topReason: cardsData.mostCommonReason ?? "--",

        // NOVOS CAMPOS DO BACKEND
        activeMachines: cardsData.activeMachines ?? 0,
        inactiveMachines: cardsData.inactiveMachines ?? 0,
      };
    }

    // fallback (caso o backend esteja offline)
    const totalStops = stops.length;
    const totalMinutes = stops.reduce(
      (s, x) => s + (x.duration_minutes ?? x.duration ?? 0),
      0
    );

    const reasons = {};
    stops.forEach((s) => {
      const r = s.reason || "Desconhecido";
      reasons[r] = (reasons[r] || 0) + 1;
    });

    const topReason =
      Object.keys(reasons).sort((a, b) => reasons[b] - reasons[a])[0] || "--";

    return {
      totalStops,
      totalMinutes,
      topReason,
      activeMachines: 0,
      inactiveMachines: 0,
    };
  }, [stops, cardsData]);

  return (
    <>
      {/* NOVO CARD: MÁQUINAS EM ATIVIDADE */}
      <div className="card">
        <h2>Máquinas em Atividade</h2>
        <p style={{ color: "#29cc97", fontWeight: "bold" }}>
          {stats.activeMachines}
        </p>
      </div>

      {/* NOVO CARD: MÁQUINAS INATIVAS */}
      <div className="card">
        <h2>Máquinas Inativas</h2>
        <p style={{ color: "#f12b2c", fontWeight: "bold" }}>
          {stats.inactiveMachines}
        </p>
      </div>

      <div className="card">
        <h2>Total de Paradas</h2>
        <p>{stats.totalStops}</p>
      </div>

      <div className="card">
        <h2>Tempo Total</h2>
        <p>{formatMinutes(stats.totalMinutes)}</p>
      </div>

      <div className="card">
        <h2>Motivo Mais Comum</h2>
        <p>{stats.topReason}</p>
      </div>
    </>
  );
}
