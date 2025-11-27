import React, { useEffect, useState } from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: var(--card-bg);
  border-radius: 4px;
  margin-bottom: 16px;
  position: relative;
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

// Título centralizado
const CenteredTitle = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;

  h1 {
    margin: 0;
    font-size: 20px;
    color: var(--text-primary);
  }

  h2 {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--text-secondary);
  }
`;

const UserInfo = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
`;

const StatusText = styled.div`
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background: ${(props) => (props.$online ? "#29cc97" : "#f12b2c")};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid ${(props) => (props.$primary ? "var(--accent)" : "#2b2c33")};
  background: ${(props) => (props.$primary ? "var(--accent)" : "transparent")};
  color: ${(props) => (props.$primary ? "#fff" : "var(--text-secondary)")};
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--accent);
    color: ${(props) => (props.$primary ? "#fff" : "var(--accent)")};
  }
`;

export default function Header({ username, setIsLoggedIn, setShowStopForm }) {
  const [online, setOnline] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  const logout = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "";
      await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore
    }
    if (setIsLoggedIn) setIsLoggedIn(false);
  };

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || "";

    const checkStatus = async () => {
      try {
        await fetch(`${API_BASE}/api/data`, {
          method: "GET",
          credentials: "include",
        });
        setOnline(true);
      } catch (e) {
        setOnline(false);
      } finally {
        setLastCheck(new Date());
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // checa a cada 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <HeaderContainer>
      <HeaderInfo>
        <UserInfo>Logado como: {username || "-"}</UserInfo>
        <StatusText>
          <StatusDot $online={online} />
          {online ? "Servidor online" : "Servidor offline"}
          {lastCheck && (
            <span>
              • Atualizado às{" "}
              {lastCheck.toLocaleTimeString("pt-BR", { hour12: false })}
            </span>
          )}
        </StatusText>
      </HeaderInfo>

      <CenteredTitle>
        <h1>Indústria Maroni</h1>
        <h2>Monitoramento I4.0</h2>
      </CenteredTitle>

      <ButtonGroup>
        <Button
          $primary
          onClick={() => setShowStopForm && setShowStopForm(true)}
        >
          Registrar Parada
        </Button>
        <Button onClick={logout}>Sair</Button>
      </ButtonGroup>
    </HeaderContainer>
  );
}
