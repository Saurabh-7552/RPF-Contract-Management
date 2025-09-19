from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import RFPDocument, RFPDocumentVersion, User
from app.db.session import get_async_session
from app.dependencies.auth import get_current_user
from app.services.storage import StorageService


router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/{document_id}/versions")
async def list_versions(document_id: int, session: AsyncSession = Depends(get_async_session), user: User = Depends(get_current_user)):
    doc = (await session.execute(select(RFPDocument).where(RFPDocument.id == document_id))).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    items = (
        await session.execute(
            select(RFPDocumentVersion).where(RFPDocumentVersion.rfp_document_id == document_id).order_by(RFPDocumentVersion.version_number.desc())
        )
    ).scalars().all()
    return {"items": [{"id": v.id, "version_number": v.version_number, "s3_key": v.s3_key, "notes": v.notes} for v in items]}


@router.post("/{document_id}/versions")
async def upload_new_version(document_id: int, key: str, notes: str | None = None, session: AsyncSession = Depends(get_async_session), user: User = Depends(get_current_user)):
    doc = (await session.execute(select(RFPDocument).where(RFPDocument.id == document_id))).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    latest = (
        await session.execute(
            select(func.max(RFPDocumentVersion.version_number)).where(RFPDocumentVersion.rfp_document_id == document_id)
        )
    ).scalar()
    next_version = (latest or 0) + 1
    ver = RFPDocumentVersion(rfp_document_id=document_id, version_number=next_version, s3_key=key, uploaded_by=user.id, notes=notes)
    session.add(ver)
    await session.commit()
    await session.refresh(ver)
    return {"id": ver.id, "version_number": ver.version_number}


@router.post("/{document_id}/versions/{version_number}/revert")
async def revert_version(document_id: int, version_number: int, session: AsyncSession = Depends(get_async_session), user: User = Depends(get_current_user)):
    target = (
        await session.execute(
            select(RFPDocumentVersion).where(
                RFPDocumentVersion.rfp_document_id == document_id,
                RFPDocumentVersion.version_number == version_number,
            )
        )
    ).scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Version not found")
    latest = (
        await session.execute(
            select(func.max(RFPDocumentVersion.version_number)).where(RFPDocumentVersion.rfp_document_id == document_id)
        )
    ).scalar() or 0
    new_ver = RFPDocumentVersion(
        rfp_document_id=document_id,
        version_number=latest + 1,
        s3_key=target.s3_key,
        uploaded_by=user.id,
        notes=f"Reverted to {version_number}",
    )
    session.add(new_ver)
    await session.commit()
    return {"id": new_ver.id, "version_number": new_ver.version_number}


@router.get("/{document_id}/versions/{version_number}/preview")
async def preview(document_id: int, version_number: int, session: AsyncSession = Depends(get_async_session), user: User = Depends(get_current_user)):
    ver = (
        await session.execute(
            select(RFPDocumentVersion).where(
                RFPDocumentVersion.rfp_document_id == document_id,
                RFPDocumentVersion.version_number == version_number,
            )
        )
    ).scalar_one_or_none()
    if not ver:
        raise HTTPException(status_code=404, detail="Version not found")
    storage = StorageService()
    if storage.enabled_s3:
        presigned = storage.presign_put(key=ver.s3_key, content_type="application/octet-stream")
        # For preview, a GET presign would be ideal. Using PUT URL here as placeholder if permissions allow.
        return {"url": presigned["url"], "key": ver.s3_key}
    else:
        # Local: stream file
        from fastapi.responses import FileResponse
        path = storage.presign_put(key=ver.s3_key, content_type="application/octet-stream")["path"]
        return FileResponse(path)






