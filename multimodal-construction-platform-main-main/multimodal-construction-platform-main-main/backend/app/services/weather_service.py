import logging
from app.schemas.weather import WeatherAdvisoryRequest, WeatherAdvisoryResponse, TradeAdvisory
from app.services.gemini_client import generate_multimodal_content

logger = logging.getLogger("weather_service")

WEATHER_SYSTEM_PROMPT = """
You are a licensed Construction Risk Engineer and Meteorological Safety Consultant.
Analyze the provided meteorological parameters against active construction trade operations.
Evaluate risks according to standard building specifications (ACI 305R Hot Weather, ACI 306R Cold Weather, OSHA 1926.1431 Crane Wind Thresholds, and NIOSH Heat Illness Prevention).
For each trade, assign status ("Safe" | "Caution" | "Unsafe"), itemize specific physical risk factors, and mandate engineering controls.
Provide an overall site condition status and worker safety advisory.

Respond strictly in valid JSON matching this schema:
{
  "overall_site_condition": string,
  "risk_level": "Safe" | "Caution" | "Unsafe",
  "trade_advisories": [
    {
      "trade": string,
      "status": "Safe" | "Caution" | "Unsafe",
      "risk_factors": [string],
      "mandatory_measures": [string]
    }
  ],
  "worker_safety_advisory": string
}
"""

def generate_deterministic_weather_advisory(req: WeatherAdvisoryRequest) -> WeatherAdvisoryResponse:
    """Deterministic engineering physics advisory for construction trades."""
    temp = req.temperature_c
    humidity = req.humidity_pct
    rain_prob = req.precipitation_chance_pct
    wind = req.wind_speed_kmh
    uv = req.uv_index
    
    trade_advisories = []
    caution_count = 0
    unsafe_count = 0
    
    # 1. Concrete Pouring & Curing
    concrete_risks = []
    concrete_measures = []
    concrete_status = "Safe"
    if temp > 32.0 or (temp > 28.0 and humidity < 35.0):
        concrete_status = "Caution"
        caution_count += 1
        concrete_risks.append(f"Elevated evaporation rate (Temp: {temp}°C, Humidity: {humidity}%) causing rapid surface drying and plastic shrinkage cracks.")
        concrete_measures.extend([
            "Dose batch mix with chilled water or flake ice to keep fresh concrete temp below 30°C (ACI 305R).",
            "Spray aliphatic alcohol evaporation retardant immediately following surface screeding.",
            "Commence wet continuous burlap curing as soon as surface can support weight without marring."
        ])
    elif temp < 5.0:
        concrete_status = "Unsafe" if temp < 0.0 else "Caution"
        if concrete_status == "Unsafe": unsafe_count += 1
        else: caution_count += 1
        concrete_risks.append("Freezing of pore water in plastic concrete causing permanent 50% compressive strength loss.")
        concrete_measures.extend([
            "Heat mixing aggregates and batch water; do not pour concrete against frozen subgrade or rebar.",
            "Deploy heated thermal curing blankets maintaining internal concrete temp above 10°C for min 72 hours (ACI 306R)."
        ])
    if rain_prob > 40.0:
        concrete_status = "Caution"
        concrete_risks.append("Precipitation will dilute surface water-cement ratio, resulting in dusting and weakened wear layer.")
        concrete_measures.append("Keep waterproof polyethylene tarpaulins staged immediately adjacent to pour area.")
    if not concrete_risks:
        concrete_risks.append("Favorable ambient hydration conditions.")
        concrete_measures.append("Proceed with standard curing compound application per ASTM C309.")
        
    trade_advisories.append(TradeAdvisory(
        trade="Concrete Pouring & Curing",
        status=concrete_status,
        risk_factors=concrete_risks,
        mandatory_measures=concrete_measures
    ))
    
    # 2. Tower Crane & Aerial Hoists
    crane_risks = []
    crane_measures = []
    crane_status = "Safe"
    if wind >= 55.0:
        crane_status = "Unsafe"
        unsafe_count += 1
        crane_risks.append(f"Sustained wind speeds ({wind} km/h) exceed OSHA out-of-service maximum hoist safety threshold.")
        crane_measures.extend([
            "CEASE all crane operations immediately; land suspended loads safely.",
            "Release slew brake on tower crane to permit free-weathervaning orientation."
        ])
    elif wind >= 35.0:
        crane_status = "Caution"
        caution_count += 1
        crane_risks.append(f"Moderate wind velocity ({wind} km/h) can cause load sail-effect and pendulum swing on large surface-area materials.")
        crane_measures.extend([
            "Attach dual taglines to all lifted panels, formwork, and rebar bundles.",
            "Continuously observe mast-top calibrated anemometer readouts."
        ])
    else:
        crane_risks.append("Wind velocities within safe operational tolerance.")
        crane_measures.append("Maintain standard rigging inspection and certified rigger signals.")
        
    trade_advisories.append(TradeAdvisory(
        trade="Tower Crane & Aerial Hoists",
        status=crane_status,
        risk_factors=crane_risks,
        mandatory_measures=crane_measures
    ))
    
    # 3. External Painting & Waterproofing
    paint_risks = []
    paint_measures = []
    paint_status = "Safe"
    if rain_prob >= 30.0 or humidity > 80.0:
        paint_status = "Unsafe" if rain_prob > 50.0 else "Caution"
        if paint_status == "Unsafe": unsafe_count += 1
        else: caution_count += 1
        paint_risks.append(f"High moisture content (Humidity: {humidity}%, Rain Chance: {rain_prob}%) causes substrate condensation, paint wash-off, and coating blistering.")
        paint_measures.extend([
            "Postpone external elastomer and epoxy waterproofing coatings until relative humidity drops below 80%.",
            "Verify substrate surface moisture is below 4.5% using calibrated pinless moisture meter prior to application."
        ])
    else:
        paint_risks.append("Optimal atmospheric conditions for polymer cross-linking and solvent flashing.")
        paint_measures.append("Maintain standard wet-film thickness (WFT) mil gauge checks.")
        
    trade_advisories.append(TradeAdvisory(
        trade="External Painting & Waterproofing",
        status=paint_status,
        risk_factors=paint_risks,
        mandatory_measures=paint_measures
    ))
    
    # 4. Deep Excavation & Earthwork
    exc_risks = []
    exc_measures = []
    exc_status = "Safe"
    if rain_prob >= 40.0:
        exc_status = "Caution"
        caution_count += 1
        exc_risks.append("Rainwater saturation increases soil pore pressure, threatening trench sidewall shear collapse and muddying footing beds.")
        exc_measures.extend([
            "Inspect trench shoring boxes and soil nail slopes prior to worker entry.",
            "Position high-capacity sump dewatering pumps at lowest grade pit points."
        ])
    else:
        exc_risks.append("Dry subgrade conditions favorable for heavy earthmoving equipment.")
        exc_measures.append("Spray water cart over haul roads to mitigate ambient PM10 fugitive dust emissions.")
        
    trade_advisories.append(TradeAdvisory(
        trade="Deep Excavation & Earthwork",
        status=exc_status,
        risk_factors=exc_risks,
        mandatory_measures=exc_measures
    ))
    
    # 5. High-Elevation Roofing & Structural Steel
    roof_risks = []
    roof_measures = []
    roof_status = "Safe"
    if wind >= 40.0 or rain_prob >= 40.0:
        roof_status = "Unsafe"
        unsafe_count += 1
        roof_risks.append("Elevated gust velocities combined with slippery steel surfaces create extreme fall hazard.")
        roof_measures.extend([
            "Stand down ironworkers from exposed perimeter beams and open roof decking.",
            "Verify all loose metal deck sheets are securely welded or screwed down."
        ])
    elif wind >= 25.0:
        roof_status = "Caution"
        caution_count += 1
        roof_risks.append("Moderate gusts can catch metal sheeting during hoisting and placement.")
        roof_measures.append("Enforce 100% dual lanyard tie-off to engineered horizontal lifelines at all times.")
    else:
        roof_risks.append("Favorable conditions for structural steel erection.")
        roof_measures.append("Standard fall protection protocol enforced.")
        
    trade_advisories.append(TradeAdvisory(
        trade="High-Elevation Roofing & Structural Steel",
        status=roof_status,
        risk_factors=roof_risks,
        mandatory_measures=roof_measures
    ))
    
    # Worker safety advisory
    if temp > 33.0:
        worker_safety = f"NIOSH High Heat Alert (Temp {temp}°C, UV {uv}): Mandate 15-minute rest breaks in shaded cool-down tents every 45 minutes. Provide chilled electrolyte water stations."
    elif temp < 5.0:
        worker_safety = f"Cold Stress Warning (Temp {temp}°C): Supply windproof layered insulated garments and warm beverage stations to prevent hypothermia."
    else:
        worker_safety = f"Comfortable environmental conditions (Temp {temp}°C, Humidity {humidity}%). Standard hydration and PPE protocols applicable."
        
    if unsafe_count > 0:
        overall_condition = "Adverse Weather Hazard - High Risk Operations Restricted"
        overall_level = "Unsafe"
    elif caution_count > 0:
        overall_condition = "Moderate Meteorological Caution - Specific Trade Safeguards Required"
        overall_level = "Caution"
    else:
        overall_condition = "Favorable Weather - All Operations Permitted"
        overall_level = "Safe"
        
    return WeatherAdvisoryResponse(
        overall_site_condition=overall_condition,
        risk_level=overall_level,
        trade_advisories=trade_advisories,
        worker_safety_advisory=worker_safety
    )

async def generate_weather_advisory(req: WeatherAdvisoryRequest) -> WeatherAdvisoryResponse:
    """Generate weather advisory using Gemini or deterministic meteorological risk model."""
    user_prompt = f"""
    Evaluate weather impacts on construction trades:
    Temperature: {req.temperature_c}°C
    Relative Humidity: {req.humidity_pct}%
    Precipitation Chance: {req.precipitation_chance_pct}%
    Wind Speed: {req.wind_speed_kmh} km/h
    UV Index: {req.uv_index}
    Scheduled Trades: {', '.join(req.scheduled_trades)}
    
    Assess trade risk statuses (Safe/Caution/Unsafe), cite standards (ACI 305/306, OSHA 1926), and define mandatory mitigation controls.
    """
    
    ai_data = await generate_multimodal_content(
        prompt=user_prompt,
        image=None,
        system_instruction=WEATHER_SYSTEM_PROMPT
    )
    
    if ai_data:
        try:
            return WeatherAdvisoryResponse(**ai_data)
        except Exception as e:
            logger.warning(f"Error parsing Gemini weather response: {e}. Falling back to deterministic engine.")
            
    return generate_deterministic_weather_advisory(req)
