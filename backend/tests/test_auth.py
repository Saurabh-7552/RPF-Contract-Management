import asyncio
import os
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.main import app
from app.db.session import engine, AsyncSessionLocal
from app.db.models import Base


@pytest.fixture(scope="session", autouse=True)
def set_test_db_env():
    os.environ["DATABASE_URL"] = os.getenv(
        "TEST_DATABASE_URL",
        "postgresql+asyncpg://username:password@localhost:5432/rfp_contracts_test",
    )
    yield


@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_register_and_login_flow():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register
        res = await client.post(
            "/auth/register",
            json={"email": "user@example.com", "password": "P@ssw0rd!", "role": "buyer"},
        )
        assert res.status_code == 201, res.text

        # Login
        res = await client.post(
            "/auth/login",
            json={"email": "user@example.com", "password": "P@ssw0rd!"},
        )
        assert res.status_code == 200, res.text
        body = res.json()
        assert "access_token" in body






