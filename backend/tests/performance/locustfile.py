from locust import HttpUser, task, between
import random
import json


class RFPUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Called when a user starts"""
        # Register and login
        self.register_and_login()
    
    def register_and_login(self):
        """Register a new user and login"""
        user_id = random.randint(1000, 9999)
        email = f"perfuser{user_id}@example.com"
        password = "perfpassword123"
        role = random.choice(["buyer", "supplier"])
        
        # Register
        register_data = {
            "email": email,
            "password": password,
            "role": role
        }
        
        response = self.client.post("/auth/register", json=register_data)
        if response.status_code == 201:
            self.token = response.json()["access_token"]
            self.role = role
            self.user_id = user_id
        else:
            # If registration fails, try to login
            login_data = {
                "email": email,
            "password": password
            }
            response = self.client.post("/auth/login", json=login_data)
            if response.status_code == 200:
                self.token = response.json()["access_token"]
                self.role = role
                self.user_id = user_id
            else:
                # Create a dummy token for testing
                self.token = "dummy_token"
                self.role = role
                self.user_id = user_id
    
    @task(3)
    def get_rfps(self):
        """Get list of RFPs"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get("/rfps", headers=headers)
    
    @task(2)
    def get_rfp_detail(self):
        """Get specific RFP details"""
        headers = {"Authorization": f"Bearer {self.token}"}
        rfp_id = random.randint(1, 50)
        self.client.get(f"/rfps/{rfp_id}", headers=headers)
    
    @task(1)
    def create_rfp(self):
        """Create a new RFP (buyers only)"""
        if self.role == "buyer":
            headers = {"Authorization": f"Bearer {self.token}"}
            rfp_data = {
                "title": f"Performance Test RFP {random.randint(1000, 9999)}",
                "description": "This is a performance test RFP",
                "requirements": "Performance testing requirements"
            }
            self.client.post("/rfps", json=rfp_data, headers=headers)
    
    @task(1)
    def respond_to_rfp(self):
        """Respond to an RFP (suppliers only)"""
        if self.role == "supplier":
            headers = {"Authorization": f"Bearer {self.token}"}
            rfp_id = random.randint(1, 50)
            response_data = {
                "content": f"Performance test response {random.randint(1000, 9999)}"
            }
            self.client.post(f"/rfps/{rfp_id}/respond", json=response_data, headers=headers)
    
    @task(1)
    def search_rfps(self):
        """Search RFPs"""
        headers = {"Authorization": f"Bearer {self.token}"}
        query = random.choice(["test", "performance", "rfp", "contract"])
        self.client.get(f"/rfps/search?q={query}", headers=headers)
    
    @task(1)
    def get_current_user(self):
        """Get current user info"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get("/auth/me", headers=headers)
    
    @task(1)
    def get_health(self):
        """Get health check"""
        self.client.get("/health")


class APIUser(HttpUser):
    """Lightweight user for API endpoint testing"""
    wait_time = between(0.5, 2)
    
    @task(5)
    def health_check(self):
        """Frequent health checks"""
        self.client.get("/health")
    
    @task(2)
    def get_docs(self):
        """Get API documentation"""
        self.client.get("/docs")
    
    @task(1)
    def get_openapi(self):
        """Get OpenAPI schema"""
        self.client.get("/openapi.json")




