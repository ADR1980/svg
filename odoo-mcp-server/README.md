# Odoo MCP Server

MCP (Model Context Protocol) Server für die Integration von Odoo in Claude Code.
Ermöglicht direkten Zugriff auf beliebige Odoo-Modelle via XML-RPC.

## Verfügbare Tools

| Tool | Beschreibung |
|------|-------------|
| `odoo_search_read` | Datensätze suchen und lesen (mit Domain-Filter, Paginierung) |
| `odoo_read` | Datensätze per ID lesen |
| `odoo_create` | Neuen Datensatz erstellen |
| `odoo_write` | Datensatz aktualisieren |
| `odoo_unlink` | Datensatz löschen |
| `odoo_fields_get` | Felddefinitionen eines Modells abrufen |
| `odoo_list_models` | Verfügbare Modelle auflisten |

## Setup

### 1. Odoo API-Key erstellen

1. Bei deiner odoo.sh Instanz einloggen
2. Oben rechts auf deinen **Benutzernamen** klicken → **„Mein Profil"** (oder „Preferences")
3. Tab **„Account Security"** öffnen
4. Im Bereich **„API Keys"** auf **„New API Key"** klicken
5. Ein Label vergeben (z.B. „Claude Code MCP")
6. Den generierten Key **sofort kopieren** — er wird nur einmal angezeigt!

### 2. Datenbankname herausfinden

Der Datenbankname ist in der Regel in der URL deiner odoo.sh Instanz sichtbar:
- URL-Format: `https://<datenbankname>.odoo.com`
- Alternativ: **Einstellungen → Technisch → Datenbankstruktur → Datenbankname**
- Oder im odoo.sh Dashboard unter deinem Projekt

### 3. `.mcp.json` konfigurieren

Die Datei `.mcp.json` im Repository-Root enthält die MCP-Server-Konfiguration für Claude Code.
Trage dort deine echten Zugangsdaten ein:

```json
{
  "mcpServers": {
    "odoo": {
      "command": "python3",
      "args": ["odoo-mcp-server/server.py"],
      "env": {
        "ODOO_URL": "https://deine-instanz.odoo.com",
        "ODOO_DB": "deine-datenbank",
        "ODOO_USERNAME": "deine-email@example.com",
        "ODOO_API_KEY": "dein-api-key-hier"
      }
    }
  }
}
```

> **Wichtig:** Die `.mcp.json` enthält sensible Daten (API-Key). Sie ist in `.gitignore`
> eingetragen und wird **nicht** ins Repository committed.

### 4. Claude Code neu starten

Nach dem Konfigurieren der `.mcp.json` muss Claude Code neu gestartet werden,
damit der MCP Server erkannt wird. Du solltest dann sehen, dass der „Odoo"
MCP Server verbunden ist.

## Verwendungsbeispiele in Claude Code

Sobald der MCP Server verbunden ist, kannst du Claude direkt bitten:

- *„Zeig mir alle Kontakte die Firmen sind"*
- *„Liste die letzten 10 Verkaufsaufträge"*
- *„Erstelle einen neuen Kontakt mit Name 'Test GmbH'"*
- *„Welche Felder hat das Modell sale.order?"*
- *„Suche nach Odoo-Modellen die mit 'account' beginnen"*

## Häufige Odoo-Modelle

| Modell | Beschreibung |
|--------|-------------|
| `res.partner` | Kontakte / Kunden / Lieferanten |
| `sale.order` | Verkaufsaufträge |
| `purchase.order` | Einkaufsbestellungen |
| `account.move` | Rechnungen / Buchungen |
| `product.product` | Produkte |
| `product.template` | Produktvorlagen |
| `stock.picking` | Lagerbewegungen |
| `project.project` | Projekte |
| `project.task` | Aufgaben |
| `hr.employee` | Mitarbeiter |
| `crm.lead` | CRM Leads / Opportunities |

## Troubleshooting

- **Verbindungsfehler:** Prüfe ob die ODOO_URL korrekt ist (mit `https://`, ohne `/` am Ende)
- **Authentifizierung fehlgeschlagen:** API-Key und Benutzername prüfen
- **Modell nicht gefunden:** Prüfe ob das Odoo-Modul installiert ist (z.B. `sale` für `sale.order`)
- **Zugriff verweigert:** Der API-Benutzer braucht die entsprechenden Berechtigungen in Odoo
