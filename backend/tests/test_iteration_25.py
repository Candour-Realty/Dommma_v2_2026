"""
Test Suite for DOMMMA Iteration 25
Features: AI Property Valuation, Neighborhood Comparison, Smart Rent Pricing,
Notifications, Payment History, Scheduler endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAIPropertyValuation:
    """Test AI Property Valuation endpoint"""
    
    def test_property_valuation_returns_estimated_rent(self):
        """POST /api/ai/property-valuation returns estimated_rent and confidence"""
        response = requests.post(
            f"{BASE_URL}/api/ai/property-valuation",
            params={
                "address": "123 Test St",
                "city": "Vancouver",
                "property_type": "Apartment",
                "bedrooms": 2,
                "bathrooms": 1,
                "sqft": 700,
                "year_built": 2010,
                "amenities": "gym,pool"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "estimated_rent" in data, "Response missing estimated_rent"
        assert "confidence" in data, "Response missing confidence"
        assert data["confidence"] in ["high", "medium", "low"], f"Invalid confidence: {data['confidence']}"
        
        # Verify structure
        assert "specs" in data
        assert "comparables_count" in data
        assert "market_averages" in data
        assert "adjustments" in data
        print(f"Property valuation: estimated_rent={data.get('estimated_rent')}, confidence={data['confidence']}")


class TestNeighborhoodComparison:
    """Test Neighborhood Comparison endpoint"""
    
    def test_neighborhood_comparison_returns_array(self):
        """GET /api/ai/neighborhood-comparison returns neighborhoods array"""
        response = requests.get(
            f"{BASE_URL}/api/ai/neighborhood-comparison",
            params={"neighborhoods": "Downtown,Kitsilano"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify neighborhoods array exists
        assert "neighborhoods" in data, "Response missing neighborhoods array"
        assert isinstance(data["neighborhoods"], list), "neighborhoods should be a list"
        
        # Verify structure of each neighborhood
        for n in data["neighborhoods"]:
            assert "neighborhood" in n, "Missing neighborhood name"
            assert "rent" in n, "Missing rent data"
            assert "sale" in n, "Missing sale data"
            assert "avg_sqft" in n, "Missing avg_sqft"
            assert "pet_friendly_pct" in n, "Missing pet_friendly_pct"
        
        print(f"Neighborhood comparison: {len(data['neighborhoods'])} neighborhoods returned")


class TestSmartRentPricing:
    """Test Smart Rent Pricing endpoint"""
    
    def test_smart_rent_pricing_returns_suggested_rent(self):
        """POST /api/ai/smart-rent-pricing returns suggested_rent"""
        response = requests.post(
            f"{BASE_URL}/api/ai/smart-rent-pricing",
            params={
                "city": "Vancouver",
                "bedrooms": 2,
                "bathrooms": 1,
                "sqft": 700,
                "property_type": "Apartment"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "suggested_rent" in data, "Response missing suggested_rent"
        assert "market_data" in data, "Response missing market_data"
        
        # Verify market_data structure
        if data["market_data"].get("count", 0) > 0:
            assert "median" in data["market_data"]
            assert "average" in data["market_data"]
            assert "p25" in data["market_data"]
            assert "p75" in data["market_data"]
        
        print(f"Smart pricing: suggested_rent={data.get('suggested_rent')}, comparables={data['market_data'].get('count', 0)}")


class TestNotifications:
    """Test Notifications endpoint"""
    
    def test_get_notifications_returns_array(self):
        """GET /api/notifications returns array"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            params={"user_id": "test"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return an array (empty or with notifications)
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"Notifications: {len(data)} notifications returned")


class TestPaymentHistory:
    """Test Payment History endpoint"""
    
    def test_get_payment_history_returns_array(self):
        """GET /api/payments/history returns array"""
        response = requests.get(
            f"{BASE_URL}/api/payments/history",
            params={"user_id": "test"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return an array (empty or with payments)
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"Payment history: {len(data)} payments returned")


class TestSchedulerEndpoints:
    """Test Scheduler admin endpoints"""
    
    def test_run_reminders_with_admin_key(self):
        """POST /api/scheduler/run-reminders with admin key runs scheduler tasks"""
        response = requests.post(
            f"{BASE_URL}/api/scheduler/run-reminders",
            params={"admin_key": "dommma-admin-2026"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "reminders_sent" in data, "Response missing reminders_sent"
        assert "late_fees_applied" in data, "Response missing late_fees_applied"
        assert "renewal_reminders" in data, "Response missing renewal_reminders"
        print(f"Scheduler reminders: sent={data['reminders_sent']}, late_fees={data['late_fees_applied']}, renewals={data['renewal_reminders']}")
    
    def test_run_invoices_with_admin_key(self):
        """POST /api/scheduler/run-invoices with admin key runs invoice generation"""
        response = requests.post(
            f"{BASE_URL}/api/scheduler/run-invoices",
            params={"admin_key": "dommma-admin-2026"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "status" in data, "Response missing status"
        assert "invoices_generated" in data, "Response missing invoices_generated"
        assert data["status"] == "success", f"Expected success, got {data['status']}"
        print(f"Scheduler invoices: generated={data['invoices_generated']}")
    
    def test_scheduler_rejects_invalid_admin_key(self):
        """Scheduler endpoints reject invalid admin key"""
        response = requests.post(
            f"{BASE_URL}/api/scheduler/run-reminders",
            params={"admin_key": "invalid-key"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


class TestExistingEndpoints:
    """Verify existing endpoints still work"""
    
    def test_listings_endpoint(self):
        """GET /api/listings returns listings"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Listings: {len(data)} listings returned")
    
    def test_auth_login(self):
        """POST /api/auth/login works with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@dommma.com", "password": "test123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "email" in data
        print(f"Login successful: {data['email']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
