# Odoo MCP Server — Remote-Variante (Hostinger VPS)

Diese Anleitung beschreibt die Installation des Odoo MCP Servers als
**Daemon auf einem VPS** (z.B. Hostinger). Anders als die lokale Variante
läuft der Server als HTTP-Service und kann von jedem Claude Code Client
remote angesprochen werden.

## Architektur

```
[Claude Code Client]  --HTTPS/HTTP+Bearer Token-->  [VPS:8080 server_http.py]  --XML-RPC-->  [Odoo]
```

## Voraussetzungen

- Hostinger VPS mit Ubuntu/Debian und Root-Zugang
- SSH-Zugriff
- Geöffneter Port (Standard: 8080) in der Hostinger-Firewall
- Optional: Domain für HTTPS (sonst HTTP)

## Installation

### 1. Per SSH verbinden

```bash
ssh root@DEINE-VPS-IP
```

### 2. Repo klonen

```bash
cd /tmp
git clone https://github.com/ADR1980/svg.git
cd svg/odoo-mcp-server
```

### 3. Installations-Script ausführen

```bash
sudo bash install-server.sh
```

Das Script:
- Installiert Python und Dependencies
- Legt einen Service-User `odoomcp` an
- Kopiert Dateien nach `/opt/odoo-mcp-server`
- Generiert einen zufälligen 32-Byte Bearer Token
- Erstellt `/etc/odoo-mcp.env` mit Vorlagen-Werten
- Installiert systemd-Service `odoo-mcp.service`
- Öffnet Port 8080 in der UFW Firewall

### 4. Konfiguration vervollständigen

```bash
sudo nano /etc/odoo-mcp.env
```

Trage deinen `ODOO_API_KEY` (oder Passwort) ein. URL, DB und User sind bereits
für 1MOA voreingestellt.

### 5. Service starten

```bash
sudo systemctl start odoo-mcp
sudo systemctl status odoo-mcp
```

Logs anschauen:
```bash
sudo journalctl -u odoo-mcp -f
```

### 6. Test (auf dem VPS)

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

### 7. Bearer Token notieren

```bash
sudo grep MCP_AUTH_TOKEN /etc/odoo-mcp.env
```

### 8. Hostinger Firewall öffnen

In der Hostinger-Web-Konsole (hPanel):
- Zu deinem VPS gehen
- **Firewall** → Neue Regel: TCP Port `8080` von beliebig → erlauben

## Claude Code konfigurieren (.mcp.json)

Auf deinem **lokalen Rechner** in der `.mcp.json` (oder Projekt-Verzeichnis):

```json
{
  "mcpServers": {
    "odoo": {
      "type": "http",
      "url": "http://DEINE-VPS-IP:8080/mcp/",
      "headers": {
        "Authorization": "Bearer DEIN-BEARER-TOKEN"
      }
    }
  }
}
```

Ersetze `DEINE-VPS-IP` und `DEIN-BEARER-TOKEN` mit den entsprechenden Werten.

> **Achtung HTTP:** Da nur eine IP verwendet wird, läuft die Verbindung über
> HTTP (unverschlüsselt). Der Bearer-Token wird im Klartext übertragen.
> Für Produktivnutzung **dringend HTTPS** einrichten — siehe unten.

## HTTPS aktivieren (empfohlen)

### Option A: Mit Domain (optimal)

1. Subdomain auf VPS-IP zeigen lassen (A-Record)
2. nginx + certbot installieren:
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   sudo certbot --nginx -d mcp.deine-domain.de
   ```
3. nginx als Reverse Proxy zu `localhost:8080` konfigurieren

### Option B: Mit nip.io (ohne eigene Domain)

[nip.io](https://nip.io) bietet kostenlose Wildcard-DNS für jede IP:
- Wenn deine IP `1.2.3.4` ist, ist `1-2-3-4.nip.io` automatisch verfügbar
- Damit kann Let's Encrypt einen TLS-Cert ausstellen
- Beispiel: `sudo certbot --nginx -d 1-2-3-4.nip.io`

## Service-Verwaltung

```bash
sudo systemctl start odoo-mcp      # Starten
sudo systemctl stop odoo-mcp       # Stoppen
sudo systemctl restart odoo-mcp    # Neustart
sudo systemctl status odoo-mcp     # Status
sudo journalctl -u odoo-mcp -f     # Logs live
```

## Sicherheit

- **Bearer Token** ist 32 Byte zufällig — sicher
- **HTTP** ist unverschlüsselt → Token könnte abgefangen werden
- **Firewall** sollte nur Port 8080 (oder 443 mit nginx) öffnen
- **Service-User** `odoomcp` hat keine Login-Shell, eingeschränkte Rechte
- **Hardening** in der systemd-Unit: `NoNewPrivileges`, `ProtectSystem`, etc.

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `systemctl status odoo-mcp` zeigt Fehler | `journalctl -u odoo-mcp -n 50` für Details |
| Port 8080 nicht erreichbar | Hostinger-Firewall prüfen, ufw status |
| 401 Unauthorized | Bearer Token in `.mcp.json` prüfen |
| Odoo Auth fehlgeschlagen | `/etc/odoo-mcp.env` Credentials prüfen |
| Service stoppt sofort | Logs prüfen, evtl. fehlende env-Variablen |

## Update

Auf dem VPS:
```bash
cd /tmp/svg
git pull
sudo cp odoo-mcp-server/server.py odoo-mcp-server/server_http.py /opt/odoo-mcp-server/
sudo systemctl restart odoo-mcp
```
