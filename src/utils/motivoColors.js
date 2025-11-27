export const MOTIVO_COLORS = {
  "falta de material": "#fec400",     // amarelo
  manutenção: "#f12b2c",              // vermelho
  setup: "#2196f3",                   // azul
  "sem motivo": "#9e9e9e",            // cinza
  "almoço/intervalo": "#9c27b0",      // roxo
};

export function getMotivoColor(reasonRaw) {
  if (!reasonRaw) return MOTIVO_COLORS["sem motivo"];
  const r = reasonRaw.toLowerCase().trim();

  if (r.includes("material")) return MOTIVO_COLORS["falta de material"];
  if (r.includes("manuten")) return MOTIVO_COLORS["manutenção"];
  if (r.includes("setup")) return MOTIVO_COLORS["setup"];
  if (r.includes("almoço") || r.includes("intervalo"))
    return MOTIVO_COLORS["almoço/intervalo"];

  return MOTIVO_COLORS["sem motivo"];
}
