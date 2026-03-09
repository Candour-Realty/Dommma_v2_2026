"""
Backend tests for email verification functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestEmailVerification:
    """Tests for email verification endpoints"""
    
    def test_verify_email_invalid_token(self):
        """Test that invalid token returns proper error"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-email", params={"token": "invalid_token_12345"})
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Invalid" in data["detail"] or "invalid" in data["detail"].lower()
    
    def test_verify_email_expired_token(self):
        """Test that expired token returns proper error"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-email", params={"token": "expired_token_abc123"})
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_verify_email_missing_token(self):
        """Test that missing token returns proper error"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-email")
        
        # Should return 422 for missing required parameter
        assert response.status_code == 422
    
    def test_resend_verification_invalid_email(self):
        """Test resend verification with non-existent email - should succeed (security)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/resend-verification",
            json={"email": "nonexistent_user_12345@example.com"}
        )
        
        # Returns 200 for security (doesn't reveal if email exists)
        # This is correct behavior to prevent email enumeration
        assert response.status_code == 200
    
    def test_resend_verification_missing_email(self):
        """Test resend verification with missing email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/resend-verification",
            json={}
        )
        
        # Should return 422 for missing required field
        assert response.status_code == 422


class TestPaymentTypes:
    """Tests for payment types endpoint used by Payments page"""
    
    def test_get_payment_types_renter(self):
        """Test payment types for renter"""
        response = requests.get(f"{BASE_URL}/api/payments/types/renter")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Renter should have payment options like rent, utilities, etc.
        assert len(data) > 0
    
    def test_get_payment_types_contractor(self):
        """Test payment types for contractor"""
        response = requests.get(f"{BASE_URL}/api/payments/types/contractor")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_get_payment_types_landlord(self):
        """Test payment types for landlord"""
        response = requests.get(f"{BASE_URL}/api/payments/types/landlord")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0


class TestHomepageEndpoints:
    """Tests for homepage data endpoints"""
    
    def test_listings_for_rent(self):
        """Test listings endpoint for rental properties"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"listing_type": "rent"})
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_listings_for_sale(self):
        """Test listings endpoint for sale properties"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"listing_type": "sale"})
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_contractors_search(self):
        """Test contractors search endpoint"""
        response = requests.get(f"{BASE_URL}/api/contractors/search")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestLoginEndpoint:
    """Tests for login functionality"""
    
    def test_login_with_valid_credentials(self):
        """Test login with valid test renter credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test_renter@example.com",
                "password": "test123456"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["email"] == "test_renter@example.com"
        assert data["user_type"] == "renter"
    
    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        
        # Should return 401 or 404
        assert response.status_code in [401, 404]
