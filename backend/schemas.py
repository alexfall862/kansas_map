from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

class Contact(BaseModel):
    name: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)
    email: Optional[EmailStr] = Field(default=None)

class County(BaseModel):
    id: str  # e.g., "Riley"
    contact: Optional[Contact] = None

class CountiesResponse(BaseModel):
    counties: List[County]

class ImportResult(BaseModel):
    imported: int
    skipped: int
