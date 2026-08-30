'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  BarChart3,
  Layers,
  FileSpreadsheet,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Radio,
  Cpu,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'chat' | 'dashboard' | 'explorer' | 'briefing' | 'connector';
  setActiveTab: (tab: 'chat' | 'dashboard' | 'explorer' | 'briefing' | 'connector') => void;
  isLive: boolean;
  completenessScore: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isLive,
  completenessScore,
  onRefresh,
  isLoading,
}) => {
  const navTabs = [
    { id: 'chat', label: 'AI Copilot', icon: BrainCircuit },
    { id: 'dashboard', label: 'Executive BI', icon: BarChart3 },
    { id: 'explorer', label: 'Cross-Board Data', icon: Layers },
    { id: 'briefing', label: 'Leadership Studio', icon: FileSpreadsheet },
    { id: 'connector', label: 'Monday.com API', icon: Database },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#04080f]/90 backdrop-blur-xl px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <svg className="w-4.5 h-4.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-100 text-sm font-mono">SKYLARK://DRONES</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v2.4 TELEMETRY
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>BI DECISION ENGINE ACTIVE</span>
              </p>
            </div>
          </div>

          {/* Mobile Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tab Navigation with Framer Motion Layout Transition */}
        <nav className="flex items-center gap-1 p-1 bg-slate-950/90 border border-slate-800/90 rounded-xl w-full md:w-auto overflow-x-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap z-10 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-950/60 -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="font-mono text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Live Connection Pill */}
          <div
            onClick={() => setActiveTab('connector')}
            className="cursor-pointer flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-[11px] font-mono transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-300">{isLive ? 'LIVE MONDAY.COM' : 'SNAPSHOT DATA'}</span>
          </div>

          {/* Data Quality Score Pill */}
          <div
            onClick={() => setActiveTab('explorer')}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] font-mono transition-colors"
            title="Data Health Score"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">HEALTH:</span>
            <span className={`font-semibold ${completenessScore >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {completenessScore}%
            </span>
          </div>

          {/* Global Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            title="Refresh All Boards"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
