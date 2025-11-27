// ============================================================================
// REGISTRO DE PARADAS MARONI - VERSÃO FINAL (TRAVA VISUAL NO OFF)
// ============================================================================

#define LIGADO    LOW
#define DESLIGADO HIGH

#include <Arduino.h>
#include <SPI.h>
#include <Ethernet.h>
#include <string.h>

// ---------------------- PINOS ----------------------
const int BTN_SETUP = 2;
const int BTN_MAT   = 3;
const int BTN_MAN   = 6;
const int BTN_RUN   = 5;

const int LED_SETUP = 7;
const int LED_MAT   = 8;
const int LED_MAN   = 9;

const int LED_RUN_G  = A0;
const int LED_STOP_R = A1;

// ---------------------- ESTADO ----------------------
bool maquinaRodando = false;
bool latchSETUP = false;
bool latchMAT   = false;
bool latchMAN   = false;

String motivo = "NONE";

// ---------------------- DEBOUNCE ----------------------
const unsigned long DEBOUNCE_MS = 30;

bool lastRUN  = HIGH;
bool lastSETUP = HIGH;
bool lastMAT  = HIGH;
bool lastMAN  = HIGH;

unsigned long tRUN   = 0;
unsigned long tSETUP = 0;
unsigned long tMAT   = 0;
unsigned long tMAN   = 0;

bool lockRUN   = false;
bool lockSETUP = false;
bool lockMAT   = false;
bool lockMAN   = false;

// ---------------------- CICLO DO LED RUN/STOP ----------------------
// 0 = VERDE (Rodando)
// 1 = VERMELHO (Parado)
// 2 = DESLIGADO (Sistema Off)
byte estadoLedRun = 2;

// ---------------------- ETHERNET ----------------------
byte MAC_ADDR[] = {0xDE,0xAD,0xBE,0xEF,0xFE,0x01};
IPAddress IP_STATIC(192,168,1,250);
IPAddress DNS_STATIC(192,168,1,1);
IPAddress GW_STATIC(192,168,1,1);
IPAddress MASK_STATIC(255,255,255,0);

// Servidor Python + Firebase
IPAddress SERVER_IP(192,168,1,129);
const uint16_t SERVER_PORT = 5000;
const char* SERVER_PATH = "/log";

EthernetClient client;

// ---------------------- MONITOR DE REDE ----------------------
bool redeOk = false;
unsigned long ultimaVerificacaoRede = 0;
const unsigned long INTERVALO_VERIF_REDE = 15000UL;

// Protótipos das funções para evitar erros de ordem
void atualizaLedsMotivo();

// Testa se há link físico (cabo conectado)
bool temLinkFisico() {
  int status = Ethernet.linkStatus();
  // 2 = LinkOFF, 1 = LinkON, 0 = Unknown
  if (status == 2) return false;
  return true; 
}

// Testa se o SERVIDOR responde
bool gatewayRespondendo() {
  EthernetClient test;
  if (test.connect(SERVER_IP, SERVER_PORT)) {
    test.stop();
    return true;
  }
  return false;
}

// Imprime no Serial o estado da rede
void verificaRede() {
  Serial.println(F("----- TESTE DE REDE -----"));

  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    Serial.println(F("ERRO: Nenhum shield Ethernet detectado!"));
    redeOk = false;
    return;
  }

  if (!temLinkFisico()) {
    Serial.println(F("ERRO: Sem link - cabo desconectado!"));
    redeOk = false;
    return;
  } else {
    Serial.println(F("OK: Cabo conectado."));
  }

  Serial.print(F("IP atual: "));
  Serial.println(Ethernet.localIP());

  if (gatewayRespondendo()) {
    Serial.println(F("OK: Servidor respondeu. REDE FUNCIONANDO!"));
    redeOk = true;
  } else {
    Serial.println(F("ERRO: Servidor nao respondeu."));
    redeOk = false;
  }
  Serial.println(F("--------------------------"));
}

// ---------------------- FUNÇÃO: DEBOUNCE ----------------------
bool pressedEdgeNB(int pin, bool &last, unsigned long &tchg, bool &lock) {
  bool raw = digitalRead(pin);
  unsigned long now = millis();

  if (raw != last) {
    tchg = now;
    last = raw;
  }

  if (lock && raw == HIGH)
    lock = false;

  if (!lock && (now - tchg) > DEBOUNCE_MS && raw == LOW) {
    lock = true;
    return true;
  }
  return false;
}

// ---------------------- LED RUN/STOP ----------------------
void aplicaEstadoLedRun() {
  switch (estadoLedRun) {
    case 0: // VERDE
      digitalWrite(LED_RUN_G,  LIGADO);
      digitalWrite(LED_STOP_R, DESLIGADO);
      break;

    case 1: // VERMELHO
      digitalWrite(LED_RUN_G,  DESLIGADO);
      digitalWrite(LED_STOP_R, LIGADO);
      break;

    case 2: // DESLIGADO
    default:
      digitalWrite(LED_RUN_G,  DESLIGADO);
      digitalWrite(LED_STOP_R, DESLIGADO);
      break;
  }
}

// Chamado a cada clique no botão RUN
void cicloLedRun() {
  estadoLedRun++;
  if (estadoLedRun > 2)
    estadoLedRun = 0;

  aplicaEstadoLedRun();

  // Máquina rodando somente quando LED VERDE (estado 0)
  maquinaRodando = (estadoLedRun == 0);

  // Se entrou no estado 2 (OFF), os leds de motivo apagarão agora.
  atualizaLedsMotivo();
}

// ---------------------- LED MOTIVOS ----------------------
void atualizaLedsMotivo() {
  // Se o painel principal estiver desligado (estado 2), NADA acende.
  if (estadoLedRun == 2) {
    digitalWrite(LED_SETUP, DESLIGADO);
    digitalWrite(LED_MAT,   DESLIGADO);
    digitalWrite(LED_MAN,   DESLIGADO);
    return; 
  }

  // Se o painel estiver ligado (Verde ou Vermelho), segue lógica normal:
  bool parado = !maquinaRodando;

  digitalWrite(LED_SETUP, latchSETUP ? LIGADO : DESLIGADO);
  digitalWrite(LED_MAT,   (latchMAT && parado) ? LIGADO : DESLIGADO);
  digitalWrite(LED_MAN,   (latchMAN && parado) ? LIGADO : DESLIGADO);
}

void setMotivoExclusivo(const char* nome) {
  latchSETUP = latchMAT = latchMAN = false;

  if (strcmp(nome,"SETUP") == 0) {
    latchSETUP = true;
    motivo = "SETUP";
  }
  else if (strcmp(nome,"MATERIAL") == 0) {
    latchMAT = true;
    motivo = "MATERIAL";
  }
  else if (strcmp(nome,"MANUTENCAO") == 0) {
    latchMAN = true;
    motivo = "MANUTENCAO";
  }
  else {
    motivo = "NONE";
  }

  atualizaLedsMotivo();
}

// Helper: calcula motivo atual a partir dos latches
String getMotivoAtual() {
  if (latchSETUP)   return "SETUP";
  if (latchMAT)     return "MATERIAL";
  if (latchMAN)     return "MANUTENCAO";
  return "NONE";
}

// ---------------------- MONTAR JSON DO EVENTO ----------------------
String montaJSON(const char* tipo) {
  String json = "{";

  // Identificador da máquina (pode ser "Máquina 01", "EXT-01", etc)
  json += "\"machine\":\"Máquina 01\"";

  json += ",\"ts_ms\":";
  json += String(millis());

  json += ",\"tipo\":\"";
  json += tipo;
  json += "\"";

  json += ",\"estado\":\"";
  json += (maquinaRodando ? "RUN" : "STOP");
  json += "\"";

  json += ",\"estadoLed\":";
  json += String(estadoLedRun);   // 0=verde, 1=vermelho, 2=off

  // Flag de parada (1 = parado, 0 = rodando)
  json += ",\"parada\":";
  json += (maquinaRodando ? "0" : "1");

  // Motivo atual (SETUP / MATERIAL / MANUTENCAO / NONE)
  String motivoAtual = getMotivoAtual();
  json += ",\"motivo\":\"";
  json += motivoAtual;
  json += "\"";

  json += "}";

  return json;
}

// ---------------------- ENVIAR LOG VIA HTTP ----------------------
void logEventoHttp(const char* tipo) {
  if (!redeOk) {
    Serial.print(F("Rede indisponivel, log local: "));
    Serial.println(tipo);
    return;
  }

  String payload = montaJSON(tipo);
  Serial.print(F("Enviando: "));
  Serial.println(payload);

  if (client.connect(SERVER_IP, SERVER_PORT)) {
    client.print(F("POST "));
    client.print(SERVER_PATH);
    client.println(F(" HTTP/1.1"));
    client.print(F("Host: "));
    client.print(SERVER_IP);
    client.print(F(":"));
    client.println(SERVER_PORT);
    client.println(F("Content-Type: application/json"));
    client.print(F("Content-Length: "));
    client.println(payload.length());
    client.println(F("Connection: close"));
    client.println();
    client.print(payload);

    unsigned long tstart = millis();
    while (client.connected() && millis() - tstart < 500) {
      while (client.available()) {
        char c = client.read();
      }
    }
    client.stop();
  } else {
    Serial.println(F("Falha ao conectar no servidor HTTP."));
  }
}

// ---------------------- SETUP ----------------------
void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(BTN_SETUP, INPUT_PULLUP);
  pinMode(BTN_MAT,   INPUT_PULLUP);
  pinMode(BTN_MAN,   INPUT_PULLUP);
  pinMode(BTN_RUN,   INPUT_PULLUP);

  pinMode(LED_SETUP, OUTPUT);
  pinMode(LED_MAT,   OUTPUT);
  pinMode(LED_MAN,   OUTPUT);
  pinMode(LED_RUN_G, OUTPUT);
  pinMode(LED_STOP_R,OUTPUT);

  digitalWrite(LED_SETUP, DESLIGADO);
  digitalWrite(LED_MAT,   DESLIGADO);
  digitalWrite(LED_MAN,   DESLIGADO);
  digitalWrite(LED_RUN_G, DESLIGADO);
  digitalWrite(LED_STOP_R,DESLIGADO);

  Ethernet.begin(MAC_ADDR, IP_STATIC, DNS_STATIC, GW_STATIC, MASK_STATIC);
  delay(800);

  verificaRede();

  estadoLedRun = 2; // Começa desligado
  maquinaRodando = false;
  motivo = "NONE";

  logEventoHttp("BOOT");
}

// ---------------------- LOOP ----------------------
void loop() {

  // Verifica rede periodicamente
  if (millis() - ultimaVerificacaoRede > INTERVALO_VERIF_REDE) {
    ultimaVerificacaoRede = millis();
    verificaRede();
  }

  // BOTÃO RUN: Ciclo Verde -> Vermelho -> Desligado
  if (pressedEdgeNB(BTN_RUN, lastRUN, tRUN, lockRUN)) {
    cicloLedRun();
    logEventoHttp("RUN_CYCLE");
  }

  // BOTÃO SETUP
  if (pressedEdgeNB(BTN_SETUP, lastSETUP, tSETUP, lockSETUP)) {
    if (latchSETUP) setMotivoExclusivo("NONE");
    else            setMotivoExclusivo("SETUP");
    logEventoHttp("MOTIVO");
  }

  // BOTÃO MATERIAL
  if (pressedEdgeNB(BTN_MAT, lastMAT, tMAT, lockMAT)) {
    if (latchMAT)  setMotivoExclusivo("NONE");
    else           setMotivoExclusivo("MATERIAL");
    logEventoHttp("MOTIVO");
  }

  // BOTÃO MANUTENÇÃO
  if (pressedEdgeNB(BTN_MAN, lastMAN, tMAN, lockMAN)) {
    if (latchMAN)  setMotivoExclusivo("NONE");
    else           setMotivoExclusivo("MANUTENCAO");
    logEventoHttp("MOTIVO");
  }
}