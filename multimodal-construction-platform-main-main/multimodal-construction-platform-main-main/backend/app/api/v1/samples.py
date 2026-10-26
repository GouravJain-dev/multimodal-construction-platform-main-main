from fastapi import APIRouter
from app.utils.sample_data import SAMPLE_SAFETY_IMAGE, SAMPLE_CRACK_IMAGE

router = APIRouter()

@router.get("", summary="Get preset sample scenarios for quick testing and mentor evaluation")
async def get_preset_samples():
    return {
        "safety": {
            "project_name": "Skyline Heights Tower B",
            "site_zone": "Scaffolding Zone B - Level 4",
            "image_base64": SAMPLE_SAFETY_IMAGE,
            "description": "Multi-story scaffolding platform with workers active at height and edge perimeter."
        },
        "crack": {
            "structural_element": "Beam",
            "concrete_grade": "M25 / 3500 PSI",
            "image_base64": SAMPLE_CRACK_IMAGE,
            "description": "Reinforced concrete transfer beam exhibiting 45-degree diagonal shear distress."
        },
        "planning": {
            "project_name": "Apex Commercial Complex",
            "project_type": "Commercial",
            "total_built_up_area_sqft": 45000,
            "target_budget_usd": 3200000,
            "target_duration_months": 14,
            "location": "Dallas, TX",
            "soil_condition": "Standard Clay / Sandy Silt",
            "floors": 4
        },
        "valuation": {
            "property_type": "Residential High-Rise",
            "built_up_area_sqft": 2400,
            "bedrooms": 3,
            "bathrooms": 3,
            "construction_quality": "Premium",
            "age_years": 0,
            "location_tier": "Prime Urban Core",
            "amenities": ["Underground Parking", "Swimming Pool", "24/7 Power Backup", "Gymnasium", "LEED Certified"],
            "land_area_sqft": 3000
        },
        "daily_log": {
            "date": "2026-10-19",
            "supervisor_name": "Marcus Vance",
            "raw_field_notes": "Poured 120 cubic yards of concrete on Floor 3 slab. Ready-mix transit mixer delayed 1.5 hours due to highway accident. 4 masons absent today. Steel delivery arrived at 2 PM. Minor scaffold tie wire loose on north bay, fixed on spot. Rebar crew completed column cages for Floor 4.",
            "workforce_headcount": 34,
            "weather_observed": "Clear, 28°C"
        },
        "weather": {
            "temperature_c": 36.5,
            "humidity_pct": 32.0,
            "precipitation_chance_pct": 10.0,
            "wind_speed_kmh": 28.0,
            "uv_index": 9.0,
            "scheduled_trades": [
                "Concrete Pouring & Curing",
                "Tower Crane & Aerial Hoists",
                "External Painting & Waterproofing",
                "Deep Excavation & Earthwork",
                "High-Elevation Roofing & Structural Steel"
            ]
        }
    }
