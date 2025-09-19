import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.db.session import get_async_session
from app.db.models import User, UserRole
from app.core.security import hash_password


@pytest.fixture
async def test_user_data():
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "role": "buyer"
    }


@pytest.fixture
async def test_supplier_data():
    return {
        "email": "supplier@example.com", 
        "password": "supplierpass123",
        "role": "supplier"
    }


class TestAuthEndpoints:
    """Comprehensive authentication tests"""

    async def test_register_buyer(self, client: AsyncClient, test_user_data):
        """Test buyer registration"""
        response = await client.post("/auth/register", json=test_user_data)
        assert response.status_code == 201
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == test_user_data["email"]
        assert data["user"]["role"] == "buyer"

    async def test_register_supplier(self, client: AsyncClient, test_supplier_data):
        """Test supplier registration"""
        response = await client.post("/auth/register", json=test_supplier_data)
        assert response.status_code == 201
        
        data = response.json()
        assert data["user"]["role"] == "supplier"

    async def test_register_duplicate_email(self, client: AsyncClient, test_user_data):
        """Test registration with duplicate email fails"""
        # First registration
        await client.post("/auth/register", json=test_user_data)
        
        # Second registration with same email
        response = await client.post("/auth/register", json=test_user_data)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email"""
        data = {
            "email": "invalid-email",
            "password": "password123",
            "role": "buyer"
        }
        response = await client.post("/auth/register", json=data)
        assert response.status_code == 422

    async def test_register_short_password(self, client: AsyncClient):
        """Test registration with short password"""
        data = {
            "email": "test@example.com",
            "password": "short",
            "role": "buyer"
        }
        response = await client.post("/auth/register", json=data)
        assert response.status_code == 422

    async def test_register_invalid_role(self, client: AsyncClient):
        """Test registration with invalid role"""
        data = {
            "email": "test@example.com",
            "password": "password123",
            "role": "invalid_role"
        }
        response = await client.post("/auth/register", json=data)
        assert response.status_code == 422

    async def test_login_success(self, client: AsyncClient, test_user_data):
        """Test successful login"""
        # Register user first
        await client.post("/auth/register", json=test_user_data)
        
        # Login
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = await client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == test_user_data["email"]

    async def test_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        response = await client.post("/auth/login", json=login_data)
        assert response.status_code == 401

    async def test_login_wrong_password(self, client: AsyncClient, test_user_data):
        """Test login with wrong password"""
        # Register user first
        await client.post("/auth/register", json=test_user_data)
        
        # Login with wrong password
        login_data = {
            "email": test_user_data["email"],
            "password": "wrongpassword"
        }
        response = await client.post("/auth/login", json=login_data)
        assert response.status_code == 401

    async def test_get_current_user(self, client: AsyncClient, test_user_data):
        """Test getting current user with valid token"""
        # Register and login
        await client.post("/auth/register", json=test_user_data)
        login_response = await client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        
        # Get current user
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.get("/auth/me", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["role"] == test_user_data["role"]

    async def test_get_current_user_no_token(self, client: AsyncClient):
        """Test getting current user without token"""
        response = await client.get("/auth/me")
        assert response.status_code == 401

    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/auth/me", headers=headers)
        assert response.status_code == 401

    async def test_refresh_token(self, client: AsyncClient, test_user_data):
        """Test token refresh"""
        # Register and login
        await client.post("/auth/register", json=test_user_data)
        await client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        
        # Refresh token
        response = await client.post("/auth/refresh")
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data

    async def test_logout(self, client: AsyncClient, test_user_data):
        """Test logout"""
        # Register and login
        await client.post("/auth/register", json=test_user_data)
        await client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        
        # Logout
        response = await client.post("/auth/logout")
        assert response.status_code == 200

    async def test_password_hashing(self):
        """Test password hashing functionality"""
        password = "testpassword123"
        hashed = hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 0
        # Test that same password produces different hash (due to salt)
        hashed2 = hash_password(password)
        assert hashed != hashed2


class TestAuthDependencies:
    """Test authentication dependencies"""

    async def test_require_role_buyer(self, client: AsyncClient, test_user_data, test_supplier_data):
        """Test require_role dependency for buyer"""
        # Register buyer
        await client.post("/auth/register", json=test_user_data)
        login_response = await client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        buyer_token = login_response.json()["access_token"]
        
        # Register supplier
        await client.post("/auth/register", json=test_supplier_data)
        login_response = await client.post("/auth/login", json={
            "email": test_supplier_data["email"],
            "password": test_supplier_data["password"]
        })
        supplier_token = login_response.json()["access_token"]
        
        # Test buyer can access buyer-only endpoint
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = await client.post("/rfps", json={
            "title": "Test RFP",
            "description": "Test description"
        }, headers=headers)
        assert response.status_code == 201
        
        # Test supplier cannot access buyer-only endpoint
        headers = {"Authorization": f"Bearer {supplier_token}"}
        response = await client.post("/rfps", json={
            "title": "Test RFP",
            "description": "Test description"
        }, headers=headers)
        assert response.status_code == 403

    async def test_require_role_supplier(self, client: AsyncClient, test_user_data, test_supplier_data):
        """Test require_role dependency for supplier"""
        # Register both users
        await client.post("/auth/register", json=test_user_data)
        await client.post("/auth/register", json=test_supplier_data)
        
        # Login supplier
        login_response = await client.post("/auth/login", json={
            "email": test_supplier_data["email"],
            "password": test_supplier_data["password"]
        })
        supplier_token = login_response.json()["access_token"]
        
        # Create an RFP first (as buyer)
        buyer_login = await client.post("/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        buyer_token = buyer_login.json()["access_token"]
        
        rfp_response = await client.post("/rfps", json={
            "title": "Test RFP",
            "description": "Test description"
        }, headers={"Authorization": f"Bearer {buyer_token}"})
        rfp_id = rfp_response.json()["id"]
        
        # Publish the RFP
        await client.put(f"/rfps/{rfp_id}", json={"status": "PUBLISHED"}, 
                        headers={"Authorization": f"Bearer {buyer_token}"})
        
        # Test supplier can respond
        headers = {"Authorization": f"Bearer {supplier_token}"}
        response = await client.post(f"/rfps/{rfp_id}/respond", json={
            "content": "Test response"
        }, headers=headers)
        assert response.status_code == 200
        
        # Test buyer cannot respond to their own RFP
        headers = {"Authorization": f"Bearer {buyer_token}"}
        response = await client.post(f"/rfps/{rfp_id}/respond", json={
            "content": "Test response"
        }, headers=headers)
        assert response.status_code == 403




