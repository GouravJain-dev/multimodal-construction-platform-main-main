import logging
from app.schemas.valuation import (
    ValuationRequest, ValuationResponse, MarketValueRange, 
    CostBreakdown, InvestmentMetrics
)
from app.services.gemini_client import generate_multimodal_content

logger = logging.getLogger("valuation_service")

VALUATION_SYSTEM_PROMPT = """
You are a certified Senior Real Estate Appraiser (MAI / RICS) and Chartered Quantity Surveyor.
Evaluate the property specification using hedonic pricing, replacement cost methodology, and income capitalization.
Compute:
1. Estimated Market Value Range (min, median, max) and Price per Sqft.
2. Replacement Cost Breakdown: Direct construction cost, land share valuation, developer overhead/margin.
3. Investment Metrics: Projected monthly rental income, gross rental yield (%), capitalization rate (Cap Rate %), 5-year capital appreciation projection.
4. Comparative Market Insights & economic drivers.

Respond strictly in valid JSON matching this schema:
{
  "property_type": string,
  "estimated_market_value": {
    "min_value": number,
    "median_value": number,
    "max_value": number,
    "currency": "USD"
  },
  "price_per_sqft": number,
  "cost_breakdown": {
    "construction_cost": number,
    "land_share_value": number,
    "developer_margin_overhead": number
  },
  "investment_metrics": {
    "projected_monthly_rental": number,
    "gross_rental_yield_pct": number,
    "estimated_cap_rate_pct": number,
    "forecasted_5yr_appreciation_pct": number
  },
  "comparative_market_insights": [string]
}
"""

def generate_deterministic_valuation(req: ValuationRequest) -> ValuationResponse:
    """Quantitative hedonic pricing and DCF/Cap-rate financial appraisal model."""
    area = req.built_up_area_sqft
    
    # Base construction cost per sqft based on specification grade
    quality_rates = {
        "Standard": 165.0,
        "Premium": 245.0,
        "Ultra-Luxury": 395.0
    }
    base_build_rate = quality_rates.get(req.construction_quality, 245.0)
    
    # Location tier multipliers
    loc_multipliers = {
        "Prime Urban Core": 1.95,
        "Suburban Growth Corridor": 1.35,
        "Outer Metropolitan": 1.05,
        "Industrial Zone": 0.90
    }
    loc_mult = loc_multipliers.get(req.location_tier, 1.4)
    
    # Amenity value premium (+2.5% per certified amenity, capped at 25%)
    amenity_count = len(req.amenities)
    amenity_mult = 1.0 + min(0.25, amenity_count * 0.025)
    
    # Depreciation adjustment (1.2% per year of age, max 40% depreciation)
    age_depreciation = max(0.60, 1.0 - (req.age_years * 0.012))
    
    # Direct Construction Cost
    construction_cost = round(area * base_build_rate * age_depreciation, 2)
    
    # Land Share Value calculation
    land_area = req.land_area_sqft if req.land_area_sqft else (area * 0.8)
    land_base_rate = base_build_rate * 0.55 * loc_mult
    land_value = round(land_area * land_base_rate * 0.5, 2)
    
    # Developer Margin & Overhead (15-20%)
    margin_overhead = round((construction_cost + land_value) * 0.16, 2)
    
    # Total Median Market Value
    median_val = round((construction_cost + land_value + margin_overhead) * amenity_mult, 2)
    min_val = round(median_val * 0.93, 2)
    max_val = round(median_val * 1.08, 2)
    
    price_per_sqft = round(median_val / area, 2)
    
    # Rental & Investment Calculations
    # Cap rate benchmarks based on location tier
    cap_rate_map = {
        "Prime Urban Core": 5.2,
        "Suburban Growth Corridor": 6.4,
        "Outer Metropolitan": 7.1,
        "Industrial Zone": 7.8
    }
    cap_rate = cap_rate_map.get(req.location_tier, 5.8)
    
    # Annual NOI = Median Value * (Cap Rate / 100)
    annual_noi = median_val * (cap_rate / 100.0)
    # Gross rent assumes ~75% NOI efficiency ratio (25% operating expenses/taxes/management)
    annual_gross_rent = annual_noi / 0.75
    monthly_rent = round(annual_gross_rent / 12.0, 2)
    gross_yield = round((annual_gross_rent / median_val) * 100.0, 2)
    
    # 5-Year Capital Appreciation Forecast
    appreciation_map = {
        "Prime Urban Core": 28.5,
        "Suburban Growth Corridor": 34.0,
        "Outer Metropolitan": 21.0,
        "Industrial Zone": 24.0
    }
    appreciation_5yr = appreciation_map.get(req.location_tier, 26.0)
    
    insights = [
        f"Valuation is anchored by the {req.location_tier} geographic index, commanding a {loc_mult:.2f}x location factor over outer metropolitan baselines.",
        f"{req.construction_quality} grade finishes and {amenity_count} incorporated amenities contribute a net +{((amenity_mult - 1.0) * 100):.1f}% market valuation premium.",
        f"Projected gross rental yield of {gross_yield:.2f}% and estimated Cap Rate of {cap_rate:.2f}% indicate strong institutional-grade investor yield.",
        f"Construction replacement cost represents {round((construction_cost / median_val) * 100, 1)}% of total asset capitalization."
    ]
    
    return ValuationResponse(
        property_type=req.property_type,
        estimated_market_value=MarketValueRange(
            min_value=min_val,
            median_value=median_val,
            max_value=max_val,
            currency="USD"
        ),
        price_per_sqft=price_per_sqft,
        cost_breakdown=CostBreakdown(
            construction_cost=construction_cost,
            land_share_value=land_value,
            developer_margin_overhead=margin_overhead
        ),
        investment_metrics=InvestmentMetrics(
            projected_monthly_rental=monthly_rent,
            gross_rental_yield_pct=gross_yield,
            estimated_cap_rate_pct=cap_rate,
            forecasted_5yr_appreciation_pct=appreciation_5yr
        ),
        comparative_market_insights=insights
    )

async def calculate_real_estate_valuation(req: ValuationRequest) -> ValuationResponse:
    """Calculate valuation using Gemini appraiser intelligence or quantitative DCF model."""
    user_prompt = f"""
    Conduct an appraisal and feasibility valuation for this property:
    Typology: {req.property_type}
    Built-Up Area: {req.built_up_area_sqft} sqft
    Bedrooms: {req.bedrooms} | Bathrooms: {req.bathrooms}
    Quality Grade: {req.construction_quality}
    Age: {req.age_years} years
    Location Tier: {req.location_tier}
    Amenities: {', '.join(req.amenities)}
    Land Area: {req.land_area_sqft} sqft
    Return comprehensive value range, per-sqft metrics, replacement cost breakdown, rental yields, cap rate, and comparative insights.
    """
    
    ai_data = await generate_multimodal_content(
        prompt=user_prompt,
        image=None,
        system_instruction=VALUATION_SYSTEM_PROMPT
    )
    
    if ai_data:
        try:
            return ValuationResponse(**ai_data)
        except Exception as e:
            logger.warning(f"Error parsing Gemini valuation response: {e}. Falling back to DCF engine.")
            
    return generate_deterministic_valuation(req)
