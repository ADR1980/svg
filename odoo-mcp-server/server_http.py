"""
Odoo MCP Server (HTTP-Variante) — läuft als Daemon auf einem Server.

Anders als server.py (stdio-basiert für lokale Nutzung) startet diese Variante
einen HTTP-Server, zu dem sich Claude Code remote verbinden kann.
Authentifizierung erfolgt über einen Bearer-Token im Authorization-Header.

Umgebungsvariablen:
- ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY: Odoo-Zugangsdaten
- MCP_AUTH_TOKEN: Geheimer Token für die Authentifizierung
- MCP_HOST: Bind-Host (Standard: 0.0.0.0)
- MCP_PORT: Bind-Port (Standard: 8080)
"""

import os
import sys

import uvicorn
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.routing import Mount

# Reuse die Tools aus server.py
sys.path.insert(0, os.path.dirname(__file__))
from server import mcp  # noqa: E402

MCP_AUTH_TOKEN = os.environ.get("MCP_AUTH_TOKEN", "")
MCP_HOST = os.environ.get("MCP_HOST", "0.0.0.0")
MCP_PORT = int(os.environ.get("MCP_PORT", "8080"))


class BearerAuthMiddleware(BaseHTTPMiddleware):
    """Validiert den Authorization-Header gegen den konfigurierten Token."""

    def __init__(self, app, token: str):
        super().__init__(app)
        self.token = token

    async def dispatch(self, request, call_next):
        # Health-Check unauthentifiziert erlauben
        if request.url.path == "/health":
            return JSONResponse({"status": "ok"})

        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                {"error": "Missing or invalid Authorization header"},
                status_code=401,
            )
        token = auth_header[len("Bearer ") :].strip()
        if token != self.token:
            return JSONResponse({"error": "Invalid token"}, status_code=401)

        return await call_next(request)


def main() -> None:
    if not MCP_AUTH_TOKEN:
        print(
            "FEHLER: Umgebungsvariable MCP_AUTH_TOKEN ist nicht gesetzt.",
            file=sys.stderr,
        )
        sys.exit(1)

    # FastMCP liefert die Streamable-HTTP Starlette-App
    mcp_app = mcp.streamable_http_app()

    # Mit Bearer-Auth Middleware umschließen
    app = Starlette(
        debug=False,
        routes=[Mount("/", app=mcp_app)],
        middleware=[Middleware(BearerAuthMiddleware, token=MCP_AUTH_TOKEN)],
        lifespan=mcp_app.router.lifespan_context,
    )

    print(f"Starte Odoo MCP HTTP Server auf {MCP_HOST}:{MCP_PORT}")
    uvicorn.run(app, host=MCP_HOST, port=MCP_PORT, log_level="info")


if __name__ == "__main__":
    main()
