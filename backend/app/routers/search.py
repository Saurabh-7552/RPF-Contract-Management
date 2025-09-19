from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text, select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.db.models import RFP, User
from app.dependencies.auth import get_current_user
from app.schemas.rfp import PaginatedRFPs


router = APIRouter(prefix="/search", tags=["search"])


@router.get("/rfps", response_model=PaginatedRFPs)
async def search_rfps(
    q: str = Query(..., min_length=1), 
    page: int = Query(1, ge=1), 
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by RFP status"),
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * limit
    
    # Build search query with ILIKE for better compatibility
    search_conditions = or_(
        RFP.title.ilike(f"%{q}%"),
        RFP.description.ilike(f"%{q}%")
    )
    
    # Base query
    stmt = select(RFP).where(search_conditions)
    count_stmt = select(func.count()).select_from(RFP).where(search_conditions)
    
    # Role-based filtering
    if current_user.role.value == "buyer":
        # Buyers can only see their own RFPs
        stmt = stmt.where(RFP.owner_id == current_user.id)
        count_stmt = count_stmt.where(RFP.owner_id == current_user.id)
    elif current_user.role.value == "supplier":
        # Suppliers can see all published RFPs (no additional filtering by default)
        stmt = stmt.where(RFP.status == "PUBLISHED")
        count_stmt = count_stmt.where(RFP.status == "PUBLISHED")
    
    # Apply status filter if provided
    if status:
        stmt = stmt.where(RFP.status == status)
        count_stmt = count_stmt.where(RFP.status == status)
    
    # Get total count
    total = (await session.execute(count_stmt)).scalar_one()
    
    # Get paginated results with owner information
    items = (await session.execute(
        stmt.options(selectinload(RFP.owner)).order_by(RFP.id.desc()).limit(limit).offset(offset)
    )).scalars().all()
    
    return PaginatedRFPs(total=total, items=items, page=page, limit=limit)






