import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Thermometer, Sun, ShieldAlert, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getWeatherAdvisory } from '../api/client';

export default function WeatherAdvisor({ onUpdateReport }) {
  const [tempC, setTempC] = useState(36.5);
  const [humidity, setHumidity] = useState(32);
  const [rainChance, setRainChance] = useState(10);
  const [windKmh, setWindKmh] = useState(28);
  const [uvIndex, setUvIndex] = useState(9);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    handleRunAdvisory();
  }, []);

  const applyScenario = (t, h, r, w, uv) => {
    setTempC(t);
    setHumidity(h);
    setRainChance(r);
    setWindKmh(w);
    setUvIndex(uv);
  };

  const handleRunAdvisory = async () => {
    setLoading(true);
    try {
      const data = await getWeatherAdvisory({
        temperature_c: Number(tempC),
        humidity_pct: Number(humidity),
        precipitation_chance_pct: Number(rainChance),
        wind_speed_kmh: Number(windKmh),
        uv_index: Number(uvIndex),
        scheduled_trades: [
          'Concrete Pouring & Curing',
          'Tower Crane & Aerial Hoists',
          'External Painting & Waterproofing',
          'Deep Excavation & Earthwork',
        ],
      });
      setResult(data);
      if (onUpdateReport) onUpdateReport('weather', data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-zinc-200">
      <div className="lg:col-span-4 space-y-4">
        <div className="tactical-card p-4 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
            <span className="font-semibold text-xs tracking-wide text-white uppercase">Meteorological Parameters</span>
          </div>

          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => applyScenario(36.5, 32, 10, 28, 9)}
              className="text-[10px] px-2 py-1 rounded bg-[#0b101d] text-zinc-300 border border-[#1e2a42] hover:border-zinc-500 cursor-pointer"
            >
              Extreme Heat
            </button>
            <button
              onClick={() => applyScenario(18, 60, 20, 58, 3)}
              className="text-[10px] px-2 py-1 rounded bg-[#0b101d] text-zinc-300 border border-[#1e2a42] hover:border-zinc-500 cursor-pointer"
            >
              Gale Wind Crane
            </button>
            <button
              onClick={() => applyScenario(20, 85, 75, 20, 2)}
              className="text-[10px] px-2 py-1 rounded bg-[#0b101d] text-zinc-300 border border-[#1e2a42] hover:border-zinc-500 cursor-pointer"
            >
              Heavy Rain
            </button>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Temperature</span>
                <span className="font-mono text-white font-bold">{tempC}°C</span>
              </div>
              <input
                type="range"
                min="-10"
                max="50"
                value={tempC}
                onChange={(e) => setTempC(parseFloat(e.target.value))}
                className="w-full accent-[#0ea5e9]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Wind Speed</span>
                <span className="font-mono text-white font-bold">{windKmh} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={windKmh}
                onChange={(e) => setWindKmh(parseInt(e.target.value))}
                className="w-full accent-[#0ea5e9]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Rain Chance</span>
                <span className="font-mono text-white font-bold">{rainChance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={rainChance}
                onChange={(e) => setRainChance(parseInt(e.target.value))}
                className="w-full accent-[#0ea5e9]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Humidity</span>
                <span className="font-mono text-white font-bold">{humidity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={humidity}
                onChange={(e) => setHumidity(parseInt(e.target.value))}
                className="w-full accent-[#0ea5e9]"
              />
            </div>
          </div>

          <button
            onClick={handleRunAdvisory}
            disabled={loading}
            className="w-full mt-2 py-2 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow transition cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CloudRain className="w-3.5 h-3.5" />}
            <span>{loading ? 'Evaluating...' : 'Evaluate Weather Impact'}</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-4">
        {result ? (
          <>
            <div className="tactical-card p-5 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-[#1c263c]">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  METEOROLOGICAL ADVISORY
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  result.risk_level === 'Unsafe' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                  result.risk_level === 'Caution' ? 'bg-amber-500/20 text-[#38bdf8] border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {result.risk_level} Protocol
                </span>
              </div>
              <h3 className="text-base font-bold text-white pt-1">{result.overall_site_condition}</h3>
              <p className="text-xs text-zinc-300 leading-relaxed pt-1">{result.worker_safety_advisory}</p>
            </div>

            <div className="tactical-card p-4 space-y-3">
              <span className="font-semibold text-xs tracking-wider uppercase text-zinc-300 block">
                Trade Safeguards & Code Thresholds
              </span>
              <div className="space-y-3">
                {result.trade_advisories.map((ta, i) => (
                  <div key={i} className="p-3 rounded bg-[#0b101d] border border-[#1e2a42] space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-white">{ta.trade}</span>
                      <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                        ta.status === 'Unsafe' ? 'text-rose-400 bg-rose-500/10' :
                        ta.status === 'Caution' ? 'text-[#38bdf8] bg-amber-500/10' :
                        'text-emerald-400 bg-emerald-500/10'
                      }`}>{ta.status}</span>
                    </div>

                    <div className="text-[11px] text-zinc-400 space-y-0.5">
                      {ta.risk_factors.map((rf, rIdx) => (
                        <div key={rIdx} className="flex items-start space-x-1">
                          <span className="text-amber-400">•</span>
                          <span>{rf}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-zinc-300 space-y-0.5 pt-1 border-t border-[#1a253a]">
                      {ta.mandatory_measures.map((mm, mIdx) => (
                        <div key={mIdx} className="flex items-start space-x-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
                          <span className="text-zinc-200">{mm}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="tactical-card p-12 flex flex-col items-center justify-center text-center space-y-2">
            <CloudRain className="w-10 h-10 text-zinc-600" />
            <span className="text-xs text-zinc-400">Click "Evaluate Weather Impact" to view trade workability.</span>
          </div>
        )}
      </div>
    </div>
  );
}
