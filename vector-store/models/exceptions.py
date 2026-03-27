"""Custom Exceptions für Spam- und Duplikat-Erkennung."""


class SpamRejectedError(ValueError):
    """Wird geworfen wenn ein Dokument als Spam erkannt wird."""

    def __init__(self, reason: str, score: float):
        self.reason = reason
        self.score = score
        super().__init__(f"Spam erkannt (Score: {score:.2f}): {reason}")


class DuplicateDocumentError(ValueError):
    """Wird geworfen wenn ein Dokument bereits existiert."""

    def __init__(self, dup_type: str, existing_rid: str, similarity: float | None = None):
        self.dup_type = dup_type
        self.existing_rid = existing_rid
        self.similarity = similarity

        if dup_type == "exact":
            msg = f"Exaktes Duplikat existiert bereits: {existing_rid}"
        elif dup_type == "near":
            msg = f"Sehr ähnliches Dokument existiert (Similarity: {similarity:.3f}): {existing_rid}"
        elif dup_type == "rid":
            msg = f"Dokument mit dieser RID existiert bereits: {existing_rid}"
        else:
            msg = f"Duplikat ({dup_type}): {existing_rid}"

        super().__init__(msg)
