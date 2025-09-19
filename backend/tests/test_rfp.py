import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_rfp_lifecycle_basic(monkeypatch):
    # This is a high-level test stub; full DB fixtures would be added normally
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register buyer and supplier
        await client.post("/auth/register", json={"email": "buyer@example.com", "password": "P@ssw0rd!", "role": "buyer"})
        await client.post("/auth/register", json={"email": "supplier@example.com", "password": "P@ssw0rd!", "role": "supplier"})

        # Login buyer
        buyer_login = await client.post("/auth/login", json={"email": "buyer@example.com", "password": "P@ssw0rd!"})
        buyer_token = buyer_login.json()["access_token"]

        # Create RFP
        res = await client.post("/rfps", headers={"Authorization": f"Bearer {buyer_token}"}, json={"title": "RFP 1", "description": "desc"})
        assert res.status_code == 201
        rfp = res.json()

        # Publish RFP
        res = await client.put(f"/rfps/{rfp['id']}", headers={"Authorization": f"Bearer {buyer_token}"}, json={"status": "PUBLISHED"})
        assert res.status_code == 200

        # Login supplier
        supplier_login = await client.post("/auth/login", json={"email": "supplier@example.com", "password": "P@ssw0rd!"})
        supplier_token = supplier_login.json()["access_token"]

        # Supplier responds
        res = await client.post(
            f"/rfps/{rfp['id']}/respond",
            headers={"Authorization": f"Bearer {supplier_token}"},
            json={"content": "our offer"},
        )
        assert res.status_code == 200






