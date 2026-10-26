import React, { useState, useEffect } from 'react';
import { Calendar, Layers, ShieldAlert, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { generateProjectPlan } from '../api/client';

export default function ProjectPlanner({ onUpdateReport }) {
  const [projectName, setProjectName] = useState('Apex Commercial Complex');
  const [projectType, setProjectType] = useState('Commercial');
  const [areaSqft, setAreaSqft] = useState(45000);
  const [budgetUsd, setBudgetUsd] = useState(3200000);
  const [durationMonths, setDurationMonths] = useState(14);
  const [location, setLocation] = useState('Dallas, TX');
  const [soilCondition, setSoilCondition] = useState('Standard Clay / Sandy Silt');
  const [floors, setFloors] = useState(4);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateProjectPlan({
        project_name: projectName,
        project_type: projectType,
        total_built_up_area_sqft: Number(areaSqft),
        target_budget_usd: Number(budgetUsd),
        target_duration_months: Number(durationMonths),
        location,
        soil_condition: soilCondition,
        floors: Number(floors),
      });
      setResult(data);
      if (onUpdateReport) onUpdateReport('planning', data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-zinc-200">
      {/* Left Column: Parameters */}
      <div className="lg:col-span-4 space-y-4">
        <div className="tactical-card p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
            <span className="font-semibold text-xs tracking-wide text-white uppercase">Project Parameters</span>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Project Title</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Typology</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              >
                <option value="Commercial">Commercial</option>
                <option value="Residential">Residential</option>
                <option value="Industrial">Industrial</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Floors</label>
              <input
                type="number"
                min="1"
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Gross Area (sqft)</label>
              <input
                type="number"
                value={areaSqft}
                onChange={(e) => setAreaSqft(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Duration (Months)</label>
              <input
                type="number"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Target Budget ($ USD)</label>
            <input
              type="number"
              value={budgetUsd}
              onChange={(e) => setBudgetUsd(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
            />
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full mt-2 py-2 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow transition cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
            <span>{loading ? 'Synthesizing...' : 'Generate CPM Project Plan'}</span>
          </button>
        </div>
      </div>

      {/* Right Column: Schedule & WBS */}
      <div className="lg:col-span-8 space-y-4">
        {result ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="tactical-card p-3">
                <span className="text-[10px] font-mono text-zinc-400 block">Total Duration</span>
                <span className="text-base font-bold font-mono text-white mt-0.5">{result.estimated_total_weeks} Weeks</span>
              </div>
              <div className="tactical-card p-3">
                <span className="text-[10px] font-mono text-zinc-400 block">Total Budget</span>
                <span className="text-base font-bold font-mono text-[#0ea5e9] mt-0.5">${(result.estimated_budget_usd / 1e6).toFixed(2)}M</span>
              </div>
              <div className="tactical-card p-3">
                <span className="text-[10px] font-mono text-zinc-400 block">WBS Stages</span>
                <span className="text-base font-bold font-mono text-white mt-0.5">{result.phases.length} Phases</span>
              </div>
              <div className="tactical-card p-3">
                <span className="text-[10px] font-mono text-zinc-400 block">Workforce Peak</span>
                <span className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  {Math.max(...result.phases.map(p => p.labor_headcount))} Workers
                </span>
              </div>
            </div>

            <div className="tactical-card p-4 space-y-3">
              <span className="font-semibold text-xs tracking-wider uppercase text-zinc-300 block">
                Work Breakdown Structure & Gantt Timeline
              </span>
              <div className="space-y-2.5">
                {result.phases.map((ph) => (
                  <div key={ph.phase_id} className="p-3 rounded bg-[#0b101d] border border-[#1e2a42] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] text-zinc-500">{ph.phase_id}</span>
                        <span className="font-semibold text-white">{ph.phase_name}</span>
                        {ph.critical_path && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Critical Path
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">Weeks {ph.start_week}-{ph.end_week}</span>
                    </div>

                    <div className="w-full h-1.5 bg-[#141d30] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ph.critical_path ? 'bg-rose-500' : 'bg-emerald-400'}`}
                        style={{
                          marginLeft: `${(ph.start_week / result.estimated_total_weeks) * 100}%`,
                          width: `${Math.max(5, (ph.duration_weeks / result.estimated_total_weeks) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="tactical-card p-12 flex flex-col items-center justify-center text-center space-y-2">
            <Calendar className="w-10 h-10 text-zinc-600" />
            <span className="text-xs text-zinc-400">Click "Generate CPM Project Plan" to view 5-phase WBS timeline.</span>
          </div>
        )}
      </div>
    </div>
  );
}
