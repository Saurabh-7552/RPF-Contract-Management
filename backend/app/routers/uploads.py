from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import RFP, RFPDocument, RFPDocumentVersion
from app.db.session import get_async_session
from app.dependencies.auth import get_current_user
from app.services.storage import StorageService


router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign")
async def presign(key: str, content_type: str, user=Depends(get_current_user)):
    storage = StorageService()
    return storage.presign_put(key=key, content_type=content_type)


@router.post("/complete")
async def complete(
    rfp_id: int,
    key: str,
    filename: str,
    session: AsyncSession = Depends(get_async_session),
    user=Depends(get_current_user),
):
    rfp = (await session.execute(select(RFP).where(RFP.id == rfp_id))).scalar_one_or_none()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    # Create document and first version
    doc = RFPDocument(rfp_id=rfp.id, filename=filename, storage_path=key)
    session.add(doc)
    await session.flush()
    ver = RFPDocumentVersion(document_id=doc.id, version=1, storage_path=key)
    session.add(ver)
    await session.commit()
    return {"ok": True, "document_id": doc.id, "version_id": ver.id}


@router.post("/local/put")
async def local_put(key: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    storage = StorageService()
    if storage.enabled_s3:
        raise HTTPException(status_code=400, detail="S3 is enabled; use presigned upload")
    target_path = storage.presign_put(key=key, content_type=file.content_type)["path"]
    with open(target_path, "wb") as f:
        f.write(await file.read())
    return {"ok": True, "path": target_path}

# Frontend example flow (pseudo-code):
# 1) const { url, key, provider } = await POST /uploads/presign { key, content_type }
# 2) if provider==='s3': PUT file to url with Content-Type header
#    else: POST file as multipart to /uploads/local/put?key=<key>
# 3) POST /uploads/complete { rfp_id, key, filename }






