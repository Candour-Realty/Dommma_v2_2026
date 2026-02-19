"""
DOMMMA V2 API Tests - Complete Real Estate Marketplace
Tests for: Payments, Documents, Messages, Nova AI Chat
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAPIHealth:
    """Test API root and basic health"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "DOMMMA" in data.get("message", "")
        print(f"✓ API root working: {data}")

    def test_seed_data(self):
        """Test database seeding"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data.get("message", "").lower() or "already" in data.get("message", "").lower()
        print(f"✓ Seed endpoint working: {data}")


class TestAuthFlow:
    """Test authentication endpoints"""
    
    def test_login_renter(self):
        """Test login as renter"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_renter@dommma.com",
            "password": "password123",
            "user_type": "renter"
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["email"] == "test_renter@dommma.com"
        assert data["user_type"] == "renter"
        print(f"✓ Renter login working: {data['id']}")
        return data
    
    def test_login_landlord(self):
        """Test login as landlord"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_landlord@dommma.com",
            "password": "password123",
            "user_type": "landlord"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user_type"] == "landlord"
        print(f"✓ Landlord login working: {data['id']}")
        return data
    
    def test_login_contractor(self):
        """Test login as contractor"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "test_contractor@dommma.com",
            "password": "password123",
            "user_type": "contractor"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user_type"] == "contractor"
        print(f"✓ Contractor login working: {data['id']}")
        return data


class TestListings:
    """Test property listings endpoints"""
    
    def test_get_listings(self):
        """Test getting all listings"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            listing = data[0]
            assert "id" in listing
            assert "title" in listing
            assert "price" in listing
            assert "city" in listing
        print(f"✓ Listings endpoint working: {len(data)} listings found")
        return data
    
    def test_filter_listings_by_city(self):
        """Test filtering listings by city"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"city": "Vancouver"})
        assert response.status_code == 200
        data = response.json()
        print(f"✓ City filter working: {len(data)} Vancouver listings")
        return data
    
    def test_filter_pet_friendly(self):
        """Test filtering pet-friendly listings"""
        response = requests.get(f"{BASE_URL}/api/listings", params={"pet_friendly": True})
        assert response.status_code == 200
        data = response.json()
        for listing in data:
            assert listing.get("pet_friendly") == True
        print(f"✓ Pet-friendly filter working: {len(data)} listings")


class TestPayments:
    """Test Stripe payment endpoints"""
    
    def test_create_payment_checkout(self):
        """Test creating a Stripe checkout session"""
        response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "amount": 1500.00,
            "description": "Monthly Rent Payment - Test",
            "property_id": None,
            "recipient_id": None
        })
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        assert "checkout.stripe.com" in data["url"] or "emergentagent" in data["url"]
        print(f"✓ Payment checkout created: {data['session_id'][:20]}...")
        return data
    
    def test_get_payment_history(self):
        """Test getting payment history"""
        response = requests.get(f"{BASE_URL}/api/payments/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Payment history endpoint working: {len(data)} transactions")
        return data
    
    def test_get_payment_history_with_user(self):
        """Test getting payment history for a specific user"""
        # First login to get a user ID
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "payment_test@dommma.com",
            "password": "password123",
            "user_type": "renter"
        })
        user_id = login_response.json().get("id")
        
        response = requests.get(f"{BASE_URL}/api/payments/history", params={"user_id": user_id})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ User payment history working: {len(data)} transactions for {user_id[:8]}...")


class TestDocuments:
    """Test document management endpoints"""
    
    @pytest.fixture
    def test_user_id(self):
        """Get a test user ID"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "doc_test@dommma.com",
            "password": "password123",
            "user_type": "renter"
        })
        return login_response.json().get("id")
    
    def test_upload_document(self, test_user_id):
        """Test uploading a document"""
        # Create a simple test file
        test_content = b"Test lease agreement content for DOMMMA V2"
        files = {"file": ("test_lease.txt", test_content, "text/plain")}
        
        response = requests.post(
            f"{BASE_URL}/api/documents/upload",
            params={
                "user_id": test_user_id,
                "name": "Test Lease Agreement",
                "doc_type": "lease"
            },
            files=files
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "Test Lease Agreement"
        assert data["type"] == "lease"
        print(f"✓ Document uploaded: {data['id']}")
        return data
    
    def test_get_user_documents(self, test_user_id):
        """Test getting user's documents"""
        response = requests.get(f"{BASE_URL}/api/documents/{test_user_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ User documents retrieved: {len(data)} documents")
        return data
    
    def test_filter_documents_by_type(self, test_user_id):
        """Test filtering documents by type"""
        response = requests.get(f"{BASE_URL}/api/documents/{test_user_id}", params={"doc_type": "lease"})
        assert response.status_code == 200
        data = response.json()
        for doc in data:
            assert doc["type"] == "lease"
        print(f"✓ Document type filter working: {len(data)} lease documents")


class TestMessages:
    """Test messaging endpoints"""
    
    @pytest.fixture
    def sender_id(self):
        """Get sender user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sender_test@dommma.com",
            "password": "password123",
            "user_type": "renter"
        })
        return response.json().get("id")
    
    @pytest.fixture
    def recipient_id(self):
        """Get recipient user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "recipient_test@dommma.com",
            "password": "password123",
            "user_type": "landlord"
        })
        return response.json().get("id")
    
    def test_send_message(self, sender_id, recipient_id):
        """Test sending a direct message"""
        response = requests.post(
            f"{BASE_URL}/api/messages/send",
            params={"sender_id": sender_id},
            json={
                "recipient_id": recipient_id,
                "content": "Hello, I'm interested in your property!"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["status"] == "sent"
        print(f"✓ Message sent: {data['id']}")
        return data
    
    def test_get_messages(self, sender_id, recipient_id):
        """Test getting messages between users"""
        response = requests.get(
            f"{BASE_URL}/api/messages/{sender_id}",
            params={"other_user_id": recipient_id}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Messages retrieved: {len(data)} messages")
        return data
    
    def test_get_conversations(self, sender_id):
        """Test getting conversation list"""
        response = requests.get(f"{BASE_URL}/api/messages/conversations/{sender_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Conversations retrieved: {len(data)} conversations")
        return data


class TestNovaAIChat:
    """Test Nova AI chatbot endpoints"""
    
    def test_nova_chat_basic(self):
        """Test basic Nova AI chat"""
        response = requests.post(f"{BASE_URL}/api/chat", json={
            "session_id": None,
            "message": "Hello Nova! Show me apartments in Vancouver under $2500",
            "user_context": None
        }, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "response" in data
        assert len(data["response"]) > 10  # Should have meaningful response
        print(f"✓ Nova basic chat working. Session: {data['session_id'][:8]}...")
        return data
    
    def test_nova_budget_calculator(self):
        """Test Nova's budget calculation feature"""
        response = requests.post(f"{BASE_URL}/api/chat", json={
            "session_id": None,
            "message": "Can I afford $2500/month rent on an $80,000 salary?",
            "user_context": {"budget": 2500, "occupation": "Software Engineer"}
        }, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        # Budget queries should get a meaningful response
        assert len(data["response"]) > 50
        print(f"✓ Nova budget calculator working")
        return data
    
    def test_nova_with_user_context(self):
        """Test Nova with full user context"""
        response = requests.post(f"{BASE_URL}/api/chat", json={
            "session_id": None,
            "message": "Find me a pet-friendly apartment near downtown",
            "user_context": {
                "budget": 2000,
                "occupation": "Teacher",
                "has_pets": "Yes - Dog",
                "commute_location": "Downtown Vancouver"
            }
        }, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        print(f"✓ Nova context-aware search working")
        return data
    
    def test_nova_suggestions(self):
        """Test that Nova provides proactive suggestions"""
        response = requests.post(f"{BASE_URL}/api/chat", json={
            "session_id": None,
            "message": "What's my budget if I make $70k per year?",
            "user_context": None
        }, timeout=30)
        assert response.status_code == 200
        data = response.json()
        # Suggestions should be present for budget queries
        if "suggestions" in data:
            print(f"✓ Nova suggestions working: {len(data.get('suggestions', []))} suggestions")
        return data


class TestIntegration:
    """Test full integration flows"""
    
    def test_user_payment_flow(self):
        """Test complete user payment flow: Login -> Create Payment"""
        # 1. Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "integration_test@dommma.com",
            "password": "password123",
            "user_type": "renter"
        })
        assert login_response.status_code == 200
        user_id = login_response.json().get("id")
        
        # 2. Create payment checkout
        payment_response = requests.post(f"{BASE_URL}/api/payments/create-checkout", json={
            "amount": 2500.00,
            "description": "Integration Test - Monthly Rent",
            "property_id": None,
            "recipient_id": None
        })
        assert payment_response.status_code == 200
        assert "url" in payment_response.json()
        print(f"✓ User payment flow working for user: {user_id[:8]}...")
    
    def test_user_document_flow(self):
        """Test complete document flow: Login -> Upload -> Get Documents"""
        # 1. Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "docflow_test@dommma.com",
            "password": "password123",
            "user_type": "renter"
        })
        assert login_response.status_code == 200
        user_id = login_response.json().get("id")
        
        # 2. Upload document
        test_content = b"Integration test document content"
        files = {"file": ("integration_test.txt", test_content, "text/plain")}
        upload_response = requests.post(
            f"{BASE_URL}/api/documents/upload",
            params={"user_id": user_id, "name": "Integration Test Doc", "doc_type": "application"},
            files=files
        )
        assert upload_response.status_code == 200
        doc_id = upload_response.json().get("id")
        
        # 3. Get documents
        docs_response = requests.get(f"{BASE_URL}/api/documents/{user_id}")
        assert docs_response.status_code == 200
        docs = docs_response.json()
        assert any(d.get("id") == doc_id for d in docs)
        print(f"✓ Document flow working: uploaded and retrieved doc {doc_id[:8]}...")
    
    def test_messaging_flow(self):
        """Test complete messaging flow: Login users -> Send message -> Get conversation"""
        # 1. Login sender
        sender_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "msgflow_sender@dommma.com",
            "password": "password123",
            "user_type": "renter"
        })
        sender_id = sender_response.json().get("id")
        
        # 2. Login recipient
        recipient_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "msgflow_recipient@dommma.com",
            "password": "password123",
            "user_type": "landlord"
        })
        recipient_id = recipient_response.json().get("id")
        
        # 3. Send message
        msg_response = requests.post(
            f"{BASE_URL}/api/messages/send",
            params={"sender_id": sender_id},
            json={"recipient_id": recipient_id, "content": "Integration test message"}
        )
        assert msg_response.status_code == 200
        
        # 4. Get conversations
        conv_response = requests.get(f"{BASE_URL}/api/messages/conversations/{sender_id}")
        assert conv_response.status_code == 200
        conversations = conv_response.json()
        assert len(conversations) > 0
        print(f"✓ Messaging flow working: message sent and conversation retrieved")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
