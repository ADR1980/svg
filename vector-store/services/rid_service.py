import re

from slugify import slugify

from config import RID_NAMESPACE
from models.rid import RID, DocType


def generate_rid(doc_type: str, title: str, suffix: str | None = None, tenant_id: str | None = None) -> str:
    """Generiert eine Palantir-inspirierte RID aus Dokumenttyp und Titel.

    Format: ri.<tenant>.<type>.<locator>
    Beispiel: ri.acme-corp.risk-report.2026-03-27-eastern-europe

    Falls kein tenant_id angegeben, wird der konfigurierte RID_NAMESPACE verwendet.
    """
    namespace = tenant_id or RID_NAMESPACE
    locator = slugify(title, max_length=80, word_boundary=True)
    if suffix:
        locator = f"{locator}-{slugify(suffix, max_length=30)}"

    rid = RID(namespace=namespace, doc_type=doc_type, locator=locator)
    return str(rid)


def validate_rid(rid_string: str) -> RID:
    """Validiert und parst einen RID-String."""
    return RID.parse(rid_string)


def validate_doc_type(doc_type: str) -> str:
    """Prüft ob ein Dokumenttyp gültig ist."""
    valid_types = {t.value for t in DocType}
    if doc_type not in valid_types:
        raise ValueError(
            f"Ungültiger Dokumenttyp: '{doc_type}'. Erlaubt: {', '.join(sorted(valid_types))}"
        )
    return doc_type
