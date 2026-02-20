"""
Test Moving Quote API with AI Tips Enhancement
Tests real pricing calculations and AI-powered recommendations using Claude
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMovingQuotePricingInfo:
    """Test the pricing info endpoint"""
    
    def test_get_pricing_info(self):
        """GET /api/moving/pricing-info returns pricing configuration"""
        response = requests.get(f"{BASE_URL}/api/moving/pricing-info")
        assert response.status_code == 200
        
        data = response.json()
        # Verify structure
        assert "home_sizes" in data
        assert "special_items" in data
        assert "services" in data
        assert "notes" in data
        assert "ai_features" in data
        
        # Verify home sizes
        assert len(data["home_sizes"]) == 6
        home_size_values = [h["value"] for h in data["home_sizes"]]
        assert "studio" in home_size_values
        assert "2br" in home_size_values
        assert "house" in home_size_values
        
        # Verify special items
        special_item_values = [s["value"] for s in data["special_items"]]
        assert "piano" in special_item_values
        assert "hot_tub" in special_item_values
        
        # Verify AI features are listed
        assert len(data["ai_features"]) >= 3
        print(f"PASSED: Pricing info returned with {len(data['home_sizes'])} home sizes, {len(data['special_items'])} special items, and {len(data['ai_features'])} AI features")


class TestMovingQuoteGeneration:
    """Test quote generation with real pricing calculations"""
    
    def test_basic_quote_generation(self):
        """POST /api/moving/quote generates quote with real calculations"""
        payload = {
            "origin_address": "Downtown Vancouver",
            "destination_address": "Burnaby",
            "home_size": "2br",
            "move_date": "2026-03-15",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": [],
            "packing_service": False,
            "storage_needed": False
        }
        
        response = requests.post(f"{BASE_URL}/api/moving/quote", json=payload)
        assert response.status_code == 200
        
        quote = response.json()
        
        # Verify quote structure
        assert "id" in quote
        assert "estimated_cost_low" in quote
        assert "estimated_cost_high" in quote
        assert "estimated_hours" in quote
        assert "distance_km" in quote
        assert "truck_size" in quote
        assert "crew_size" in quote
        
        # Verify calculations are reasonable
        assert quote["estimated_cost_low"] > 0
        assert quote["estimated_cost_high"] > quote["estimated_cost_low"]
        assert quote["estimated_hours"] > 0
        assert quote["distance_km"] > 0
        assert quote["truck_size"] == "medium"  # 2br should get medium truck
        assert quote["crew_size"] == 3  # Medium truck has 3 crew
        
        print(f"PASSED: Basic quote generated - ${quote['estimated_cost_low']:.2f} - ${quote['estimated_cost_high']:.2f} for {quote['distance_km']}km")
        return quote["id"]
    
    def test_quote_with_special_items(self):
        """Quote includes special item surcharges"""
        payload = {
            "origin_address": "Kitsilano Vancouver",
            "destination_address": "Richmond",
            "home_size": "3br",
            "move_date": "2026-04-01",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": ["piano", "pool_table"],  # $300 + $250 = $550 surcharge
            "packing_service": False,
            "storage_needed": False
        }
        
        response = requests.post(f"{BASE_URL}/api/moving/quote", json=payload)
        assert response.status_code == 200
        
        quote = response.json()
        
        # Should have notes about special handling
        assert len(quote.get("notes", [])) > 0
        notes_text = " ".join(quote["notes"])
        assert "piano" in notes_text.lower() or "special" in notes_text.lower()
        
        print(f"PASSED: Quote with special items - ${quote['estimated_cost_low']:.2f} - ${quote['estimated_cost_high']:.2f}")
    
    def test_quote_with_floor_surcharges(self):
        """Quote includes floor surcharges when no elevator"""
        payload = {
            "origin_address": "Mount Pleasant Vancouver",
            "destination_address": "East Vancouver",
            "home_size": "1br",
            "move_date": "2026-03-20",
            "has_elevator_origin": False,
            "has_elevator_destination": False,
            "floor_origin": 4,  # 3 floors carry = $150
            "floor_destination": 3,  # 2 floors carry = $100
            "special_items": [],
            "packing_service": False,
            "storage_needed": False
        }
        
        response = requests.post(f"{BASE_URL}/api/moving/quote", json=payload)
        assert response.status_code == 200
        
        quote = response.json()
        
        # Should have stair carry note
        notes_text = " ".join(quote.get("notes", []))
        assert "stair" in notes_text.lower() or "floor" in notes_text.lower()
        
        print(f"PASSED: Quote with floor surcharges - ${quote['estimated_cost_low']:.2f} - ${quote['estimated_cost_high']:.2f}")
    
    def test_quote_with_packing_service(self):
        """Quote applies packing service multiplier"""
        payload_without = {
            "origin_address": "West End Vancouver",
            "destination_address": "Yaletown",
            "home_size": "2br",
            "move_date": "2026-05-01",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": [],
            "packing_service": False,
            "storage_needed": False
        }
        
        payload_with = payload_without.copy()
        payload_with["packing_service"] = True
        
        response_without = requests.post(f"{BASE_URL}/api/moving/quote", json=payload_without)
        response_with = requests.post(f"{BASE_URL}/api/moving/quote", json=payload_with)
        
        assert response_without.status_code == 200
        assert response_with.status_code == 200
        
        quote_without = response_without.json()
        quote_with = response_with.json()
        
        # Packing should increase cost by ~40%
        assert quote_with["estimated_cost_low"] > quote_without["estimated_cost_low"]
        assert quote_with["includes_packing"] == True
        assert quote_without["includes_packing"] == False
        
        # Check notes mention packing
        notes_text = " ".join(quote_with.get("notes", []))
        assert "packing" in notes_text.lower()
        
        print(f"PASSED: Packing service increases cost from ${quote_without['estimated_cost_low']:.2f} to ${quote_with['estimated_cost_low']:.2f}")
    
    def test_quote_with_storage(self):
        """Quote calculates storage costs"""
        payload = {
            "origin_address": "Downtown Vancouver",
            "destination_address": "Surrey",
            "home_size": "3br",
            "move_date": "2026-06-01",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": [],
            "packing_service": False,
            "storage_needed": True,
            "storage_duration_months": 3
        }
        
        response = requests.post(f"{BASE_URL}/api/moving/quote", json=payload)
        assert response.status_code == 200
        
        quote = response.json()
        
        assert quote["includes_storage"] == True
        assert quote["storage_monthly_cost"] is not None
        assert quote["storage_monthly_cost"] > 0
        
        print(f"PASSED: Quote with storage - monthly cost ${quote['storage_monthly_cost']:.2f}")


class TestMovingQuoteAITips:
    """Test AI-powered tips generation using Claude"""
    
    def test_quote_with_ai_tips_included(self):
        """POST /api/moving/quote?include_ai_tips=true returns AI tips with quote"""
        payload = {
            "origin_address": "Downtown Vancouver",
            "destination_address": "North Vancouver",
            "home_size": "2br",
            "move_date": "2026-04-15",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 5,
            "floor_destination": 10,
            "special_items": ["artwork"],
            "packing_service": True,
            "storage_needed": False
        }
        
        response = requests.post(f"{BASE_URL}/api/moving/quote?include_ai_tips=true", json=payload)
        assert response.status_code == 200
        
        quote = response.json()
        
        # Verify AI tips are included
        assert "ai_tips" in quote
        ai_tips = quote["ai_tips"]
        
        # Verify AI tips structure
        assert "summary" in ai_tips
        assert "money_saving_tips" in ai_tips
        assert "preparation_checklist" in ai_tips
        assert "moving_day_tips" in ai_tips
        assert "neighborhood_info" in ai_tips
        assert "timing_advice" in ai_tips
        
        # Verify AI tips content
        assert len(ai_tips["summary"]) > 20
        assert len(ai_tips["money_saving_tips"]) >= 3
        assert len(ai_tips["preparation_checklist"]) >= 5
        assert len(ai_tips["moving_day_tips"]) >= 3
        assert len(ai_tips["neighborhood_info"]) > 20
        assert len(ai_tips["timing_advice"]) > 20
        
        print(f"PASSED: Quote with AI tips - summary: {ai_tips['summary'][:80]}...")
        return quote["id"]
    
    def test_ai_tips_for_existing_quote(self):
        """POST /api/moving/quote/{id}/ai-tips gets AI tips for existing quote"""
        # First create a quote without AI tips
        payload = {
            "origin_address": "Coquitlam",
            "destination_address": "New Westminster",
            "home_size": "studio",
            "move_date": "2026-05-01",
            "has_elevator_origin": True,
            "has_elevator_destination": False,
            "floor_origin": 1,
            "floor_destination": 2,
            "special_items": [],
            "packing_service": False,
            "storage_needed": False
        }
        
        response = requests.post(f"{BASE_URL}/api/moving/quote", json=payload)
        assert response.status_code == 200
        quote = response.json()
        quote_id = quote["id"]
        
        # Verify no AI tips initially
        assert "ai_tips" not in quote or quote.get("ai_tips") is None
        
        # Now get AI tips for the quote
        tips_response = requests.post(f"{BASE_URL}/api/moving/quote/{quote_id}/ai-tips")
        assert tips_response.status_code == 200
        
        ai_tips = tips_response.json()
        
        # Verify structure
        assert "summary" in ai_tips
        assert "money_saving_tips" in ai_tips
        assert "preparation_checklist" in ai_tips
        assert "moving_day_tips" in ai_tips
        
        print(f"PASSED: AI tips for existing quote retrieved - {len(ai_tips['money_saving_tips'])} money saving tips")
    
    def test_ai_tips_for_nonexistent_quote(self):
        """POST /api/moving/quote/{id}/ai-tips returns 404 for nonexistent quote"""
        response = requests.post(f"{BASE_URL}/api/moving/quote/nonexistent-id-12345/ai-tips")
        assert response.status_code == 404
        print("PASSED: 404 returned for nonexistent quote AI tips")


class TestMovingQuoteRetrieval:
    """Test quote retrieval endpoints"""
    
    def test_get_quote_by_id(self):
        """GET /api/moving/quote/{id} retrieves existing quote"""
        # Create a quote first
        payload = {
            "origin_address": "Richmond",
            "destination_address": "Surrey",
            "home_size": "4br+",
            "move_date": "2026-07-01",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": ["gym_equipment"],
            "packing_service": False,
            "storage_needed": False
        }
        
        create_response = requests.post(f"{BASE_URL}/api/moving/quote", json=payload)
        assert create_response.status_code == 200
        created_quote = create_response.json()
        quote_id = created_quote["id"]
        
        # Retrieve the quote
        get_response = requests.get(f"{BASE_URL}/api/moving/quote/{quote_id}")
        assert get_response.status_code == 200
        
        retrieved_quote = get_response.json()
        
        # Verify data matches
        assert retrieved_quote["id"] == quote_id
        assert retrieved_quote["estimated_cost_low"] == created_quote["estimated_cost_low"]
        assert retrieved_quote["truck_size"] == "large"  # 4br+ gets large truck
        
        print(f"PASSED: Quote retrieved by ID - truck size: {retrieved_quote['truck_size']}")
    
    def test_get_nonexistent_quote(self):
        """GET /api/moving/quote/{id} returns 404 for nonexistent quote"""
        response = requests.get(f"{BASE_URL}/api/moving/quote/fake-quote-id-99999")
        assert response.status_code == 404
        print("PASSED: 404 returned for nonexistent quote")


class TestMovingQuoteDistanceCalculation:
    """Test distance calculation between Vancouver areas"""
    
    def test_short_distance_move(self):
        """Short distance move within same area"""
        payload = {
            "origin_address": "Downtown Vancouver",
            "destination_address": "Yaletown Vancouver",
            "home_size": "studio",
            "move_date": "2026-03-01",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": [],
            "packing_service": False,
            "storage_needed": False
        }
        
        response = requests.post(f"{BASE_URL}/api/moving/quote", json=payload)
        assert response.status_code == 200
        
        quote = response.json()
        # Minimum distance of 5km applies
        assert quote["distance_km"] >= 5.0
        print(f"PASSED: Short distance move - {quote['distance_km']} km")
    
    def test_longer_distance_move(self):
        """Longer distance move to different city"""
        payload = {
            "origin_address": "Downtown Vancouver",
            "destination_address": "Surrey",
            "home_size": "house",
            "move_date": "2026-03-01",
            "has_elevator_origin": True,
            "has_elevator_destination": True,
            "floor_origin": 1,
            "floor_destination": 1,
            "special_items": [],
            "packing_service": False,
            "storage_needed": False
        }
        
        response = requests.post(f"{BASE_URL}/api/moving/quote", json=payload)
        assert response.status_code == 200
        
        quote = response.json()
        # Surrey should be farther than minimum
        assert quote["distance_km"] > 10.0
        # Should include long distance note
        assert quote["truck_size"] == "large"  # house gets large truck
        assert quote["crew_size"] == 4
        
        print(f"PASSED: Long distance move - {quote['distance_km']} km, ${quote['estimated_cost_low']:.2f}-${quote['estimated_cost_high']:.2f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
