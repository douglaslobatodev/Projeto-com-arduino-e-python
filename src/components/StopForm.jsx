import React, { useState } from "react";
import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
`;

const Modal = styled.div`
  background: var(--card-bg);
  padding: 24px;
  border-radius: 8px;
  width: 320px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
`;

const Title = styled.h2`
  margin: 0 0 16px 0;
  font-size: 18px;
  color: var(--text-primary);
`;

const Field = styled.div`
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 8px;
    color: var(--text-secondary);
  }

  select,
  input {
    width: 100%;
    padding: 8px 10px;
    background: #15161a;
    border: 1px solid #2b2c33;
    color: var(--text-primary);
    border-radius: 4px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 24px;
`;

const Button = styled.button`
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: ${(props) =>
    props.$primary ? "var(--accent)" : "var(--card-bg)"};
  color: ${(props) => (props.$primary ? "#fff" : "var(--text-secondary)")};
  border: 1px solid ${(props) => (props.$primary ? "var(--accent)" : "#2b2c33")};
`;

const ErrorMessage = styled.div`
  color: var(--error);
  margin-top: 8px;
  font-size: 13px;
`;

const reasons = [
  "Setup",
  "Falta de Material",
  "Manutenção",
  "Almoço/Intervalo",
];

export default function StopForm({ onClose, onSuccess: onStopRegistered }) {
  const [reason, setReason] = useState(reasons[0]);
  const [duration, setDuration] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!duration) {
      setError("Por favor, informe a duração da parada.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_BASE}/api/register_stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason,
          duration: parseFloat(duration),
          machine: "Máquina 01", // hardcoded for now
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Sessão expirada. Por favor, faça login novamente.");
          return;
        }
        throw new Error("Erro ao registrar parada");
      }

      if (onStopRegistered) {
        onStopRegistered();
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <Title>Registrar Nova Parada</Title>
        <form onSubmit={handleSubmit}>
          <Field>
            <label>Motivo da Parada</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>

          <Field>
            <label>Duração (minutos)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Ex: 30.5"
            />
          </Field>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" $primary disabled={submitting}>
              {submitting ? "Registrando..." : "Registrar"}
            </Button>
          </ButtonGroup>
        </form>
      </Modal>
    </Overlay>
  );
}
