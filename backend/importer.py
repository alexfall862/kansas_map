import csv
from io import StringIO
from typing import Tuple, Dict

REQUIRED_HEADERS = {"county", "name", "phone", "email"}

def import_csv(content: str) -> Tuple[int, int, Dict[str, dict]]:
    """Return (imported, skipped, updates) where updates is a dict keyed by county id."""
    f = StringIO(content)
    reader = csv.DictReader(f)
    if not REQUIRED_HEADERS.issubset({h.strip() for h in (reader.fieldnames or [])}):
        raise ValueError("CSV must include headers: county,name,phone,email")

    updates: Dict[str, dict] = {}
    imported = skipped = 0

    for row in reader:
        county = (row.get("county") or "").strip()
        name = (row.get("name") or "").strip() or None
        phone = (row.get("phone") or "").strip() or None
        email = (row.get("email") or "").strip() or None

        if not county:
            skipped += 1
            continue

        updates[county] = {"name": name, "phone": phone, "email": email}
        imported += 1

    return imported, skipped, updates
