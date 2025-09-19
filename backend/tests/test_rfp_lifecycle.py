import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.db.models import RFP, RFPStatus, User, UserRole
from app.core.security import hash_password


@pytest.fixture
async def buyer_user(client: AsyncClient):
    """Create a buyer user for testing"""
    user_data = {
        "email": "buyer@example.com",
        "password": "buyerpass123",
        "role": "buyer"
    }
    await client.post("/auth/register", json=user_data)
    login_response = await client.post("/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    token = login_response.json()["access_token"]
    return {"token": token, "user_data": user_data}


@pytest.fixture
async def supplier_user(client: AsyncClient):
    """Create a supplier user for testing"""
    user_data = {
        "email": "supplier@example.com",
        "password": "supplierpass123",
        "role": "supplier"
    }
    await client.post("/auth/register", json=user_data)
    login_response = await client.post("/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    token = login_response.json()["access_token"]
    return {"token": token, "user_data": user_data}


class TestRFPLifecycle:
    """Test complete RFP lifecycle from creation to completion"""

    async def test_create_rfp(self, client: AsyncClient, buyer_user):
        """Test RFP creation"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        rfp_data = {
            "title": "Test RFP",
            "description": "This is a test RFP description",
            "requirements": "Test requirements"
        }
        
        response = await client.post("/rfps", json=rfp_data, headers=headers)
        assert response.status_code == 201
        
        data = response.json()
        assert data["title"] == rfp_data["title"]
        assert data["description"] == rfp_data["description"]
        assert data["requirements"] == rfp_data["requirements"]
        assert data["status"] == "DRAFT"
        assert "id" in data
        assert "created_at" in data

    async def test_create_rfp_unauthorized(self, client: AsyncClient):
        """Test RFP creation without authentication"""
        rfp_data = {
            "title": "Test RFP",
            "description": "This is a test RFP description"
        }
        
        response = await client.post("/rfps", json=rfp_data)
        assert response.status_code == 401

    async def test_create_rfp_supplier_forbidden(self, client: AsyncClient, supplier_user):
        """Test supplier cannot create RFPs"""
        headers = {"Authorization": f"Bearer {supplier_user['token']}"}
        rfp_data = {
            "title": "Test RFP",
            "description": "This is a test RFP description"
        }
        
        response = await client.post("/rfps", json=rfp_data, headers=headers)
        assert response.status_code == 403

    async def test_list_rfps(self, client: AsyncClient, buyer_user):
        """Test listing RFPs"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Create a few RFPs
        for i in range(3):
            rfp_data = {
                "title": f"Test RFP {i}",
                "description": f"Description {i}"
            }
            await client.post("/rfps", json=rfp_data, headers=headers)
        
        # List RFPs
        response = await client.get("/rfps", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "total_pages" in data
        assert len(data["items"]) == 3

    async def test_get_rfp_detail(self, client: AsyncClient, buyer_user):
        """Test getting RFP details"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Create RFP
        rfp_data = {
            "title": "Test RFP",
            "description": "Test description",
            "requirements": "Test requirements"
        }
        create_response = await client.post("/rfps", json=rfp_data, headers=headers)
        rfp_id = create_response.json()["id"]
        
        # Get RFP details
        response = await client.get(f"/rfps/{rfp_id}", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == rfp_id
        assert data["title"] == rfp_data["title"]
        assert data["description"] == rfp_data["description"]

    async def test_update_rfp(self, client: AsyncClient, buyer_user):
        """Test updating RFP"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Create RFP
        rfp_data = {
            "title": "Original Title",
            "description": "Original description"
        }
        create_response = await client.post("/rfps", json=rfp_data, headers=headers)
        rfp_id = create_response.json()["id"]
        
        # Update RFP
        update_data = {
            "title": "Updated Title",
            "description": "Updated description"
        }
        response = await client.put(f"/rfps/{rfp_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["description"] == update_data["description"]

    async def test_update_rfp_unauthorized(self, client: AsyncClient, buyer_user, supplier_user):
        """Test updating RFP by non-owner"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Create RFP as buyer
        rfp_data = {
            "title": "Test RFP",
            "description": "Test description"
        }
        create_response = await client.post("/rfps", json=rfp_data, headers=headers)
        rfp_id = create_response.json()["id"]
        
        # Try to update as supplier
        supplier_headers = {"Authorization": f"Bearer {supplier_user['token']}"}
        update_data = {"title": "Hacked Title"}
        response = await client.put(f"/rfps/{rfp_id}", json=update_data, headers=supplier_headers)
        assert response.status_code == 403

    async def test_publish_rfp(self, client: AsyncClient, buyer_user):
        """Test publishing RFP"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Create RFP
        rfp_data = {
            "title": "Test RFP",
            "description": "Test description"
        }
        create_response = await client.post("/rfps", json=rfp_data, headers=headers)
        rfp_id = create_response.json()["id"]
        
        # Publish RFP
        update_data = {"status": "PUBLISHED"}
        response = await client.put(f"/rfps/{rfp_id}", json=update_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "PUBLISHED"

    async def test_respond_to_rfp(self, client: AsyncClient, buyer_user, supplier_user):
        """Test supplier responding to RFP"""
        buyer_headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        supplier_headers = {"Authorization": f"Bearer {supplier_user['token']}"}
        
        # Create and publish RFP
        rfp_data = {
            "title": "Test RFP",
            "description": "Test description"
        }
        create_response = await client.post("/rfps", json=rfp_data, headers=buyer_headers)
        rfp_id = create_response.json()["id"]
        
        # Publish RFP
        await client.put(f"/rfps/{rfp_id}", json={"status": "PUBLISHED"}, headers=buyer_headers)
        
        # Supplier responds
        response_data = {"content": "This is my proposal for the RFP"}
        response = await client.post(f"/rfps/{rfp_id}/respond", json=response_data, headers=supplier_headers)
        assert response.status_code == 200
        
        # Check RFP status changed
        rfp_response = await client.get(f"/rfps/{rfp_id}", headers=buyer_headers)
        assert rfp_response.json()["status"] == "RESPONSE_SUBMITTED"

    async def test_respond_to_draft_rfp(self, client: AsyncClient, buyer_user, supplier_user):
        """Test supplier cannot respond to draft RFP"""
        buyer_headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        supplier_headers = {"Authorization": f"Bearer {supplier_user['token']}"}
        
        # Create RFP (stays in DRAFT)
        rfp_data = {
            "title": "Test RFP",
            "description": "Test description"
        }
        create_response = await client.post("/rfps", json=rfp_data, headers=buyer_headers)
        rfp_id = create_response.json()["id"]
        
        # Supplier tries to respond to draft
        response_data = {"content": "This is my proposal"}
        response = await client.post(f"/rfps/{rfp_id}/respond", json=response_data, headers=supplier_headers)
        assert response.status_code == 400

    async def test_change_rfp_status(self, client: AsyncClient, buyer_user, supplier_user):
        """Test changing RFP status"""
        buyer_headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        supplier_headers = {"Authorization": f"Bearer {supplier_user['token']}"}
        
        # Create and publish RFP
        rfp_data = {
            "title": "Test RFP",
            "description": "Test description"
        }
        create_response = await client.post("/rfps", json=rfp_data, headers=buyer_headers)
        rfp_id = create_response.json()["id"]
        
        # Publish RFP
        await client.put(f"/rfps/{rfp_id}", json={"status": "PUBLISHED"}, headers=buyer_headers)
        
        # Supplier responds
        response_data = {"content": "This is my proposal"}
        await client.post(f"/rfps/{rfp_id}/respond", json=response_data, headers=supplier_headers)
        
        # Buyer changes status to UNDER_REVIEW
        response = await client.patch(f"/rfps/{rfp_id}/status?new_status=UNDER_REVIEW", headers=buyer_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "UNDER_REVIEW"
        
        # Buyer approves RFP
        response = await client.patch(f"/rfps/{rfp_id}/status?new_status=APPROVED", headers=buyer_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "APPROVED"

    async def test_invalid_status_transition(self, client: AsyncClient, buyer_user):
        """Test invalid status transitions"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Create RFP
        rfp_data = {
            "title": "Test RFP",
            "description": "Test description"
        }
        create_response = await client.post("/rfps", json=rfp_data, headers=headers)
        rfp_id = create_response.json()["id"]
        
        # Try invalid transition: DRAFT -> APPROVED
        response = await client.patch(f"/rfps/{rfp_id}/status?new_status=APPROVED", headers=headers)
        assert response.status_code == 400

    async def test_rfp_pagination(self, client: AsyncClient, buyer_user):
        """Test RFP listing pagination"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Create 5 RFPs
        for i in range(5):
            rfp_data = {
                "title": f"Test RFP {i}",
                "description": f"Description {i}"
            }
            await client.post("/rfps", json=rfp_data, headers=headers)
        
        # Test first page
        response = await client.get("/rfps?page=1&limit=2", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["total"] == 5
        assert data["total_pages"] == 3
        
        # Test second page
        response = await client.get("/rfps?page=2&limit=2", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["items"]) == 2
        assert data["page"] == 2

    async def test_rfp_not_found(self, client: AsyncClient, buyer_user):
        """Test accessing non-existent RFP"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        response = await client.get("/rfps/99999", headers=headers)
        assert response.status_code == 404




