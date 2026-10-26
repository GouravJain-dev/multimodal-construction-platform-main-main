import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Calendar, 
  Building2, 
  ClipboardList, 
  CloudRain, 
  MessageSquareCode 
} from 'lucide-react';

import Navbar from './components/Navbar';
import SafetyInspector from './components/SafetyInspector';
import CrackAnalyzer from './components/CrackAnalyzer';
import ProjectPlanner from './components/ProjectPlanner';
import RealEstateValuer from './components/RealEstateValuer';
import DailySiteAssistant from './components/DailySiteAssistant';
import WeatherAdvisor from './components/WeatherAdvisor';
import KnowledgeBot from './components/KnowledgeBot';
import ReportModal from './components/ReportModal';

const TABS = [
  { id: 'safety', label: 'Site Safety', icon: ShieldCheck },
  { id: 'crack', label: 'Crack Analysis', icon: Activity },
  { id: 'planning', label: 'Project Planner', icon: Calendar },
  { id: 'valuation', label: 'Real Estate Valuer', icon: Building2 },
  { id: 'daily_log', label: 'Daily Assistant', icon: ClipboardList },
  { id: 'weather', label: 'Weather Advisor', icon: CloudRain },
  { id: 'chat', label: 'Knowledge Bot', icon: MessageSquareCode },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('safety');
  const [uiState, setUiState] = useState('results'); // 'results' | 'empty' | 'loading' | 'error'
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [reportData, setReportData] = useState({
    safety: null,
    crack: null,
    planning: null,
    valuation: null,
    daily_log: null,
    weather: null,
  });

  const handleUpdateReport = (moduleName, data) => {
    setReportData(prev => ({
      ...prev,
      [moduleName]: data,
    }));
  };

  const handleLoadPreset = () => {
    window.dispatchEvent(new CustomEvent('load_preset_sample'));
  };

  const handleRunAudit = () => {
    window.dispatchEvent(new CustomEvent('run_active_audit'));
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-[#e2e8f0] flex flex-col font-sans select-none pb-12">
      {/* Top Main Navbar */}
      <Navbar
        onLoadPreset={handleLoadPreset}
        onOpenReport={() => setIsReportOpen(true)}
        onRunAudit={handleRunAudit}
      />

      {/* Navigation Tabs Bar */}
      <div className="border-b border-[#1c263c] bg-[#090e1a]/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-[#8b9bb4] hover:text-white hover:bg-[#141e33]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-[#8b9bb4]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-5">
        {activeTab === 'safety' && (
          <SafetyInspector 
            uiState={uiState} 
            onUpdateReport={handleUpdateReport} 
          />
        )}

        {activeTab === 'crack' && (
          <CrackAnalyzer onUpdateReport={handleUpdateReport} />
        )}

        {activeTab === 'planning' && (
          <ProjectPlanner onUpdateReport={handleUpdateReport} />
        )}

        {activeTab === 'valuation' && (
          <RealEstateValuer onUpdateReport={handleUpdateReport} />
        )}

        {activeTab === 'daily_log' && (
          <DailySiteAssistant onUpdateReport={handleUpdateReport} />
        )}

        {activeTab === 'weather' && (
          <WeatherAdvisor onUpdateReport={handleUpdateReport} />
        )}

        {activeTab === 'chat' && (
          <KnowledgeBot />
        )}
      </main>

      {/* Bottom Footer Bar */}
      <footer className="border-t border-[#1c263c] bg-[#080d18] py-2.5 px-4 sm:px-6 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8b9bb4] gap-2">
          <div>
            FastAPI • React • Gemini • OSHA 1926 & ACI 318 reference
          </div>

          {/* Root-Level Demo-State Switcher inside Footer Area */}
          {activeTab === 'safety' && (
            <div className="flex items-center p-0.5 rounded-full bg-[#0b101d] border border-[#223354] space-x-1 text-xs">
              {['results', 'empty', 'loading', 'error'].map((st) => (
                <button
                  key={st}
                  onClick={() => setUiState(st)}
                  className={`px-3 py-0.5 rounded-full capitalize transition cursor-pointer font-medium text-[11px] ${
                    uiState === st 
                      ? 'bg-[#0284c7] text-white font-semibold shadow' 
                      : 'text-zinc-400 hover:text-white hover:bg-[#152035]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-3">
            {/* Demo Mode Toggle */}
            <div className="flex items-center space-x-1.5 cursor-pointer" onClick={() => setDemoMode(!demoMode)}>
              <div className={`w-7 h-4 rounded-full p-0.5 transition ${demoMode ? 'bg-[#0ea5e9]' : 'bg-[#1e2a42]'}`}>
                <div className={`w-3 h-3 rounded-full bg-black transition transform ${demoMode ? 'translate-x-3' : 'translate-x-0'}`}></div>
              </div>
              <span className="text-zinc-300 font-medium">Demo mode</span>
            </div>

            <span>•</span>

            {/* Debug link */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-[#8b9bb4] hover:text-white transition underline decoration-dotted cursor-pointer"
            >
              Show Latency / Debug Info
            </button>
          </div>
        </div>

        {/* Debug Drawer */}
        {showDebug && (
          <div className="max-w-[1600px] mx-auto mt-2 p-2 rounded bg-[#0b101d] border border-[#1c263c] text-[10px] font-mono text-zinc-400 flex items-center justify-between">
            <span>Inference Target: Gemini 1.5 Flash Vision / Calibrated Engine • Latency: 124ms • Host: 127.0.0.1:8000</span>
            <span className="text-emerald-400">WebSocket / Polling Active</span>
          </div>
        )}
      </footer>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        reportData={reportData}
      />
    </div>
  );
}
