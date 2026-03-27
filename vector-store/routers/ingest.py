import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from models.document import DocumentCreate
from services.document_service import create_document

router = APIRouter(prefix="/api/v1/ingest", tags=["Batch-Import"])

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


@router.post("/risk-data")
def ingest_risk_data():
    """Importiert alle Regionen aus risk-data.json als einzelne Dokumente."""
    risk_file = PROJECT_ROOT / "risk-data.json"
    if not risk_file.exists():
        raise HTTPException(status_code=404, detail="risk-data.json nicht gefunden")

    data = json.loads(risk_file.read_text(encoding="utf-8"))
    generated_at = data.get("generated_at", "unknown")
    results = []

    for region in data.get("regions", []):
        key = region["key"]
        name = region.get("name_de", key)
        score = region.get("score", 0)
        dims = region.get("dimensions", {})

        # Volltext aus allen verfügbaren Feldern zusammensetzen
        content_parts = [
            f"Region: {name}",
            f"Risiko-Score: {score}/100 (Änderung: {region.get('change', 0):+d})",
            "",
            f"Zusammenfassung (DE): {region.get('summary_de', '')}",
            f"Summary (EN): {region.get('summary_en', '')}",
            "",
            "Dimensionen:",
        ]
        for dim_key, dim_val in dims.items():
            content_parts.append(f"  - {dim_key}: {dim_val}/20")

        # Trend-Daten anhängen falls vorhanden
        trend = region.get("trend_30d", [])
        if trend:
            content_parts.append("")
            content_parts.append(f"30-Tage-Trend: {', '.join(str(t) for t in trend)}")

        content = "\n".join(content_parts)

        # RID mit Datum und Region-Key
        date_prefix = generated_at[:10] if generated_at != "unknown" else "latest"
        rid = f"ri.svg.risk-report.{date_prefix}-{key.replace('_', '-')}"

        doc = DocumentCreate(
            doc_type="risk-report",
            title=f"Risikobericht {name} ({date_prefix})",
            content=content,
            metadata={
                "region_key": key,
                "score": score,
                "change": region.get("change", 0),
                "dimensions": dims,
                "generated_at": generated_at,
                "lat": region.get("lat"),
                "lng": region.get("lng"),
            },
            language="de",
            source="risk-data.json",
            rid=rid,
        )

        try:
            result = create_document(doc)
            results.append({"rid": result.rid, "title": result.title, "status": "created"})
        except Exception as e:
            results.append({"rid": rid, "title": doc.title, "status": f"error: {e}"})

    return {
        "imported": len([r for r in results if r["status"] == "created"]),
        "errors": len([r for r in results if r["status"] != "created"]),
        "details": results,
    }


@router.post("/production-data")
def ingest_production_data():
    """Importiert Produktionsdaten (Projekte, Kunden, Arbeitsschritte) aus data.js.

    Parst die JavaScript-Datei und extrahiert die relevanten Objekte.
    """
    data_file = PROJECT_ROOT / "production-planner" / "data.js"
    if not data_file.exists():
        raise HTTPException(status_code=404, detail="production-planner/data.js nicht gefunden")

    content = data_file.read_text(encoding="utf-8")
    results = []

    # Kunden extrahieren und speichern
    results.extend(_ingest_customers(content))
    # Projekte extrahieren und speichern
    results.extend(_ingest_projects(content))

    return {
        "imported": len([r for r in results if r["status"] == "created"]),
        "errors": len([r for r in results if r["status"] != "created"]),
        "details": results,
    }


def _ingest_customers(js_content: str) -> list[dict]:
    """Extrahiert Kunden aus data.js und erstellt Dokumente."""
    results = []

    # Einfache Extraktion der Kunden-Einträge via JSON-ähnlicher Muster
    import re

    # Suche nach Kunden-Objekten im customers-Array
    customer_pattern = re.compile(
        r"\{[^}]*?id\s*:\s*['\"](\d+)['\"][^}]*?name\s*:\s*['\"]([^'\"]+)['\"][^}]*?\}",
        re.DOTALL,
    )

    for match in customer_pattern.finditer(js_content):
        cid = match.group(1)
        name = match.group(2)

        from slugify import slugify
        locator = slugify(name, max_length=60)
        rid = f"ri.svg.customer.{locator}"

        doc = DocumentCreate(
            doc_type="customer",
            title=name,
            content=f"Kunde: {name} (ID: {cid})\n\nExtrahiert aus Produktionsplaner-Stammdaten.",
            metadata={"original_id": cid},
            source="production-planner/data.js",
            rid=rid,
        )

        try:
            result = create_document(doc)
            results.append({"rid": result.rid, "title": result.title, "status": "created"})
        except Exception as e:
            results.append({"rid": rid, "title": name, "status": f"error: {e}"})

    return results


def _ingest_projects(js_content: str) -> list[dict]:
    """Extrahiert Projekte aus data.js und erstellt Dokumente."""
    results = []
    import re
    from slugify import slugify

    # Suche nach Projekt-Objekten
    project_pattern = re.compile(
        r"\{[^}]*?id\s*:\s*(\d+)[^}]*?name\s*:\s*['\"]([^'\"]+)['\"][^}]*?\}",
        re.DOTALL,
    )

    # Nur im projects-Abschnitt suchen
    projects_start = js_content.find("projects:")
    if projects_start == -1:
        projects_start = js_content.find("projects :")
    if projects_start == -1:
        return results

    # Begrenze die Suche auf den projects-Bereich (nächstes Top-Level-Key)
    projects_section = js_content[projects_start:projects_start + 5000]

    for match in project_pattern.finditer(projects_section):
        pid = match.group(1)
        name = match.group(2)

        locator = slugify(name, max_length=60)
        rid = f"ri.svg.project.{locator}"

        doc = DocumentCreate(
            doc_type="project",
            title=name,
            content=f"Projekt: {name} (ID: {pid})\n\nExtrahiert aus Produktionsplaner-Stammdaten.",
            metadata={"original_id": pid},
            source="production-planner/data.js",
            rid=rid,
        )

        try:
            result = create_document(doc)
            results.append({"rid": result.rid, "title": result.title, "status": "created"})
        except Exception as e:
            results.append({"rid": rid, "title": name, "status": f"error: {e}"})

    return results
