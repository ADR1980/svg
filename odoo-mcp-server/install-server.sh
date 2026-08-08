#!/bin/bash
# Installations-Script für den Odoo MCP Server auf einem Linux VPS (Debian/Ubuntu).
# Muss als root oder mit sudo ausgeführt werden.

set -euo pipefail

INSTALL_DIR="/opt/odoo-mcp-server"
SERVICE_USER="odoomcp"
ENV_FILE="/etc/odoo-mcp.env"
PORT="${MCP_PORT:-8080}"

if [[ $EUID -ne 0 ]]; then
   echo "Bitte als root oder mit sudo ausführen." >&2
   exit 1
fi

echo "=== Odoo MCP Server Installation ==="
echo ""

# 1. System-Pakete
echo "[1/7] Installiere System-Pakete..."
apt-get update -qq
apt-get install -y python3 python3-venv python3-pip ufw curl >/dev/null

# 2. Service-User anlegen
echo "[2/7] Lege Service-User an..."
if ! id -u "$SERVICE_USER" >/dev/null 2>&1; then
    useradd --system --home "$INSTALL_DIR" --shell /usr/sbin/nologin "$SERVICE_USER"
fi

# 3. Verzeichnis vorbereiten
echo "[3/7] Bereite Verzeichnis vor..."
mkdir -p "$INSTALL_DIR"

# Quelldateien kopieren (relativ zum Script-Standort)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/server.py" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/server_http.py" "$INSTALL_DIR/"
cp "$SCRIPT_DIR/requirements.txt" "$INSTALL_DIR/"

# 4. Virtuelles Environment + Dependencies
echo "[4/7] Erstelle Python venv und installiere Abhängigkeiten..."
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install --quiet --upgrade pip
"$INSTALL_DIR/venv/bin/pip" install --quiet -r "$INSTALL_DIR/requirements.txt"

chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"

# 5. Token generieren falls noch keiner existiert
echo "[5/7] Bereite Konfiguration vor..."
if [[ ! -f "$ENV_FILE" ]]; then
    GENERATED_TOKEN="$(openssl rand -hex 32)"
    cat > "$ENV_FILE" <<EOF
# Odoo Verbindung
ODOO_URL=https://adr1980-1moa-main-30651823.dev.odoo.com
ODOO_DB=adr1980-1moa-main-30651823
ODOO_USERNAME=andreas@del.re
ODOO_API_KEY=BITTE_HIER_DEIN_PASSWORT_ODER_API_KEY_EINTRAGEN

# MCP Server
MCP_AUTH_TOKEN=$GENERATED_TOKEN
MCP_HOST=0.0.0.0
MCP_PORT=$PORT
EOF
    chmod 600 "$ENV_FILE"
    chown root:root "$ENV_FILE"
    echo ""
    echo "  Konfigurationsdatei erstellt: $ENV_FILE"
    echo "  Bearer-Token generiert: $GENERATED_TOKEN"
    echo ""
    echo "  WICHTIG: Bitte den ODOO_API_KEY in $ENV_FILE eintragen!"
    echo ""
else
    echo "  Konfigurationsdatei existiert bereits: $ENV_FILE (wird nicht überschrieben)"
fi

# 6. systemd Service installieren
echo "[6/7] Installiere systemd Service..."
cp "$SCRIPT_DIR/odoo-mcp.service" /etc/systemd/system/odoo-mcp.service
systemctl daemon-reload
systemctl enable odoo-mcp.service >/dev/null 2>&1

# 7. Firewall öffnen
echo "[7/7] Öffne Firewall-Port $PORT..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow "$PORT/tcp" >/dev/null 2>&1 || true
fi

echo ""
echo "=== Installation abgeschlossen ==="
echo ""
echo "Nächste Schritte:"
echo "  1. Bearbeite $ENV_FILE und trage ODOO_API_KEY ein"
echo "  2. Starte den Service:"
echo "       sudo systemctl start odoo-mcp"
echo "  3. Status prüfen:"
echo "       sudo systemctl status odoo-mcp"
echo "       sudo journalctl -u odoo-mcp -f"
echo "  4. Health-Check:"
echo "       curl http://localhost:$PORT/health"
echo ""
echo "Für Claude Code (.mcp.json) brauchst du:"
echo "  - Server-IP: \$(curl -s ifconfig.me)"
echo "  - Port: $PORT"
echo "  - Token aus: $ENV_FILE (MCP_AUTH_TOKEN)"
echo ""
