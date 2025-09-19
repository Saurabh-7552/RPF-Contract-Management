from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session


router = APIRouter(prefix="/rfps", tags=["search"])


@router.get("/search")
async def search_rfps(q: str = Query(..., min_length=1), limit: int = 10, offset: int = 0, session: AsyncSession = Depends(get_async_session)):
    # Using plainto_tsquery for simplicity; parameterized to avoid injection
    stmt = text(
        """
        SELECT id, title, description, status, owner_id
        FROM rfps
        WHERE search_vector @@ plainto_tsquery('english', :q)
        ORDER BY id DESC
        LIMIT :limit OFFSET :offset
        """
    )
    rows = (await session.execute(stmt, {"q": q, "limit": limit, "offset": offset})).mappings().all()
    return {"items": rows}






