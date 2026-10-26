import React, { useState, useEffect } from 'react';
import { ClipboardList, AlertCircle, CheckCircle2, Clock, Sparkles, RefreshCw, Users, ShieldAlert } from 'lucide-react';
import { processDailyLog } from '../api/client';

export default function DailySiteAssistant({ onUpdateReport }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [supervisor, setSupervisor] = useState('Marcus Vance');
  const [headcount, setHeadcount] = useState(34);
  const [weatherObserved, setWeatherObserved] = useState('Clear, 28°C');
  const [fieldNotes, setFieldNotes] = useState(
    'Poured 120 cubic yards of concrete on Floor 3 slab. Ready-mix transit mixer delayed 1.5 hours due to highway accident. 4 masons absent today. Steel delivery arrived at 2 PM. Minor scaffold tie wire loose on north bay, fixed on spot. Rebar crew completed column cages for Floor 4.'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    handleProcess();
  }, []);

  const handleProcess = async () => {
    setLoading(true);
    try {
      const data = await processDailyLog({
        date,
        supervisor_name: supervisor,
        workforce_headcount: Number(headcount),
        weather_observed: weatherObserved,
        raw_field_notes: fieldNotes,
      });
      setResult(data);
      if (onUpdateReport) onUpdateReport('daily_log', data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-zinc-200">
      <div className="lg:col-span-4 space-y-4">
        <div className="tactical-card p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span>
            <span className="font-semibold text-xs tracking-wide text-white uppercase">Daily Field Ingestion</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Supervisor</label>
              <input
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Headcount</label>
              <input
                type="number"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-400 block mb-1">Weather</label>
              <input
                type="text"
                value={weatherObserved}
                onChange={(e) => setWeatherObserved(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-zinc-400 block mb-1">Raw Field Notes</label>
            <textarea
              rows="6"
              value={fieldNotes}
              onChange={(e) => setFieldNotes(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#0b101d] border border-[#1e2a42] text-xs text-white focus:outline-none focus:border-[#3b5380] resize-none"
            />
          </div>

          <button
            onClick={handleProcess}
            disabled={loading}
            className="w-full mt-2 py-2 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold shadow transition cursor-pointer flex items-center justify-center space-x-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ClipboardList className="w-3.5 h-3.5" />}
            <span>{loading ? 'Synthesizing...' : 'Process Field Notes'}</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-4">
        {result ? (
          <>
            <div className="tactical-card p-5 space-y-2">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                EXECUTIVE SUMMARY
              </span>
              <p className="text-xs text-zinc-200 leading-relaxed">{result.executive_summary}</p>
            </div>

            <div className="tactical-card p-4 space-y-2">
              <span className="font-semibold text-xs tracking-wider uppercase text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Progress Highlights</span>
              </span>
              <ul className="space-y-1 text-xs text-zinc-300">
                {result.progress_highlights.map((p, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="tactical-card p-4 space-y-2">
              <span className="font-semibold text-xs tracking-wider uppercase text-[#0ea5e9] flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Trade Delays & Bottlenecks</span>
              </span>
              <div className="space-y-2">
                {result.delays_and_bottlenecks.map((d, i) => (
                  <div key={i} className="p-2.5 rounded bg-[#0b101d] border border-[#1e2a42] flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-white block">{d.issue}</span>
                      <span className="text-[11px] text-zinc-400">{d.impact}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-[#38bdf8] border border-amber-500/30 font-mono text-[10px]">
                      {d.delay_hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="tactical-card p-4 space-y-2">
              <span className="font-semibold text-xs tracking-wider uppercase text-zinc-300 block">
                Next-Day Action Punch List
              </span>
              <ol className="space-y-1.5 text-xs text-zinc-300">
                {result.next_day_punch_list.map((task, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="w-4 h-4 rounded bg-[#162138] text-zinc-300 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5 border border-[#233558]">
                      {i + 1}
                    </span>
                    <span>{task}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : (
          <div className="tactical-card p-12 flex flex-col items-center justify-center text-center space-y-2">
            <ClipboardList className="w-10 h-10 text-zinc-600" />
            <span className="text-xs text-zinc-400">Click "Process Field Notes" to extract progress and punch list.</span>
          </div>
        )}
      </div>
    </div>
  );
}
