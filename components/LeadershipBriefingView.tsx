'use client';

import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  FileText,
  Copy,
  Check,
  Download,
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Plane,
  Target,
  ShieldAlert,
  Terminal,
  Activity,
} from 'lucide-react';
import { LeadershipBriefing } from '../lib/agent/leadership_brief';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
};

import { handleClientBriefing } from '../lib/data/client_store';

export const LeadershipBriefingView: React.FC = () => {
  const [briefing, setBriefing] = useState<LeadershipBriefing | null>(null);
  const [period, setPeriod] = useState('Weekly Executive Flash (Q3 Week 8)');
  const [audience, setAudience] = useState<'Founders / Board of Directors' | 'Executive Leadership Team' | 'Sales & Ops Sync'>('Founders / Board of Directors');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchBriefing = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, audience }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBriefing(data.data);
          setIsLoading(false);
          return;
        }
      }
      throw new Error('API unavailable, running client engine');
    } catch {
      // Fallback to client-side briefing generator for static hosting
      try {
        const localBrief = handleClientBriefing(period, audience);
        setBriefing(localBrief);
      } catch (e) {
        console.error('Failed to generate local briefing', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [period, audience]);

  const handleCopyMarkdown = () => {
    if (!briefing) return;
    navigator.clipboard.writeText(briefing.markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Control Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="tech-frame tech-panel rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight font-mono">
              LEADERSHIP BRIEFING STUDIO // DECK GENERATOR
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Tailored executive intelligence decks for Founders, Board of Directors, and Cross-Functional Syncs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-emerald-500"
          >
            <option value="Weekly Executive Flash (Q3 Week 8)">Weekly Executive Flash (Q3 Week 8)</option>
            <option value="Monthly Board Review (Aug 2024)">Monthly Board Review (Aug 2024)</option>
            <option value="Quarterly Forecast (Q3 2024)">Quarterly Forecast (Q3 2024)</option>
          </select>

          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono outline-none focus:border-emerald-500"
          >
            <option value="Founders / Board of Directors">Founders / Board of Directors</option>
            <option value="Executive Leadership Team">Executive Leadership Team</option>
            <option value="Sales & Ops Sync">Sales & Ops Sync</option>
          </select>

          <button
            onClick={fetchBriefing}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white active:scale-95"
            title="Regenerate"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={handleCopyMarkdown}
            disabled={!briefing}
            className="text-xs px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-200 border border-slate-800 flex items-center gap-1.5 transition-colors font-mono active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED!' : 'COPY MD'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={!briefing}
            className="text-xs px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-medium flex items-center gap-1.5 shadow-md shadow-emerald-950/60 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT PDF</span>
          </button>
        </div>
      </motion.div>

      {isLoading || !briefing ? (
        <div className="flex items-center justify-center h-80 font-mono text-xs text-slate-400">
          <Activity className="w-4 h-4 text-emerald-400 animate-spin mr-2" />
          SYNTHESIZING EXECUTIVE INTELLIGENCE DECK...
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Executive Summary Card */}
          <motion.div variants={itemVariants} className="p-6 rounded-2xl tech-frame tech-panel-emerald space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider">
                  {briefing.period} • {briefing.audience}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5 font-mono">{briefing.headline}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold self-start sm:self-auto uppercase tracking-wider ${
                briefing.overallHealthStatus === 'STRONG_GROWTH'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {briefing.overallHealthStatus.replace('_', ' ')}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
              {briefing.healthSummary}
            </p>
          </motion.div>

          {/* 8 Core KPIs Grid */}
          <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.div variants={itemVariants} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Won Revenue</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{briefing.kpis.wonRevenue}</span>
            </motion.div>
            <motion.div variants={itemVariants} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Total Pipeline</span>
              <span className="text-lg font-bold text-white font-mono">{briefing.kpis.totalPipeline}</span>
            </motion.div>
            <motion.div variants={itemVariants} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Weighted Forecast</span>
              <span className="text-lg font-bold text-blue-400 font-mono">{briefing.kpis.weightedPipeline}</span>
            </motion.div>
            <motion.div variants={itemVariants} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Win Rate</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{briefing.kpis.winRate}</span>
            </motion.div>
            <motion.div variants={itemVariants} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Active Flights</span>
              <span className="text-lg font-bold text-white font-mono">{briefing.kpis.activeWorkOrders} WOs</span>
            </motion.div>
            <motion.div variants={itemVariants} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">On-Time SLA</span>
              <span className="text-lg font-bold text-teal-400 font-mono">{briefing.kpis.onTimeDeliveryRate}</span>
            </motion.div>
            <motion.div variants={itemVariants} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90">
              <span className="text-[10px] text-slate-400 block font-mono uppercase">Area Surveyed</span>
              <span className="text-lg font-bold text-white font-mono">{briefing.kpis.totalAreaSurveyed}</span>
            </motion.div>
            <motion.div variants={itemVariants} className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/20">
              <span className="text-[10px] text-rose-400 block font-mono uppercase">Pipeline at Risk</span>
              <span className="text-lg font-bold text-rose-300 font-mono">{briefing.kpis.pipelineAtRisk}</span>
            </motion.div>
          </motion.div>

          {/* Detailed Tailored Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {briefing.sections.map((sec, sIdx) => (
              <motion.div key={sIdx} variants={itemVariants} className="tech-frame tech-panel rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <h4 className="text-xs font-bold text-white font-mono uppercase">{sec.title}</h4>
                    {sec.badge && (
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {sec.badge}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2 mt-3 text-xs text-slate-300 font-mono">
                    {sec.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold mt-0.5">▪</span>
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {sec.highlights && sec.highlights.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 mt-3">
                    {sec.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                        <span className="text-[9px] font-mono text-slate-400 block uppercase truncate">{h.label}</span>
                        <span className={`text-xs font-bold font-mono ${
                          h.status === 'positive' ? 'text-emerald-400' : h.status === 'warning' ? 'text-amber-400' : 'text-slate-200'
                        }`}>
                          {h.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Strategic Priorities */}
          <motion.div variants={itemVariants} className="p-5 rounded-2xl tech-panel border-emerald-500/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>STRATEGIC ACTION ITEMS & FOCUS ({briefing.audience})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {briefing.topPriorities.map((p, pIdx) => (
                <div key={pIdx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-200 flex items-start gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0 text-[10px]">
                    {pIdx + 1}
                  </span>
                  <span className="leading-relaxed">{p}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
