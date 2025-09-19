import os
from celery import Celery


def make_celery() -> Celery:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    app = Celery(
        "rfp_backend",
        broker=redis_url,
        backend=redis_url,
        include=["app.tasks.email_tasks"],
    )
    app.conf.task_routes = {"app.tasks.email_tasks.*": {"queue": "emails"}}
    return app


celery_app = make_celery()






