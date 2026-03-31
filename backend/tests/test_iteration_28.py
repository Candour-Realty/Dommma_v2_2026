"""
Iteration 28 Tests - Testing new features:
1. Virtual Staging API (styles, history)
2. Real-time Notifications API (CRUD, count, mark-read)
3. Analytics Export API (CSV, JSON)
4. Enhanced Credit Check API (score_breakdown, affordability)
5. Web Push API (VAPID key)
6. Auth login for renter and landlord
7. Listings API
8. Contractors search API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuth:
    """Test authentication for both renter and landlord accounts"""
    
    def test_renter_login(self):
        """Test login with renter account test@dommma.com / test123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dommma.com",
            "password": "test123",
            "user_type": "renter"
        })
        assert response.status_code == 200, f"Renter login failed: {response.text}"
        data = response.json()
        # Login returns user data directly (not wrapped in "user" key)
        assert "email" in data
        assert data["email"] == "test@dommma.com"
        assert data["user_type"] == "renter"
        print(f"✓ Renter login successful: {data['name']}")
        return data
    
    def test_landlord_login(self):
        """Test login with landlord account testlandlord@dommma.com / test123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "testlandlord@dommma.com",
            "password": "test123",
            "user_type": "landlord"
        })
        assert response.status_code == 200, f"Landlord login failed: {response.text}"
        data = response.json()
        # Login returns user data directly (not wrapped in "user" key)
        assert "email" in data
        assert data["email"] == "testlandlord@dommma.com"
        assert data["user_type"] == "landlord"
        print(f"✓ Landlord login successful: {data['name']}")
        return data
    
    def test_invalid_login(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword",
            "user_type": "renter"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly returns 401")


class TestVirtualStagingAPI:
    """Test Virtual Staging AI endpoints"""
    
    def test_get_staging_styles(self):
        """GET /api/virtual-staging/styles returns room types and styles"""
        response = requests.get(f"{BASE_URL}/api/virtual-staging/styles")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify room_types
        assert "room_types" in data
        assert len(data["room_types"]) >= 6
        room_ids = [r["id"] for r in data["room_types"]]
        assert "living_room" in room_ids
        assert "bedroom" in room_ids
        assert "kitchen" in room_ids
        
        # Verify styles
        assert "styles" in data
        assert len(data["styles"]) >= 6
        style_ids = [s["id"] for s in data["styles"]]
        assert "modern" in style_ids
        assert "luxury" in style_ids
        
        print(f"✓ Virtual staging styles: {len(data['room_types'])} room types, {len(data['styles'])} styles")
    
    def test_get_staging_history(self):
        """GET /api/virtual-staging/history/{user_id} returns staging history array"""
        # Use a test user ID
        user_id = "test-user-123"
        response = requests.get(f"{BASE_URL}/api/virtual-staging/history/{user_id}")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Should return an array (may be empty)
        assert isinstance(data, list)
        print(f"✓ Virtual staging history: {len(data)} items")


class TestNotificationsAPI:
    """Test Real-time Notifications endpoints"""
    
    def test_get_notifications(self):
        """GET /api/notifications/{user_id} returns notifications array"""
        user_id = "test-user-123"
        response = requests.get(f"{BASE_URL}/api/notifications/{user_id}")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Notifications: {len(data)} items")
    
    def test_get_unread_count(self):
        """GET /api/notifications/{user_id}/count returns unread_count"""
        user_id = "test-user-123"
        response = requests.get(f"{BASE_URL}/api/notifications/{user_id}/count")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        print(f"✓ Unread count: {data['unread_count']}")
    
    def test_mark_all_read(self):
        """PUT /api/notifications/{user_id}/read-all marks all as read"""
        user_id = "test-user-123"
        response = requests.put(f"{BASE_URL}/api/notifications/{user_id}/read-all")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        print(f"✓ Mark all read: {data.get('marked_read', 0)} notifications marked")


class TestAnalyticsExportAPI:
    """Test Analytics Export endpoints (CSV and JSON)"""
    
    def test_export_csv_overview(self):
        """GET /api/analytics/export/csv/{user_id}?report_type=overview returns CSV"""
        user_id = "test-user-123"
        response = requests.get(f"{BASE_URL}/api/analytics/export/csv/{user_id}?report_type=overview")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Check content type is CSV
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected CSV, got {content_type}"
        
        # Check content disposition header
        content_disp = response.headers.get("content-disposition", "")
        assert "attachment" in content_disp
        assert ".csv" in content_disp
        
        # Verify CSV content has headers
        content = response.text
        assert "Metric" in content or "User Type" in content
        print(f"✓ CSV overview export: {len(content)} bytes")
    
    def test_export_csv_payments(self):
        """GET /api/analytics/export/csv/{user_id}?report_type=payments returns CSV"""
        user_id = "test-user-123"
        response = requests.get(f"{BASE_URL}/api/analytics/export/csv/{user_id}?report_type=payments")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type
        print(f"✓ CSV payments export: {len(response.text)} bytes")
    
    def test_export_json_overview(self):
        """GET /api/analytics/export/json/{user_id}?report_type=overview returns JSON report"""
        user_id = "test-user-123"
        response = requests.get(f"{BASE_URL}/api/analytics/export/json/{user_id}?report_type=overview")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify JSON structure
        assert "report_type" in data
        assert data["report_type"] == "overview"
        assert "generated_at" in data
        assert "data" in data
        assert "period_days" in data
        
        # Verify data fields
        assert "total_listings" in data["data"]
        assert "total_payments" in data["data"]
        print(f"✓ JSON overview export: {data['data']}")


class TestCreditCheckAPI:
    """Test Enhanced Credit Check API with score_breakdown and affordability"""
    
    def test_credit_check_request(self):
        """POST /api/credit-check/request returns enhanced report"""
        # First get a renter user
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test@dommma.com",
            "password": "test123",
            "user_type": "renter"
        })
        assert login_resp.status_code == 200
        renter = login_resp.json()  # Login returns user data directly
        
        # Request credit check
        response = requests.post(f"{BASE_URL}/api/credit-check/request", json={
            "tenant_id": renter["id"],
            "full_name": renter["name"],
            "consent": True
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify basic fields
        assert "credit_score" in data
        assert "risk_level" in data
        assert data["risk_level"] in ["low", "medium", "high"]
        
        # Verify score_breakdown (new enhanced feature)
        assert "score_breakdown" in data, "Missing score_breakdown"
        breakdown = data["score_breakdown"]
        assert "payment_history" in breakdown
        assert "credit_utilization" in breakdown
        assert "credit_age" in breakdown
        
        # Verify affordability section (new enhanced feature)
        assert "affordability" in data, "Missing affordability"
        affordability = data["affordability"]
        assert "estimated_monthly_income" in affordability
        assert "recommended_max_rent" in affordability
        assert "debt_to_income_ratio" in affordability
        
        # Verify rental_history
        assert "rental_history" in data
        assert "evictions" in data["rental_history"]
        
        # Verify recommendation
        assert "recommendation" in data
        assert data["recommendation"] in ["Approve", "Review", "Decline"]
        
        print(f"✓ Credit check: score={data['credit_score']}, risk={data['risk_level']}, recommendation={data['recommendation']}")
        print(f"  Affordability: max_rent=${affordability['recommended_max_rent']}")
    
    def test_credit_check_without_consent(self):
        """POST /api/credit-check/request without consent returns 400"""
        response = requests.post(f"{BASE_URL}/api/credit-check/request", json={
            "tenant_id": "test-id",
            "full_name": "Test User",
            "consent": False
        })
        assert response.status_code == 400
        print("✓ Credit check without consent correctly returns 400")


class TestWebPushAPI:
    """Test Web Push VAPID endpoints"""
    
    def test_get_vapid_public_key(self):
        """GET /api/push/vapid-public-key returns public key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-public-key")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "publicKey" in data
        assert len(data["publicKey"]) > 50  # VAPID keys are long
        print(f"✓ VAPID public key: {data['publicKey'][:30]}...")


class TestListingsAPI:
    """Test Listings endpoints"""
    
    def test_get_listings(self):
        """GET /api/listings returns listings"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            listing = data[0]
            assert "id" in listing
            assert "title" in listing
            assert "price" in listing
        print(f"✓ Listings: {len(data)} items")
    
    def test_get_listings_filtered(self):
        """GET /api/listings?listing_type=rent returns filtered listings"""
        response = requests.get(f"{BASE_URL}/api/listings?listing_type=rent")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Filtered listings (rent): {len(data)} items")


class TestContractorsAPI:
    """Test Contractors search endpoints"""
    
    def test_search_contractors(self):
        """GET /api/contractors/search returns contractor results"""
        response = requests.get(f"{BASE_URL}/api/contractors/search")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Contractors search: {len(data)} results")
    
    def test_search_contractors_with_specialty(self):
        """GET /api/contractors/search?specialty=plumbing returns filtered results"""
        response = requests.get(f"{BASE_URL}/api/contractors/search?specialty=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Contractors search (plumbing): {len(data)} results")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
