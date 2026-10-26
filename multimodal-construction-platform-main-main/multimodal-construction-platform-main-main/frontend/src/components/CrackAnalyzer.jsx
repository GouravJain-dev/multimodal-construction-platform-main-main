import React, { useState } from 'react';
import { UploadCloud, AlertTriangle, Shield, RefreshCw, Eye, Sparkles, Hammer, Check } from 'lucide-react';
import { analyzeCrackFile, analyzeCrackJson } from '../api/client';

export default function CrackAnalyzer({ onUpdateReport }) {
  const [structuralElement, setStructuralElement] = useState('Beam');
  const [concreteGrade, setConcreteGrade] = useState('M25 / 3500 PSI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState({
    structural_element: 'Reinforced Concrete Transfer Beam',
    crack_detected: true,
    crack_classification: 'Shear Crack',
    estimated_width_mm: 2.4,
    severity: 'Severe',
    structural_risk_rating: 'High',
    cause_analysis: 'Distinct 45-degree diagonal tension fracture propagating from support toward neutral axis. Indicates primary shear stress exceedance and potential undersized shear stirrup reinforcement or excessive concentrated live load.',
    code_reference: 'ACI 318-19 Section 9.5 (Design Shear Strength) & ACI 224R-01 (Tolerable Crack Widths: Limit 0.40mm for interior exposure)',
    immediate_actions: [
      'Erect temporary heavy-duty hydraulic screw jacks (shore props) beneath the beam at one-third span immediately.',
      'Cordon off the floor area directly above and beneath the affected bay to eliminate transient live loads.',
      'Affix calibrated acrylic tell-tale crack motion monitors across the crack face to record active movement.'
    ],
    remediation_protocol: [
      'Perform ultrasonic pulse velocity (UPV) or core sampling to map internal crack depth and rebar debonding.',
      'Surface preparation and low-viscosity epoxy pressure injection conforming to ASTM C881 Type I/IV.',
      'Structural strengthening via high-modulus Carbon Fiber Reinforced Polymer (CFRP) U-wrap laminate jackets around the shear span.'
    ]
  });

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeCrackJson({
        structural_element: structuralElement,
        concrete_grade: concreteGrade,
        image_base64: 'demo_beam',
      });
      setResult(data);
      if (onUpdateReport) onUpdateReport('crack', data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-zinc-200">
      {/* Left Column: Form & Scan Config */}
      <div className="lg:col-span-4 space-y-4">
        <div className="tactical-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
              <span className="font-semibold text-xs tracking-wide text-white uppercase">Structural Image Ingestion</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">ACI 318 Triage</span>
          </div>

          <div className="border border-dashed border-[#243555] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer bg-[#0b101d]/60">
            <UploadCloud className="w-8 h-8 text-zinc-400 mb-2" />
            <span className="text-xs text-zinc-300 font-medium">Click to upload structural surface photo</span>
            <span className="text-[11px] text-zinc-500 mt-1">High-resolution concrete or masonry close-up</span>

            <div className="mt-3 px-3 py-1.5 rounded-md bg-[#0f1a2e] border border-[#1e2f4f] text-[11px] text-zinc-300 flex items-center space-x-2 w-full justify-between">
              <div className="flex items-center space-x-1.5 truncate">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">RC_Transfer_Beam_B4.jpg</span>
              </div>
              <span className="text-zinc-500 font-mono text-[10px] shrink-0">(6.2MB)</span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Structural Element</label>
              <select
                value={structuralElement}
                onChange={(e) => setStructuralElement(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              >
                <option value="Beam">Reinforced Concrete Beam</option>
                <option value="Column">Reinforced Concrete Column</option>
                <option value="Slab">Suspended Two-Way Slab</option>
                <option value="Retaining Wall">Basement Retaining Wall</option>
                <option value="Foundation">Foundation Footing / Raft</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Concrete Design Grade</label>
              <input
                type="text"
                value={concreteGrade}
                onChange={(e) => setConcreteGrade(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              />
            </div>
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="w-full mt-2 py-2 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow transition cursor-pointer flex items-center justify-center space-x-2"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{loading ? 'Analyzing...' : 'Run Forensic Crack Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Forensic Diagnosis */}
      <div className="lg:col-span-8 space-y-4">
        {result && (
          <>
            {/* Banner Card */}
            <div className="tactical-card p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#1c263c]">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-mono">
                    DIAGNOSED CRACK MORPHOLOGY
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{result.crack_classification}</h3>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  {result.structural_risk_rating} Risk
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded bg-[#0b101d] border border-[#1e2a42]">
                  <span className="text-[10px] text-zinc-400 block">Est. Max Width</span>
                  <span className="text-lg font-mono font-bold text-rose-400">{result.estimated_width_mm} mm</span>
                </div>
                <div className="p-3 rounded bg-[#0b101d] border border-[#1e2a42]">
                  <span className="text-[10px] text-zinc-400 block">Severity Tier</span>
                  <span className="text-sm font-semibold text-white mt-1 block">{result.severity}</span>
                </div>
                <div className="p-3 rounded bg-[#0b101d] border border-[#1e2a42]">
                  <span className="text-[10px] text-zinc-400 block">Component</span>
                  <span className="text-xs font-medium text-zinc-300 mt-1 block truncate">{result.structural_element}</span>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[11px] font-mono text-[#0ea5e9] uppercase tracking-wide block mb-1">
                  Root Cause Mechanism:
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">{result.cause_analysis}</p>
              </div>

              <div className="pt-2 text-[11px] text-zinc-500 border-t border-[#1c263c] flex justify-between">
                <span>Design Code Reference:</span>
                <span className="font-mono text-zinc-400">{result.code_reference}</span>
              </div>
            </div>

            {/* Shoring & Safety Actions */}
            <div className="tactical-card p-4 space-y-2">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wide flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Immediate Structural Safety Actions</span>
              </span>
              <ul className="space-y-1.5">
                {result.immediate_actions.map((act, i) => (
                  <li key={i} className="flex items-start space-x-2 text-xs text-zinc-300">
                    <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Remediation Protocol */}
            <div className="tactical-card p-4 space-y-2">
              <span className="text-xs font-mono font-bold text-[#0ea5e9] uppercase tracking-wide flex items-center space-x-1.5">
                <Hammer className="w-3.5 h-3.5" />
                <span>Permanent Remediation Protocol</span>
              </span>
              <ol className="space-y-2">
                {result.remediation_protocol.map((step, i) => (
                  <li key={i} className="flex items-start space-x-2 text-xs text-zinc-300">
                    <span className="w-4 h-4 rounded bg-[#162138] text-zinc-300 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 border border-[#233558]">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
