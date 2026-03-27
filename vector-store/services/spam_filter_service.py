"""Spam-Filter Service.

Erkennt Spam in Dokumenten und E-Mails anhand von:
- Mindestlänge
- Keyword-Blocklist (DE + EN, branchenspezifisch)
- Sender-Blacklist (nur E-Mails)
- Link-Dichte
- Gibberish-Erkennung

WICHTIG: Defense/Security-Fachbegriffe wie "Waffe", "Munition", "Sprengstoff"
sind KEINE Spam-Begriffe - sie sind Fachvokabular der Branche.
"""

import re
from dataclasses import dataclass

# ─── Konfiguration ───────────────────────────────────────────────────────────

MIN_CONTENT_LENGTH = 10
MAX_LINK_DENSITY = 0.05  # Max 5 URLs pro 100 Wörter
MIN_ALPHA_RATIO = 0.4    # Mindestens 40% alphabetische Zeichen
SPAM_KEYWORD_SCORE = 0.6  # Ab diesem Score = Spam

# ─── Keyword-Blocklist (DE + EN) ────────────────────────────────────────────
# Gewichtung: 1.0 = sicher Spam, 0.3 = verdächtig
# Defense/Security-Begriffe NICHT enthalten (Branchenvokabular)

_SPAM_KEYWORDS: list[tuple[str, float]] = [
    # Pharma-Spam
    ("viagra", 0.9),
    ("cialis", 0.9),
    ("pharmacy online", 0.8),
    ("online apotheke ohne rezept", 0.8),
    ("gewichtsverlust pillen", 0.7),
    ("abnehmpillen", 0.7),
    # Finanz-Scam
    ("nigerian prince", 1.0),
    ("nigerianischer prinz", 1.0),
    ("lottery winner", 0.9),
    ("lotteriegewinn", 0.9),
    ("gewinnbenachrichtigung", 0.8),
    ("sie haben gewonnen", 0.7),
    ("you have won", 0.7),
    ("free money", 0.8),
    ("kostenloses geld", 0.8),
    ("dringend überweisen", 0.8),
    ("urgent wire transfer", 0.8),
    ("konto gesperrt dringend", 0.8),
    ("account suspended verify", 0.8),
    ("erben millionen", 0.8),
    ("inheritance million", 0.8),
    # Crypto-Scam
    ("kryptowährung verdienen garantiert", 0.8),
    ("crypto guaranteed profit", 0.8),
    ("bitcoin verdoppeln", 0.9),
    ("double your bitcoin", 0.9),
    ("nft airdrop free", 0.7),
    # Marketing-Spam
    ("act now limited time", 0.6),
    ("jetzt handeln zeitlich begrenzt", 0.6),
    ("unsubscribe click here", 0.3),
    ("abbestellen klicken sie", 0.3),
    ("gratisangebot nur heute", 0.7),
    ("free offer today only", 0.7),
    ("100% kostenlos", 0.5),
    ("100% free no risk", 0.6),
    ("click here to claim", 0.7),
    ("hier klicken um zu erhalten", 0.7),
    # Adult-Spam
    ("enlarge your", 0.9),
    ("singles in deiner nähe", 0.8),
    ("hot singles near you", 0.8),
    ("dating profile viewed", 0.7),
]

# Sender-Domain-Blacklist (Regex-Muster)
_SENDER_BLACKLIST_PATTERNS: list[str] = [
    r"@.*\.ru$",             # Russische Domains (häufig Spam-Quelle)
    r"@.*\.cn$",             # Chinesische Domains
    r"no-?reply@",           # No-Reply Adressen (kein sinnvoller Inhalt)
    r"@.*spam",
    r"@.*bulk",
    r"@.*promo\.",
    r"@.*marketing\.",
]

# URL-Pattern
_URL_PATTERN = re.compile(r"https?://[^\s<>\"']+|www\.[^\s<>\"']+", re.IGNORECASE)


@dataclass
class SpamCheckResult:
    """Ergebnis der Spam-Prüfung."""
    is_spam: bool
    reason: str | None
    score: float  # 0.0 = sauber, 1.0 = sicher Spam


def check_spam(content: str, title: str, metadata: dict, doc_type: str) -> SpamCheckResult:
    """Prüft ob ein Dokument Spam ist.

    Args:
        content: Dokumentinhalt
        title: Dokumenttitel
        metadata: Dokument-Metadaten (bei E-Mails: sender, recipients, etc.)
        doc_type: Dokumenttyp

    Returns:
        SpamCheckResult mit Bewertung
    """
    combined_text = f"{title}\n{content}".lower()
    scores: list[tuple[str, float]] = []

    # 1. Mindestlänge
    if len(content.strip()) < MIN_CONTENT_LENGTH:
        return SpamCheckResult(is_spam=True, reason="content-too-short", score=1.0)

    # 2. Sender-Blacklist (nur E-Mails)
    if doc_type == "email":
        sender = metadata.get("sender", "").lower()
        for pattern in _SENDER_BLACKLIST_PATTERNS:
            if re.search(pattern, sender):
                scores.append((f"sender-blacklist:{pattern}", 0.7))
                break

    # 3. Keyword-Check
    for keyword, weight in _SPAM_KEYWORDS:
        if keyword in combined_text:
            scores.append((f"keyword:{keyword}", weight))

    # 4. Link-Dichte
    urls = _URL_PATTERN.findall(combined_text)
    word_count = max(len(combined_text.split()), 1)
    link_density = len(urls) / word_count
    if link_density > MAX_LINK_DENSITY:
        scores.append((f"link-density:{link_density:.3f}", min(link_density * 10, 1.0)))

    # 5. Gibberish-Check (zu wenig lesbare Zeichen)
    alpha_chars = sum(1 for c in content if c.isalpha())
    total_non_space = max(sum(1 for c in content if not c.isspace()), 1)
    alpha_ratio = alpha_chars / total_non_space
    if alpha_ratio < MIN_ALPHA_RATIO:
        scores.append((f"gibberish:{alpha_ratio:.2f}", 0.8))

    # Gesamtscore berechnen (höchster Einzelscore zählt)
    if not scores:
        return SpamCheckResult(is_spam=False, reason=None, score=0.0)

    max_reason, max_score = max(scores, key=lambda x: x[1])

    # Mehrere Treffer erhöhen den Score
    if len(scores) > 1:
        combined_score = min(max_score + 0.1 * (len(scores) - 1), 1.0)
    else:
        combined_score = max_score

    return SpamCheckResult(
        is_spam=combined_score >= SPAM_KEYWORD_SCORE,
        reason=max_reason if combined_score >= SPAM_KEYWORD_SCORE else None,
        score=round(combined_score, 3),
    )
