import json
from pathlib import Path
from typing import Dict, Optional

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "contacts.json"

# Initialize with empty dict if missing
if not DB_PATH.exists():
    DB_PATH.write_text(json.dumps({}, indent=2))

# In-memory cache (simple)
_cache: Optional[Dict[str, dict]] = None

def load_contacts() -> Dict[str, dict]:
    global _cache
    if _cache is None:
        try:
            _cache = json.loads(DB_PATH.read_text())
        except Exception:
            _cache = {}
    return _cache

def save_contacts(data: Dict[str, dict]) -> None:
    global _cache
    _cache = data
    DB_PATH.write_text(json.dumps(data, indent=2))
