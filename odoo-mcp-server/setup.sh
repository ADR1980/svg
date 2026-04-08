#!/bin/bash
# Setup-Script für den Odoo MCP Server
# Erstellt die .mcp.json mit den Zugangsdaten

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_JSON="$REPO_ROOT/.mcp.json"

echo "=== Odoo MCP Server Setup ==="
echo ""

# Standardwerte
DEFAULT_URL="https://adr1980-1moa-main-30651823.dev.odoo.com"
DEFAULT_DB="adr1980-1moa-main-30651823"
DEFAULT_USER="andreas@del.re"

read -p "Odoo URL [$DEFAULT_URL]: " ODOO_URL
ODOO_URL="${ODOO_URL:-$DEFAULT_URL}"

read -p "Datenbank [$DEFAULT_DB]: " ODOO_DB
ODOO_DB="${ODOO_DB:-$DEFAULT_DB}"

read -p "Benutzername [$DEFAULT_USER]: " ODOO_USER
ODOO_USER="${ODOO_USER:-$DEFAULT_USER}"

read -sp "Passwort oder API-Key: " ODOO_KEY
echo ""

cat > "$MCP_JSON" << EOF
{
  "mcpServers": {
    "odoo": {
      "command": "python3",
      "args": ["odoo-mcp-server/server.py"],
      "env": {
        "ODOO_URL": "$ODOO_URL",
        "ODOO_DB": "$ODOO_DB",
        "ODOO_USERNAME": "$ODOO_USER",
        "ODOO_API_KEY": "$ODOO_KEY"
      }
    }
  }
}
EOF

echo ""
echo "✓ .mcp.json erstellt: $MCP_JSON"
echo ""
echo "Nächster Schritt: Claude Code starten mit 'claude' im Repo-Verzeichnis."
echo "Der Odoo MCP Server wird automatisch erkannt."
