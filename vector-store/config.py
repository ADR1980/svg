import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL", "")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
EMBEDDING_DIMENSIONS = 384

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

RID_NAMESPACE = "svg"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# KI-Analyse (RAG)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "claude-sonnet-4-6")
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "2000"))

# Email-Ingestion (IMAP)
IMAP_HOST = os.getenv("IMAP_HOST", "")
IMAP_PORT = int(os.getenv("IMAP_PORT", "993"))
IMAP_EMAIL = os.getenv("IMAP_EMAIL", "")
IMAP_PASSWORD = os.getenv("IMAP_PASSWORD", "")
IMAP_MAILBOX = os.getenv("IMAP_MAILBOX", "INBOX")
IMAP_USE_SSL = os.getenv("IMAP_USE_SSL", "true").lower() == "true"
EMAIL_POLL_INTERVAL_SECONDS = int(os.getenv("EMAIL_POLL_INTERVAL_SECONDS", "300"))
EMAIL_DEFAULT_LANGUAGE = os.getenv("EMAIL_DEFAULT_LANGUAGE", "de")
