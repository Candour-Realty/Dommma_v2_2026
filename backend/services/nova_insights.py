"""
Nova Insights Service - Personal analytics and AI-generated insights
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from collections import Counter

logger = logging.getLogger(__name__)


class NovaInsightsService:
    def __init__(self, db):
        self.db = db
        self.api_key = os.environ.get('EMERGENT_LLM_KEY', '')
    
    async def get_user_insights(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive insights for a user"""
        insights = {
            "search_history": await self._get_search_history(user_id),
            "preference_evolution": await self._get_preference_evolution(user_id),
            "market_trends": await self._get_personalized_market_trends(user_id),
            "moving_timeline": await self._generate_moving_timeline(user_id),
            "property_match_scores": await self._get_match_scores(user_id),
            "activity_summary": await self._get_activity_summary(user_id),
            "recommendations": await self._generate_recommendations(user_id)
        }
        
        return insights
    
    async def _get_search_history(self, user_id: str) -> Dict[str, Any]:
        """Get user's search history and patterns"""
        # Get recent interactions
        interactions = await self.db.nova_interactions.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(100).to_list(100)
        
        # Get saved searches
        saved = await self.db.saved_searches.find(
            {"user_id": user_id}
        ).sort("created_at", -1).to_list(20)
        
        # Analyze search patterns
        search_terms = []
        for interaction in interactions:
            msg = interaction.get("message", "").lower()
            # Extract key terms
            if "bedroom" in msg or "bed" in msg:
                search_terms.append("bedrooms")
            if any(area in msg for area in ["downtown", "kitsilano", "yaletown", "burnaby"]):
                search_terms.append("location")
            if "$" in msg or "budget" in msg:
                search_terms.append("budget")
            if "pet" in msg:
                search_terms.append("pets")
        
        term_counts = Counter(search_terms)
        
        return {
            "total_searches": len(interactions),
            "saved_searches": len(saved),
            "top_search_topics": dict(term_counts.most_common(5)),
            "recent_searches": [
                {
                    "query": i.get("message", "")[:100],
                    "timestamp": i.get("timestamp")
                }
                for i in interactions[:5]
            ]
        }
    
    async def _get_preference_evolution(self, user_id: str) -> Dict[str, Any]:
        """Track how user preferences have evolved"""
        # Get user profile history (we'd need to track this over time)
        profile = await self.db.nova_user_profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        
        prefs = profile.get("preferences", {}) if profile else {}
        
        # Get interactions to see preference evolution
        interactions = await self.db.nova_interactions.find(
            {"user_id": user_id}
        ).sort("timestamp", 1).limit(100).to_list(100)
        
        # Track budget mentions over time
        budget_evolution = []
        for interaction in interactions:
            context = interaction.get("context", {})
            if context.get("budget"):
                budget_evolution.append({
                    "timestamp": interaction.get("timestamp"),
                    "budget": context.get("budget")
                })
        
        return {
            "current_preferences": prefs,
            "budget_evolution": budget_evolution[-10:] if budget_evolution else [],
            "areas_of_interest": prefs.get("preferred_areas", []),
            "preference_completeness": self._calculate_profile_completeness(prefs)
        }
    
    def _calculate_profile_completeness(self, prefs: dict) -> int:
        """Calculate how complete the preference profile is"""
        fields = ["max_budget", "bedrooms", "preferred_areas", "pet_friendly", 
                  "commute_to", "preferred_property_type"]
        filled = sum(1 for f in fields if prefs.get(f))
        return int((filled / len(fields)) * 100)
    
    async def _get_personalized_market_trends(self, user_id: str) -> Dict[str, Any]:
        """Get market trends personalized to user preferences"""
        profile = await self.db.nova_user_profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        prefs = profile.get("preferences", {}) if profile else {}
        
        # Get listings matching preferences
        query = {"status": "active"}
        if prefs.get("max_budget"):
            query["price"] = {"$lte": prefs["max_budget"]}
        if prefs.get("bedrooms"):
            query["bedrooms"] = prefs["bedrooms"]
        
        listings = await self.db.listings.find(query, {"_id": 0}).to_list(100)
        
        if not listings:
            return {
                "average_price": 0,
                "price_range": {"min": 0, "max": 0},
                "availability": "No matching listings",
                "competition_level": "Unknown",
                "trend": "neutral"
            }
        
        prices = [l.get("price", 0) for l in listings if l.get("price")]
        
        # Simulated market trends (in production, compare to historical data)
        return {
            "average_price": sum(prices) / len(prices) if prices else 0,
            "price_range": {"min": min(prices) if prices else 0, "max": max(prices) if prices else 0},
            "total_matching_listings": len(listings),
            "availability": "High" if len(listings) > 20 else "Moderate" if len(listings) > 10 else "Low",
            "competition_level": "High" if len(listings) < 10 else "Moderate",
            "trend": "stable",  # In production, compare to last month
            "best_value_areas": ["East Vancouver", "Mount Pleasant", "Burnaby"],  # Simulated
            "insight": f"Found {len(listings)} listings matching your preferences. Average price: ${sum(prices)//len(prices) if prices else 0}/month"
        }
    
    async def _generate_moving_timeline(self, user_id: str) -> Dict[str, Any]:
        """Generate AI-powered moving timeline based on user activity"""
        profile = await self.db.nova_user_profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        prefs = profile.get("preferences", {}) if profile else {}
        
        # Get user's calendar events
        events = await self.db.calendar_events.find(
            {"user_id": user_id, "event_type": {"$in": ["viewing", "moving"]}}
        ).sort("start_time", 1).to_list(20)
        
        # Get recent activity
        interactions = await self.db.nova_interactions.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(20).to_list(20)
        
        # Calculate activity level
        recent_count = len([i for i in interactions if i.get("timestamp", "") > 
                          (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()])
        
        activity_level = "High" if recent_count > 10 else "Moderate" if recent_count > 3 else "Low"
        
        # Generate timeline phases
        today = datetime.now(timezone.utc)
        
        timeline = {
            "current_phase": self._determine_phase(interactions, events, prefs),
            "activity_level": activity_level,
            "estimated_move_date": None,
            "phases": [
                {
                    "name": "Research",
                    "status": "completed" if len(interactions) > 10 else "in_progress" if len(interactions) > 0 else "not_started",
                    "description": "Browse listings, define preferences",
                    "tasks": ["Set budget", "Choose preferred areas", "Define must-haves"]
                },
                {
                    "name": "Active Search",
                    "status": "in_progress" if events else "not_started",
                    "description": "Schedule viewings, compare properties",
                    "tasks": ["Schedule viewings", "Compare properties", "Save favorites"]
                },
                {
                    "name": "Application",
                    "status": "not_started",
                    "description": "Submit applications, prepare documents",
                    "tasks": ["Prepare rental resume", "Gather references", "Submit applications"]
                },
                {
                    "name": "Move Preparation",
                    "status": "not_started",
                    "description": "Plan the move, hire movers",
                    "tasks": ["Get moving quotes", "Pack belongings", "Set up utilities"]
                }
            ],
            "upcoming_tasks": [],
            "completed_tasks": []
        }
        
        # Add upcoming events as tasks
        for event in events[:5]:
            timeline["upcoming_tasks"].append({
                "task": event.get("title", "Scheduled event"),
                "date": event.get("start_time"),
                "type": event.get("event_type")
            })
        
        return timeline
    
    def _determine_phase(self, interactions: list, events: list, prefs: dict) -> str:
        """Determine user's current phase in the moving journey"""
        if not interactions:
            return "Not Started"
        
        # Check if they have calendar events (active search)
        if events:
            return "Active Search"
        
        # Check if preferences are well-defined
        completeness = self._calculate_profile_completeness(prefs)
        if completeness >= 50:
            return "Ready to Search"
        
        return "Research"
    
    async def _get_match_scores(self, user_id: str) -> Dict[str, Any]:
        """Get property match scores for user's favorites"""
        profile = await self.db.nova_user_profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        prefs = profile.get("preferences", {}) if profile else {}
        
        # Get user's favorites
        favorites = await self.db.favorites.find(
            {"user_id": user_id}
        ).to_list(20)
        
        if not favorites:
            return {"matches": [], "average_score": 0}
        
        # Get listing details for favorites
        listing_ids = [f.get("listing_id") for f in favorites]
        listings = await self.db.listings.find(
            {"id": {"$in": listing_ids}}, {"_id": 0}
        ).to_list(20)
        
        matches = []
        for listing in listings:
            score = self._calculate_match_score(listing, prefs)
            matches.append({
                "listing_id": listing.get("id"),
                "title": listing.get("title"),
                "score": score,
                "price": listing.get("price"),
                "match_reasons": self._get_match_reasons(listing, prefs)
            })
        
        matches.sort(key=lambda x: x["score"], reverse=True)
        
        return {
            "matches": matches[:10],
            "average_score": sum(m["score"] for m in matches) / len(matches) if matches else 0,
            "best_match": matches[0] if matches else None
        }
    
    def _calculate_match_score(self, listing: dict, prefs: dict) -> int:
        """Calculate how well a listing matches user preferences"""
        score = 50  # Base score
        
        # Budget match
        if prefs.get("max_budget"):
            if listing.get("price", 0) <= prefs["max_budget"]:
                score += 20
            elif listing.get("price", 0) <= prefs["max_budget"] * 1.1:
                score += 10
        
        # Bedroom match
        if prefs.get("bedrooms") and listing.get("bedrooms") == prefs["bedrooms"]:
            score += 15
        
        # Pet friendly match
        if prefs.get("pet_friendly") and listing.get("pet_friendly"):
            score += 10
        
        # Area match
        if prefs.get("preferred_areas"):
            listing_area = f"{listing.get('city', '')} {listing.get('address', '')}".lower()
            if any(area.lower() in listing_area for area in prefs["preferred_areas"]):
                score += 15
        
        return min(score, 100)
    
    def _get_match_reasons(self, listing: dict, prefs: dict) -> List[str]:
        """Get reasons why a listing matches preferences"""
        reasons = []
        
        if prefs.get("max_budget") and listing.get("price", 0) <= prefs["max_budget"]:
            reasons.append("Within budget")
        
        if prefs.get("bedrooms") and listing.get("bedrooms") == prefs["bedrooms"]:
            reasons.append(f"Has {prefs['bedrooms']} bedroom(s)")
        
        if prefs.get("pet_friendly") and listing.get("pet_friendly"):
            reasons.append("Pet friendly")
        
        if listing.get("parking"):
            reasons.append("Has parking")
        
        return reasons
    
    async def _get_activity_summary(self, user_id: str) -> Dict[str, Any]:
        """Get summary of user activity"""
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Count interactions
        total_interactions = await self.db.nova_interactions.count_documents(
            {"user_id": user_id}
        )
        
        week_interactions = await self.db.nova_interactions.count_documents(
            {"user_id": user_id, "timestamp": {"$gte": week_ago.isoformat()}}
        )
        
        # Count favorites
        favorites_count = await self.db.favorites.count_documents(
            {"user_id": user_id}
        )
        
        # Count viewings
        viewings_count = await self.db.calendar_events.count_documents(
            {"user_id": user_id, "event_type": "viewing"}
        )
        
        return {
            "total_interactions": total_interactions,
            "this_week": week_interactions,
            "favorites_saved": favorites_count,
            "viewings_scheduled": viewings_count,
            "engagement_level": "High" if week_interactions > 10 else "Moderate" if week_interactions > 3 else "Low"
        }
    
    async def _generate_recommendations(self, user_id: str) -> List[Dict[str, Any]]:
        """Generate personalized recommendations"""
        profile = await self.db.nova_user_profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        prefs = profile.get("preferences", {}) if profile else {}
        
        recommendations = []
        
        # Profile completion recommendations
        completeness = self._calculate_profile_completeness(prefs)
        if completeness < 100:
            missing = []
            if not prefs.get("max_budget"):
                missing.append("budget")
            if not prefs.get("bedrooms"):
                missing.append("bedroom count")
            if not prefs.get("preferred_areas"):
                missing.append("preferred areas")
            if not prefs.get("commute_to"):
                missing.append("commute location")
            
            recommendations.append({
                "type": "profile",
                "priority": "high",
                "title": "Complete Your Profile",
                "description": f"Add your {', '.join(missing[:2])} to get better recommendations",
                "action": "Update preferences"
            })
        
        # Search recommendations
        favorites_count = await self.db.favorites.count_documents({"user_id": user_id})
        if favorites_count == 0:
            recommendations.append({
                "type": "action",
                "priority": "medium",
                "title": "Start Saving Properties",
                "description": "Save listings you like to compare them later",
                "action": "Browse properties"
            })
        
        # Viewing recommendations
        viewings = await self.db.calendar_events.count_documents(
            {"user_id": user_id, "event_type": "viewing"}
        )
        if favorites_count > 3 and viewings == 0:
            recommendations.append({
                "type": "action",
                "priority": "high",
                "title": "Schedule a Viewing",
                "description": "You have saved properties - schedule a viewing!",
                "action": "Schedule viewing"
            })
        
        return recommendations
