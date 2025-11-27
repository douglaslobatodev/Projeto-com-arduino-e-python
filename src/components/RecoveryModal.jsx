import React, { useState } from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #6052c7;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 500;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    color: #333;
    font-size: 0.9rem;
  }

  input {
    padding: 0.75rem 1rem;
    border: 1px solid #e1e1e1;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #6052c7;
    }
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: #6052c7;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover {
    background: #4b3fb6;
  }

  &:disabled {
    background: #a8a8a8;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  right: 1rem;
  top: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;

  &:hover {
    color: #333;
  }
`;

const Message = styled.div`
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;

  &.success {
    background: #e7f3eb;
    color: #2d6a4f;
  }

  &.error {
    background: #fee7e7;
    color: #cf1717;
  }
`;

export default function RecoveryModal({ onClose }) {
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (step === 1) {
        // Enviar solicitação de código
        const res = await fetch(`${API_BASE}/api/request-recovery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (res.ok) {
          setMessage("Código de recuperação enviado para seu email");
          setStep(2);
        } else {
          throw new Error("Email não encontrado");
        }
      } else if (step === 2) {
        // Verificar código
        const res = await fetch(`${API_BASE}/api/verify-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });

        if (res.ok) {
          setStep(3);
        } else {
          throw new Error("Código inválido");
        }
      } else if (step === 3) {
        // Redefinir senha
        if (newPassword !== confirmPassword) {
          throw new Error("As senhas não coincidem");
        }

        const res = await fetch(`${API_BASE}/api/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, newPassword }),
        });

        if (res.ok) {
          setMessage("Senha redefinida com sucesso!");
          setTimeout(onClose, 2000);
        } else {
          throw new Error("Erro ao redefinir senha");
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title>Recuperação de Senha</Title>

        {message && <Message className="success">{message}</Message>}
        {error && <Message className="error">{error}</Message>}

        <Form onSubmit={handleSubmit}>
          {step === 1 && (
            <Field>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Seu email cadastrado"
              />
            </Field>
          )}

          {step === 2 && (
            <Field>
              <label>Código de Verificação</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="Digite o código recebido"
              />
            </Field>
          )}

          {step === 3 && (
            <>
              <Field>
                <label>Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Digite sua nova senha"
                />
              </Field>
              <Field>
                <label>Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirme sua nova senha"
                />
              </Field>
            </>
          )}

          <Button type="submit" disabled={loading}>
            {loading
              ? "Processando..."
              : step === 1
              ? "Enviar Código"
              : step === 2
              ? "Verificar Código"
              : "Redefinir Senha"}
          </Button>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
}
