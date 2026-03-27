import re
from enum import Enum

from pydantic import BaseModel, field_validator


class DocType(str, Enum):
    RISK_REPORT = "risk-report"
    PROJECT = "project"
    CUSTOMER = "customer"
    WORK_STEP = "work-step"
    PRODUCT = "product"
    ORDER = "order"
    EMPLOYEE = "employee"
    MACHINE = "machine"
    INTELLIGENCE = "intelligence"


RID_PATTERN = re.compile(r"^ri\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z0-9][a-z0-9-]*$")


class RID(BaseModel):
    """Palantir-inspirierter Resource Identifier: ri.<namespace>.<type>.<locator>"""

    namespace: str
    doc_type: str
    locator: str

    @field_validator("namespace", "doc_type", "locator")
    @classmethod
    def validate_segment(cls, v: str) -> str:
        if not re.match(r"^[a-z][a-z0-9-]*$", v):
            raise ValueError(
                f"RID-Segment muss lowercase alphanumerisch sein (mit Bindestrichen): '{v}'"
            )
        return v

    def __str__(self) -> str:
        return f"ri.{self.namespace}.{self.doc_type}.{self.locator}"

    @classmethod
    def parse(cls, rid_string: str) -> "RID":
        if not RID_PATTERN.match(rid_string):
            raise ValueError(f"Ungültiges RID-Format: '{rid_string}'")
        parts = rid_string.split(".")
        return cls(namespace=parts[1], doc_type=parts[2], locator=parts[3])
