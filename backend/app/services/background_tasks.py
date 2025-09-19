import os
from typing import Callable, Any
from fastapi import BackgroundTasks

from app.tasks.email_tasks import send_email_task, index_rfp_task


class BackgroundTaskService:
    """Service to handle background tasks with Celery fallback to FastAPI BackgroundTasks"""
    
    def __init__(self, background_tasks: BackgroundTasks = None):
        self.background_tasks = background_tasks
        self.use_celery = bool(os.getenv("REDIS_URL"))
    
    def send_email(self, to_email: str, subject: str, html_content: str) -> None:
        """Send email via Celery or FastAPI BackgroundTasks"""
        if self.use_celery:
            try:
                send_email_task.delay(to_email, subject, html_content)
            except Exception:
                # Fallback to inline if Celery fails
                from app.services.email import get_email_service
                get_email_service().send(to_email=to_email, subject=subject, html_content=html_content)
        else:
            # Use FastAPI BackgroundTasks for dev
            if self.background_tasks:
                self.background_tasks.add_task(self._send_email_sync, to_email, subject, html_content)
            else:
                # Direct call if no background_tasks available
                self._send_email_sync(to_email, subject, html_content)
    
    def index_rfp(self, rfp_id: int) -> None:
        """Index RFP for search via Celery or FastAPI BackgroundTasks"""
        if self.use_celery:
            try:
                index_rfp_task.delay(rfp_id)
            except Exception:
                # Fallback to inline if Celery fails
                self._index_rfp_sync(rfp_id)
        else:
            # Use FastAPI BackgroundTasks for dev
            if self.background_tasks:
                self.background_tasks.add_task(self._index_rfp_sync, rfp_id)
            else:
                # Direct call if no background_tasks available
                self._index_rfp_sync(rfp_id)
    
    def _send_email_sync(self, to_email: str, subject: str, html_content: str) -> None:
        """Synchronous email sending"""
        from app.services.email import get_email_service
        get_email_service().send(to_email=to_email, subject=subject, html_content=html_content)
    
    def _index_rfp_sync(self, rfp_id: int) -> None:
        """Synchronous RFP indexing"""
        from sqlalchemy import text
        from sqlalchemy.ext.asyncio import create_async_engine
        from app.core.config import settings
        
        engine = create_async_engine(settings.database_url)
        
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


def get_background_task_service(background_tasks: BackgroundTasks = None) -> BackgroundTaskService:
    """Get background task service instance"""
    return BackgroundTaskService(background_tasks)




