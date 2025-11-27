import React from "react";
import styled from "styled-components";

const FooterContainer = styled.footer`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 4px;
  margin-top: 24px;
  position: relative;
`;

const Copyright = styled.p`
  color: var(--text-secondary);
  font-size: 13px;
  margin: 0;
  text-align: center;

  strong {
    color: var(--text-primary);
  }
`;

export default function Footer() {
  return (
    <FooterContainer>
      <Copyright>
        <strong>Indústria Maroni</strong> © 2025 - Sistema de Monitoramento IoT
      </Copyright>
    </FooterContainer>
  );
}
