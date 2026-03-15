from typing import Dict, Any, Optional
from app.services.gemini_service import GeminiService
from app.models.request_models import ChatMessage, ChatResponse

class AssistantService:
    def __init__(self):
        self.gemini_service = GeminiService()
        
        # FAQ database
        self.faq_database = {
            "order_status": {
                "question": ["where is my order", "order status", "track delivery", "delivery status"],
                "answer": "To check your order status, please provide your order ID. I can help you track the current location and estimated delivery time."
            },
            "delivery_cost": {
                "question": ["how much delivery cost", "delivery price", "delivery charges", "cost of delivery"],
                "answer": "Delivery costs typically range from ₹30-₹150 depending on distance, urgency, and item size. Urgent deliveries cost more. Would you like me to estimate the cost for your specific delivery?"
            },
            "become_partner": {
                "question": ["how to become delivery partner", "become partner", "join as delivery partner", "earn money"],
                "answer": "To become a delivery partner: 1) Sign up in the Zipzy app 2) Complete verification with your campus ID 3) Start accepting deliveries! Partners earn ₹50-₹200 per delivery. You can work flexible hours and earn money while helping fellow students."
            },
            "delivery_time": {
                "question": ["how long delivery take", "delivery time", "eta", "when will delivery arrive"],
                "answer": "Delivery times vary by location and urgency: Normal deliveries take 15-30 minutes, urgent deliveries take 10-20 minutes. Factors like distance and campus traffic affect timing. Would you like me to estimate the delivery time for your specific route?"
            },
            "how_zipzy_works": {
                "question": ["how does zipzy work", "what is zipzy", "how to use zipzy", "zipzy platform"],
                "answer": "Zipzy connects students who need items delivered with campus members who can deliver them. Simply: 1) Request a delivery with pickup/drop locations 2) A nearby partner accepts your request 3) They pick up and deliver your item 4) You pay through the app. It's fast, reliable, and campus-focused!"
            },
            "payment": {
                "question": ["how to pay", "payment methods", "wallet", "money"],
                "answer": "Zipzy uses a secure wallet system. Add money to your wallet using UPI, cards, or campus payment methods. Payment is held in escrow until delivery is confirmed, then released to the partner. This ensures security for both users and partners."
            },
            "cancellation": {
                "question": ["cancel order", "how to cancel", "refund", "cancellation policy"],
                "answer": "You can cancel orders before they're accepted for a full refund. After acceptance, cancellation may incur a small fee. Partners can also cancel within reasonable time. Both users and partners with high cancellation rates may face restrictions."
            }
        }
        
        # System data formatting templates
        self.data_templates = {
            "order_status": "📦 **Order #{order_id}**\n📍 Status: {status}\n🚚 Partner: {partner_name}\n⏰ Estimated: {eta}\n📍 Current: {current_location}",
            "delivery_cost": "💰 **Estimated Cost: ₹{amount}**\n📍 Distance: {distance}km\n⚡ Urgency: {urgency}\n📦 Item: {item_category}",
            "partner_info": "👤 **Partner Information**\n⭐ Rating: {rating}/5\n✅ Completed: {completed_deliveries}\n📍 Currently: {location}\n💰 Earned: ₹{total_earned}"
        }
    
    def handle_chat_message(self, message: ChatMessage) -> ChatResponse:
        """Handle incoming chat message and generate response"""
        
        try:
            # Analyze message intent
            intent_analysis = self.gemini_service.analyze_message_intent(message.message)
            intent = intent_analysis.get("intent", "general_help")
            confidence = intent_analysis.get("confidence", 0.5)
            
            # Route to appropriate handler
            if intent == "check_status" and confidence > 0.6:
                return self._handle_order_status_inquiry(message)
            elif intent == "pricing_info" and confidence > 0.6:
                return self._handle_pricing_inquiry(message)
            elif intent == "become_partner" and confidence > 0.6:
                return self._handle_partner_inquiry(message)
            elif intent == "create_order" and confidence > 0.6:
                return self._handle_order_creation(message)
            else:
                return self._handle_general_inquiry(message)
                
        except Exception as e:
            print(f"Error in chat handling: {e}")
            return ChatResponse(
                response="I'm having trouble processing your message right now. Please try again or contact support.",
                requires_data=False
            )
    
    def _handle_order_status_inquiry(self, message: ChatMessage) -> ChatResponse:
        """Handle order status inquiries"""
        
        # Check if user provided order ID
        if message.context and message.context.get("order_id"):
            # Format order status using template
            order_data = message.context
            response = self.data_templates["order_status"].format(**order_data)
            
            return ChatResponse(
                response=response,
                requires_data=False
            )
        else:
            return ChatResponse(
                response="I can help you track your order! Please provide your order ID, and I'll give you the current status and estimated delivery time.",
                requires_data=True,
                data_request="order_id"
            )
    
    def _handle_pricing_inquiry(self, message: ChatMessage) -> ChatResponse:
        """Handle pricing inquiries"""
        
        if message.context and message.context.get("route_info"):
            # Format pricing using template
            pricing_data = message.context
            response = self.data_templates["delivery_cost"].format(**pricing_data)
            
            return ChatResponse(
                response=response,
                requires_data=False
            )
        else:
            return ChatResponse(
                response="I can estimate the delivery cost for you! Please tell me:\n• Pickup location\n• Drop location\n• Item type\n• Urgency level",
                requires_data=True,
                data_request="route_info"
            )
    
    def _handle_partner_inquiry(self, message: ChatMessage) -> ChatResponse:
        """Handle partner registration inquiries"""
        
        faq_answer = self.faq_database["become_partner"]["answer"]
        
        return ChatResponse(
            response=faq_answer,
            requires_data=False,
            actions=["become_partner"]
        )
    
    def _handle_order_creation(self, message: ChatMessage) -> ChatResponse:
        """Handle order creation requests"""
        
        return ChatResponse(
            response="I can help you create a delivery order! Please describe what you need delivered in natural language, like:\n\n'Bring coffee from canteen to AI block'\n'Deliver laptop from hostel A to library'\n\nI'll extract the details and create the order for you.",
            requires_data=False,
            actions=["create_order"]
        )
    
    def _handle_general_inquiry(self, message: ChatMessage) -> ChatResponse:
        """Handle general inquiries using FAQ and Gemini"""
        
        # Check against FAQ database
        message_lower = message.message.lower()
        
        for category, faq_data in self.faq_database.items():
            for question_keyword in faq_data["question"]:
                if question_keyword in message_lower:
                    return ChatResponse(
                        response=faq_data["answer"],
                        requires_data=False
                    )
        
        # Use Gemini for general responses
        gemini_response = self.gemini_service.generate_chat_response(
            message.message, 
            message.context
        )
        
        return ChatResponse(
            response=gemini_response,
            requires_data=False
        )
    
    def format_system_data(self, data_type: str, data: Dict[str, Any]) -> str:
        """Format system data into readable responses"""
        
        template = self.data_templates.get(data_type)
        if template:
            try:
                return template.format(**data)
            except KeyError as e:
                return f"Error formatting data: missing field {e}"
        else:
            return "I don't have a template for this data type."
    
    def get_help_menu(self) -> Dict[str, Any]:
        """Get comprehensive help menu"""
        
        help_categories = {
            "Getting Started": [
                "How does Zipzy work?",
                "How to create a delivery request",
                "How to become a delivery partner"
            ],
            "Orders & Delivery": [
                "Where is my order?",
                "How long will delivery take?",
                "How much does delivery cost?",
                "How to cancel an order"
            ],
            "Payments & Wallet": [
                "How to add money to wallet",
                "Payment methods accepted",
                "Refund policy"
            ],
            "Partner Program": [
                "Partner requirements",
                "How much can I earn?",
                "Partner rating system",
                "Best practices for partners"
            ]
        }
        
        quick_commands = {
            "Track Order": "Where is my order #12345?",
            "Get Price": "How much to deliver from hostel to library?",
            "Partner Info": "How to become a delivery partner?",
            "Create Order": "Bring coffee from canteen to AI block"
        }
        
        return {
            "categories": help_categories,
            "quick_commands": quick_commands,
            "contact_support": "For additional help, contact campus support or email support@zipzy.edu"
        }
    
    def analyze_user_intent(self, message: str) -> Dict[str, Any]:
        """Analyze user message to determine intent and required data"""
        
        intent_analysis = self.gemini_service.analyze_message_intent(message)
        
        # Enhance with local logic
        message_lower = message.lower()
        
        # Check for specific keywords
        if any(keyword in message_lower for keyword in ["track", "status", "where is", "order"]):
            intent_analysis["intent"] = "check_status"
            intent_analysis["requires_data"] = True
            intent_analysis["data_needed"] = "order_id"
        
        elif any(keyword in message_lower for keyword in ["cost", "price", "how much", "charges"]):
            intent_analysis["intent"] = "pricing_info"
            intent_analysis["requires_data"] = True
            intent_analysis["data_needed"] = "route_info"
        
        elif any(keyword in message_lower for keyword in ["partner", "earn", "join", "deliver"]):
            intent_analysis["intent"] = "become_partner"
            intent_analysis["requires_data"] = False
        
        elif any(keyword in message_lower for keyword in ["bring", "deliver", "get", "send", "pick up"]):
            intent_analysis["intent"] = "create_order"
            intent_analysis["requires_data"] = False
        
        return intent_analysis
