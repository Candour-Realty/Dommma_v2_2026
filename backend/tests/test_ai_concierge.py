"""
Backend tests for AI Concierge tool calling functionality
Tests: search_listings, find_contractors, calculate_budget, create_listing, triage_maintenance
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def unique_id():
    """Generate unique test identifiers"""
    return f"TEST_{uuid.uuid4().hex[:8]}_{datetime.now().strftime('%H%M%S')}"

class TestAIConciergeEndpoint:
    """Test the /api/ai/concierge endpoint"""
    
    def test_concierge_endpoint_exists(self, api_client):
        """Test that the AI concierge endpoint is accessible"""
        response = api_client.post(f"{BASE_URL}/api/ai/concierge", json={
            "message": "hello"
        })
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "response" in data
    
    def test_concierge_returns_session_id(self, api_client):
        """Test that concierge returns a session_id for continuity"""
        response = api_client.post(f"{BASE_URL}/api/ai/concierge", json={
            "message": "What can you help me with?"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] is not None
        assert len(data["session_id"]) > 0


class TestSearchListingsTool:
    """Test the search_listings tool via AI Concierge"""
    
    def test_search_listings_via_concierge(self, api_client):
        """Test searching for listings through natural language"""
        response = api_client.post(f"{BASE_URL}/api/ai/concierge", json={
            "message": "Find me apartments in Vancouver under $2500"
        }, timeout=45)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # The AI should either use the search tool or respond about searching
        # Check for tool_results if the AI decided to use the tool
    
    def test_search_listings_api_directly(self, api_client):
        """Test the listings API directly"""
        response = api_client.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_search_listings_with_filters(self, api_client):
        """Test listings API with various filters"""
        response = api_client.get(f"{BASE_URL}/api/listings", params={
            "max_price": 3000,
            "bedrooms": 2
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestFindContractorsTool:
    """Test the find_contractors tool via AI Concierge"""
    
    def test_find_contractors_via_concierge(self, api_client):
        """Test finding contractors through natural language"""
        response = api_client.post(f"{BASE_URL}/api/ai/concierge", json={
            "message": "I need a plumber"
        }, timeout=45)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # The AI should respond about contractors
    
    def test_contractors_search_api(self, api_client):
        """Test the contractors search API directly"""
        response = api_client.get(f"{BASE_URL}/api/contractors/search")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestCalculateBudgetTool:
    """Test the calculate_budget tool via AI Concierge"""
    
    def test_calculate_budget_via_concierge(self, api_client):
        """Test budget calculation through natural language"""
        response = api_client.post(f"{BASE_URL}/api/ai/concierge", json={
            "message": "What rent can I afford on an $80,000 salary?"
        }, timeout=45)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Response should contain budget-related information
        response_text = data["response"].lower()
        # Should mention affordability or budget
        assert any(word in response_text for word in ["afford", "budget", "rent", "$", "income", "month"])


class TestCreateListingTool:
    """Test the create_listing tool via AI Concierge"""
    
    def test_create_listing_api(self, api_client, unique_id):
        """Test creating a listing directly via API"""
        listing_data = {
            "title": f"TEST Listing {unique_id}",
            "address": "123 Test Street",
            "city": "Vancouver",
            "province": "BC",
            "postal_code": "V6B 1A1",
            "lat": 49.2827,
            "lng": -123.1207,
            "price": 2500,
            "bedrooms": 2,
            "bathrooms": 1.5,
            "sqft": 900,
            "property_type": "apartment",
            "description": "Test listing for automated testing",
            "amenities": ["parking", "laundry"],
            "pet_friendly": True,
            "parking": True,
            "listing_type": "rent"
        }
        response = api_client.post(f"{BASE_URL}/api/listings", json=listing_data)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["title"] == listing_data["title"]
        assert data["price"] == listing_data["price"]
        
        # Cleanup - verify the listing exists
        get_response = api_client.get(f"{BASE_URL}/api/listings/{data['id']}")
        assert get_response.status_code == 200


class TestTriageMaintenanceTool:
    """Test the triage_maintenance tool via AI Concierge"""
    
    def test_triage_maintenance_via_concierge(self, api_client):
        """Test maintenance request through natural language"""
        response = api_client.post(f"{BASE_URL}/api/ai/concierge", json={
            "message": "My sink is leaking and I need help fixing it urgently"
        }, timeout=45)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Should respond about the maintenance issue


class TestChatFallback:
    """Test the fallback /api/chat endpoint"""
    
    def test_chat_endpoint_works(self, api_client):
        """Test the original chat endpoint as fallback"""
        response = api_client.post(f"{BASE_URL}/api/chat", json={
            "message": "Hello, what can you help me with?"
        })
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "response" in data


class TestAPIHealthCheck:
    """Basic health checks for the API"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_listings_endpoint(self, api_client):
        """Test listings endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
    
    def test_contractors_search(self, api_client):
        """Test contractors search endpoint"""
        response = api_client.get(f"{BASE_URL}/api/contractors/search")
        assert response.status_code == 200
