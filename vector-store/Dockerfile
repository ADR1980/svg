FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# PyTorch CPU-only (viel kleiner als mit CUDA)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Python-Dependencies
COPY vector-store/requirements.txt .
RUN pip install --no-cache-dir --no-deps sentence-transformers && \
    pip install --no-cache-dir -r requirements.txt

# spaCy + Embedding Modell vorinstallieren
RUN python -m spacy download de_core_news_sm
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Anwendungscode
COPY vector-store/ .

EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
