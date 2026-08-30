'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  AlertOctagon,
  Clock,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Plane,
  Layers,
  Activity,
  Terminal,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { ExecutiveSummaryStats, SectorAnalytics } from '../lib/agent/analytics';
import { DataQualityReport } from '../lib/types';

import { Variants } from 'framer-motion';

interface DashboardProps {
  stats: ExecutiveSummaryStats | null;
  qualityReport: DataQualityReport | null;
  onAskAgent: (query: string) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#64748b'];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
};

export const ExecutiveDashboard: React.FC<DashboardProps> = ({ stats, qualityReport, onAskAgent }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96 font-mono text-xs text-slate-400">
        <Activity className="w-4 h-4 text-emerald-400 animate-spin mr-2" />
        INITIALIZING EXECUTIVE TELEMETRY STREAM...
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6"
    >
      {/* Top Telemetry Header Bar */}
      <motion.div
        variants={itemVariants}
        className="tech-frame tech-panel-emerald rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-base font-bold text-white tracking-tight font-mono">
              EXECUTIVE TELEMETRY // REAL-TIME SYNTHESIS
            </h2>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              MONDAY.COM SYNC ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Deterministic cross-board financial and operations intelligence across 344 Deals and 176 Flight Missions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAskAgent('Give me a complete executive update for leadership')}
            className="text-xs px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-medium shadow-md shadow-emerald-950/60 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>GENERATE FLASH BRIEF</span>
          </button>
        </div>
      </motion.div>

      {/* 5 Core Executive Metric Cards (Instrument Modules) */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Pipeline */}
        <motion.div
          variants={itemVariants}
          className="metric-card rounded-2xl p-4 cursor-pointer relative group"
          onClick={() => onAskAgent('Analyze our sales pipeline health and deal stages')}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Active Pipeline
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.formattedTotalPipeline}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
            <span className="text-slate-400">{stats.openDealsCount} Open Deals</span>
            <span className="text-blue-400 font-semibold">Weighted: {stats.formattedWeightedPipeline}</span>
          </div>
        </motion.div>

        {/* Won Revenue */}
        <motion.div
          variants={itemVariants}
          className="metric-card rounded-2xl p-4 cursor-pointer relative group"
          onClick={() => onAskAgent('What is our revenue and win rate breakdown?')}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Won Revenue
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">
            {stats.formattedWonRevenue}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
            <span className="text-slate-400">{stats.wonDealsCount} Contracts</span>
            <span className="text-emerald-400 font-bold">{stats.winRate}% Win Rate</span>
          </div>
        </motion.div>

        {/* Active Work Orders */}
        <motion.div
          variants={itemVariants}
          className="metric-card rounded-2xl p-4 cursor-pointer relative group"
          onClick={() => onAskAgent('Show active drone flight missions and delivery status')}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-400">
              Active Missions
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Plane className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.activeWorkOrdersCount}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
            <span className="text-slate-400">{stats.totalWorkOrdersCount} Total Ops</span>
            <span className={stats.delayedWorkOrdersCount > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
              {stats.delayedWorkOrdersCount} Delayed
            </span>
          </div>
        </motion.div>

        {/* On-Time Delivery SLA */}
        <motion.div
          variants={itemVariants}
          className="metric-card rounded-2xl p-4 cursor-pointer relative group"
          onClick={() => onAskAgent('What is our flight operations turnaround and on-time SLA?')}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-teal-400">
              Delivery SLA
            </span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats.onTimeDeliveryRate}%
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
            <span className="text-slate-400">{stats.totalSurveyAreaKm2} km²</span>
            <span className="text-teal-400 font-semibold">{stats.completedWorkOrdersCount} Delivered</span>
          </div>
        </motion.div>

        {/* Pipeline at Risk */}
        <motion.div
          variants={itemVariants}
          className="metric-card rounded-2xl p-4 cursor-pointer border-rose-500/20 relative group"
          onClick={() => onAskAgent('Which clients have delayed work orders and open pipeline deals?')}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-rose-400">
              Pipeline At Risk
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-300 tracking-tight font-mono">
            {stats.formattedPipelineValueAtRisk}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
            <span className="text-rose-400 font-semibold">{stats.atRiskAccountsCount} Accounts Flagged</span>
            <span className="text-slate-500">CROSS-JOIN</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Funnel by Stage */}
        <motion.div variants={itemVariants} className="tech-frame tech-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono">SALES PIPELINE FUNNEL</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Stage distribution and aggregate closure potential</p>
            </div>
            <button
              onClick={() => onAskAgent('Break down sales pipeline by stage and high-confidence negotiations')}
              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>DEEP DIVE</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.stageFunnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} fontStyle="mono" />
                <YAxis stroke="#94a3b8" fontSize={10} fontStyle="mono" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value: any) => [`₹${(Number(value) / 100000).toFixed(1)} Lakhs`, 'Value']}
                />
                <Bar dataKey="value" name="Deal Value (₹)" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80 text-center">
            {stats.stageFunnel.map((st, idx) => (
              <div key={idx} className="p-1.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-[9px] font-mono text-slate-400 block truncate">{st.stage}</span>
                <span className="text-xs font-bold text-slate-200 font-mono">{st.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Flight Operations Status */}
        <motion.div variants={itemVariants} className="tech-frame tech-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <h3 className="text-sm font-bold text-white font-mono">FLIGHT OPERATIONS SLA</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Execution turnaround and mission status breakdown</p>
            </div>
            <button
              onClick={() => onAskAgent('Show flight operations turnaround, total km² surveyed, and weather delays')}
              className="text-[11px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>OPS AUDIT</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Pie
                  data={stats.opsStatusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {stats.opsStatusBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px', fontFamily: 'monospace' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-800/80 text-slate-400">
            <span>Area Covered: <strong className="text-slate-200">{stats.totalSurveyAreaKm2} km²</strong></span>
            <span>Weather Standby: <strong className="text-amber-400">{stats.totalWeatherDelayDays} Days</strong></span>
          </div>
        </motion.div>
      </div>

      {/* Sector Performance Matrix */}
      <motion.div variants={itemVariants} className="tech-frame tech-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold text-white font-mono">SECTOR PERFORMANCE MATRIX</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Cross-sector conversion rates, revenue realization, and flight acreage</p>
          </div>
          <button
            onClick={() => onAskAgent('Show revenue, win rates, and pipeline distribution by sector')}
            className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 self-start sm:self-auto flex items-center gap-1"
          >
            <span>SECTOR BENCHMARKS</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.sectorBreakdown.map((sec, idx) => (
            <div
              key={idx}
              onClick={() => onAskAgent(`How is our pipeline looking for ${sec.sector} sector?`)}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-emerald-500/40 transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors font-mono">
                  {sec.sector}
                </h4>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {sec.winRate}% WIN
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Won Revenue:</span>
                  <span className="text-emerald-400 font-bold">{sec.formattedWonRevenue}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pipeline:</span>
                  <span className="text-white">{sec.formattedPipelineValue} ({sec.openDealCount} deals)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Missions:</span>
                  <span className="text-slate-300">{sec.activeWorkOrders} Active / {sec.workOrderCount} Total</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Survey Area:</span>
                  <span className="text-blue-400 font-medium">{sec.totalSurveyAreaKm2} km²</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
