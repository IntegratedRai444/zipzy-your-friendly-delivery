from typing import Optional, Dict, Any
from app.services.gemini_service import GeminiService
from app.models.request_models import OrderExtraction, OrderExtractionRequest, OrderExtractionResponse, UrgencyLevelEnum, ItemCategoryEnum, ItemSizeEnum
from app.utils.geo_utils import GeoUtils
import re

class OrderExtractionService:
    def __init__(self):
        self.gemini_service = GeminiService()
        self.geo_utils = GeoUtils()
        
        # Campus-specific keywords and patterns
        self.campus_locations = {
            "pickup": ["canteen", "mess", "library", "hostel", "block", "admin", "sports", "gym", "parking", "night canteen"],
            "drop": ["canteen", "mess", "library", "hostel", "block", "admin", "sports", "gym", "parking", "ai block", "cs block", "block a", "block b"]
        }
        
        self.urgency_keywords = {
            "urgent": ["urgent", "asap", "now", "quickly", "immediately", "fast"],
            "normal": ["deliver", "bring", "get", "send", "pick up"]
        }
        
        self.category_patterns = {
            "food": ["coffee", "tea", "food", "maggie", "snacks", "lunch", "dinner", "breakfast", "meal"],
            "groceries": ["groceries", "vegetables", "fruits", "milk", "bread", "eggs"],
            "electronics": ["laptop", "phone", "charger", "headphones", "mouse", "keyboard"],
            "documents": ["book", "document", "file", "paper", "notes", "assignment"],
            "clothing": ["clothes", "shirt", "pants", "dress", "jacket"],
            "task": ["help", "assist", "task", "work"]
        }
    
    def extract_order(self, request: OrderExtractionRequest) -> OrderExtractionResponse:
        """Extract order details from natural language message"""
        
        try:
            # Use Gemini AI for primary extraction
            extracted_order = self.gemini_service.extract_order_from_message(request.message)
            
            if extracted_order:
                # Validate and enhance with our own logic
                confidence = self._calculate_extraction_confidence(request.message, extracted_order)
                
                # Enhance location data
                self._enhance_location_data(extracted_order)
                
                return OrderExtractionResponse(
                    success=True,
                    extracted_order=extracted_order,
                    confidence=confidence
                )
            
            # Fallback to rule-based extraction
            fallback_order = self._rule_based_extraction(request.message)
            if fallback_order:
                return OrderExtractionResponse(
                    success=True,
                    extracted_order=fallback_order,
                    confidence=0.6  # Lower confidence for fallback
                )
            
            return OrderExtractionResponse(
                success=False,
                error_message="Could not extract order details. Please provide pickup and drop locations."
            )
            
        except Exception as e:
            return OrderExtractionResponse(
                success=False,
                error_message=f"Extraction failed: {str(e)}"
            )
    
    def _calculate_extraction_confidence(self, message: str, order: OrderExtraction) -> float:
        """Calculate confidence score for extraction"""
        confidence = 0.0
        
        # Item name present
        if order.item_name and len(order.item_name) > 2:
            confidence += 0.2
        
        # Both locations present
        if order.pickup_location and len(order.pickup_location) > 2:
            confidence += 0.3
        
        if order.drop_location and len(order.drop_location) > 2:
            confidence += 0.3
        
        # Campus locations detected
        if self._is_campus_location(order.pickup_location):
            confidence += 0.1
        
        if self._is_campus_location(order.drop_location):
            confidence += 0.1
        
        return min(confidence, 1.0)
    
    def _enhance_location_data(self, order: OrderExtraction):
        """Enhance location data with campus-specific information"""
        # Standardize location names
        order.pickup_location = self._standardize_location(order.pickup_location)
        order.drop_location = self._standardize_location(order.drop_location)
    
    def _standardize_location(self, location: str) -> str:
        """Standardize campus location names"""
        location_lower = location.lower().strip()
        
        # Common abbreviations and variations
        standardizations = {
            "ai block": "AI Block",
            "cs block": "CS Block",
            "comp sci": "CS Block",
            "computer science": "CS Block",
            "hostel a": "Hostel A",
            "hostel b": "Hostel B",
            "hostel c": "Hostel C",
            "mess": "Mess",
            "canteen": "Canteen",
            "food court": "Food Court",
            "lib": "Library",
            "gym": "Gym",
            "sports": "Sports Ground",
            "admin": "Admin Block",
        }
        
        for variation, standard in standardizations.items():
            if variation in location_lower:
                return standard
        
        return location.title() if location else location
    
    def _is_campus_location(self, location: str) -> bool:
        """Check if location is a known campus location"""
        location_lower = location.lower()
        return any(loc in location_lower for loc in self.campus_locations["pickup"])
    
    def _rule_based_extraction(self, message: str) -> Optional[OrderExtraction]:
        """Fallback rule-based extraction"""
        message_lower = message.lower()
        
        # Extract item
        item_name = self._extract_item_name(message_lower)
        
        # Extract locations using "from...to" pattern
        pickup, drop = self._extract_locations_from_pattern(message_lower)
        
        if not pickup or not drop:
            # Try other patterns
            pickup, drop = self._extract_locations_general(message_lower)
        
        if not pickup or not drop:
            return None
        
        # Extract urgency
        urgency = self._extract_urgency(message_lower)
        
        # Extract category
        category = self._extract_category(message_lower, item_name)
        
        return OrderExtraction(
            item_name=item_name or "Item",
            pickup_location=pickup,
            drop_location=drop,
            urgency=urgency,
            category=category
        )
    
    def _extract_item_name(self, message: str) -> Optional[str]:
        """Extract item name from message"""
        # Common item patterns
        item_patterns = [
            r'(?:deliver|bring|get|send|pick up)\s+(.+?)\s+(?:from|to)',
            r'(.+?)\s+(?:from|to)',
            r'(?:need|want)\s+(.+?)\s+(?:from|to)',
        ]
        
        for pattern in item_patterns:
            match = re.search(pattern, message)
            if match:
                item = match.group(1).strip()
                # Clean up common words
                item = re.sub(r'\b(the|a|an|my|your|some)\b', '', item).strip()
                if len(item) > 1:
                    return item.title()
        
        return None
    
    def _extract_locations_from_pattern(self, message: str) -> tuple[Optional[str], Optional[str]]:
        """Extract locations using from...to pattern"""
        # Pattern: from [pickup] to [drop]
        match = re.search(r'from\s+(.+?)\s+to\s+(.+?)(?:\s|$|\?|\.|,)', message)
        if match:
            pickup = match.group(1).strip()
            drop = match.group(2).strip()
            return pickup, drop
        
        # Pattern: bring [item] from [pickup] to [drop]
        match = re.search(r'bring\s+.+?\s+from\s+(.+?)\s+to\s+(.+?)(?:\s|$|\?|\.|,)', message)
        if match:
            pickup = match.group(1).strip()
            drop = match.group(2).strip()
            return pickup, drop
        
        return None, None
    
    def _extract_locations_general(self, message: str) -> tuple[Optional[str], Optional[str]]:
        """Extract locations using general patterns"""
        locations = []
        
        # Find all campus locations in the message
        for location in self.campus_locations["pickup"]:
            if location in message:
                locations.append(location)
        
        if len(locations) >= 2:
            return locations[0], locations[1]
        elif len(locations) == 1:
            # Try to find another location
            words = message.split()
            for i, word in enumerate(words):
                if word in locations[0]:
                    # Look for nearby words that might be locations
                    for j in range(max(0, i-3), min(len(words), i+4)):
                        if j != i and words[j] not in locations and len(words[j]) > 2:
                            return locations[0], words[j]
        
        return None, None
    
    def _extract_urgency(self, message: str) -> str:
        """Extract urgency from message"""
        for urgency, keywords in self.urgency_keywords.items():
            if any(keyword in message for keyword in keywords):
                return urgency
        return "normal"
    
    def _extract_category(self, message: str, item_name: str) -> str:
        """Extract item category from message and item"""
        message_lower = message.lower()
        item_lower = item_name.lower() if item_name else ""
        
        for category, items in self.category_patterns.items():
            if any(item in item_lower for item in items) or any(item in message_lower for item in items):
                return category
        
        return "other"
