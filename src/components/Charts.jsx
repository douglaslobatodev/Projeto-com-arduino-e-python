import React, { useMemo, useRef } from "react";
import { Pie, Bar } from "react-chartjs-2";
import styled from "styled-components";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  TimeScale,
} from "chart.js";
import { getMotivoColor } from "../utils/motivoColors";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  TimeScale
);

const FilterButton = styled.button`
  margin-bottom: 16px;
  padding: 8px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    background: #2b3edf;
  }
`;

export default function Charts({
  stops,
  type = "pie",
  setFilterReason,
  pieDataFromApi,
  barDataFromApi,
}) {
  const chartRef = useRef(null);

  const pieData = useMemo(() => {
    // Usando dados vindos do backend
    if (
      pieDataFromApi &&
      Array.isArray(pieDataFromApi.labels) &&
      Array.isArray(pieDataFromApi.data)
    ) {
      const labels = pieDataFromApi.labels;
      const data = pieDataFromApi.data;

      const backgroundColor = labels.map((label) => getMotivoColor(label));

      return {
        labels,
        datasets: [
          {
            label: "Motivos",
            data,
            backgroundColor,
          },
        ],
      };
    }

    // FALLBACK: calcula a pizza em cima de stops
    const counts = {};
    stops.forEach((s) => {
      const r = s.reason || "Desconhecido";
      counts[r] = (counts[r] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data = labels.map((l) => counts[l]);
    const backgroundColor = labels.map((label) => getMotivoColor(label));

    return {
      labels,
      datasets: [
        {
          label: "Motivos",
          data,
          backgroundColor,
        },
      ],
    };
  }, [stops, pieDataFromApi]);

  const barData = useMemo(() => {
    if (
      barDataFromApi &&
      Array.isArray(barDataFromApi.labels) &&
      Array.isArray(barDataFromApi.data)
    ) {
      return {
        labels: barDataFromApi.labels,
        datasets: [
          {
            label: "Duração (min)",
            data: barDataFromApi.data,
            backgroundColor: "rgba(88,166,255,0.9)",
          },
        ],
      };
    }

    const last = [...stops].slice(-10);
    const labels = last.map((s) => {
      const t = new Date(s.start_time || s.start || s.timestamp || Date.now());
      return t.toLocaleTimeString();
    });
    const data = last.map((s) => s.duration_minutes ?? s.duration ?? 0);
    return {
      labels,
      datasets: [
        {
          label: "Duração (min)",
          data,
          backgroundColor: "rgba(88,166,255,0.9)",
        },
      ],
    };
  }, [stops, barDataFromApi]);

  if (type === "pie") {
    const pieOptions = {
      onClick: (event, elements) => {
        if (!elements.length || !setFilterReason) return;
        const clickedIndex = elements[0].index;
        const clickedLabel = pieData.labels[clickedIndex];
        setFilterReason(clickedLabel);
      },
      responsive: true,
    };

    return (
      <>
        {setFilterReason && (
          <FilterButton onClick={() => setFilterReason(null)}>
            Limpar Filtro
          </FilterButton>
        )}
        <Pie ref={chartRef} data={pieData} options={pieOptions} />
      </>
    );
  }

  return <Bar data={barData} options={{ responsive: true }} />;
}
