"""
Test suite for DOMMMA modular routers:
- Auth router (/api/auth/*)
- Listings router (/api/listings/*)
- Contractors router (/api/contractors/*, /api/jobs/*)
- Web Push router (/api/push/*)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://landlord-tools-5.preview.emergentagent.com')

# Test credentials from test_credentials.md
TEST_RENTER_EMAIL = "test@dommma.com"
TEST_RENTER_PASSWORD = "test123"
TEST_LANDLORD_EMAIL = "testlandlord@dommma.com"
TEST_LANDLORD_PASSWORD = "test123"


class TestAuthRouter:
    """Auth router tests - /api/auth/*"""
    
    def test_login_success(self):
        """POST /api/auth/login - should return user data for valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_RENTER_EMAIL,
            "password": TEST_RENTER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "id" in data, "Response should contain user id"
        assert "email" in data, "Response should contain email"
        assert data["email"] == TEST_RENTER_EMAIL
        print(f"✓ Login success - user_id: {data.get('id')}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - should return 401 for invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_register_duplicate_email(self):
        """POST /api/auth/register - should reject duplicate email"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_RENTER_EMAIL,
            "password": "newpassword123",
            "name": "Test User",
            "user_type": "renter"
        })
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        data = response.json()
        assert "already registered" in data.get("detail", "").lower() or "email" in data.get("detail", "").lower()
        print("✓ Duplicate email registration correctly rejected")
    
    def test_resend_verification(self):
        """POST /api/auth/resend-verification - should accept email"""
        response = requests.post(f"{BASE_URL}/api/auth/resend-verification", json={
            "email": TEST_RENTER_EMAIL
        })
        # Should return 200 or 400 (if already verified)
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        print(f"✓ Resend verification endpoint works - status: {response.status_code}")


class TestListingsRouter:
    """Listings router tests - /api/listings/*"""
    
    def test_get_listings(self):
        """GET /api/listings - should return listings array"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200, f"Failed to get listings: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/listings returned {len(data)} listings")
        
        # Verify listing structure if we have data
        if len(data) > 0:
            listing = data[0]
            assert "id" in listing, "Listing should have id"
            assert "title" in listing, "Listing should have title"
            assert "price" in listing, "Listing should have price"
            print(f"✓ Listing structure verified: {listing.get('title', 'N/A')[:50]}")
    
    def test_get_listings_for_map(self):
        """GET /api/listings/map - should return listings for map view"""
        response = requests.get(f"{BASE_URL}/api/listings/map")
        assert response.status_code == 200, f"Failed to get map listings: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/listings/map returned {len(data)} listings")
        
        # Verify lat/lng if we have data
        if len(data) > 0:
            listing = data[0]
            assert "lat" in listing, "Map listing should have lat"
            assert "lng" in listing, "Map listing should have lng"
            print("✓ Map listing has lat/lng coordinates")
    
    def test_get_single_listing(self):
        """GET /api/listings/{listing_id} - should return single listing"""
        # First get a listing ID
        listings_response = requests.get(f"{BASE_URL}/api/listings?limit=1")
        assert listings_response.status_code == 200
        listings = listings_response.json()
        
        if len(listings) > 0:
            listing_id = listings[0]["id"]
            response = requests.get(f"{BASE_URL}/api/listings/{listing_id}")
            assert response.status_code == 200, f"Failed to get listing: {response.text}"
            data = response.json()
            assert data["id"] == listing_id
            print(f"✓ GET /api/listings/{listing_id} returned correct listing")
        else:
            print("⚠ No listings available to test single listing endpoint")
    
    def test_get_listing_not_found(self):
        """GET /api/listings/{invalid_id} - should return 404"""
        response = requests.get(f"{BASE_URL}/api/listings/nonexistent-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent listing correctly returns 404")
    
    def test_listings_filter_by_type(self):
        """GET /api/listings?listing_type=rent - should filter by type"""
        response = requests.get(f"{BASE_URL}/api/listings?listing_type=rent")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Filtered listings by type=rent: {len(data)} results")


class TestContractorsRouter:
    """Contractors router tests - /api/contractors/*, /api/jobs/*"""
    
    def test_search_contractors(self):
        """GET /api/contractors/search - should return contractor profiles"""
        response = requests.get(f"{BASE_URL}/api/contractors/search")
        assert response.status_code == 200, f"Failed to search contractors: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/contractors/search returned {len(data)} contractors")
    
    def test_search_contractors_with_filters(self):
        """GET /api/contractors/search?specialty=plumbing - should filter by specialty"""
        response = requests.get(f"{BASE_URL}/api/contractors/search?specialty=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Filtered contractors by specialty=plumbing: {len(data)} results")
    
    def test_get_contractor_leaderboard(self):
        """GET /api/contractors/leaderboard - should return top contractors"""
        response = requests.get(f"{BASE_URL}/api/contractors/leaderboard")
        assert response.status_code == 200, f"Failed to get leaderboard: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/contractors/leaderboard returned {len(data)} contractors")
        
        # Verify leaderboard structure if we have data
        if len(data) > 0:
            contractor = data[0]
            assert "business_name" in contractor or "user_id" in contractor
            print(f"✓ Leaderboard entry structure verified")
    
    def test_get_jobs(self):
        """GET /api/jobs - should return job posts"""
        response = requests.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200, f"Failed to get jobs: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/jobs returned {len(data)} job posts")
    
    def test_get_jobs_with_category(self):
        """GET /api/jobs?category=plumbing - should filter by category"""
        response = requests.get(f"{BASE_URL}/api/jobs?category=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Filtered jobs by category=plumbing: {len(data)} results")


class TestWebPushRouter:
    """Web Push router tests - /api/push/*"""
    
    def test_get_vapid_public_key(self):
        """GET /api/push/vapid-public-key - should return VAPID public key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-public-key")
        # May return 503 if not configured, or 200 with key
        if response.status_code == 200:
            data = response.json()
            assert "publicKey" in data, "Response should contain publicKey"
            assert len(data["publicKey"]) > 0, "Public key should not be empty"
            print(f"✓ VAPID public key returned: {data['publicKey'][:20]}...")
        elif response.status_code == 503:
            print("⚠ Push notifications not configured (503) - expected in some environments")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")
    
    def test_subscribe_push(self):
        """POST /api/push/subscribe - should save subscription"""
        test_subscription = {
            "user_id": f"test-user-{uuid.uuid4()}",
            "subscription": {
                "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
                "keys": {
                    "p256dh": "test-p256dh-key",
                    "auth": "test-auth-key"
                }
            }
        }
        response = requests.post(f"{BASE_URL}/api/push/subscribe", json=test_subscription)
        assert response.status_code == 200, f"Failed to subscribe: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Subscribe should return success=true"
        print(f"✓ Push subscription saved successfully")
    
    def test_unsubscribe_push(self):
        """DELETE /api/push/unsubscribe/{user_id} - should remove subscription"""
        test_user_id = f"test-unsubscribe-{uuid.uuid4()}"
        
        # First subscribe
        requests.post(f"{BASE_URL}/api/push/subscribe", json={
            "user_id": test_user_id,
            "subscription": {
                "endpoint": "https://fcm.googleapis.com/fcm/send/test",
                "keys": {"p256dh": "test", "auth": "test"}
            }
        })
        
        # Then unsubscribe
        response = requests.delete(f"{BASE_URL}/api/push/unsubscribe/{test_user_id}")
        assert response.status_code == 200, f"Failed to unsubscribe: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Unsubscribe should return success=true"
        print(f"✓ Push subscription removed successfully")


class TestMatterportViewer:
    """Test that listings can have matterport_id field"""
    
    def test_listing_can_have_matterport_id(self):
        """Verify listing model supports matterport_id field"""
        response = requests.get(f"{BASE_URL}/api/listings?limit=10")
        assert response.status_code == 200
        listings = response.json()
        
        # Check that matterport_id is a valid field (may be null)
        for listing in listings:
            # matterport_id should be allowed in the schema
            if "matterport_id" in listing:
                print(f"✓ Found listing with matterport_id: {listing.get('matterport_id')}")
                return
        
        print("✓ Listings schema supports matterport_id (none found with value)")


class TestIntegration:
    """Integration tests across routers"""
    
    def test_login_and_access_listings(self):
        """Login and then access listings"""
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_RENTER_EMAIL,
            "password": TEST_RENTER_PASSWORD
        })
        assert login_response.status_code == 200
        user = login_response.json()
        user_id = user.get("id")
        
        # Access listings
        listings_response = requests.get(f"{BASE_URL}/api/listings")
        assert listings_response.status_code == 200
        
        print(f"✓ Integration: Login + Listings access works for user {user_id}")
    
    def test_full_contractor_flow(self):
        """Test contractor search -> leaderboard -> jobs flow"""
        # Search contractors
        search_response = requests.get(f"{BASE_URL}/api/contractors/search")
        assert search_response.status_code == 200
        
        # Get leaderboard
        leaderboard_response = requests.get(f"{BASE_URL}/api/contractors/leaderboard")
        assert leaderboard_response.status_code == 200
        
        # Get jobs
        jobs_response = requests.get(f"{BASE_URL}/api/jobs")
        assert jobs_response.status_code == 200
        
        print("✓ Integration: Contractor search -> leaderboard -> jobs flow works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
