import random
from typing import Dict, Any, List, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
from app.models.request_models import DemandAnalysisRequest, DemandAnalysisResponse

class DemandService:
    def __init__(self):
        # Campus location coordinates for demand analysis
        self.campus_locations = {
            "canteen": (28.5450, 77.1926),
            "mess": (28.5450, 77.1926),
            "library": (28.5460, 77.1930),
            "ai block": (28.5470, 77.1940),
            "cs block": (28.5470, 77.1940),
            "hostel a": (28.5440, 77.1910),
            "hostel b": (28.5440, 77.1900),
            "hostel c": (28.5430, 77.1910),
            "block a": (28.5470, 77.1940),
            "block b": (28.5470, 77.1940),
            "night canteen": (28.5450, 77.1926),
            "sports ground": (28.5480, 77.1950),
            "gym": (28.5480, 77.1950),
            "admin block": (28.5460, 77.1920),
            "parking": (28.5455, 77.1915)
        }
        
        # Historical demand patterns by hour
        self.hourly_patterns = {
            0: 0.1,  # 12am
            1: 0.05, # 1am
            2: 0.05, # 2am
            3: 0.05, # 3am
            4: 0.05, # 4am
            5: 0.1,  # 5am
            6: 0.2,  # 6am
            7: 0.4,  # 7am
            8: 0.8,  # 8am - peak
            9: 0.6,  # 9am
            10: 0.5, # 10am
            11: 0.4, # 11am
            12: 0.9, # 12pm - peak
            13: 0.7, # 1pm
            14: 0.6, # 2pm
            15: 0.5, # 3pm
            16: 0.4, # 4pm
            17: 0.8, # 5pm - peak
            18: 0.7, # 6pm
            19: 1.0, # 7pm - peak
            20: 0.9, # 8pm - peak
            21: 0.6, # 9pm
            22: 0.3, # 10pm
            23: 0.2  # 11pm
        }
    
    def analyze_demand(self, request: DemandAnalysisRequest) -> DemandAnalysisResponse:
        """Analyze demand patterns and predict hotspots"""
        
        try:
            # Generate or use provided request history
            if request.request_history:
                demand_data = self._process_request_history(request.request_history)
            else:
                demand_data = self._generate_mock_data(request.time_period_hours)
            
            # Identify hotspots
            hotspots = self._identify_hotspots(demand_data)
            
            # Identify peak hours
            peak_hours = self._identify_peak_hours(demand_data)
            
            # Recommend partner distribution
            partner_distribution = self._recommend_partner_distribution(hotspots, peak_hours)
            
            return DemandAnalysisResponse(
                hotspots=hotspots,
                peak_hours=peak_hours,
                recommended_partner_distribution=partner_distribution
            )
            
        except Exception as e:
            print(f"Error in demand analysis: {e}")
            # Fallback response
            return DemandAnalysisResponse(
                hotspots=["canteen", "library"],
                peak_hours=["12pm-2pm", "7pm-9pm"],
                recommended_partner_distribution={"canteen": 2, "library": 2}
            )
    
    def _process_request_history(self, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process actual request history data"""
        
        location_demand = defaultdict(int)
        hourly_demand = defaultdict(int)
        
        for request in history:
            # Extract location information
            pickup_location = request.get("pickup_location", "").lower()
            drop_location = request.get("drop_location", "").lower()
            
            # Count demand for locations
            if pickup_location:
                location_demand[pickup_location] += 1
            if drop_location:
                location_demand[drop_location] += 1
            
            # Count hourly demand
            created_at = request.get("created_at")
            if created_at:
                try:
                    if isinstance(created_at, str):
                        created_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    else:
                        created_time = created_at
                    
                    hour = created_time.hour
                    hourly_demand[hour] += 1
                except:
                    pass
        
        return {
            "location_demand": dict(location_demand),
            "hourly_demand": dict(hourly_demand)
        }
    
    def _generate_mock_data(self, time_window_hours: int) -> Dict[str, Any]:
        """Generate mock demand data for testing"""
        
        location_demand = defaultdict(int)
        hourly_demand = defaultdict(int)
        
        now = datetime.now()
        
        # Generate requests for each hour in the time window
        for hour_offset in range(time_window_hours):
            hour_time = now - timedelta(hours=hour_offset)
            hour_of_day = hour_time.hour
            
            # Simulate demand based on time patterns
            base_demand = self.hourly_patterns.get(hour_of_day, 0.1) * 10  # Scale to requests
            
            # Add some randomness
            demand = max(0, base_demand + random.uniform(-2, 2))
            request_count = int(demand)
            
            if request_count > 0:
                hourly_demand[hour_of_day] += request_count
                
                # Distribute requests across locations
                for _ in range(request_count):
                    # Weight location selection by typical demand
                    location_weights = {
                        "canteen": 0.3,
                        "library": 0.2,
                        "hostel a": 0.15,
                        "hostel b": 0.1,
                        "ai block": 0.1,
                        "cs block": 0.1,
                        "sports ground": 0.05
                    }
                    
                    location = random.choices(
                        list(location_weights.keys()),
                        weights=list(location_weights.values())
                    )[0]
                    
                    location_demand[location] += 1
        
        return {
            "location_demand": dict(location_demand),
            "hourly_demand": dict(hourly_demand)
        }
    
    def _identify_hotspots(self, demand_data: Dict[str, Any]) -> List[str]:
        """Identify high-demand locations"""
        
        location_demand = demand_data["location_demand"]
        
        if not location_demand:
            return ["canteen", "library", "hostel areas"]
        
        # Calculate total demand
        total_demand = sum(location_demand.values())
        
        if total_demand == 0:
            return ["canteen", "library"]
        
        # Calculate demand percentage for each location
        demand_percentages = {
            location: (count / total_demand) * 100 
            for location, count in location_demand.items()
        }
        
        # Identify hotspots (locations with >15% of total demand)
        hotspots = [
            location for location, percentage in demand_percentages.items()
            if percentage > 15
        ]
        
        # If no hotspots found, return top 3 locations
        if not hotspots:
            sorted_locations = sorted(
                demand_percentages.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            hotspots = [loc for loc, _ in sorted_locations[:3]]
        
        return hotspots
    
    def _identify_peak_hours(self, demand_data: Dict[str, Any]) -> List[str]:
        """Identify peak demand hours"""
        
        hourly_demand = demand_data["hourly_demand"]
        
        if not hourly_demand:
            return ["12pm-2pm", "7pm-9pm"]
        
        # Sort hours by demand
        sorted_hours = sorted(
            hourly_demand.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        # Get top 3 peak hours
        peak_hours = sorted_hours[:3]
        
        # Convert to time ranges
        time_ranges = []
        for hour, _ in peak_hours:
            if hour == 12:
                time_ranges.append("12pm-2pm")
            elif hour == 19:
                time_ranges.append("7pm-9pm")
            elif hour == 8:
                time_ranges.append("8am-10am")
            elif hour == 20:
                time_ranges.append("8pm-10pm")
            else:
                time_ranges.append(f"{hour % 12 if hour != 0 else 12}{'am' if hour < 12 else 'pm'}-{(hour + 2) % 12 if (hour + 2) != 0 else 12}{'am' if (hour + 2) < 12 else 'pm'}")
        
        return time_ranges
    
    def _recommend_partner_distribution(self, hotspots: List[str], peak_hours: List[str]) -> Dict[str, int]:
        """Recommend optimal partner distribution"""
        
        distribution = {}
        
        # Base distribution for hotspots
        for hotspot in hotspots:
            distribution[hotspot] = 2  # Base 2 partners per hotspot
        
        # Additional partners for peak hours
        if "7pm-9pm" in peak_hours or "8pm-10pm" in peak_hours:
            # Evening peak - more partners needed at food locations
            if "canteen" in hotspots:
                distribution["canteen"] += 2
            if "night canteen" in hotspots or "mess" in hotspots:
                distribution["night canteen"] = 2
                distribution["mess"] = 1
        
        if "12pm-2pm" in peak_hours:
            # Lunch peak - more partners at food locations
            if "canteen" in hotspots:
                distribution["canteen"] += 1
            if "mess" in hotspots:
                distribution["mess"] += 1
        
        # Academic locations during study hours
        if "8am-10am" in peak_hours:
            if "library" in hotspots:
                distribution["library"] += 1
            if "ai block" in hotspots:
                distribution["ai block"] += 1
            if "cs block" in hotspots:
                distribution["cs block"] += 1
        
        return distribution
    
    def get_demand_insights(self, request: DemandAnalysisRequest) -> Dict[str, Any]:
        """Get detailed insights about demand patterns"""
        
        # Generate demand data
        if request.request_history:
            demand_data = self._process_request_history(request.request_history)
        else:
            demand_data = self._generate_mock_data(request.time_period_hours)
        
        insights = {
            "total_requests": sum(demand_data["hourly_demand"].values()),
            "unique_locations": len(demand_data["location_demand"]),
            "busiest_hour": max(demand_data["hourly_demand"].items(), key=lambda x: x[1])[0] if demand_data["hourly_demand"] else 12,
            "top_location": max(demand_data["location_demand"].items(), key=lambda x: x[1])[0] if demand_data["location_demand"] else "canteen",
            "demand_distribution": demand_data["location_demand"],
            "hourly_pattern": demand_data["hourly_demand"]
        }
        
        return insights
