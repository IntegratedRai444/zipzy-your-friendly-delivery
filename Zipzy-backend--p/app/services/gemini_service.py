from openai import OpenAI
import json
import re
from typing import Optional, Dict, Any
from app.config import settings
from app.models.request_models import OrderExtraction, UrgencyLevelEnum, ItemCategoryEnum

# ============================================================
# ZIPZY COMPLETE PLATFORM KNOWLEDGE BASE
# Injected into every AI prompt so the assistant knows everything
# ============================================================
ZIPZY_KNOWLEDGE = """
=== ZIPZY PLATFORM — COMPLETE KNOWLEDGE BASE ===

## What is Zipzy?
Zipzy is a campus peer-to-peer (P2P) delivery platform built for students.
Students who need items delivered create a "request". Other students on campus
(called "partners") see those requests, accept them, and complete the delivery
to earn money. Everything happens within the university campus.

## User Roles
- **Buyer / User**: A student placing a delivery request (needs item delivered).
- **Partner**: A student who accepts delivery requests and earns a reward.
- **Admin**: Platform administrators who manage users and monitor deliveries.

## Full Delivery Flow — Step by Step
1. Buyer opens the Zipzy app and taps "Create Delivery".
2. Buyer fills in: item description, item size, pickup location, and drop location.
3. Buyer submits. The backend calculates the reward and platform fee automatically.
4. System matches and notifies nearby available partners.
5. A partner accepts the request.
6. Partner heads to the pickup location. A pickup OTP is generated.
7. Pickup OTP is verified at the pickup point — delivery officially starts.
8. Partner delivers the item to the drop location. A drop OTP is generated.
9. Drop OTP is verified at the drop point — delivery confirmed.
10. Payment is released to the partner.

## Pricing Model (STRICT — enforced by backend only)
- **Delivery Reward** = distance_km × ₹10
  - Minimum reward: ₹10 (for any distance under 1 km)
  - Maximum reward: ₹30 (hard capped — regardless of distance)
- **Platform Fee** = 20% of the reward (kept by Zipzy, charged to buyer)
- **Total paid by buyer** = item_price + reward + platform_fee
- Example 1: 1.5 km → reward=₹15, platform_fee=₹3, total=item_price+₹18
- Example 2: 3 km → reward=₹30 (capped), platform_fee=₹6, total=item_price+₹36
- Note: The AI NEVER sets or suggests prices. Backend calculates all pricing.

## Partner Earnings
- Partners earn ₹10 to ₹30 per delivery (based on distance).
- Zipzy keeps 20% of the reward as a platform fee.
- Partners receive payment only after the drop OTP is confirmed.
- Payments are held in escrow (secure) until delivery is complete.

## How to Become a Delivery Partner
1. Register on Zipzy with your campus email.
2. Complete the partner onboarding form in the app.
3. Your account gets the "partner" flag activated.
4. You start seeing available delivery requests in the "Partner Dashboard".
5. Accept any request you like, complete the delivery, and earn money!

## Campus Locations Supported
- Canteen / Mess / Food Court / Night Canteen
- Library
- AI Block / CS Block / Block A / Block B / Block C
- Hostel A / Hostel B / Hostel C
- Sports Ground / Gym
- Admin Block / Reception / Parking

## Delivery Status Values
- **pending**: Request is created, looking for a partner.
- **accepted**: A partner accepted, heading to pickup.
- **picked_up**: Item collected from pickup location with OTP.
- **delivered**: Item delivered and confirmed with OTP.
- **cancelled**: Cancelled by buyer or partner.

## OTP Verification System
- A 6-digit OTP is generated at each stage.
- **Pickup OTP**: Verified when partner is at pickup — confirms item collected.
- **Drop OTP**: Verified when partner is at drop — confirms delivery complete.
- Both parties must confirm with OTPs for the system to advance.

## Item Sizes Available
- Small, Medium, Large, Extra Large

## Item Categories Available
- Food, Groceries, Electronics, Documents, Clothing, Task, Other

## Urgency Levels
- Standard, Express, Urgent

## Trust & Safety System
- Partners have a trust score (0 to 1) calculated from:
  - Successful deliveries completed
  - Average user ratings
  - Number of complaints filed
  - Cancellation rate
- Users/partners with very high cancellation rates face restrictions.
- Automated fraud detection flags suspicious patterns.

## Chat System
- Buyers and partners can chat with each other within an active delivery.
- Zipzy AI Assistant (this chat) is separate from user-partner delivery chat.
- To chat about a specific delivery, use the delivery detail screen.

## Payment & Wallet
- Payments are held in escrow until delivery is confirmed.
- Supported payment methods: UPI, Campus wallet, Cards.
- Refunds are issued for cancellations before partner acceptance.
- After acceptance, partial cancellation fees may apply.

## Cancellation Policy
- Full refund if cancelled before a partner accepts.
- Partial fee if cancelled after partner accepted.
- Partners with high cancellation rates may be restricted.

## Platform Contact / Support
- For delivery issues: Use the in-app delivery chat with your partner.
- For platform/account issues: Email support@zipzy.edu

=== END OF ZIPZY KNOWLEDGE BASE ===
"""

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_MODEL = "meta/llama-3.3-70b-instruct"


class GeminiService:
    """
    AI service — now powered by NVIDIA NIM (meta/llama-3.3-70b-instruct)
    via OpenAI-compatible API. Retains the class name for compatibility.
    """

    def __init__(self):
        api_key = settings.NVIDIA_API_KEY
        if not api_key:
            raise ValueError("NVIDIA_API_KEY is required in .env")
        self.client = OpenAI(
            base_url=NVIDIA_BASE_URL,
            api_key=api_key
        )

    def _chat(self, system: str, user: str, temperature: float = 0.5, max_tokens: int = 512) -> str:
        """Internal helper: single call to NVIDIA NIM"""
        completion = self.client.chat.completions.create(
            model=NVIDIA_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return completion.choices[0].message.content.strip()

    # ------------------------------------------------------------------
    # Public Methods
    # ------------------------------------------------------------------

    def extract_order_from_message(self, message: str) -> Optional[OrderExtraction]:
        """Extract structured delivery data from a natural language message."""
        system = f"""{ZIPZY_KNOWLEDGE}

You are an order extraction engine for Zipzy. Given a user message, extract delivery details.
Return ONLY a valid JSON object with these keys:
- item_name: string
- pickup_location: string (campus location)
- drop_location: string (campus location)
- urgency: "normal" or "urgent"
- category: "food"|"groceries"|"task"|"electronics"|"documents"|"clothing"|"other"
Use null for fields you cannot determine. Output JSON only — no extra text."""

        try:
            raw = self._chat(system, message, temperature=0.2, max_tokens=256)
            json_match = re.search(r'\{.*\}', raw, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                if not data.get('pickup_location') or not data.get('drop_location'):
                    return None
                data['urgency'] = data.get('urgency', 'normal')
                data['category'] = data.get('category', 'other')
                if data['urgency'] not in [e.value for e in UrgencyLevelEnum]:
                    data['urgency'] = 'normal'
                if data['category'] not in [e.value for e in ItemCategoryEnum]:
                    data['category'] = 'other'
                return OrderExtraction(**data)
            return None
        except Exception as e:
            print(f"[AI] extract_order error: {e}")
            return None

    def generate_chat_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Generate a helpful, knowledgeable assistant response about Zipzy."""
        context_block = ""
        if context:
            try:
                safe = {k: v for k, v in context.items()
                        if isinstance(v, (str, int, float, bool, list, dict, type(None)))}
                context_block = f"\n\nUser Context:\n{json.dumps(safe, indent=2)}"
            except Exception:
                pass

        system = f"""{ZIPZY_KNOWLEDGE}

You are Zipzy AI, the friendly and knowledgeable official assistant of the Zipzy campus delivery platform.
You have the complete knowledge base above. Use it to answer ANY question about Zipzy accurately.

Rules:
- Be friendly, helpful, and conversational.
- Use the knowledge base above for all answers — do not make up facts.
- Use emojis to make responses clear (📦 🚀 💰 📍 ✅ 🎓).
- Keep answers concise (max 4 short paragraphs).
- If asked about a specific order status, politely ask for the order ID.
- If a question is completely unrelated to Zipzy (e.g. math homework), explain you can only help with Zipzy.{context_block}"""

        try:
            return self._chat(system, message, temperature=0.6, max_tokens=512)
        except Exception as e:
            import traceback
            traceback.print_exc()
            err = str(e)
            return f"⚠️ AI service error: {err}. Please try again in a moment."

    def analyze_message_intent(self, message: str) -> Dict[str, Any]:
        """Classify user message intent."""
        system = """You are an intent classifier for Zipzy campus delivery platform.
Classify the user's message intent. Return ONLY valid JSON:
{"intent": "create_order"|"check_status"|"pricing_info"|"general_help"|"become_partner"|"other",
 "confidence": 0.0-1.0, "entities": {}, "requires_data": true|false}"""
        try:
            raw = self._chat(system, message, temperature=0.1, max_tokens=128)
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                return json.loads(match.group())
            return {"intent": "general_help", "confidence": 0.5, "entities": {}, "requires_data": False}
        except Exception as e:
            print(f"[AI] analyze_intent error: {e}")
            return {"intent": "general_help", "confidence": 0.3, "entities": {}, "requires_data": False}
