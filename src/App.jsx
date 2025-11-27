import React, { useEffect, useState, useMemo } from "react";
import styled, { createGlobalStyle } from "styled-components";
import Login from "./components/Login";
import Header from "./components/Header";
import Cards from "./components/Cards";
import Charts from "./components/Charts";
import HistoryTable from "./components/HistoryTable";
import Footer from "./components/Footer";
import StopForm from "./components/StopForm";

const GlobalStyle = createGlobalStyle`
  :root {
    --dark-bg: #1a1d24;
    --card-bg: #242731;
    --text-primary: #ffffff;
    --text-secondary: #a4a6b3;
    --accent: #3751ff;
    --success: #29cc97;
    --warning: #fec400;
    --error: #f12b2c;
    --spacing-unit: 8px;
  }
  
  body {
    margin: 0;
    padding: 0;
    background-color: var(--dark-bg);
    color: var(--text-primary);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.4;
  }

  main {
    max-width: 1000px;
    margin: 0 auto;
    padding: var(--spacing-unit);
  }

  h1 { font-size: 20px; margin: var(--spacing-unit) 0; }
  h2 { font-size: 18px; margin: var(--spacing-unit) 0; }
  h3 { font-size: 14px; margin: var(--spacing-unit) 0; }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-unit);
    margin-bottom: calc(var(--spacing-unit) * 2);
  }

  .charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: calc(var(--spacing-unit) * 2);
    margin-bottom: calc(var(--spacing-unit) * 2);
  }

  .chart-box {
    background: var(--card-bg);
    padding: var(--spacing-unit);
    border-radius: 4px;
  }

  .history {
    background: var(--card-bg);
    padding: var(--spacing-unit);
    border-radius: 4px;
  }
`;

function normalizeText(t) {
  return (t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const AppContainer = styled.div`
  min-height: 100vh;
  padding: 12px;
  box-sizing: border-box;
`;

const MONITORED_MACHINE = "Máquina 01";

export default function App() {
  const API_BASE = import.meta.env.VITE_API_URL || "";

  const [rawData, setRawData] = useState([]); // stops
  const [cardsData, setCardsData] = useState(null);
  const [pieDataApi, setPieDataApi] = useState(null);
  const [barDataApi, setBarDataApi] = useState(null);

  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [showStopForm, setShowStopForm] = useState(false);

  const [filterReason, setFilterReason] = useState(null);

  // -------------------------------------------------------------------
  // BUSCAR /api/data
  // -------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/data`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Network response was not ok");

        const json = await res.json();

        const stops = Array.isArray(json.stops) ? json.stops : [];

        if (mounted) {
          setRawData(stops);
          setCardsData(json.cards || null);
          setPieDataApi(json.pie || null);
          setBarDataApi(json.bar || null);
          setError(null);
        }
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(
          err.message.includes("Failed to fetch")
            ? "Erro de rede ao conectar com o backend."
            : err.message
        );
      }
    };

    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [API_BASE]);

  // -------------------------------------------------------------------
  // VERIFICA LOGIN
  // -------------------------------------------------------------------
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/status`, {
          credentials: "include",
        });
        if (!res.ok) return;

        const j = await res.json();
        if (j.logged_in) {
          setIsLoggedIn(true);
          if (j.username) setUsername(j.username);
        }
      } catch {}
    };

    check();
  }, [API_BASE]);

  // -------------------------------------------------------------------
  // FILTROS
  // -------------------------------------------------------------------
  const machineStops = useMemo(
    () =>
      rawData.filter(
        (s) => !s.machine || normalizeText(s.machine) === normalizeText(MONITORED_MACHINE)

      ),
    [rawData]
  );

  const stopsToDisplay = useMemo(
    () =>
      filterReason
        ? machineStops.filter(
            (s) => (s.reason || "Sem motivo") === filterReason
          )
        : machineStops,
    [machineStops, filterReason]
  );

  // -------------------------------------------------------------------
  // Após registrar parada manual
  // -------------------------------------------------------------------
  const handleStopRegistered = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/data`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Network response was not ok");

      const json = await res.json();
      const stops = Array.isArray(json.stops) ? json.stops : [];

      setRawData(stops);
      setCardsData(json.cards || null);
      setPieDataApi(json.pie || null);
      setBarDataApi(json.bar || null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erro ao atualizar dados após registrar parada.");
    }
  };

  // -------------------------------------------------------------------
  // LOGIN
  // -------------------------------------------------------------------
  if (!isLoggedIn) {
    return <Login setLoggedIn={setIsLoggedIn} setUsername={setUsername} />;
  }

  // -------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------
  return (
    <AppContainer>
      <GlobalStyle />

      <Header
        username={username}
        setIsLoggedIn={setIsLoggedIn}
        setShowStopForm={setShowStopForm}
      />

      {showStopForm && (
        <StopForm
          onClose={() => setShowStopForm(false)}
          onSuccess={handleStopRegistered}
        />
      )}

      <main>
        {error && (
          <div style={{ color: "salmon", textAlign: "center" }}>
            Erro ao buscar dados: {error}
          </div>
        )}

        <section className="cards">
          <Cards
            stops={stopsToDisplay}
            cardsData={cardsData}
          />
        </section>

        <section className="charts">
          <div className="chart-box">
            <h3>Distribuição de Motivos</h3>
            <Charts
              stops={machineStops}
              type="pie"
              setFilterReason={setFilterReason}
              pieDataFromApi={pieDataApi}
            />
          </div>

          <div className="chart-box">
            <h3>Tempo - Últimas Paradas (min)</h3>
            <Charts
              stops={stopsToDisplay}
              type="bar"
              barDataFromApi={barDataApi}
            />
          </div>
        </section>

        <section className="history">
          <h3>Últimas Paradas</h3>
          <HistoryTable stops={stopsToDisplay} />
        </section>
      </main>

      <Footer />
    </AppContainer>
  );
}
