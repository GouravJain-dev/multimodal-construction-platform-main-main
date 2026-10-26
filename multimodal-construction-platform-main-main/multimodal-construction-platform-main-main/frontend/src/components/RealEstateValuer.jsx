import React, { useState, useEffect } from 'react';
import { Building2, DollarSign, TrendingUp, Sparkles, RefreshCw, PieChart, Check } from 'lucide-react';
import { calculateValuation } from '../api/client';

const ALL_AMENITIES = [
  'Underground Parking',
  'Swimming Pool',
  '24/7 Power Backup',
  'Gymnasium',
  'LEED Certified',
  'Rooftop Lounge',
  'EV Charging Stations',
];

export default function RealEstateValuer({ onUpdateReport }) {
  const [propertyType, setPropertyType] = useState('Residential High-Rise');
  const [areaSqft, setAreaSqft] = useState(2400);
  const [quality, setQuality] = useState('Premium');
  const [locationTier, setLocationTier] = useState('Prime Urban Core');
  const [selectedAmenities, setSelectedAmenities] = useState([
    'Underground Parking',
    'Swimming Pool',
    '24/7 Power Backup',
    'LEED Certified'
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    handleCalculate();
  }, []);

  const toggleAmenity = (item) => {
    if (selectedAmenities.includes(item)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== item));
    } else {
      setSelectedAmenities([...selectedAmenities, item]);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const data = await calculateValuation({
        property_type: propertyType,
        built_up_area_sqft: Number(areaSqft),
        construction_quality: quality,
        location_tier: locationTier,
        amenities: selectedAmenities,
        bedrooms: 3,
        bathrooms: 3,
        age_years: 0,
        land_area_sqft: areaSqft * 1.2,
      });
      setResult(data);
      if (onUpdateReport) onUpdateReport('valuation', data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-zinc-200">
      <div className="lg:col-span-4 space-y-4">
        <div className="tactical-card p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
            <span className="font-semibold text-xs tracking-wide text-white uppercase">Property Specification</span>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Typology</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
            >
              <option value="Residential High-Rise">Residential High-Rise</option>
              <option value="Residential Single-Family">Residential Single-Family</option>
              <option value="Commercial Office">Commercial Office</option>
              <option value="Retail Storefront">Retail Storefront</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Built-Up Area (sqft)</label>
            <input
              type="number"
              value={areaSqft}
              onChange={(e) => setAreaSqft(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Finish Quality</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              >
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Ultra-Luxury">Ultra-Luxury</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Location</label>
              <select
                value={locationTier}
                onChange={(e) => setLocationTier(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              >
                <option value="Prime Urban Core">Prime Urban</option>
                <option value="Suburban Growth Corridor">Suburban</option>
                <option value="Outer Metropolitan">Outer Metro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1.5">Amenities</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_AMENITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`text-[10px] px-2 py-1 rounded transition border cursor-pointer ${
                    selectedAmenities.includes(a)
                      ? 'bg-[#0284c7] text-white font-semibold border-[#0ea5e9]'
                      : 'bg-[#0b101d] text-zinc-400 border-[#1e2a42] hover:border-zinc-500'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full mt-2 py-2 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow transition cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
            <span>{loading ? 'Evaluating...' : 'Calculate Valuation & Cap Rate'}</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-4">
        {result ? (
          <>
            <div className="tactical-card p-5 space-y-3">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                FAIR MARKET APPRAISAL
              </span>
              <div className="flex items-baseline justify-between pb-3 border-b border-[#1c263c]">
                <div>
                  <h3 className="text-3xl font-extrabold font-mono text-white tracking-tight">
                    {formatCurrency(result.estimated_market_value.median_value)}
                  </h3>
                  <span className="text-xs text-zinc-400 mt-1 block">
                    Range: {formatCurrency(result.estimated_market_value.min_value)} — {formatCurrency(result.estimated_market_value.max_value)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-bold text-emerald-400">
                    ${result.price_per_sqft.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-500 block font-mono">per sqft</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42]">
                  <span className="text-[10px] text-zinc-400 block font-mono">Monthly Rent</span>
                  <span className="text-sm font-mono font-bold text-white mt-0.5 block">
                    {formatCurrency(result.investment_metrics.projected_monthly_rental)}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42]">
                  <span className="text-[10px] text-zinc-400 block font-mono">Gross Yield</span>
                  <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">
                    {result.investment_metrics.gross_rental_yield_pct}%
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42]">
                  <span className="text-[10px] text-zinc-400 block font-mono">Cap Rate (NOI)</span>
                  <span className="text-sm font-mono font-bold text-[#0ea5e9] mt-0.5 block">
                    {result.investment_metrics.estimated_cap_rate_pct}%
                  </span>
                </div>
              </div>
            </div>

            <div className="tactical-card p-4 space-y-2.5">
              <span className="font-semibold text-xs tracking-wider uppercase text-zinc-300 block">
                Cost & Land Equity Breakdown
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Direct Construction Cost</span>
                  <span className="font-mono">{formatCurrency(result.cost_breakdown.construction_cost)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Land Share Equity</span>
                  <span className="font-mono">{formatCurrency(result.cost_breakdown.land_share_value)}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Developer Margin & Overhead</span>
                  <span className="font-mono">{formatCurrency(result.cost_breakdown.developer_margin_overhead)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="tactical-card p-12 flex flex-col items-center justify-center text-center space-y-2">
            <Building2 className="w-10 h-10 text-zinc-600" />
            <span className="text-xs text-zinc-400">Click "Calculate Valuation" to view financial and Cap Rate analytics.</span>
          </div>
        )}
      </div>
    </div>
  );
}
