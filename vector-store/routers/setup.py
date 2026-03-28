"""Setup-Endpunkt für initiale Datenbank-Einrichtung via REST API.

Erstellt Tabellen, Default-Tenant und Admin-User über die Supabase REST API.
Wird einmalig aufgerufen: POST /setup?secret=<SETUP_SECRET>
"""

import hashlib
import os
import secrets

from fastapi import APIRouter, HTTPException, Query

from config import SUPABASE_URL, SUPABASE_ANON_KEY

router = APIRouter(tags=["Setup"])

SETUP_SECRET = os.getenv("SETUP_SECRET", "svg-initial-setup-2026")


@router.get("/setup/debug")
def debug_connection():
    """Prüft die Verbindung zur Supabase-Datenbank."""
    import socket
    results = {}

    # 1. DNS-Auflösung testen
    host = SUPABASE_URL.replace("https://", "").replace("http://", "").rstrip("/")
    results["supabase_host"] = host
    try:
        ip = socket.getaddrinfo(host, 443)
        results["dns"] = f"OK: {ip[0][4]}"
    except Exception as e:
        results["dns"] = f"FAILED: {e}"

    # 2. Supabase-Client testen
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        # Einfachster Test: app_data Tabelle (existiert von der alten Migration)
        r = client.table("app_data").select("key").limit(1).execute()
        results["supabase_rest"] = f"OK (app_data: {len(r.data)} rows)"
    except Exception as e:
        results["supabase_rest"] = f"FAILED: {e}"

    # 3. Tenants-Tabelle testen
    try:
        r = client.table("tenants").select("id").limit(1).execute()
        results["tenants_table"] = f"OK ({len(r.data)} rows)"
    except Exception as e:
        results["tenants_table"] = f"FAILED: {e}"

    return results


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


@router.post("/setup")
def run_setup(secret: str = Query(..., description="Setup-Secret zur Absicherung")):
    """Einmalige Datenbank-Einrichtung: Tabellen, Tenant, Admin-User."""
    if secret != SETUP_SECRET:
        raise HTTPException(status_code=403, detail="Ungültiges Setup-Secret")

    from supabase import create_client
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    results = []

    # ── 1. Tabellen prüfen ──────────────────────────────────────────────
    tables_ok = True
    for table in ["tenants", "users", "documents"]:
        try:
            client.table(table).select("*").limit(1).execute()
            results.append({"step": f"check_{table}", "status": "exists"})
        except Exception as e:
            err = str(e)
            results.append({"step": f"check_{table}", "status": "not_found", "error": err[:200]})
            tables_ok = False

    if not tables_ok:
        # Prüfe ob es ein Schema-Cache-Problem ist (Tabelle existiert aber PostgREST kennt sie nicht)
        # Supabase braucht manchmal einen Reload: Dashboard > Settings > API > Reload schema
        return {
            "success": False,
            "message": "Einige Tabellen fehlen oder sind nicht via REST API sichtbar. "
                       "Falls die Migrationen bereits ausgeführt wurden: "
                       "Supabase Dashboard > Project Settings > API > 'Reload Schema' klicken, "
                       "dann /setup erneut aufrufen.",
            "migration_urls": {
                "001": "https://github.com/ADR1980/svg/blob/claude/vector-db-document-storage-SwEiT/vector-store/migrations/001_pgvector_setup.sql",
                "002": "https://github.com/ADR1980/svg/blob/claude/vector-db-document-storage-SwEiT/vector-store/migrations/002_content_hash.sql",
                "003": "https://github.com/ADR1980/svg/blob/claude/vector-db-document-storage-SwEiT/vector-store/migrations/003_multi_tenancy.sql",
            },
            "details": results,
        }

    # ── 2. KOA Tenant anlegen ────────────────────────────────────────────
    api_key = f"sk_live_koa_{secrets.token_hex(16)}"
    try:
        existing = client.table("tenants").select("id").eq("id", "koa").execute()
        if existing.data:
            # Tenant existiert, API-Key aktualisieren
            client.table("tenants").update({"api_key_hash": _hash(api_key)}).eq("id", "koa").execute()
            results.append({"step": "koa_tenant", "status": "updated"})
        else:
            client.table("tenants").insert({
                "id": "koa",
                "name": "KOA",
                "api_key_hash": _hash(api_key),
            }).execute()
            results.append({"step": "koa_tenant", "status": "created"})
    except Exception as e:
        results.append({"step": "koa_tenant", "status": f"error: {e}"})
        api_key = None

    # ── 3. SVG Default-Tenant anlegen ────────────────────────────────────
    try:
        existing = client.table("tenants").select("id").eq("id", "svg").execute()
        if not existing.data:
            client.table("tenants").insert({"id": "svg", "name": "SVG Global"}).execute()
            results.append({"step": "svg_tenant", "status": "created"})
        else:
            results.append({"step": "svg_tenant", "status": "exists"})
    except Exception as e:
        results.append({"step": "svg_tenant", "status": f"error: {e}"})

    # ── 4. Admin-User anlegen ────────────────────────────────────────────
    admin_password = "Koa2026!"
    try:
        import bcrypt as _bcrypt
        pw_hash = _bcrypt.hashpw(admin_password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")

        existing = client.table("users").select("id").eq("email", "andreas@del.re").execute()
        if existing.data:
            client.table("users").update({"password_hash": pw_hash}).eq("email", "andreas@del.re").execute()
            results.append({"step": "admin_user", "status": "password_updated"})
        else:
            client.table("users").insert({
                "email": "andreas@del.re",
                "password_hash": pw_hash,
                "tenant_id": "koa",
                "role": "admin",
                "name": "Andreas",
            }).execute()
            results.append({"step": "admin_user", "status": "created"})
    except Exception as e:
        results.append({"step": "admin_user", "status": f"error: {e}"})
        admin_password = None

    return {
        "success": all("error" not in r.get("status", "") for r in results),
        "credentials": {
            "api_key": api_key,
            "admin_email": "andreas@del.re",
            "admin_password": admin_password,
            "tenant_id": "koa",
            "ui_url": "/ui/",
        },
        "details": results,
        "warning": "Bitte diese Zugangsdaten sicher aufbewahren! Sie werden nur einmal angezeigt.",
    }
