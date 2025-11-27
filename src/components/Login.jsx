import React, { useState } from "react";
import styled from "styled-components";
import RecoveryModal from "./RecoveryModal";
const API_BASE = import.meta.env.VITE_API_URL || "";

const LoginContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  z-index: 50;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`;

const Logo = styled.div`
  margin-bottom: 2rem;
  img {
    max-width: 200px;
    height: auto;
  }
`;

const Title = styled.h1`
  color: #6052c7;
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
`;

const Form = styled.form`
  width: 100%;
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
    color: #333;
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

  &:hover {
    background: #4b3fb6;
  }

  &:disabled {
    background: #a8a8a8;
    cursor: not-allowed;
  }
`;

const Links = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;

  a {
    color: #6052c7;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s;

    &:hover {
      color: #4b3fb6;
    }
  }
`;

export default function Login({ setLoggedIn, setUsername }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, _setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  const validatePassword = (pass) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*]/.test(pass);
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isLogin) {
        // -------- REGISTRO --------
        if (!fullName.trim()) {
          setError("Informe o nome completo");
          setLoading(false);
          return;
        }
        if (!username.trim()) {
          setError("Informe um usuário de acesso");
          setLoading(false);
          return;
        }
        if (!email.trim()) {
          setError("Informe um e-mail");
          setLoading(false);
          return;
        }
        if (!validatePassword(password)) {
          setError(
            "A senha deve conter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos"
          );
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError("As senhas não coincidem");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/register_user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            username,
            password,
            email,
            nome: fullName,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.ok === false) {
          throw new Error(
            data.error ||
              data.message ||
              "Erro ao cadastrar usuário. Verifique os dados."
          );
        }

        // cadastro ok → já volta para tela de login
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
        setEmail("");
        setError(null);
      } else {
        // -------- LOGIN --------
        const res = await fetch(`${API_BASE}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.ok === false) {
          throw new Error("Usuário ou senha inválidos");
        }

        setLoggedIn(true);
        if (setUsername) {
          // prioriza nome vindo do backend, senão o username digitado
          setUsername(data.nome || data.username || username);
        }
      }
    } catch (err) {
      if (
        err.message &&
        err.message.toLowerCase().includes("failed to fetch")
      ) {
        setError(
          "Erro de rede ao conectar com o backend. Verifique se o backend está rodando e acessível."
        );
      } else {
        setError(err.message || "Ocorreu um erro ao processar a requisição.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/api/request-recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        // aqui você pode integrar com um toast, etc.
        alert("Se o e-mail existir, uma instrução de recuperação será enviada.");
      } else {
        throw new Error("Erro ao solicitar recuperação de senha");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <Title>Maroni</Title>
        </Logo>

        <Form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <Field>
                <label>Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <label>Usuário</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => _setUsername(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
            </>
          )}

          {isLogin && (
            <Field>
              <label>Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => _setUsername(e.target.value)}
                required
              />
            </Field>
          )}

          <Field>
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          {!isLogin && (
            <Field>
              <label>Confirmar Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Field>
          )}

          {error && (
            <div
              style={{
                color: "#ff3333",
                fontSize: "0.875rem",
                marginTop: "0.5rem",
              }}
            >
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Processando..." : isLogin ? "Entrar" : "Cadastrar"}
          </Button>
        </Form>

        <Links>
          {isLogin ? (
            <>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRecoveryModal(true);
                }}
              >
                Esqueci minha senha
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLogin(false);
                  setError(null);
                }}
              >
                Cadastrar novo usuário
              </a>
            </>
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsLogin(true);
                setError(null);
              }}
            >
              Já tenho uma conta
            </a>
          )}
        </Links>
      </LoginCard>

      {showRecoveryModal && (
        <RecoveryModal
          onClose={() => setShowRecoveryModal(false)}
          onConfirm={handlePasswordRecovery}
        />
      )}
    </LoginContainer>
  );
}
