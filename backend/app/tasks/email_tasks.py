from celery import shared_task
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.services.email import get_email_service


@shared_task(name="app.tasks.email_tasks.send_email")
def send_email_task(to_email: str, subject: str, html_content: str) -> None:  # pragma: no cover - IO
    svc = get_email_service()
    svc.send(to_email=to_email, subject=subject, html_content=html_content)


@shared_task(name="app.tasks.email_tasks.index_rfp")
def index_rfp_task(rfp_id: int) -> None:  # pragma: no cover - IO
    """Update search_vector for an RFP after creation/update"""
    engine = create_async_engine(settings.DATABASE_URL)
    
    async def _index():
        async with engine.begin() as conn:
            await conn.execute(text("""
                UPDATE rfps 
                SET search_vector = to_tsvector('english', 
                    COALESCE(title, '') || ' ' || 
                    COALESCE(description, '') || ' ' || 
                    COALESCE(requirements, '')
                )
                WHERE id = :rfp_id
            """), {"rfp_id": rfp_id})
    
    import asyncio
    asyncio.run(_index())
    engine.sync_close()


