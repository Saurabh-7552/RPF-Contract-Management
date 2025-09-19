from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import RFP, RFPStatus, Response as SupplierResponse, User, UserRole
from app.db.session import get_async_session
from app.dependencies.auth import get_current_user, require_role
from app.schemas.rfp import RFPCreate, RFPOut, RFPUpdate, ResponseCreate, PaginatedRFPs
from app.services.background_tasks import get_background_task_service
from fastapi import BackgroundTasks


router = APIRouter(prefix="/rfps", tags=["rfps"])


@router.post("", response_model=RFPOut, status_code=201, dependencies=[Depends(require_role(UserRole.buyer))])
async def create_rfp(
    payload: RFPCreate, 
    session: AsyncSession = Depends(get_async_session), 
    user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    rfp = RFP(title=payload.title, description=payload.description, owner_id=user.id)
    session.add(rfp)
    await session.commit()
    await session.refresh(rfp)
    
    # Index RFP for search
    task_service = get_background_task_service(background_tasks)
    task_service.index_rfp(rfp.id)
    
    return rfp


@router.get("", response_model=PaginatedRFPs)
async def list_rfps(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(get_current_user),
    q: Optional[str] = Query(default=None, description="Search query stub"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    stmt = select(RFP)
    count_stmt = select(func.count()).select_from(RFP)
    
    # Role-based filtering
    if current_user.role == UserRole.buyer:
        # Buyers can only see their own RFPs
        stmt = stmt.where(RFP.owner_id == current_user.id)
        count_stmt = count_stmt.where(RFP.owner_id == current_user.id)
    elif current_user.role == UserRole.supplier:
        # Suppliers can only see published RFPs
        stmt = stmt.where(RFP.status == RFPStatus.PUBLISHED)
        count_stmt = count_stmt.where(RFP.status == RFPStatus.PUBLISHED)
    
    # Simple stub for search: title ilike
    if q:
        from sqlalchemy import or_
        search_condition = RFP.title.ilike(f"%{q}%")
        stmt = stmt.where(search_condition)
        count_stmt = count_stmt.where(search_condition)

    total = (await session.execute(count_stmt)).scalar_one()
    items = (await session.execute(stmt.order_by(RFP.id.desc()).limit(limit).offset(offset))).scalars().all()
    return PaginatedRFPs(total=total, items=items)


@router.get("/{rfp_id}", response_model=RFPOut)
async def get_rfp(rfp_id: int, session: AsyncSession = Depends(get_async_session)):
    rfp = (await session.execute(select(RFP).where(RFP.id == rfp_id))).scalar_one_or_none()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    return rfp


@router.put("/{rfp_id}", response_model=RFPOut)
async def update_rfp(
    rfp_id: int,
    payload: RFPUpdate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    rfp = (await session.execute(select(RFP).where(RFP.id == rfp_id))).scalar_one_or_none()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    if rfp.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only owner can update")

    if payload.title is not None:
        rfp.title = payload.title
    if payload.description is not None:
        rfp.description = payload.description
    if payload.status is not None:
        # Allow update only among DRAFT/PUBLISHED for this endpoint
        if payload.status not in {RFPStatus.DRAFT.value, RFPStatus.PUBLISHED.value}:
            raise HTTPException(status_code=400, detail="Invalid status update")
        rfp.status = RFPStatus(payload.status)
        if rfp.status == RFPStatus.PUBLISHED:
            # Notify suppliers (simplified: send to owner for demo)
            task_service = get_background_task_service(background_tasks)
            task_service.send_email(user.email, "RFP Published", f"Your RFP '{rfp.title}' is published.")

    await session.commit()
    await session.refresh(rfp)
    
    # Re-index RFP for search after update
    task_service = get_background_task_service(background_tasks)
    task_service.index_rfp(rfp.id)
    
    return rfp


@router.post("/{rfp_id}/respond", response_model=dict, dependencies=[Depends(require_role(UserRole.supplier))])
async def respond_to_rfp(
    rfp_id: int,
    payload: ResponseCreate,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    rfp = (await session.execute(select(RFP).where(RFP.id == rfp_id))).scalar_one_or_none()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    if rfp.status not in {RFPStatus.PUBLISHED}:
        raise HTTPException(status_code=400, detail="Cannot respond unless RFP is PUBLISHED")

    resp = SupplierResponse(rfp_id=rfp.id, supplier_id=user.id, content=payload.content)
    session.add(resp)
    # Update status to RESPONSE_SUBMITTED upon first response (basic rule)
    rfp.status = RFPStatus.RESPONSE_SUBMITTED
    await session.commit()
    # Notify buyer/owner
    owner = (await session.execute(select(User).where(User.id == rfp.owner_id))).scalar_one()
    task_service = get_background_task_service(background_tasks)
    task_service.send_email(owner.email, "RFP Response Submitted", f"Your RFP '{rfp.title}' received a response.")
    return {"ok": True}


@router.patch("/{rfp_id}/status", response_model=RFPOut)
async def change_status(
    rfp_id: int,
    new_status: str,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    rfp = (await session.execute(select(RFP).where(RFP.id == rfp_id))).scalar_one_or_none()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    if rfp.owner_id != user.id and user.role != UserRole.buyer:
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        target = RFPStatus(new_status)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid status value")

    # Validate transitions
    allowed: dict[RFPStatus, set[RFPStatus]] = {
        RFPStatus.DRAFT: {RFPStatus.PUBLISHED},
        RFPStatus.PUBLISHED: {RFPStatus.RESPONSE_SUBMITTED, RFPStatus.UNDER_REVIEW},
        RFPStatus.RESPONSE_SUBMITTED: {RFPStatus.UNDER_REVIEW},
        RFPStatus.UNDER_REVIEW: {RFPStatus.APPROVED, RFPStatus.REJECTED},
        RFPStatus.APPROVED: set(),
        RFPStatus.REJECTED: set(),
    }

    if target not in allowed.get(rfp.status, set()):
        raise HTTPException(status_code=400, detail="Invalid status transition")

    rfp.status = target
    await session.commit()
    
    # Notify on status change
    if target in {RFPStatus.APPROVED, RFPStatus.REJECTED}:
        # Notify supplier(s) - simplified: notify owner
        owner = (await session.execute(select(User).where(User.id == rfp.owner_id))).scalar_one()
        subject = f"RFP {target.value}"
        body = f"Your RFP '{rfp.title}' is now {target.value}."
        task_service = get_background_task_service(background_tasks)
        task_service.send_email(owner.email, subject, body)
    
    await session.refresh(rfp)
    return rfp


@router.get("/supplier/responses")
async def get_supplier_responses(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_role(UserRole.supplier))
):
    """Get all responses submitted by the current supplier"""
    stmt = select(SupplierResponse, RFP, User).join(
        RFP, SupplierResponse.rfp_id == RFP.id
    ).join(
        User, RFP.owner_id == User.id
    ).where(
        SupplierResponse.supplier_id == current_user.id
    ).order_by(SupplierResponse.created_at.desc())
    
    results = (await session.execute(stmt)).all()
    
    responses = []
    for response, rfp, owner in results:
        responses.append({
            "id": response.id,
            "rfp_id": rfp.id,
            "rfp_title": rfp.title,
            "rfp_status": rfp.status.value,
            "owner_email": owner.email,
            "content": response.content,
            "submitted_at": response.created_at,
            "rfp_created_at": rfp.created_at
        })
    
    return {"responses": responses}


@router.get("/supplier/published")
async def get_published_rfps_with_owners(
    session: AsyncSession = Depends(get_async_session),
    current_user: User = Depends(require_role(UserRole.supplier)),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all published RFPs with owner information for suppliers"""
    stmt = select(RFP, User).join(
        User, RFP.owner_id == User.id
    ).where(
        RFP.status == RFPStatus.PUBLISHED
    ).order_by(RFP.id.desc()).limit(limit).offset(offset)
    
    count_stmt = select(func.count()).select_from(RFP).where(
        RFP.status == RFPStatus.PUBLISHED
    )
    
    total = (await session.execute(count_stmt)).scalar_one()
    results = (await session.execute(stmt)).all()
    
    rfps_with_owners = []
    for rfp, owner in results:
        rfps_with_owners.append({
            "id": rfp.id,
            "title": rfp.title,
            "description": rfp.description,
            "requirements": rfp.requirements,
            "status": rfp.status.value,
            "created_at": rfp.created_at,
            "deadline": rfp.deadline,
            "owner": {
                "id": owner.id,
                "email": owner.email
            }
        })
    
    return {
        "total": total,
        "items": rfps_with_owners,
        "limit": limit,
        "offset": offset
    }


