"""Authentifizierungs-Service.

JWT-Token-Generierung und Password-Hashing.
"""

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── Password ────────────────────────────────────────────────────────────────


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# ─── API Keys ────────────────────────────────────────────────────────────────


def generate_api_key() -> str:
    """Generiert einen neuen API-Key im Format sk_live_<random>."""
    return f"sk_live_{secrets.token_urlsafe(32)}"


def hash_api_key(api_key: str) -> str:
    """SHA-256 Hash eines API-Keys für DB-Speicherung."""
    return hashlib.sha256(api_key.encode()).hexdigest()


# ─── JWT ─────────────────────────────────────────────────────────────────────


def create_jwt(tenant_id: str, user_id: int, email: str, role: str) -> tuple[str, int]:
    """Erstellt ein JWT Token.

    Returns:
        Tuple von (token_string, expires_in_seconds)
    """
    expires_in = int(JWT_EXPIRATION_HOURS * 3600)
    payload = {
        "sub": str(user_id),
        "email": email,
        "tenant_id": tenant_id,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, expires_in


def decode_jwt(token: str) -> dict:
    """Dekodiert und validiert ein JWT Token.

    Raises:
        jwt.ExpiredSignatureError: Token abgelaufen
        jwt.InvalidTokenError: Token ungültig
    """
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
