import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.db.models import RFP, RFPDocument, RFPDocumentVersion


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
async def test_rfp(client: AsyncClient, buyer_user):
    """Create a test RFP"""
    headers = {"Authorization": f"Bearer {buyer_user['token']}"}
    rfp_data = {
        "title": "Test RFP for Upload",
        "description": "Test description for upload testing"
    }
    response = await client.post("/rfps", json=rfp_data, headers=headers)
    return response.json()


class TestFileUpload:
    """Test file upload functionality"""

    async def test_get_presigned_url(self, client: AsyncClient, buyer_user):
        """Test getting presigned URL for upload"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        presign_data = {
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }
        
        response = await client.post("/uploads/presign", json=presign_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "presigned_url" in data
        assert "filename" in data
        assert data["filename"] == presign_data["filename"]

    async def test_get_presigned_url_unauthorized(self, client: AsyncClient):
        """Test getting presigned URL without authentication"""
        presign_data = {
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }
        
        response = await client.post("/uploads/presign", json=presign_data)
        assert response.status_code == 401

    async def test_complete_upload(self, client: AsyncClient, buyer_user, test_rfp):
        """Test completing upload process"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Get presigned URL
        presign_data = {
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }
        presign_response = await client.post("/uploads/presign", json=presign_data, headers=headers)
        presign_data_response = presign_response.json()
        
        # Complete upload
        complete_data = {
            "filename": presign_data["filename"],
            "rfp_id": test_rfp["id"],
            "document_type": "specification"
        }
        
        response = await client.post("/uploads/complete", json=complete_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "document_id" in data
        assert "version_number" in data
        assert data["version_number"] == 1

    async def test_complete_upload_invalid_rfp(self, client: AsyncClient, buyer_user):
        """Test completing upload with invalid RFP ID"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        complete_data = {
            "filename": "test_document.pdf",
            "rfp_id": 99999,  # Non-existent RFP
            "document_type": "specification"
        }
        
        response = await client.post("/uploads/complete", json=complete_data, headers=headers)
        assert response.status_code == 404

    async def test_complete_upload_unauthorized_rfp(self, client: AsyncClient, buyer_user):
        """Test completing upload for RFP not owned by user"""
        # Create another buyer
        other_buyer_data = {
            "email": "otherbuyer@example.com",
            "password": "otherpass123",
            "role": "buyer"
        }
        await client.post("/auth/register", json=other_buyer_data)
        other_login = await client.post("/auth/login", json={
            "email": other_buyer_data["email"],
            "password": other_buyer_data["password"]
        })
        other_token = other_login.json()["access_token"]
        
        # Create RFP as other buyer
        other_headers = {"Authorization": f"Bearer {other_token}"}
        rfp_data = {
            "title": "Other Buyer's RFP",
            "description": "Other buyer's description"
        }
        rfp_response = await client.post("/rfps", json=rfp_data, headers=other_headers)
        rfp_id = rfp_response.json()["id"]
        
        # Try to upload to other buyer's RFP
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        complete_data = {
            "filename": "test_document.pdf",
            "rfp_id": rfp_id,
            "document_type": "specification"
        }
        
        response = await client.post("/uploads/complete", json=complete_data, headers=headers)
        assert response.status_code == 403


class TestDocumentVersioning:
    """Test document versioning functionality"""

    async def test_list_document_versions(self, client: AsyncClient, buyer_user, test_rfp):
        """Test listing document versions"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Upload a document first
        presign_data = {
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }
        presign_response = await client.post("/uploads/presign", json=presign_data, headers=headers)
        
        complete_data = {
            "filename": presign_data["filename"],
            "rfp_id": test_rfp["id"],
            "document_type": "specification"
        }
        complete_response = await client.post("/uploads/complete", json=complete_data, headers=headers)
        document_id = complete_response.json()["document_id"]
        
        # List versions
        response = await client.get(f"/documents/{document_id}/versions", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["version_number"] == 1
        assert data[0]["filename"] == presign_data["filename"]

    async def test_upload_new_version(self, client: AsyncClient, buyer_user, test_rfp):
        """Test uploading new version of document"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Upload initial document
        presign_data = {
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }
        presign_response = await client.post("/uploads/presign", json=presign_data, headers=headers)
        
        complete_data = {
            "filename": presign_data["filename"],
            "rfp_id": test_rfp["id"],
            "document_type": "specification"
        }
        complete_response = await client.post("/uploads/complete", json=complete_data, headers=headers)
        document_id = complete_response.json()["document_id"]
        
        # Upload new version
        new_version_data = {
            "filename": "test_document_v2.pdf",
            "notes": "Updated specification with new requirements"
        }
        
        response = await client.post(f"/documents/{document_id}/versions", json=new_version_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["version_number"] == 2
        assert data["filename"] == new_version_data["filename"]
        assert data["notes"] == new_version_data["notes"]

    async def test_revert_to_version(self, client: AsyncClient, buyer_user, test_rfp):
        """Test reverting to previous version"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Upload initial document
        presign_data = {
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }
        presign_response = await client.post("/uploads/presign", json=presign_data, headers=headers)
        
        complete_data = {
            "filename": presign_data["filename"],
            "rfp_id": test_rfp["id"],
            "document_type": "specification"
        }
        complete_response = await client.post("/uploads/complete", json=complete_data, headers=headers)
        document_id = complete_response.json()["document_id"]
        
        # Upload new version
        new_version_data = {
            "filename": "test_document_v2.pdf",
            "notes": "Updated specification"
        }
        await client.post(f"/documents/{document_id}/versions", json=new_version_data, headers=headers)
        
        # Revert to version 1
        response = await client.post(f"/documents/{document_id}/versions/1/revert", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["version_number"] == 3  # New version created
        assert data["filename"] == presign_data["filename"]  # Reverted to original filename

    async def test_revert_to_invalid_version(self, client: AsyncClient, buyer_user, test_rfp):
        """Test reverting to non-existent version"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Upload document
        presign_data = {
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }
        presign_response = await client.post("/uploads/presign", json=presign_data, headers=headers)
        
        complete_data = {
            "filename": presign_data["filename"],
            "rfp_id": test_rfp["id"],
            "document_type": "specification"
        }
        complete_response = await client.post("/uploads/complete", json=complete_data, headers=headers)
        document_id = complete_response.json()["document_id"]
        
        # Try to revert to non-existent version
        response = await client.post(f"/documents/{document_id}/versions/999/revert", headers=headers)
        assert response.status_code == 404

    async def test_get_version_preview(self, client: AsyncClient, buyer_user, test_rfp):
        """Test getting version preview URL"""
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        
        # Upload document
        presign_data = {
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }
        presign_response = await client.post("/uploads/presign", json=presign_data, headers=headers)
        
        complete_data = {
            "filename": presign_data["filename"],
            "rfp_id": test_rfp["id"],
            "document_type": "specification"
        }
        complete_response = await client.post("/uploads/complete", json=complete_data, headers=headers)
        document_id = complete_response.json()["document_id"]
        
        # Get preview
        response = await client.get(f"/documents/{document_id}/versions/1/preview", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "preview_url" in data or "download_url" in data

    async def test_unauthorized_document_access(self, client: AsyncClient, buyer_user):
        """Test accessing documents without proper authorization"""
        # Create another buyer
        other_buyer_data = {
            "email": "otherbuyer@example.com",
            "password": "otherpass123",
            "role": "buyer"
        }
        await client.post("/auth/register", json=other_buyer_data)
        other_login = await client.post("/auth/login", json={
            "email": other_buyer_data["email"],
            "password": other_buyer_data["password"]
        })
        other_token = other_login.json()["access_token"]
        
        # Create RFP and upload document as other buyer
        other_headers = {"Authorization": f"Bearer {other_token}"}
        rfp_data = {
            "title": "Other Buyer's RFP",
            "description": "Other buyer's description"
        }
        rfp_response = await client.post("/rfps", json=rfp_data, headers=other_headers)
        rfp_id = rfp_response.json()["id"]
        
        # Upload document
        presign_data = {
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }
        presign_response = await client.post("/uploads/presign", json=presign_data, headers=other_headers)
        
        complete_data = {
            "filename": presign_data["filename"],
            "rfp_id": rfp_id,
            "document_type": "specification"
        }
        complete_response = await client.post("/uploads/complete", json=complete_data, headers=other_headers)
        document_id = complete_response.json()["document_id"]
        
        # Try to access document as different user
        headers = {"Authorization": f"Bearer {buyer_user['token']}"}
        response = await client.get(f"/documents/{document_id}/versions", headers=headers)
        assert response.status_code == 403




