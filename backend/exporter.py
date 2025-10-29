import csv
from io import StringIO
from typing import Dict

def to_csv(contacts: Dict[str, dict]) -> str:
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=["county", "name", "phone", "email"])
    writer.writeheader()
    for county_id, contact in sorted(contacts.items()):
        contact = contact or {}
        writer.writerow({
            "county": county_id,
            "name": contact.get("name") or "",
            "phone": contact.get("phone") or "",
            "email": contact.get("email") or "",
        })
    return output.getvalue()
