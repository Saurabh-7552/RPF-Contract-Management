from __future__ import annotations

from typing import Optional, List
from pydantic import BaseModel, Field


class RFPCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None


class RFPUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None


class RFPOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    owner_id: int

    class Config:
        from_attributes = True


class ResponseCreate(BaseModel):
    content: Optional[str] = None


class PaginatedRFPs(BaseModel):
    total: int
    items: List[RFPOut]






