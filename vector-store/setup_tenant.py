"""Erstellt den initialen Tenant, Admin-User und API-Key.

Ausführen: python setup_tenant.py
Voraussetzung: .env konfiguriert, Migrationen ausgeführt.
"""

import secrets
from dotenv import load_dotenv

load_dotenv()

from services.auth_service import hash_api_key, hash_password, generate_api_key
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_ANON_KEY

TENANT_ID = "koa"
TENANT_NAME = "KOA"
ADMIN_EMAIL = "andreas@del.re"
ADMIN_PASSWORD = secrets.token_urlsafe(16)


def main():
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

    # 1. Tenant anlegen
    print(f"\n{'='*60}")
    print(f"  SVG Vector Store - Tenant Setup")
    print(f"{'='*60}\n")

    api_key = generate_api_key()
    tenant_data = {
        "id": TENANT_ID,
        "name": TENANT_NAME,
        "api_key_hash": hash_api_key(api_key),
        "parent_tenant_id": None,
    }

    try:
        client.table("tenants").insert(tenant_data).execute()
        print(f"  Tenant erstellt: {TENANT_NAME} (ID: {TENANT_ID})")
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            print(f"  Tenant '{TENANT_ID}' existiert bereits - API-Key wird aktualisiert")
            client.table("tenants").update({"api_key_hash": hash_api_key(api_key)}).eq("id", TENANT_ID).execute()
        else:
            raise

    # 2. Admin-User anlegen
    user_data = {
        "email": ADMIN_EMAIL,
        "password_hash": hash_password(ADMIN_PASSWORD),
        "tenant_id": TENANT_ID,
        "role": "admin",
        "name": "Admin",
    }

    try:
        client.table("users").insert(user_data).execute()
        print(f"  Admin-User erstellt: {ADMIN_EMAIL}")
    except Exception as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            print(f"  User '{ADMIN_EMAIL}' existiert bereits - Passwort wird aktualisiert")
            client.table("users").update({"password_hash": hash_password(ADMIN_PASSWORD)}).eq("email", ADMIN_EMAIL).execute()
        else:
            raise

    # 3. Zugangsdaten ausgeben
    print(f"\n{'='*60}")
    print(f"  ZUGANGSDATEN (bitte sicher aufbewahren!)")
    print(f"{'='*60}\n")
    print(f"  Tenant-ID:    {TENANT_ID}")
    print(f"  Tenant-Name:  {TENANT_NAME}")
    print(f"")
    print(f"  API-Key:      {api_key}")
    print(f"  (Für Agents, Email-Polling, Backend-Zugriff)")
    print(f"")
    print(f"  UI-Login:")
    print(f"    Email:      {ADMIN_EMAIL}")
    print(f"    Passwort:   {ADMIN_PASSWORD}")
    print(f"")
    print(f"  RID-Format:   ri.{TENANT_ID}.<type>.<locator>")
    print(f"  Beispiel:     ri.{TENANT_ID}.risk-report.2026-eastern-europe")
    print(f"\n{'='*60}")
    print(f"  Server starten: uvicorn main:app --reload")
    print(f"  UI aufrufen:    http://localhost:8000/ui/")
    print(f"  API-Docs:       http://localhost:8000/docs")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
