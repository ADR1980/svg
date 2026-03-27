FROM python:3.11-slim

WORKDIR /app

# System-Dependencies für spaCy und PDF-Verarbeitung
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python-Dependencies installieren (Pfad relativ zum Repo-Root)
COPY vector-store/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# spaCy Deutsch-Modell herunterladen
RUN python -m spacy download de_core_news_sm

# Anwendungscode kopieren
COPY vector-store/ .

# Port (Railway setzt PORT automatisch)
EXPOSE 8000

# Server starten
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
