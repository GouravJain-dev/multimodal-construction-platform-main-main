import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.sample_data import SAMPLE_SAFETY_IMAGE, SAMPLE_CRACK_IMAGE

client = TestClient(app)

def test_root_and_health():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "online"

    health = client.get("/api/v1/health")
    assert health.status_code == 200
    data = health.json()
    assert data["status"] == "healthy"
    assert "ai_mode" in data

def test_samples_endpoint():
    resp = client.get("/api/v1/samples")
    assert resp.status_code == 200
    data = resp.json()
    assert "safety" in data
    assert "crack" in data
    assert "planning" in data
    assert "valuation" in data
    assert "daily_log" in data
    assert "weather" in data

def test_safety_analysis_json():
    payload = {
        "project_name": "Test Site Alpha",
        "site_zone": "Deck Zone 3",
        "image_base64": SAMPLE_SAFETY_IMAGE
    }
    resp = client.post("/api/v1/safety/analyze-json", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert 0 <= data["hazard_score"] <= 100
    assert len(data["detections"]) > 0
    assert len(data["infractions"]) > 0
    assert len(data["actions"]) > 0
    assert data["workers_detected"] >= 1

def test_crack_analysis_json():
    payload = {
        "structural_element": "Beam",
        "concrete_grade": "M25 / 3500 PSI",
        "image_base64": SAMPLE_CRACK_IMAGE
    }
    resp = client.post("/api/v1/crack/analyze-json", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["crack_detected"] is True
    assert data["estimated_width_mm"] > 0
    assert "code_reference" in data
    assert len(data["remediation_protocol"]) > 0

def test_planning_generation():
    payload = {
        "project_name": "Apex Commercial Complex",
        "project_type": "Commercial",
        "total_built_up_area_sqft": 45000,
        "target_budget_usd": 3200000,
        "target_duration_months": 14,
        "location": "Dallas, TX",
        "soil_condition": "Standard Clay",
        "floors": 4
    }
    resp = client.post("/api/v1/planning/generate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["phases"]) == 5
    assert data["estimated_total_weeks"] > 0
    assert len(data["risk_contingency_matrix"]) > 0

def test_valuation_calculation():
    payload = {
        "property_type": "Residential High-Rise",
        "built_up_area_sqft": 2400,
        "bedrooms": 3,
        "bathrooms": 3,
        "construction_quality": "Premium",
        "age_years": 0,
        "location_tier": "Prime Urban Core",
        "amenities": ["Underground Parking", "Swimming Pool", "24/7 Power Backup"],
        "land_area_sqft": 3000
    }
    resp = client.post("/api/v1/valuation/calculate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["price_per_sqft"] > 0
    assert data["cost_breakdown"]["construction_cost"] > 0
    assert data["investment_metrics"]["gross_rental_yield_pct"] > 0

def test_daily_log_processing():
    payload = {
        "date": "2026-10-19",
        "supervisor_name": "Marcus Vance",
        "raw_field_notes": "Poured 120 cu.yd slab concrete. Transit truck delayed 1.5 hours due to highway accident. 4 masons absent today. Loose scaffold tie wire fixed on spot.",
        "workforce_headcount": 34,
        "weather_observed": "Clear, 28°C"
    }
    resp = client.post("/api/v1/daily-log/process", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["progress_highlights"]) > 0
    assert len(data["delays_and_bottlenecks"]) > 0
    assert len(data["next_day_punch_list"]) > 0

def test_weather_advisory():
    payload = {
        "temperature_c": 36.5,
        "humidity_pct": 32.0,
        "precipitation_chance_pct": 10.0,
        "wind_speed_kmh": 28.0,
        "uv_index": 9.0,
        "scheduled_trades": [
            "Concrete Pouring & Curing",
            "Tower Crane & Aerial Hoists"
        ]
    }
    resp = client.post("/api/v1/weather/advisory", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_level"] in ["Safe", "Caution", "Unsafe"]
    assert len(data["trade_advisories"]) > 0

def test_chat_assistant():
    payload = {
        "message": "What is the minimum curing period for OPC concrete according to ACI 308?",
        "conversation_history": []
    }
    resp = client.post("/api/v1/chat/message", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["response"]) > 20
    assert len(data["citations"]) > 0
    assert len(data["suggested_followups"]) > 0
