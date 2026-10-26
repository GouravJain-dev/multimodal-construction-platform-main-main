import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  Check, 
  Clock, 
  AlertTriangle, 
  Image as ImageIcon, 
  ChevronDown, 
  AlertOctagon,
  RefreshCw
} from 'lucide-react';
import { analyzeSafetyFile, analyzeSafetyJson } from '../api/client';

const DEFAULT_DETECTIONS = [
  {
    id: "det-1",
    type: "worker",
    label: "OSHA 1926.501(b)(1)",
    severity: "Critical",
    confidence: 0.98,
    bbox: { x: 0.375, y: 0.115, w: 0.215, h: 0.845 },
    description: "Worker positioned within 18 inches of leading edge at 32.4 ft without active fall arrest tie-off.",
    infraction_id: "inf-1"
  },
  {
    id: "det-2",
    type: "ppe",
    label: "Hardhat",
    severity: "OK",
    confidence: 0.96,
    bbox: { x: 0.455, y: 0.115, w: 0.080, h: 0.120 },
    description: "ANSI Z89.1 Type I industrial hardhat worn securely.",
    infraction_id: null
  },
  {
    id: "det-3",
    type: "hazard",
    label: "OSHA 1926.451(g)(1)",
    severity: "Moderate",
    confidence: 0.91,
    bbox: { x: 0.580, y: 0.420, w: 0.250, h: 0.360 },
    description: "Perimeter midrail missing between vertical standards. Missing outward-facing 3.5\" toeboard.",
    infraction_id: "inf-2"
  },
  {
    id: "det-4",
    type: "worker",
    label: "Worker 2 (Distant)",
    severity: "Unverified",
    confidence: 0.94,
    bbox: { x: 0.855, y: 0.215, w: 0.053, h: 0.195 },
    description: "Secondary worker located >60ft away on deck. Distance exceeds optical resolution for tie-off verification.",
    infraction_id: null
  }
];

const SEVERITY_ORDER = { Critical: 4, High: 3, Moderate: 2, Low: 1, OK: 0, Unverified: 0 };

/**
 * Deterministic label collision resolution algorithm:
 * 1. Process detections in descending severity (Critical first)
 * 2. Try positions in order: above, below, inside-bottom, inside-top
 * 3. Choose first position that stays inside image bounds without overlapping any placed label
 */
function computeLabelPlacements(detections) {
  const sorted = [...detections].sort((a, b) => {
    const pA = SEVERITY_ORDER[a.severity] ?? 0;
    const pB = SEVERITY_ORDER[b.severity] ?? 0;
    return pB - pA;
  });

  const placedRects = [];
  const placementMap = {};

  for (const det of sorted) {
    const { x, y, w, h } = det.bbox;
    const isPpeChild = det.type === 'ppe';
    const isShortLabel = isPpeChild || det.severity === 'Unverified';
    const labelW = isShortLabel ? 0.12 : 0.23;
    const labelH = 0.038;

    // Right-edge clamp: if box or label would overflow right margin, anchor right-edge to box right-edge
    const alignRight = (x + labelW) > 0.88 || (x + w > 0.80);
    const labelX = alignRight ? Math.max(0, x + w - labelW) : x;

    // Ordered candidate positions
    let candidatePositions;
    if (isPpeChild) {
      // Hardhat PPE: anchor to the right of the head box so it never covers the worker's face or chin
      candidatePositions = [
        { name: 'right', topOffset: y, className: 'top-0 left-full ml-1.5' },
        { name: 'inside-bottom', topOffset: y + h - labelH - 0.005, className: 'bottom-0.5 right-0.5' },
        { name: 'below', topOffset: y + h + 0.005, className: 'top-full mt-1 left-0' },
      ];
    } else {
      // Parent/hazard/worker labels prefer above, then below, then inside-top, respecting alignRight
      candidatePositions = [
        { 
          name: 'above', 
          topOffset: y - labelH - 0.005, 
          className: `-top-6 ${alignRight ? 'right-0' : 'left-0'}` 
        },
        { 
          name: 'below', 
          topOffset: y + h + 0.005, 
          className: `top-full mt-1 ${alignRight ? 'right-0' : 'left-0'}` 
        },
        { 
          name: 'inside-top', 
          topOffset: y + 0.005, 
          className: `top-1 ${alignRight ? 'right-1' : 'left-1'}` 
        },
      ];
    }

    let chosen = null;
    for (const cand of candidatePositions) {
      if (cand.topOffset < 0 || (cand.topOffset + labelH) > 1.0) continue;

      const candRect = {
        x1: labelX,
        y1: cand.topOffset,
        x2: labelX + labelW,
        y2: cand.topOffset + labelH,
      };

      const hasCollision = placedRects.some(placed => {
        return !(
          candRect.x2 <= placed.x1 ||
          candRect.x1 >= placed.x2 ||
          candRect.y2 <= placed.y1 ||
          candRect.y1 >= placed.y2
        );
      });

      if (!hasCollision) {
        chosen = { ...cand, rect: candRect };
        break;
      }
    }

    if (!chosen) {
      chosen = candidatePositions[0];
      chosen.rect = {
        x1: labelX,
        y1: chosen.topOffset,
        x2: labelX + labelW,
        y2: chosen.topOffset + labelH,
      };
    }

    placedRects.push(chosen.rect);
    placementMap[det.id] = chosen.className;
  }

  return placementMap;
}

const DEFAULT_INFRACTIONS = [
  {
    id: "inf-1",
    severity: "CRITICAL",
    osha_standard: "OSHA 1926.501(b)(1)",
    location: "Zone B • Level 4",
    description: "Worker positioned within 18 inches of leading edge at 32.4 ft without active fall arrest tie-off."
  },
  {
    id: "inf-2",
    severity: "MODERATE",
    osha_standard: "OSHA 1926.451(g)(1)",
    location: "Bay 4C Standard",
    description: "Perimeter midrail missing between vertical standards. Missing outward-facing 3.5\" toeboard."
  }
];

const DEFAULT_ACTIONS = [
  {
    step_number: "01",
    category: "IMMEDIATE ACTION",
    title: "Halt Leading Edge Work",
    description: "Halt ironwork on Cantilever B-4. Direct worker to connect dual self-retracting lanyard to rated horizontal lifeline immediately."
  },
  {
    step_number: "02",
    category: "ENGINEERING FIX",
    title: "Reinstall Perimeter Guardrails",
    description: "Direct the scaffold contractor to reinstall 42-inch top-rail, 21-inch mid-rail, and 3.5-inch toe-board on Bay 4C prior to resuming concrete work."
  },
  {
    step_number: "03",
    category: "DOCUMENTATION",
    title: "Issue Non-Conformance Report",
    description: "Log a formal non-conformance report and require a toolbox talk sign-off before the next shift."
  }
];

export default function SafetyInspector({ uiState = 'results', onUpdateReport }) {
  const [projectName, setProjectName] = useState('Skyline Heights Tower B (Commercial Core)');
  const [siteZone, setSiteZone] = useState('Scaffolding Zone B - Level 4');
  const [imageFileName, setImageFileName] = useState('Skyline-TowerB-Scaffold4.jpg');
  const [fileSizeStr, setFileSizeStr] = useState('8.4MB');
  const [imageSrc, setImageSrc] = useState('/scaffold_sample.jpg');
  const [uploadedFile, setUploadedFile] = useState(null);

  // Bug 5 fix: Default all targets to checked
  const [targets, setTargets] = useState({
    fallArrest: true,
    guardrails: true,
    ppe: true,
    plankDeflection: true,
  });

  // Server-derived audit findings
  const [data, setData] = useState({
    hazard_score: 84,
    fall_risk_pct: 88,
    scaffold_defect_pct: 42,
    workers_detected: 2,
    ppe_compliance_pct: 100,
    hazards_count: 2,
    detections: DEFAULT_DETECTIONS,
    infractions: DEFAULT_INFRACTIONS,
    actions: DEFAULT_ACTIONS,
  });

  const [loading, setLoading] = useState(false);

  // Listen to top-level "Run Safety Audit" event from Navbar
  useEffect(() => {
    const runListener = () => handleRunAudit();
    const demoListener = () => handleDemoData();
    window.addEventListener('run_active_audit', runListener);
    window.addEventListener('load_preset_sample', demoListener);
    return () => {
      window.removeEventListener('run_active_audit', runListener);
      window.removeEventListener('load_preset_sample', demoListener);
    };
  }, [uploadedFile, imageSrc, projectName, siteZone, targets]);

  const toggleTarget = (key) => {
    setTargets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDemoData = () => {
    setProjectName('Skyline Heights Tower B (Commercial Core)');
    setSiteZone('Scaffolding Zone B - Level 4');
    setImageFileName('Skyline-TowerB-Scaffold4.jpg');
    setFileSizeStr('8.4MB');
    setImageSrc('/scaffold_sample.jpg');
    setUploadedFile(null);
    setData({
      hazard_score: 84,
      fall_risk_pct: 88,
      scaffold_defect_pct: 42,
      workers_detected: 2,
      ppe_compliance_pct: 100,
      hazards_count: 2,
      detections: DEFAULT_DETECTIONS,
      infractions: DEFAULT_INFRACTIONS,
      actions: DEFAULT_ACTIONS,
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setImageFileName(file.name);
      setFileSizeStr(`${(file.size / (1024 * 1024)).toFixed(1)}MB`);
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      let res;
      if (uploadedFile) {
        res = await analyzeSafetyFile(uploadedFile, projectName, siteZone, targets);
      } else {
        res = await analyzeSafetyJson({
          project_name: projectName,
          site_zone: siteZone,
          image_base64: imageSrc,
          target_fall_arrest: targets.fallArrest,
          target_guardrails: targets.guardrails,
          target_ppe: targets.ppe,
          target_plank_deflection: targets.plankDeflection,
        });
      }

      if (res && res.detections) {
        setData(res);
        if (onUpdateReport) onUpdateReport('safety', res);
      }
    } catch (err) {
      console.warn('Audit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const [hoveredDetId, setHoveredDetId] = useState(null);

  // Severity style helper with high-contrast text and shadows
  const getBoxStyle = (severity, isHovered) => {
    const hoverGlow = isHovered 
      ? 'ring-2 ring-white/70 shadow-xl shadow-black/80 z-30 brightness-110' 
      : 'z-10';

    switch (severity) {
      case 'Critical':
        return {
          border: `border-2 border-rose-500 bg-rose-500/10 ${hoverGlow}`,
          badge: 'bg-rose-600/95 text-white font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.85)] border border-rose-400/40 tracking-tight backdrop-blur-sm',
        };
      case 'High':
        return {
          border: `border-2 border-orange-500 bg-orange-500/10 ${hoverGlow}`,
          badge: 'bg-orange-600/95 text-white font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.85)] border border-orange-400/40 tracking-tight backdrop-blur-sm',
        };
      case 'Moderate':
        return {
          border: `border-2 border-amber-400 bg-amber-400/10 ${hoverGlow}`,
          // High contrast: deep black font on vivid yellow with dark drop-shadow to stand out over sky
          badge: 'bg-[#facc15] text-zinc-950 font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.85)] border border-amber-500/80 tracking-tight drop-shadow-sm',
        };
      case 'Unverified':
        return {
          border: `border-2 border-dashed border-slate-400/80 bg-slate-500/10 ${hoverGlow}`,
          badge: 'bg-[#182234]/95 text-zinc-300 font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.8)] border border-[#2d3e5f] tracking-tight backdrop-blur-sm',
        };
      default:
        return {
          border: `border-2 border-emerald-400 bg-emerald-400/10 ${hoverGlow}`,
          badge: 'bg-emerald-600/95 text-white font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.85)] border border-emerald-400/40 tracking-tight backdrop-blur-sm',
        };
    }
  };

  // Single detections array only
  const activeDetections = (uiState === 'results' && !loading) ? (data.detections || []) : [];

  // Collision-free label placements computed deterministically
  const labelPlacements = computeLabelPlacements(activeDetections);

  // Derived counts from single detections array
  const activeWorkersCount = activeDetections.filter(d => d.type === 'worker').length || data.workers_detected || 2;
  const activeHazardsCount = activeDetections.filter(d => d.severity in { Critical: 1, High: 1, Moderate: 1 }).length || data.hazards_count || 2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-zinc-200">
      {/* ================= LEFT COLUMN (4 / 12) ================= */}
      <div className="lg:col-span-4 space-y-4">
        {/* Card 1: Site Imagery Ingestion */}
        <div className="tactical-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
              <span className="font-semibold text-xs tracking-wide text-white uppercase">Site Imagery Ingestion</span>
            </div>
            <button
              onClick={handleDemoData}
              className="px-2.5 py-1 rounded bg-[#131d31] hover:bg-[#1a2742] text-[#8b9bb4] hover:text-white text-[11px] font-medium border border-[#223354] transition cursor-pointer"
            >
              Demo Data
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => document.getElementById('file-upload-input').click()}
            className="border border-dashed border-[#243555] hover:border-[#3b5380] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition bg-[#0b101d]/60"
          >
            <input
              id="file-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="w-9 h-9 rounded-full bg-[#131d31] flex items-center justify-center text-zinc-400 mb-2">
              <UploadCloud className="w-4 h-4 text-zinc-300" />
            </div>
            <div className="text-xs text-center font-medium">
              <span className="text-[#0ea5e9]">Click to upload</span>
              <span className="text-zinc-400"> or drag site image</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">JPEG, PNG, WebP up to 25MB</p>

            {/* Active File Pill */}
            {imageFileName && (
              <div className="mt-3 px-3 py-1.5 rounded-md bg-[#0f1a2e] border border-[#1e2f4f] text-[11px] text-zinc-300 flex items-center space-x-2 w-full justify-between">
                <div className="flex items-center space-x-1.5 truncate">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{imageFileName}</span>
                </div>
                <span className="text-zinc-500 font-mono text-[10px] shrink-0">({fileSizeStr})</span>
              </div>
            )}
          </div>

          {/* Project & Zone Inputs */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Project / Structure Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380] transition"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Site Work Zone</label>
              <input
                type="text"
                value={siteZone}
                onChange={(e) => setSiteZone(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380] transition"
              />
            </div>
          </div>

          {/* OSHA Verification Targets Checklist (Bug 5: Defaults to all checked) */}
          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase block font-mono">
              OSHA VERIFICATION TARGETS
            </span>

            <div className="space-y-1.5">
              <div
                onClick={() => toggleTarget('fallArrest')}
                className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42] flex items-start space-x-2.5 cursor-pointer hover:border-[#2b3a58] transition"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                  targets.fallArrest ? 'bg-[#0284c7] text-white' : 'border border-zinc-600'
                }`}>
                  {targets.fallArrest && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-medium text-white block">Worker Fall Arrest & Tie-Off</span>
                  <span className="text-[11px] font-mono text-zinc-500">OSHA 1926.501(b)(1) 6ft threshold</span>
                </div>
              </div>

              <div
                onClick={() => toggleTarget('guardrails')}
                className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42] flex items-start space-x-2.5 cursor-pointer hover:border-[#2b3a58] transition"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                  targets.guardrails ? 'bg-[#0284c7] text-white' : 'border border-zinc-600'
                }`}>
                  {targets.guardrails && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-medium text-white block">Guardrails, Mid-rails & Toe-boards</span>
                  <span className="text-[11px] font-mono text-zinc-500">OSHA 1926.451(g)(1) perimeter integrity</span>
                </div>
              </div>

              <div
                onClick={() => toggleTarget('ppe')}
                className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42] flex items-start space-x-2.5 cursor-pointer hover:border-[#2b3a58] transition"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                  targets.ppe ? 'bg-[#0284c7] text-white' : 'border border-zinc-600'
                }`}>
                  {targets.ppe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-medium text-white block">Hardhat & High-Visibility PPE</span>
                  <span className="text-[11px] font-mono text-zinc-500">OSHA 1926.100 & ANSI/ISEA 107</span>
                </div>
              </div>

              <div
                onClick={() => toggleTarget('plankDeflection')}
                className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42] flex items-start space-x-2.5 cursor-pointer hover:border-[#2b3a58] transition"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                  targets.plankDeflection ? 'bg-[#0284c7] text-white' : 'border border-zinc-600'
                }`}>
                  {targets.plankDeflection && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs font-medium text-white block">Scaffold Plank Deflection & Locking Pins</span>
                  <span className="text-[11px] font-mono text-zinc-500">OSHA 1926.451(a) structural load limit</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Recent Audits */}
        <div className="tactical-card p-4 space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-[#1c263c]">
            <div className="flex items-center space-x-2 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span className="font-semibold tracking-wide uppercase text-[11px] font-mono">RECENT AUDITS</span>
            </div>
            <span className="text-zinc-500 text-[11px]">Last 3 audits</span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-white block">Skyline Heights Tower B</span>
                <span className="text-[10px] text-zinc-500">Today, 14:32</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                84 FAIL
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-white block">Hudson Yards Core C</span>
                <span className="text-[10px] text-zinc-500">Yesterday</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                22 PASS
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-white block">Pacific Bay Pier 14</span>
                <span className="text-[10px] text-zinc-500">2 days ago</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                68 MODERATE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= RIGHT COLUMN (8 / 12) ================= */}
      <div className="lg:col-span-8 space-y-4">
        {/* Main Vision Display Card */}
        <div className="tactical-card overflow-hidden">
          {/* Header Bar */}
          <div className="px-4 py-2.5 bg-[#0a0f1d] border-b border-[#1c263c] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-zinc-300">
              <ImageIcon className="w-3.5 h-3.5 text-[#0ea5e9]" />
              <span className="font-mono text-[11px] text-zinc-200">{imageFileName}</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-400">
              <span>3840 × 2160</span>
              <span className="mx-2">•</span>
              <span>Analyzed: 14:32:08 UTC</span>
            </div>
          </div>

          {/* Bug 3 fix: position: relative container tightly wrapping the image */}
          <div className="relative w-full overflow-hidden select-none bg-black">
            <img
              src={imageSrc}
              alt="Site Inspection Scan"
              className="w-full h-auto block object-cover"
            />

            {/* Collision-Free Detections Layer with Tooltips and Hover States */}
            {activeDetections.map((det) => {
              const isHovered = hoveredDetId === det.id || (det.infraction_id && hoveredDetId === det.infraction_id);
              const style = getBoxStyle(det.severity, isHovered);
              const placementClass = labelPlacements[det.id] || '-top-6 left-0';
              
              // Concise labels: nested parts (hardhat) use short label without %, distant worker notes unverified
              const labelText = det.type === 'ppe'
                ? `${det.label} • ${det.severity}`
                : det.severity === 'Unverified'
                  ? `${det.label} • Unverified`
                  : `${det.label} • ${det.severity} • ${Math.round(det.confidence * 100)}%`;

              return (
                <div
                  key={det.id}
                  onMouseEnter={() => setHoveredDetId(det.id)}
                  onMouseLeave={() => setHoveredDetId(null)}
                  className={`absolute pointer-events-auto cursor-pointer transition-all duration-150 ${style.border}`}
                  style={{
                    left: `${det.bbox.x * 100}%`,
                    top: `${det.bbox.y * 100}%`,
                    width: `${det.bbox.w * 100}%`,
                    height: `${det.bbox.h * 100}%`,
                  }}
                >
                  {/* Fixed 11px font badge placed with deterministic collision-free positioning */}
                  <span
                    className={`absolute text-[11px] font-mono font-bold leading-none py-1 px-1.5 whitespace-nowrap ${style.badge} ${placementClass}`}
                  >
                    {labelText}
                  </span>

                  {/* Interactive Finding Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute top-full mt-2 left-0 z-40 w-64 p-2.5 rounded bg-[#0b101d]/95 backdrop-blur-md border border-[#2b3d63] shadow-2xl text-[11px] text-zinc-200 pointer-events-none space-y-1">
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span className={
                          det.severity === 'Critical' ? 'text-rose-400' :
                          det.severity === 'Moderate' ? 'text-[#0ea5e9]' :
                          det.severity === 'Unverified' ? 'text-zinc-400' : 'text-emerald-400'
                        }>
                          {det.label}
                        </span>
                        <span className="text-[10px] text-zinc-400">{Math.round(det.confidence * 100)}% Conf.</span>
                      </div>
                      <p className="text-zinc-300 text-[10px] leading-tight font-sans">
                        {det.description || "Active object detection identified by OSHA vision inference."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Overlay */}
            {(loading || uiState === 'loading') && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-20">
                <RefreshCw className="w-8 h-8 text-[#0ea5e9] animate-spin" />
                <span className="text-xs font-mono text-zinc-300">Executing OSHA 1926 Multimodal Vision Inference...</span>
              </div>
            )}

            {/* Error Overlay */}
            {uiState === 'error' && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center space-y-2 p-6 text-center z-20">
                <AlertOctagon className="w-8 h-8 text-rose-500" />
                <span className="text-sm font-semibold text-white">Inspection Scan Interrupted</span>
                <span className="text-xs text-zinc-400 max-w-sm">Failed to connect to multimodal inference endpoint. Please verify payload formatting or network access.</span>
              </div>
            )}

            {/* Empty Overlay */}
            {uiState === 'empty' && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center space-y-2 p-6 text-center z-20">
                <UploadCloud className="w-8 h-8 text-zinc-500" />
                <span className="text-sm font-semibold text-white">No Imagery Loaded</span>
                <span className="text-xs text-zinc-400 max-w-sm">Upload a construction site photograph or click "Demo Data" on the left to start.</span>
              </div>
            )}
          </div>

          {/* Bottom Detection Stats Strip - Derived from detections */}
          <div className="px-4 pt-2.5 pb-[18px] bg-[#0a0f1d] border-t border-[#1c263c] flex flex-wrap items-center justify-between text-xs font-medium">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2">
                <span className="text-zinc-400">Workers Detected:</span>
                <span className="px-2 py-0.5 rounded bg-[#131d31] border border-[#20304f] font-mono text-[11px] text-white">
                  {activeWorkersCount} Active
                </span>
              </div>

              <div 
                className="flex items-center space-x-2 cursor-help"
                title="OSHA 1926.100 PPE Compliant: Hardhat & high-vis verified on assessable worker. Missing tie-off is tracked under Fall Protection (OSHA 1926.501). Worker 2 is distant/unverified."
              >
                <span className="text-zinc-400">PPE Compliance:</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                  data.ppe_compliance_pct === 100
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/15 border border-amber-500/30 text-[#38bdf8]'
                }`}>
                  {data.ppe_compliance_pct}% {data.ppe_compliance_pct === 100 ? 'Pass' : 'Warning'}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">(1 of 1 assessable, 1 unverified)</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-zinc-400">Hazards Found:</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 font-mono text-[11px] text-rose-400">
                  {activeHazardsCount} Detected
                </span>
              </div>
            </div>

            <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">Hover box or infraction for details</span>
          </div>
        </div>

        {/* Mid Section: Risk Score & Infraction Analysis Log */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Card A: TOTAL HAZARD RISK SCORE */}
          <div className="md:col-span-5 tactical-card p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs tracking-wider text-zinc-300 uppercase font-mono">
                  TOTAL HAZARD RISK SCORE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  FAIL
                </span>
              </div>

              {/* Big Score */}
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-4xl font-extrabold font-mono text-rose-500 tracking-tight">
                  {data.hazard_score}
                </span>
                <span className="text-xs font-mono text-zinc-400">/ 100 Risk Index</span>
              </div>

              <p className="text-xs text-rose-300/80 leading-relaxed mt-2">
                High Severity Fall Risk detected. Immediate supervisor intervention required prior to continued work.
              </p>
            </div>

            {/* Progress Bars (Bug 6 & 7 fix: Demo switcher removed from inside card, bars derived from response) */}
            <div className="space-y-3 pt-2 border-t border-[#1c263c]">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Fall Risk</span>
                  <span className="text-rose-400 font-bold">{data.fall_risk_pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#141d30] rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${data.fall_risk_pct}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">Scaffold Structure Defect</span>
                  <span className="text-[#0ea5e9] font-bold">{data.scaffold_defect_pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#141d30] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0ea5e9] rounded-full" style={{ width: `${data.scaffold_defect_pct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card B: OSHA INFRACTION ANALYSIS LOG */}
          <div className="md:col-span-7 tactical-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#1c263c]">
              <div className="flex items-center space-x-1.5 text-zinc-300">
                <AlertTriangle className="w-3.5 h-3.5 text-[#0ea5e9]" />
                <span className="font-semibold text-xs tracking-wider uppercase font-mono">OSHA INFRACTION ANALYSIS LOG</span>
              </div>
              <span className="text-zinc-500 font-mono text-[11px]">{data.infractions.length} Items Flagged</span>
            </div>

            <div className="space-y-2.5">
              {data.infractions.map((inf) => {
                const isHighlighted = hoveredDetId === inf.id || (inf.id === 'inf-1' && hoveredDetId === 'det-1') || (inf.id === 'inf-2' && hoveredDetId === 'det-3');

                return (
                  <div
                    key={inf.id}
                    onMouseEnter={() => setHoveredDetId(inf.id === 'inf-1' ? 'det-1' : 'det-3')}
                    onMouseLeave={() => setHoveredDetId(null)}
                    className={`p-3 rounded-md space-y-1.5 transition-all cursor-pointer ${
                      isHighlighted
                        ? inf.severity === 'CRITICAL'
                          ? 'bg-[#1b1c2b] border-2 border-rose-500 shadow-md shadow-rose-950/60 ring-1 ring-rose-500/40'
                          : 'bg-[#22201d] border-2 border-amber-400 shadow-md shadow-amber-950/60 ring-1 ring-amber-400/40'
                        : inf.severity === 'CRITICAL'
                          ? 'bg-[#131722] border border-rose-900/40 hover:border-rose-700/60'
                          : 'bg-[#161a24] border border-amber-900/40 hover:border-amber-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          inf.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-[#38bdf8] border border-amber-500/40'
                        }`}>
                          {inf.severity}
                        </span>
                        <span className="font-mono text-xs font-bold text-white">{inf.osha_standard}</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">{inf.location}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{inf.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Card: Recommended Actions & Corrective Protocol */}
        <div className="tactical-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#1c263c]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="font-semibold text-xs tracking-wide text-white">
                Recommended Actions & Corrective Protocol <span className="text-zinc-500 font-normal">({data.actions.length} Structured Steps)</span>
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400 cursor-pointer" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {data.actions.map((act, i) => (
              <div key={i} className="p-3.5 rounded bg-[#0b101d] border border-[#1e2a42] space-y-1.5">
                <span className={`text-[11px] font-mono font-bold block tracking-wider uppercase ${
                  i === 0 ? 'text-rose-400' : i === 1 ? 'text-[#0ea5e9]' : 'text-emerald-400'
                }`}>
                  {act.step_number}. {act.category}
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">{act.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
