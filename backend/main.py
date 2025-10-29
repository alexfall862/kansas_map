from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List
import io

from schemas import County, CountiesResponse, Contact, ImportResult
from storage import load_contacts, save_contacts
from importer import import_csv
from exporter import to_csv

app = FastAPI(title="KS Counties Contact API")

# CORS (allow Vite dev + Railway public frontends)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod if desired
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hard-coded canonical list (no "County")
CANONICAL = [
    "Johnson","Sedgwick","Wyandotte","Shawnee","Douglas","Leavenworth","Riley","Reno",
    "Butler","Crawford","Saline","Harvey","Lyon","Miami","Finney","Cowley","Geary","Ford",
    "Ellis","Montgomery","Franklin","McPherson","Cherokee","Jefferson","Labette","Pottawatomie",
    "Sumner","Seward","Atchison","Barton","Osage","Neosho","Jackson","Bourbon","Dickinson",
    "Allen","Marshall","Marion","Nemaha","Brown","Linn","Anderson","Coffey","Wabaunsee","Pratt",
    "Rice","Cloud","Kingman","Ellsworth","Clay","Doniphan","Morris","Wilson","Russell","Thomas",
    "Greenwood","Pawnee","Grant","Harper","Mitchell","Gray","Ottawa","Republic","Sherman","Meade",
    "Rooks","Barber","Trego","Norton","Osborne","Washington","Stafford","Smith","Chase","Kearny",
    "Phillips","Stevens","Edwards","Scott","Rush","Morton","Lincoln","Haskell","Woodson","Chautauqua",
    "Decatur","Clark","Ness","Gove","Cheyenne","Elk","Graham","Jewell","Rawlins","Sheridan",
    "Hamilton","Logan","Stanton","Hodgeman","Kiowa","Comanche","Wichita","Lane","Wallace","Greeley"
]

@app.get("/api/counties", response_model=CountiesResponse)
def get_counties():
    db = load_contacts()
    counties: List[County] = []
    for cid in CANONICAL:
        entry = db.get(cid)
        if entry:
            counties.append(County(id=cid, contact=Contact(**entry)))
        else:
            counties.append(County(id=cid, contact=None))
    return CountiesResponse(counties=counties)

@app.put("/api/counties/{county_id}", response_model=County)
def put_county(county_id: str, payload: Contact):
    if county_id not in CANONICAL:
        raise HTTPException(status_code=404, detail="Unknown county")
    db = load_contacts()
    if payload.name or payload.phone or payload.email:
        db[county_id] = payload.model_dump(exclude_none=True)
    else:
        db.pop(county_id, None)
    save_contacts(db)
    return County(id=county_id, contact=payload)

@app.post("/api/import", response_model=ImportResult)
async def import_contacts(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file")
    content = (await file.read()).decode("utf-8", errors="ignore")
    try:
        imported, skipped, updates = import_csv(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    db = load_contacts()
    db.update(updates)
    save_contacts(db)
    return ImportResult(imported=imported, skipped=skipped)

@app.get("/api/export")
def export_contacts():
    csv_data = to_csv(load_contacts())
    buf = io.BytesIO(csv_data.encode("utf-8"))
    return StreamingResponse(buf, media_type="text/csv", headers={
        "Content-Disposition": "attachment; filename=contacts.csv"
    })
